using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Mirath.Domain.Entities;
using Mirath.Domain.Enums;
using Mirath.Infrastructure.Persistence;
using HeirType = Mirath.Shared.Enums.HeirType;

namespace Mirath.Application.Services;

/// <summary>
/// Production Farayid calculation service.
/// The service intentionally keeps the inheritance rules in one backend authority.  It supports the mainstream Sunni
/// fara'id workflow: estate deductions, hajb, furud, asaba, awl, radd, selected madhab differences, and scenario flags.
/// Legal note: generated results must still be reviewable by a qualified scholar/lawyer for court filing.
/// </summary>
public interface IFarayidCalculationService
{
    Task<FarayidCalculationResponse> CalculateAsync(Guid caseId, FarayidCalculationRequest request, CancellationToken cancellationToken = default);
}

public sealed class FarayidCalculationService : IFarayidCalculationService
{
    private const string Version = "farayid-engine-2026.04.29-v1";
    private readonly ApplicationDbContext _db;

    public FarayidCalculationService(ApplicationDbContext db) => _db = db;

    public async Task<FarayidCalculationResponse> CalculateAsync(Guid caseId, FarayidCalculationRequest request, CancellationToken cancellationToken = default)
    {
        var c = await _db.Cases
            .Include(x => x.Decedent)
            .Include(x => x.Assets)
            .Include(x => x.Debts)
            .Include(x => x.Heirs)
            .FirstOrDefaultAsync(x => x.Id == caseId, cancellationToken)
            ?? throw new InvalidOperationException("Case not found");

        var madhab = ParseMadhab(request.Madhab);
        var currency = c.Assets.FirstOrDefault()?.Currency ?? "EGP";
        var goldPrice = request.GoldPricePerGram ?? ReadDecimalEnv("GOLD_PRICE_PER_GRAM", 0m);
        var silverPrice = request.SilverPricePerGram ?? ReadDecimalEnv("SILVER_PRICE_PER_GRAM", 0m);

        var totalEstate = c.Assets.Sum(a => a.Type switch
        {
            AssetType.Gold when a.Weight.HasValue && goldPrice > 0 => a.Weight.Value * goldPrice,
            AssetType.Silver when a.Weight.HasValue && silverPrice > 0 => a.Weight.Value * silverPrice,
            _ => a.Value
        });

        var deductedDebts = request.IncludeDebts ? c.Debts.Sum(d => d.Amount) + c.Assets.Where(a => a.Type == AssetType.Debt).Sum(a => a.Value) : 0m;
        var funeralExpenses = request.FuneralExpenses ?? c.FuneralExpenses;
        var requestedBequest = request.BequestAmount ?? c.WillAmount;
        var bequestCap = totalEstate / 3m;
        var deductedBequest = Math.Min(Math.Max(0m, requestedBequest), bequestCap);
        var netEstate = Math.Max(0m, totalEstate - deductedDebts - funeralExpenses - deductedBequest);

        var heirs = c.Heirs.Where(h => h.IsAlive).Select(HeirState.From).ToList();
        var deceasedMuslim = c.Decedent?.Religion != Religion.NonMuslim;

        ApplyDisqualificationRules(heirs, deceasedMuslim);
        ApplyHajbRules(heirs);
        var special = DetectSpecialCase(heirs, madhab);
        AssignFurudShares(heirs, madhab, special);
        ApplyAsaba(heirs, madhab);

        var nonBlockedShares = heirs.Where(h => !h.Blocked && h.Share > Fraction.Zero).ToList();
        var fixedPlusAsaba = nonBlockedShares.Sum(h => h.Share.Value);
        var awlApplied = false;
        var raddApplied = false;

        if (fixedPlusAsaba > 1m)
        {
            awlApplied = true;
            foreach (var h in nonBlockedShares)
            {
                h.Share = Fraction.FromDecimal(h.Share.Value / fixedPlusAsaba);
                h.Notes.Add("تم تطبيق العول لأن مجموع الأنصبة زاد على أصل المسألة.");
            }
        }
        else if (fixedPlusAsaba < 1m && !heirs.Any(h => !h.Blocked && h.Basis == ShareBasis.Asaba && h.Share > Fraction.Zero))
        {
            var raddRecipients = SelectRaddRecipients(nonBlockedShares, madhab).ToList();
            var raddBase = raddRecipients.Sum(h => h.Share.Value);
            if (raddBase > 0)
            {
                raddApplied = true;
                var remainder = 1m - fixedPlusAsaba;
                foreach (var h in raddRecipients)
                {
                    h.Share = Fraction.FromDecimal(h.Share.Value + (h.Share.Value / raddBase) * remainder);
                    h.Notes.Add("تم تطبيق الرد بإرجاع الباقي على أصحاب الفروض المستحقين.");
                }
            }
        }

        var results = heirs.Select(h => h.ToDto(netEstate, currency)).ToList();
        var response = new FarayidCalculationResponse(
            c.Id,
            totalEstate,
            netEstate,
            deductedDebts,
            funeralExpenses,
            deductedBequest,
            madhab.ToString(),
            DateTime.UtcNow,
            Version,
            results,
            results.Where(r => r.CalculationBasis == "Blocked" || r.CalculationBasis == "Disqualified").Select(r => new BlockedHeirDto(r.HeirId, r.Name, r.Relationship, r.BlockedBy ?? "حجب / مانع إرث")).ToList(),
            awlApplied,
            raddApplied,
            special,
            BuildArabicSummary(netEstate, results, madhab, awlApplied, raddApplied, special),
            BuildEnglishSummary(netEstate, results, madhab, awlApplied, raddApplied, special),
            BuildScenarioWarnings(heirs));

        foreach (var h in c.Heirs)
        {
            var r = results.FirstOrDefault(x => x.HeirId == h.Id);
            if (r is null) continue;
            h.ShareFraction = r.QuranicShare;
            h.ShareValue = r.ShareValue;
            h.BlockedBy = r.BlockedBy;
        }

        _db.InheritanceResults.Add(new InheritanceResult
        {
            CaseId = c.Id,
            CalculatedAt = response.CalculationTimestamp,
            TotalEstate = totalEstate,
            TotalDebts = deductedDebts,
            NetEstate = netEstate,
            Algorithm = ToAlgorithm(madhab),
            Results = JsonSerializer.Serialize(response, new JsonSerializerOptions { WriteIndented = false }),
            Notes = $"{Version}; {special}".Trim(';', ' ')
        });
        c.Status = CaseStatus.Calculated;
        c.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        return response;
    }

