using Mirath.Shared.Entities;
using Mirath.Domain.Enums;
using Mirath.Shared.Enums;

namespace Mirath.Domain.Services;

public class MafqudCalculator
{
    public static MafqudResult Calculate(Heir missingPerson, List<Heir> otherHeirs, DateTime disappearanceDate, DateTime currentDate)
    {
        var timeElapsed = currentDate - disappearanceDate;
        var yearsMissing = timeElapsed.TotalDays / 365.25;
        
        // Islamic ruling: wait 4 years before declaring death
        const int waitingPeriodYears = 4;
        
        if (yearsMissing < waitingPeriodYears)
        {
            // Presumed alive - cannot distribute
            return new MafqudResult(
                MafqudStatus.PresumedAlive,
                $"لم يمضِ على فقدانه سوى {yearsMissing:F1} سنة، لا يوزع الميراث حتى يتم {waitingPeriodYears} سنوات",
                null);
        }
        
        // After 4 years, can be declared dead
        // Two scenarios:
        // 1. Distribute with reservation (حجز نصيبه)
        // 2. Distribute fully after 90 years (age 120)
        
        var estimatedAge = 60 + yearsMissing; // Assume he was 60 at disappearance
        const int maxIslamicAge = 120;
        
        if (estimatedAge < maxIslamicAge)
        {
            // Distribute but reserve his share
            return new MafqudResult(
                MafqudStatus.ReservedShare,
                $"تم تقدير وفاته، ولكن يتم حجز نصيبه حتى يبلغ {maxIslamicAge} سنة (الآن {estimatedAge:F0} سنة)",
                new ReservedShare(missingPerson.Type, 0.1)); // Placeholder share calculation
        }
        
        // Fully distribute
        return new MafqudResult(
            MafqudStatus.ConfirmedDeath,
            $"تم التأكد من وفاته بعد تجاوز {maxIslamicAge} سنة، يتم توزيع ميراثه كاملاً",
            null);
    }
}

public enum MafqudStatus
{
    PresumedAlive,
    ReservedShare,
    ConfirmedDeath
}

public record MafqudResult(MafqudStatus Status, string Explanation, ReservedShare? ReservedShare);
public record ReservedShare(HeirType HeirType, double ReservedRatio);
