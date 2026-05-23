using Mirath.Shared.Entities;
using Mirath.Shared.Enums;

namespace Mirath.Domain.Services;

public interface IFaraidhEngine
{
    Task<CalculationResult> CalculateAsync(
        List<Heir> heirs,
        decimal netEstate,
        Mirath.Domain.Enums.Madhab madhab,
        CancellationToken cancellationToken = default);
}

public record CalculationResult(
    List<HeirShareResult> Shares,
    List<CalculationStepResult> Steps,
    bool IsAwlApplied,
    bool IsRaddApplied,
    double TotalRatio);

public record HeirShareResult(
    Mirath.Shared.Enums.HeirType HeirType,
    string HeirName,
    string Fraction,
    double Ratio,
    decimal Amount,
    string ShareType,
    string Explanation);

public record CalculationStepResult(
    int StepOrder,
    string Title,
    string Description,
    double? BeforeValue,
    double? AfterValue);

public class FaraidhEngine : IFaraidhEngine
{
    public async Task<CalculationResult> CalculateAsync(
        List<Heir> heirs,
        decimal netEstate,
        Mirath.Domain.Enums.Madhab madhab,
        CancellationToken cancellationToken = default)
    {
        var steps = new List<CalculationStepResult>();
        var results = new List<HeirShareResult>();

        steps.Add(new CalculationStepResult(1, "Validation", "Validating heirs list", null, null));

        foreach (var heir in heirs)
        {
            Console.WriteLine($"Debug: Heir.Type = {heir.Type}");

            var (fraction, ratio, shareType) = CalculateShare(heir, heirs);

            if (ratio > 0)
            {
                results.Add(new HeirShareResult(
                    heir.Type,
                    heir.Name,
                    fraction,
                    ratio,
                    netEstate * (decimal)ratio,
                    shareType,
                    GetExplanation(heir.Type)));
            }
        }

        double fixedRatioSum = results.Sum(r => r.Ratio);
        
        // Corrected Asaba (Residue) distribution logic
        var sons = heirs.Where(h => h.Type == HeirType.Son).ToList();
        var daughtersAsAsaba = sons.Any() ? heirs.Where(h => h.Type == HeirType.Daughter).ToList() : new List<Heir>();
        var fatherAsAsaba = !heirs.Any(h => h.Type == HeirType.Son || h.Type == HeirType.Daughter) 
            ? heirs.Where(h => h.Type == HeirType.Father).ToList() : new List<Heir>();

        var asabaGroup = sons.Concat(daughtersAsAsaba).Concat(fatherAsAsaba).ToList();
        
        if (fixedRatioSum < 1.0 && asabaGroup.Any())
        {
            double residue = 1.0 - fixedRatioSum;
            
            // Calculate units: Son = 2, Daughter = 1, Father = 1 (if asaba)
            double totalUnits = sons.Sum(s => s.Count * 2) + daughtersAsAsaba.Sum(d => d.Count * 1) + fatherAsAsaba.Sum(f => f.Count * 1);
            double unitShare = residue / totalUnits;

            foreach (var heir in asabaGroup)
            {
                double ratio = heir.Type == HeirType.Son ? unitShare * 2 : unitShare;
                results.Add(new HeirShareResult(
                    heir.Type, 
                    heir.Name, 
                    "Remainder", 
                    ratio, 
                    netEstate * (decimal)ratio, 
                    "Asaba", 
                    "العصبة: يأخذ ما تبقى من التركة (للذكر مثل حظ الأنثيين)"));
            }
        }

        double totalRatio = results.Sum(r => r.Ratio);
        bool isAwlApplied = totalRatio > 1.00001; // Account for precision

        if (isAwlApplied)
        {
            double adjustment = 1.0 / totalRatio;
            for (int i = 0; i < results.Count; i++)
            {
                var r = results[i];
                results[i] = r with 
                { 
                    Ratio = r.Ratio * adjustment,
                    Amount = netEstate * (decimal)(r.Ratio * adjustment),
                    Explanation = r.Explanation + " (تم تطبيق العول)"
                };
            }
            steps.Add(new CalculationStepResult(3, "Awl Applied", $"Total shares exceeded 100%, adjusted by factor {adjustment:F4}", totalRatio, 1.0));
            totalRatio = 1.0;
        }

        bool isRaddApplied = totalRatio < 0.9999 && !heirs.Any(h => h.Type == Mirath.Shared.Enums.HeirType.Son || h.Type == Mirath.Shared.Enums.HeirType.Father);

        if (isRaddApplied)
        {
            double remainder = 1.0 - totalRatio;
            double adjustment = 1.0 / totalRatio;
            for (int i = 0; i < results.Count; i++)
            {
                var r = results[i];
                results[i] = r with 
                { 
                    Ratio = r.Ratio + (r.Ratio / totalRatio) * remainder,
                    Amount = netEstate * (decimal)(r.Ratio + (r.Ratio / totalRatio) * remainder),
                    Explanation = r.Explanation + " (تم تطبيق الرد)"
                };
            }
            steps.Add(new CalculationStepResult(4, "Radd Applied", $"Surplus {remainder:P2} redistributed to heirs", totalRatio, 1.0));
        }

        return await Task.FromResult(new CalculationResult(results, steps, isAwlApplied, isRaddApplied, results.Sum(r => r.Ratio)));
    }