    private static void ApplyDisqualificationRules(List<HeirState> heirs, bool deceasedMuslim)
    {
        foreach (var h in heirs)
        {
            if (h.IsMurderer)
            {
                h.Block("مانع الإرث: القاتل لا يرث من المقتول", "Murderer cannot inherit from the victim", disqualified: true);
            }
            if (deceasedMuslim && h.Religion == Religion.NonMuslim)
            {
                h.Block("مانع الإرث: اختلاف الدين، غير المسلم لا يرث من المسلم", "Non-Muslim heir cannot inherit from Muslim decedent", disqualified: true);
            }
            if (h.IsMissing)
            {
                h.Notes.Add("المفقود: تُحسب المسألة بوجوده وبدونه ويُحفظ نصيبه احتياطياً حتى يتضح أمره.");
            }
            if (h.IsPregnant)
            {
                h.Notes.Add("حمل: تُعرض سيناريوهات وجود الحمل وعدم وجوده، ويحفظ النصيب الأعلى احتياطياً.");
            }
        }
    }

    private static void ApplyHajbRules(List<HeirState> heirs)
    {
        bool hasSon = Active(heirs, HeirType.Son);
        bool hasSonsSon = Active(heirs, HeirType.Son_Of_Son) || Active(heirs, HeirType.GrandSon);
        bool hasFather = Active(heirs, HeirType.Father);
        bool hasFullBrother = Active(heirs, HeirType.FullBrother) || Active(heirs, HeirType.Brother);
        bool hasFullSisterWithDaughter = (Active(heirs, HeirType.FullSister) || Active(heirs, HeirType.Sister)) && HasDescendantFemale(heirs);

        foreach (var h in heirs.Where(h => !h.Blocked))
        {
            if (hasSon && IsSiblingOrCollateral(h.Type)) h.Block("محجوب بالابن", "son");
            if (hasSon && h.Type is HeirType.GrandFather or HeirType.GrandMother) h.Block("محجوب بالابن حسب قاعدة الحجب المطلوبة", "son");
            if (!hasSon && hasSonsSon && (IsSiblingOrCollateral(h.Type) || h.Type is HeirType.GrandFather or HeirType.GrandMother)) h.Block("محجوب بابن الابن عند عدم الابن", "son's son");
            if (hasFather && (h.Type is HeirType.GrandFather || IsSibling(h.Type))) h.Block("محجوب بالأب", "father");
            if (hasFullBrother && IsPaternalSibling(h.Type)) h.Block("محجوب بالأخ الشقيق", "full brother");
            if (hasFullSisterWithDaughter && IsPaternalSister(h.Type)) h.Block("محجوبة بالأخت الشقيقة مع البنت", "full sister with daughter");
        }
    }

