using Mirath.Shared.Entities;
using Mirath.Shared.Enums;

namespace Mirath.Domain.Services;

public class HadamCalculator
{
    public static HadamResult Calculate(List<DeathEvent> deaths, DateTime incidentDate)
    {
        // Order deaths by time if known
        var orderedDeaths = deaths.OrderBy(d => d.EstimatedTime).ToList();
        
        var results = new List<InheritanceFlow>();
        
        for (int i = 0; i < orderedDeaths.Count; i++)
        {
            var currentDeath = orderedDeaths[i];
            var remainingHeirs = orderedDeaths.Skip(i + 1).ToList();
            
            // Calculate inheritance as if this person died first
            var flow = new InheritanceFlow(
                currentDeath.PersonName,
                currentDeath.HeirType,
                $"توفي {currentDeath.PersonName} أولاً، ينتقل ميراثه إلى الورثة الأحياء",
                currentDeath.EstateValue);
            
            results.Add(flow);
        }
        
        // If times are unknown, none inherits from the other
        if (deaths.All(d => d.EstimatedTime == null))
        {
            return new HadamResult(
                true,
                results,
                "توفي الجميع في حادث واحد دون معرفة الأسبقية، لا يرث أحدهم من الآخر (حكم الهدم)");
        }
        
        return new HadamResult(false, results, "تم ترتيب الوفيات حسب الوقت المقدر");
    }
}

public record DeathEvent(string PersonName, HeirType HeirType, DateTime? EstimatedTime, decimal EstateValue);
public record InheritanceFlow(string PersonName, HeirType HeirType, string Explanation, decimal EstateValue);
public record HadamResult(bool IsSimultaneous, List<InheritanceFlow> Flows, string Explanation);