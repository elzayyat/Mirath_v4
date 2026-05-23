using Mirath.Domain.Enums;

namespace Mirath.Domain.Entities;

public class SubscriptionPlan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public SubscriptionPlanType PlanType { get; set; }
    public decimal MonthlyPrice { get; set; }
    public int MonthlyCaseLimit { get; set; }
    public bool HasAdvancedCalculator { get; set; }
    public bool HasPdfExports { get; set; }
    public bool HasPrioritySupport { get; set; }
    public bool HasClientManagement { get; set; }
    public bool HasAdminAccess { get; set; }
    public bool IsSystemPlan { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<UserSubscription> UserSubscriptions { get; set; } = new List<UserSubscription>();
}