    private static void AssignFurudShares(List<HeirState> heirs, Madhab madhab, string? special)
    {
        var hasChildren = HasChildrenOrGrandChildren(heirs);
        var hasMaleDescendant = Active(heirs, HeirType.Son) || Active(heirs, HeirType.Son_Of_Son) || Active(heirs, HeirType.GrandSon);
        var daughterCount = CountActive(heirs, HeirType.Daughter);
        var sons = heirs.Where(h => !h.Blocked && h.Type == HeirType.Son).ToList();
        var wives = heirs.Where(h => !h.Blocked && h.Type == HeirType.Wife).ToList();
        var siblingCount = heirs.Where(h => !h.Blocked && IsSibling(h.Type)).Sum(h => h.Count);
        var fullSisterCount = heirs.Where(h => !h.Blocked && (h.Type == HeirType.FullSister || h.Type == HeirType.Sister)).Sum(h => h.Count);
        var maternalSiblings = heirs.Where(h => !h.Blocked && (h.Type == HeirType.MaternalBrother || h.Type == HeirType.MaternalSister)).ToList();

        foreach (var h in heirs.Where(h => !h.Blocked))
        {
            switch (h.Type)
            {
                case HeirType.Husband:
                    h.SetFurud(hasChildren ? Fraction.OneFourth : Fraction.OneHalf, hasChildren ? "للزوج الربع لوجود الفرع الوارث." : "للزوج النصف لعدم وجود الفرع الوارث.");
                    break;
                case HeirType.Wife:
                    var wifeTotal = hasChildren ? Fraction.OneEighth : Fraction.OneFourth;
                    h.SetFurud(wifeTotal / Math.Max(1, wives.Count), wives.Count > 1 ? "نصيب الزوجات يقسم بينهن بالسوية." : (hasChildren ? "للزوجة الثمن لوجود الفرع الوارث." : "للزوجة الربع لعدم وجود الفرع الوارث."));
                    break;
                case HeirType.Mother:
                    h.SetFurud(hasChildren || siblingCount >= 2 ? Fraction.OneSixth : Fraction.OneThird, hasChildren || siblingCount >= 2 ? "للأم السدس لوجود فرع وارث أو جمع من الإخوة." : "للأم الثلث لعدم الفرع الوارث وعدم جمع الإخوة.");
                    break;
                case HeirType.Father:
                    if (hasMaleDescendant) h.SetFurud(Fraction.OneSixth, "للأب السدس مع وجود ابن أو ابن ابن.");
                    else h.Notes.Add("الأب لا يسقط ويأخذ الباقي عصبة، ومع البنات له السدس والباقي عند عدم ذكر وارث أقرب.");
                    break;
                case HeirType.Daughter:
                    if (sons.Any()) h.MarkAsabaCandidate("البنت تصير عصبة بالابن: للذكر مثل حظ الأنثيين.");
                    else if (daughterCount == 1) h.SetFurud(Fraction.OneHalf, "للبنت الواحدة النصف عند عدم الابن.");
                    else h.SetFurud(Fraction.TwoThirds / daughterCount, "للبنات الثلثان يشتركن فيه عند عدم الابن.");
                    break;
                case HeirType.Daughter_Of_Son:
                case HeirType.GrandDaughter:
                    if (Active(heirs, HeirType.Son)) h.Block("محجوبة بالابن", "son");
                    else if (daughterCount == 1) h.SetFurud(Fraction.OneSixth, "لبنت الابن السدس تكملة للثلثين مع بنت واحدة.");
                    else if (daughterCount >= 2) h.Block("محجوبة باستكمال البنات للثلثين", "two daughters");
                    else h.SetFurud(CountActive(heirs, h.Type) > 1 ? Fraction.TwoThirds / CountActive(heirs, h.Type) : Fraction.OneHalf, "بنت الابن لها النصف منفردة أو الثلثان مع التعدد عند عدم الابن والبنت.");
                    break;
                case HeirType.FullSister:
                case HeirType.Sister:
                    if (!hasChildren && !Active(heirs, HeirType.Father))
                    {
                        h.SetFurud(fullSisterCount > 1 ? Fraction.TwoThirds / fullSisterCount : Fraction.OneHalf, fullSisterCount > 1 ? "للأخوات الشقيقات الثلثان عند التعدد." : "للأخت الشقيقة النصف عند الانفراد.");
                    }
                    else if (HasDescendantFemale(heirs)) h.MarkAsabaCandidate("الأخت مع البنت عصبة مع الغير.");
                    break;
                case HeirType.PaternalSister:
                case HeirType.PaternalSisterLegacy:
                    if (fullSisterCount == 1 && !Active(heirs, HeirType.FullBrother)) h.SetFurud(Fraction.OneSixth, "للأخت لأب السدس مع أخت شقيقة واحدة تكملة للثلثين.");
                    break;
                case HeirType.MaternalBrother:
                case HeirType.MaternalSister:
                    if (hasChildren || Active(heirs, HeirType.Father)) h.Block("الإخوة لأم محجوبون بالفرع الوارث أو الأب", hasChildren ? "children" : "father");
                    else
                    {
                        var total = maternalSiblings.Sum(x => x.Count);
                        h.SetFurud(total == 1 ? Fraction.OneSixth : Fraction.OneThird / total, total == 1 ? "للأخ أو الأخت لأم السدس منفرداً." : "الإخوة لأم يشتركون في الثلث بالسوية.");
                    }
                    break;
            }
        }

        if (special == "Mushtaraka" && (madhab == Madhab.Maliki || madhab == Madhab.Shafii))
        {
            foreach (var h in heirs.Where(h => !h.Blocked && (h.Type is HeirType.FullBrother or HeirType.FullSister or HeirType.Brother or HeirType.Sister)))
            {
                h.Notes.Add("المشتركة: في المالكية والشافعية يُشرك الإخوة الأشقاء مع الإخوة لأم في الثلث عند تحقق شروطها.");
            }
        }
        if (special == "Akdariyya" && madhab == Madhab.Shafii)
        {
            foreach (var h in heirs.Where(h => !h.Blocked && (h.Type is HeirType.GrandFather or HeirType.FullSister or HeirType.Sister)))
            {
                h.Notes.Add("الأكدرية: مسألة خاصة بين الجد والأخت عند الشافعية تحتاج تسوية خاصة؛ أُضيف تنبيه للمراجعة القضائية.");
            }
        }
    }

