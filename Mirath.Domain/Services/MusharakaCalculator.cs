using Mirath.Shared.Entities;
using Mirath.Shared.Enums;

namespace Mirath.Domain.Services;

public class MusharakaCalculator
{
    // الحالة المشتركة: زوج + أم + إخوة لأم + إخوة أشقاء
    public static MusharakaResult? Calculate(List<Heir> heirs)
    {
        bool hasHusband = heirs.Any(h => h.Type == HeirType.Husband);
        bool hasMother = heirs.Any(h => h.Type == HeirType.Mother);
        bool hasMaternalSiblings = heirs.Any(h => 
            h.Type == HeirType.MaternalBrother || 
            h.Type == HeirType.MaternalSister);
        bool hasFullSiblings = heirs.Any(h => 
            h.Type == HeirType.FullBrother || 
            h.Type == HeirType.FullSister);
        
        // Check if this is the Musharaka case
        if (hasHusband && hasMother && hasMaternalSiblings && hasFullSiblings)
        {
            var maternalCount = heirs
                .Where(h => h.Type == HeirType.MaternalBrother || h.Type == HeirType.MaternalSister)
                .Sum(h => h.Count);
            
            var fullSiblingCount = heirs
                .Where(h => h.Type == HeirType.FullBrother || h.Type == HeirType.FullSister)
                .Sum(h => h.Count);
            
            // Husband: 1/2
            double husbandShare = 0.5;
            
            // Mother: 1/6
            double motherShare = 1.0 / 6.0;
            
            // Remaining: 1/3
            double remaining = 1.0 - (husbandShare + motherShare);
            
            // In Musharaka, all siblings share equally
            int totalSiblings = maternalCount + fullSiblingCount;
            double perSibling = remaining / totalSiblings;
            
            var shares = new List<MusharakaShare>();
            
            shares.Add(new MusharakaShare(HeirType.Husband, "1/2", husbandShare, 
                "الزوج يأخذ النصف لعدم وجود فرع وارث"));
            
            shares.Add(new MusharakaShare(HeirType.Mother, "1/6", motherShare, 
                "الأم تأخذ السدس لوجود الإخوة"));
            
            foreach (var sibling in heirs.Where(h => 
                h.Type == HeirType.MaternalBrother || 
                h.Type == HeirType.MaternalSister ||
                h.Type == HeirType.FullBrother ||
                h.Type == HeirType.FullSister))
            {
                shares.Add(new MusharakaShare(sibling.Type, 
                    $"{perSibling:P2}", perSibling, 
                    $"في المسألة المشتركة، يشترك الإخوة جميعاً في الثلث"));
            }
            
            return new MusharakaResult(true, shares, 
                "هذه هي المسألة المشتركة (المشركة) حيث يشترك الإخوة لأم والأشقاء في الثلث");
        }
        
        return new MusharakaResult(false, new List<MusharakaShare>(), string.Empty);
    }
}

public record MusharakaResult(bool IsMusharaka, List<MusharakaShare> Shares, string Explanation);
public record MusharakaShare(HeirType Type, string Fraction, double Share, string Explanation);