    private (string Fraction, double Ratio, string ShareType) CalculateShare(Heir heir, List<Heir> allHeirs)
    {
        bool hasChildren = allHeirs.Any(h => h.Type == HeirType.Son || h.Type == HeirType.Daughter);
        bool hasSon = allHeirs.Any(h => h.Type == HeirType.Son);
        bool hasSiblings = allHeirs.Count(h => h.Type == HeirType.FullBrother || h.Type == HeirType.FullSister || h.Type == HeirType.MaternalBrother) > 1;

        return heir.Type switch
        {
            HeirType.Husband => hasChildren ? ("1/4", 0.25, "Fixed") : ("1/2", 0.50, "Fixed"),
            HeirType.Wife => hasChildren ? ("1/8", 0.125, "Fixed") : ("1/4", 0.25, "Fixed"),
            HeirType.Father => hasChildren ? ("1/6", 0.1667, "Fixed") : ("Asaba", 0, "Asaba"),
            HeirType.Mother => (hasChildren || hasSiblings) ? ("1/6", 0.1667, "Fixed") : ("1/3", 0.3333, "Fixed"),
            HeirType.Daughter => hasSon ? ("0", 0, "Asaba") : (allHeirs.Count(h => h.Type == HeirType.Daughter) > 1 ? ("2/3", 0.6667, "Fixed") : ("1/2", 0.5, "Fixed")),
            HeirType.Son => ("Asaba", 0, "Asaba"),
            HeirType.FullSister => ("1/2", 0.5, "Fixed"),
            _ => ("0", 0, "None")
        };
    }

    private string GetExplanation(Mirath.Shared.Enums.HeirType heirType)
    {
        return heirType switch
        {
            Mirath.Shared.Enums.HeirType.Husband => "الزوج: النصف أو الربع حسب وجود الأولاد (سورة النساء: 12)",
            HeirType.Wife => "الزوجة: الربع أو الثمن حسب وجود الأولاد (سورة النساء: 12)",
            HeirType.Father => "الأب: السدس فرضاً أو العصبة (سورة النساء: 11)",
            HeirType.Mother => "الأم: الثلث أو السدس حسب وجود الإخوة (سورة النساء: 11)",
            HeirType.Daughter => "البنت: النصف أو الثلثان (سورة النساء: 11)",
            HeirType.Son => "الابن: عصبة (يأخذ ضعف الأنثى)",
            HeirType.FullSister => "الأخت الشقيقة: النصف أو الثلثان (سورة النساء: 176)",
            _ => "نصيب شرعي محدد في الكتاب والسنة"
        };
    }
}