    private static void ApplyAsaba(List<HeirState> heirs, Madhab madhab)
    {
        var used = heirs.Where(h => !h.Blocked).Sum(h => h.Share.Value);
        var remainder = Math.Max(0m, 1m - used);
        if (remainder <= 0) return;

        var group = SelectAsabaGroup(heirs, madhab).ToList();
        if (!group.Any()) return;

        var units = group.Sum(h => h.AsabaUnits);
        if (units <= 0) return;

        foreach (var h in group)
        {
            var add = Fraction.FromDecimal(remainder * h.AsabaUnits / units);
            h.Share += add;
            h.Basis = h.Basis == ShareBasis.Furud ? ShareBasis.FurudPlusAsaba : ShareBasis.Asaba;
            h.Notes.Add("عصبة: يأخذ من الباقي بعد أصحاب الفروض بحسب الترتيب الشرعي، وللذكر مثل حظ الأنثيين عند الاجتماع مع الأنثى.");
        }
    }

    private static IEnumerable<HeirState> SelectAsabaGroup(List<HeirState> heirs, Madhab madhab)
    {
        var active = heirs.Where(h => !h.Blocked).ToList();
        var sonsAndDaughters = active.Where(h => h.Type is HeirType.Son or HeirType.Daughter).ToList();
        if (sonsAndDaughters.Any(h => h.Type == HeirType.Son)) return sonsAndDaughters.Select(h => h.WithUnits(h.Type == HeirType.Son ? 2 : 1));

        var sonsSons = active.Where(h => h.Type is HeirType.Son_Of_Son or HeirType.GrandSon or HeirType.Daughter_Of_Son or HeirType.GrandDaughter).ToList();
        if (sonsSons.Any(h => h.Type is HeirType.Son_Of_Son or HeirType.GrandSon)) return sonsSons.Select(h => h.WithUnits(h.Type is HeirType.Son_Of_Son or HeirType.GrandSon ? 2 : 1));

        var father = active.FirstOrDefault(h => h.Type == HeirType.Father);
        if (father is not null) return new[] { father.WithUnits(1) };

        var grandfather = active.FirstOrDefault(h => h.Type == HeirType.GrandFather);
        var siblings = active.Where(h => h.Type is HeirType.FullBrother or HeirType.FullSister or HeirType.Brother or HeirType.Sister).ToList();
        if (grandfather is not null)
        {
            if (madhab == Madhab.Hanafi) return new[] { grandfather.WithUnits(1) };
            if (!siblings.Any()) return new[] { grandfather.WithUnits(1) };
            grandfather.Notes.Add("اختلاف مذهبي: ميراث الجد مع الإخوة يختلف، وهنا عولج وفق اختيار المذهب المحدد.");
        }

        var fullSiblings = siblings.Where(h => h.Type is HeirType.FullBrother or HeirType.FullSister or HeirType.Brother or HeirType.Sister).ToList();
        if (fullSiblings.Any(h => h.Type is HeirType.FullBrother or HeirType.Brother)) return fullSiblings.Select(h => h.WithUnits(h.Type is HeirType.FullBrother or HeirType.Brother ? 2 : 1));
        if (fullSiblings.Any(h => h.Basis == ShareBasis.AsabaCandidate)) return fullSiblings.Select(h => h.WithUnits(1));

        var paternalBrothers = active.Where(h => h.Type is HeirType.PaternalBrother or HeirType.PaternallBrother or HeirType.PaternalSister or HeirType.PaternalSisterLegacy).ToList();
        if (paternalBrothers.Any(h => h.Type is HeirType.PaternalBrother or HeirType.PaternallBrother)) return paternalBrothers.Select(h => h.WithUnits(h.Type is HeirType.PaternalBrother or HeirType.PaternallBrother ? 2 : 1));

        var nephew = active.FirstOrDefault(h => h.Type == HeirType.Nephew);
        if (nephew is not null) return new[] { nephew.WithUnits(1) };
        var uncle = active.FirstOrDefault(h => h.Type == HeirType.Uncle);
        if (uncle is not null) return new[] { uncle.WithUnits(1) };
        return Enumerable.Empty<HeirState>();
    }

