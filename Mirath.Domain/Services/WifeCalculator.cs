using Mirath.Shared.Entities;
using Mirath.Shared.Enums;

namespace Mirath.Domain.Services;

public class WifeCalculator
{
    public static WifeResult Calculate(List<Heir> heirs)
    {
        var wives = heirs.FirstOrDefault(h => h.Type == HeirType.Wife);
        
        if (wives == null || wives.Count == 0)
            return new WifeResult(false, 0, 0, new List<WifeShare>());
        
        bool hasChildren = heirs.Any(h => 
            h.Type == HeirType.Son || 
            h.Type == HeirType.Daughter ||
            h.Type == HeirType.GrandSon);
        
        // Total share for all wives
        double totalShare = hasChildren ? 0.125 : 0.25; // 1/8 or 1/4
        
        // Distribute equally among wives
        double perWife = totalShare / wives.Count;
        
        var shares = new List<WifeShare>();
        for (int i = 1; i <= wives.Count; i++)
        {
            shares.Add(new WifeShare(i, perWife, 
                $"الزوجة {i} تأخذ {perWife:P2} من التركة"));
        }
        
        return new WifeResult(true, totalShare, perWife, shares);
    }
}

public record WifeResult(bool HasWives, double TotalShare, double PerWifeShare, List<WifeShare> Shares);
public record WifeShare(int WifeNumber, double Share, string Explanation);