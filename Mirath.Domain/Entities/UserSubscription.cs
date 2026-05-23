using Mirath.Domain.Enums;

namespace Mirath.Domain.Entities;

public class UserSubscription
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid PlanId { get; set; }
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;
    public int CasesUsedThisPeriod { get; set; }
    public DateTime UsagePeriodStart { get; set; } = DateTime.UtcNow.Date;
    public DateTime UsagePeriodEnd { get; set; } = DateTime.UtcNow.Date.AddMonths(1);
    public DateTime StartsAt { get; set; } = DateTime.UtcNow;
    public DateTime? EndsAt { get; set; }
    public bool AutoRenew { get; set; } = true;
    public string Currency { get; set; } = "USD";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public virtual User User { get; set; } = null!;
    public virtual SubscriptionPlan Plan { get; set; } = null!;
}