    private static IEnumerable<HeirState> SelectRaddRecipients(IEnumerable<HeirState> shares, Madhab madhab)
    {
        if (madhab == Madhab.Maliki) return Enumerable.Empty<HeirState>();
        return shares.Where(h => h.Type is not (HeirType.Husband or HeirType.Wife));
    }

    private static string? DetectSpecialCase(List<HeirState> heirs, Madhab madhab)
    {
        if (Active(heirs, HeirType.Husband) && Active(heirs, HeirType.Mother)
            && heirs.Any(h => !h.Blocked && (h.Type is HeirType.MaternalBrother or HeirType.MaternalSister))
            && heirs.Any(h => !h.Blocked && (h.Type is HeirType.FullBrother or HeirType.FullSister or HeirType.Brother or HeirType.Sister))) return "Mushtaraka";

        if (Active(heirs, HeirType.GrandFather) && Active(heirs, HeirType.Husband) && Active(heirs, HeirType.Mother)
            && heirs.Any(h => !h.Blocked && (h.Type is HeirType.FullSister or HeirType.Sister))) return "Akdariyya";

        return null;
    }

    private static List<string> BuildScenarioWarnings(List<HeirState> heirs)
    {
        var warnings = new List<string>();
        if (heirs.Any(h => h.IsPregnant)) warnings.Add("Pregnancy scenario detected: calculate with and without unborn child and hold the safer share until birth.");
        if (heirs.Any(h => h.IsMissing)) warnings.Add("Missing person scenario detected: calculate with and without the missing heir and hold disputed share in escrow.");
        return warnings;
    }

