using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mirath.Domain.Entities;
using Mirath.Domain.Enums;

namespace Mirath.Infrastructure.Persistence.Configurations;

public class SubscriptionPlanConfiguration : IEntityTypeConfiguration<SubscriptionPlan>
{
    public void Configure(EntityTypeBuilder<SubscriptionPlan> builder)
    {
        builder.ToTable("SubscriptionPlans");

        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.PlanType).IsUnique();
        builder.Property(x => x.Name).IsRequired().HasMaxLength(100);
        builder.Property(x => x.PlanType).HasConversion<int>();
        builder.Property(x => x.MonthlyPrice).HasColumnType("decimal(18,2)");

        builder.HasData(
            new SubscriptionPlan
            {
                Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1"),
                Name = "Normal User",
                PlanType = SubscriptionPlanType.NormalUser,
                MonthlyPrice = 0m,
                MonthlyCaseLimit = 3,
                HasAdvancedCalculator = false,
                HasPdfExports = false,
                HasPrioritySupport = false,
                HasClientManagement = false,
                HasAdminAccess = false,
                IsSystemPlan = true,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new SubscriptionPlan
            {
                Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2"),
                Name = "Lawyer",
                PlanType = SubscriptionPlanType.Lawyer,
                MonthlyPrice = 49m,
                MonthlyCaseLimit = int.MaxValue,
                HasAdvancedCalculator = true,
                HasPdfExports = true,
                HasPrioritySupport = true,
                HasClientManagement = true,
                HasAdminAccess = false,
                IsSystemPlan = true,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new SubscriptionPlan
            {
                Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3"),
                Name = "Admin",
                PlanType = SubscriptionPlanType.Admin,
                MonthlyPrice = 0m,
                MonthlyCaseLimit = int.MaxValue,
                HasAdvancedCalculator = true,
                HasPdfExports = true,
                HasPrioritySupport = true,
                HasClientManagement = true,
                HasAdminAccess = true,
                IsSystemPlan = true,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            });
    }
}
