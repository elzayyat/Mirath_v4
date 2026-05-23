using Mirath.Shared.Entities;
using Mirath.Shared.Enums;

namespace Mirath.Domain.Services;

public class SisterCalculator
{
    public static SisterResult Calculate(List<Heir> heirs)
    {
        var daughter = heirs.FirstOrDefault(h => h.Type == HeirType.Daughter);
        var fullSister = heirs.FirstOrDefault(h => h.Type == HeirType.FullSister);
        var fullBrother = heirs.FirstOrDefault(h => h.Type == HeirType.FullBrother);
        var father = heirs.FirstOrDefault(h => h.Type == HeirType.Father);
        var son = heirs.FirstOrDefault(h => h.Type == HeirType.Son);
        
        // Full sister is blocked by father or son
        if (father != null || son != null)
        {
            return new SisterResult(HeirType.FullSister, "0", 0, 
                "الأخت الشقيقة محجوبة بالأب أو الابن", true);
        }
        
        // With brother - Asaba (2:1)
        if (fullSister != null && fullBrother != null)
        {
            return new SisterResult(HeirType.FullSister, "عصبة", 0, 
                "الأخت عصبة مع أخيها بنسبة 2:1", false);
        }
        
        // With daughter - becomes Asaba ma'a ghayr (عصبة مع الغير)
        if (fullSister != null && daughter != null && fullBrother == null)
        {
            return new SisterResult(HeirType.FullSister, "عصبة مع الغير", 0, 
                "الأخت تصبح عصبة مع البنت تأخذ الباقي", false);
        }
        
        // Single full sister - 1/2
        if (fullSister != null && fullSister.Count == 1)
        {
            return new SisterResult(HeirType.FullSister, "1/2", 0.5, 
                "الأخت الشقيقة الواحدة تأخذ النصف", false);
        }
        
        // Two or more full sisters - 2/3
        if (fullSister != null && fullSister.Count >= 2)
        {
            return new SisterResult(HeirType.FullSister, "2/3", 2.0/3.0, 
                "الأختان الشقيقتان فأكثر يأخذن الثلثين", false);
        }
        
        return new SisterResult(HeirType.FullSister, "0", 0, "لا يوجد نصيب", false);
    }
}

public record SisterResult(HeirType Type, string Fraction, double Share, string Explanation, bool IsBlocked);