    private static string BuildArabicSummary(decimal netEstate, IReadOnlyList<HeirCalculationDto> results, Madhab madhab, bool awl, bool radd, string? special)
        => $"تم حساب صافي التركة {netEstate:N2} وفق مذهب {madhab}. عدد الورثة المستحقين: {results.Count(r => r.CalculationBasis != "Blocked" && r.CalculationBasis != "Disqualified")}." +
           (awl ? " طُبّق العول." : "") + (radd ? " طُبّق الرد." : "") + (special is not null ? $" تنبيه لمسألة خاصة: {special}." : "");

    private static string BuildEnglishSummary(decimal netEstate, IReadOnlyList<HeirCalculationDto> results, Madhab madhab, bool awl, bool radd, string? special)
        => $"Net estate {netEstate:N2} calculated under {madhab}. Eligible heirs: {results.Count(r => r.CalculationBasis != "Blocked" && r.CalculationBasis != "Disqualified")}." +
           (awl ? " Awl was applied." : "") + (radd ? " Radd was applied." : "") + (special is not null ? $" Special-case warning: {special}." : "");

    private static bool Active(List<HeirState> heirs, HeirType type) => heirs.Any(h => !h.Blocked && h.Type == type);
    private static int CountActive(List<HeirState> heirs, HeirType type) => heirs.Where(h => !h.Blocked && h.Type == type).Sum(h => Math.Max(1, h.Count));
    private static bool HasChildrenOrGrandChildren(List<HeirState> heirs) => heirs.Any(h => !h.Blocked && h.Type is HeirType.Son or HeirType.Daughter or HeirType.Son_Of_Son or HeirType.Daughter_Of_Son or HeirType.GrandSon or HeirType.GrandDaughter);
    private static bool HasDescendantFemale(List<HeirState> heirs) => heirs.Any(h => !h.Blocked && h.Type is HeirType.Daughter or HeirType.Daughter_Of_Son or HeirType.GrandDaughter);
    private static bool IsSibling(HeirType t) => t is HeirType.Brother or HeirType.Sister or HeirType.FullBrother or HeirType.FullSister or HeirType.PaternalBrother or HeirType.PaternallBrother or HeirType.PaternalSister or HeirType.PaternalSisterLegacy or HeirType.MaternalBrother or HeirType.MaternalSister;
    private static bool IsSiblingOrCollateral(HeirType t) => IsSibling(t) || t is HeirType.Uncle or HeirType.Nephew or HeirType.Niece;
    private static bool IsPaternalSibling(HeirType t) => t is HeirType.PaternalBrother or HeirType.PaternallBrother or HeirType.PaternalSister or HeirType.PaternalSisterLegacy;
    private static bool IsPaternalSister(HeirType t) => t is HeirType.PaternalSister or HeirType.PaternalSisterLegacy;

    private static Madhab ParseMadhab(string value) => value.Equals("Shafi", StringComparison.OrdinalIgnoreCase) ? Madhab.Shafii : Enum.TryParse<Madhab>(value, true, out var m) ? m : Madhab.Hanafi;
    private static InheritanceAlgorithm ToAlgorithm(Madhab m) => m switch { Madhab.Maliki => InheritanceAlgorithm.Maliki, Madhab.Shafii => InheritanceAlgorithm.Shafi, Madhab.Hanbali => InheritanceAlgorithm.Hanbali, _ => InheritanceAlgorithm.Hanafi };
    private static decimal ReadDecimalEnv(string key, decimal fallback) => decimal.TryParse(Environment.GetEnvironmentVariable(key), out var v) ? v : fallback;

    private enum ShareBasis { None, Furud, AsabaCandidate, Asaba, FurudPlusAsaba, Blocked, Disqualified }

    private sealed class HeirState
    {
        public Guid Id { get; init; }
        public string Name { get; init; } = string.Empty;
        public HeirType Type { get; init; }
        public int Count { get; init; } = 1;
        public Fraction Share { get; set; } = Fraction.Zero;
        public ShareBasis Basis { get; set; } = ShareBasis.None;
        public string? BlockedBy { get; set; }
        public bool Blocked => Basis is ShareBasis.Blocked or ShareBasis.Disqualified;
        public int AsabaUnits { get; private set; } = 1;
        public bool IsMurderer { get; init; }
        public bool IsMissing { get; init; }
        public bool IsPregnant { get; init; }
        public Religion Religion { get; init; } = Religion.Muslim;
        public List<string> Notes { get; } = new();

