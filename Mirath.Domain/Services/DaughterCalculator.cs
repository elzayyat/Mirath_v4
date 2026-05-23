using Mirath.Shared.Entities;
using Mirath.Shared.Enums;

namespace Mirath.Domain.Services;

public class DaughterCalculator
{
    public static DaughterResult Calculate(List<Heir> heirs)
    {
        var daughter = heirs.FirstOrDefault(h => h.Type == HeirType.Daughter);
        var grandDaughter = heirs.FirstOrDefault(h => h.Type == HeirType.GrandDaughter);
        var son = heirs.FirstOrDefault(h => h.Type == HeirType.Son);
        
        // Case 1: Only daughters, no son
        if (son == null)
        {
            if (daughter != null && daughter.Count == 1)
                return new DaughterResult(HeirType.Daughter, "1/2", 0.5, "البنت الواحدة تأخذ النصف");
            
            if (daughter != null && daughter.Count >= 2)
                return new DaughterResult(HeirType.Daughter, "2/3", 2.0/3.0, "البنتان فأكثر تأخذان الثلثين");
        }
        
        // Case 2: Daughter with son - Asaba (2:1 ratio)
        if (daughter != null && son != null)
        {
            return new DaughterResult(HeirType.Daughter, "عصبة", 0, "البنت عصبة مع الابن بنسبة 2:1");
        }
        
        // Case 3: Daughter + GrandDaughter (special case)
        if (daughter != null && grandDaughter != null && son == null)
        {
            // Daughter takes 1/2, GrandDaughter takes 1/6 to complete 2/3
            return new DaughterResult(HeirType.GrandDaughter, "1/6", 1.0/6.0, 
                "بنت الابن تأخذ السدس تكملة للثلثين مع البنت");
        }
        
        return new DaughterResult(HeirType.Daughter, "0", 0, "لا يوجد نصيب");
    }
}

public record DaughterResult(HeirType Type, string Fraction, double Share, string Explanation);