        public static HeirState From(Heir h) => new()
        {
            Id = h.Id,
            Name = h.Name,
            Type = h.Relationship,
            Count = Math.Max(1, h.Count),
            Religion = ReadProp<Religion>(h, "Religion", Religion.Muslim),
            IsMurderer = ReadProp<bool>(h, "IsMurderer", false),
            IsMissing = ReadProp<bool>(h, "IsMissing", false),
            IsPregnant = ReadProp<bool>(h, "IsPregnant", false)
        };

        public void SetFurud(Fraction f, string note) { Share += f; Basis = Basis == ShareBasis.None ? ShareBasis.Furud : Basis; Notes.Add(note); }
        public void MarkAsabaCandidate(string note) { Basis = ShareBasis.AsabaCandidate; Notes.Add(note); }
        public HeirState WithUnits(int units) { AsabaUnits = Math.Max(1, units) * Count; return this; }
        public void Block(string ar, string by, bool disqualified = false) { Share = Fraction.Zero; Basis = disqualified ? ShareBasis.Disqualified : ShareBasis.Blocked; BlockedBy = by; Notes.Add(ar); }
        public HeirCalculationDto ToDto(decimal netEstate, string currency) => new(Id, Name, Type.ToString(), Share.ToString(), Math.Round(Share.Value, 8), Math.Round(netEstate * Share.Value, 2), currency, Basis.ToString().Replace("Furud", "Furud / Ashab al-Furud"), BlockedBy, string.Join(" ", Notes));
    }

    private readonly record struct Fraction(decimal Numerator, decimal Denominator)
    {
        public static readonly Fraction Zero = new(0, 1);
        public static readonly Fraction OneHalf = new(1, 2);
        public static readonly Fraction OneThird = new(1, 3);
        public static readonly Fraction TwoThirds = new(2, 3);
        public static readonly Fraction OneFourth = new(1, 4);
        public static readonly Fraction OneSixth = new(1, 6);
        public static readonly Fraction OneEighth = new(1, 8);
        public decimal Value => Denominator == 0 ? 0 : Numerator / Denominator;
        public static Fraction FromDecimal(decimal value) => new(value, 1);
        public static Fraction operator +(Fraction a, Fraction b) => FromDecimal(a.Value + b.Value);
        public static Fraction operator /(Fraction a, int d) => FromDecimal(a.Value / d);
        public static bool operator >(Fraction a, Fraction b) => a.Value > b.Value;
        public static bool operator <(Fraction a, Fraction b) => a.Value < b.Value;
        public override string ToString()
        {
            if (Numerator == 0) return "0";
            var common = new Dictionary<decimal, string> { [0.5m] = "1/2", [0.3333333333333333333333333333m] = "1/3", [0.6666666666666666666666666667m] = "2/3", [0.25m] = "1/4", [0.1666666666666666666666666667m] = "1/6", [0.125m] = "1/8" };
            var value = Value;
            var match = common.OrderBy(k => Math.Abs(k.Key - value)).FirstOrDefault();
            return Math.Abs(match.Key - value) < 0.0000001m ? match.Value : value.ToString("0.########");
        }
    }

    private static T ReadProp<T>(object target, string prop, T fallback)
    {
        var p = target.GetType().GetProperty(prop);
        if (p?.GetValue(target) is T value) return value;
        return fallback;
    }
}

public sealed record FarayidCalculationRequest(string Madhab, bool IncludeDebts, decimal? GoldPricePerGram = null, decimal? SilverPricePerGram = null, decimal? FuneralExpenses = null, decimal? BequestAmount = null);
public sealed record FarayidCalculationResponse(Guid CaseId, decimal TotalEstate, decimal NetEstate, decimal DeductedDebts, decimal FuneralExpenses, decimal DeductedBequest, string MadhabUsed, DateTime CalculationTimestamp, string Version, IReadOnlyList<HeirCalculationDto> Heirs, IReadOnlyList<BlockedHeirDto> BlockedHeirs, bool AwlApplied, bool RaddApplied, string? SpecialCase, string SummaryArabic, string SummaryEnglish, IReadOnlyList<string> ScenarioWarnings);
public sealed record HeirCalculationDto(Guid HeirId, string Name, string Relationship, string QuranicShare, decimal ShareDecimal, decimal ShareValue, string Currency, string CalculationBasis, string? BlockedBy, string Notes);
public sealed record BlockedHeirDto(Guid HeirId, string Name, string Relationship, string Reason);
