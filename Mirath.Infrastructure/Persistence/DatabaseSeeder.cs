using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Mirath.Domain.Entities;
using Mirath.Domain.Enums;
using Mirath.Infrastructure.Security;

namespace Mirath.Infrastructure.Persistence;

public class DatabaseSeeder
{
    public static readonly Guid DefaultAdminId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid NormalPlanId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1");
    private static readonly Guid LawyerPlanId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2");
    private static readonly Guid AdminPlanId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3");

    private readonly ApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ILogger<DatabaseSeeder> _logger;

    public DatabaseSeeder(
        ApplicationDbContext context,
        IPasswordHasher passwordHasher,
        ILogger<DatabaseSeeder> logger)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await EnsureSystemPlansAsync(cancellationToken);
        await EnsureInitialAdminAsync(cancellationToken);
    }

    private async Task EnsureSystemPlansAsync(CancellationToken cancellationToken)
    {
        var now = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var existing = await _context.SubscriptionPlans
            .Select(x => x.PlanType)
            .ToListAsync(cancellationToken);

        if (!existing.Contains(SubscriptionPlanType.NormalUser))
        {
            _context.SubscriptionPlans.Add(new SubscriptionPlan
            {
                Id = NormalPlanId,
                Name = "Normal User",
                PlanType = SubscriptionPlanType.NormalUser,
                MonthlyPrice = 0m,
                MonthlyCaseLimit = 3,
                IsSystemPlan = true,
                CreatedAt = now
            });
        }

        if (!existing.Contains(SubscriptionPlanType.Lawyer))
        {
            _context.SubscriptionPlans.Add(new SubscriptionPlan
            {
                Id = LawyerPlanId,
                Name = "Lawyer",
                PlanType = SubscriptionPlanType.Lawyer,
                MonthlyPrice = 49m,
                MonthlyCaseLimit = int.MaxValue,
                HasAdvancedCalculator = true,
                HasPdfExports = true,
                HasPrioritySupport = true,
                HasClientManagement = true,
                IsSystemPlan = true,
                CreatedAt = now
            });
        }

        if (!existing.Contains(SubscriptionPlanType.Admin))
        {
            _context.SubscriptionPlans.Add(new SubscriptionPlan
            {
                Id = AdminPlanId,
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
                CreatedAt = now
            });
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureInitialAdminAsync(CancellationToken cancellationToken)
    {
        var adminEmail =
            Environment.GetEnvironmentVariable("MIRATH_ADMIN_EMAIL")
            ?? "admin@mirath.app";

        var adminPassword =
            Environment.GetEnvironmentVariable("MIRATH_ADMIN_PASSWORD")
            ?? "Mirath@Admin2026!";

        var adminNameEnglish =
            Environment.GetEnvironmentVariable("MIRATH_ADMIN_NAME_EN")
            ?? "Mirath Super Admin";

        var adminNameArabic =
            Environment.GetEnvironmentVariable("MIRATH_ADMIN_NAME_AR")
            ?? "مدير ميراث";

        var admin = await _context.Users
            .Include(x => x.Subscriptions)
            .FirstOrDefaultAsync(
                x => x.Email == adminEmail || x.Id == DefaultAdminId,
                cancellationToken);

        if (admin == null)
        {
            admin = new User
            {
                Id = DefaultAdminId,
                Email = adminEmail,
                PasswordHash = _passwordHasher.HashPassword(adminPassword),
                Role = UserRole.Admin,
                NameEnglish = adminNameEnglish,
                NameArabic = adminNameArabic,
                Phone = string.Empty,
                CreatedAt = DateTime.UtcNow,
                IsActive = true,
                Status = AccountStatus.Active,
                AuthProvider = AuthProvider.EmailPassword,
                IsEmailVerified = true,
                IsSystemProtected = true,
                Language = "en",
                DefaultMadhab = Madhab.General
            };

            _context.Users.Add(admin);

            _logger.LogInformation(
                "Seeded initial Mirath admin user {Email}",
                adminEmail);
        }
        else
        {
            admin.Email = adminEmail;

            // FORCE RESET PASSWORD EVERY STARTUP
            admin.PasswordHash =
                _passwordHasher.HashPassword(adminPassword);

            admin.Role = UserRole.Admin;
            admin.NameEnglish = adminNameEnglish;
            admin.NameArabic = adminNameArabic;
            admin.IsActive = true;
            admin.Status = AccountStatus.Active;
            admin.IsEmailVerified = true;
            admin.IsSystemProtected = true;
            admin.UpdatedAt = DateTime.UtcNow;
        }

        if (!admin.Subscriptions.Any(x => x.Status == SubscriptionStatus.Active))
        {
            var start = new DateTime(
                DateTime.UtcNow.Year,
                DateTime.UtcNow.Month,
                1,
                0,
                0,
                0,
                DateTimeKind.Utc);

            admin.Subscriptions.Add(new UserSubscription
            {
                UserId = admin.Id,
                PlanId = AdminPlanId,
                Status = SubscriptionStatus.Active,
                CasesUsedThisPeriod = 0,
                UsagePeriodStart = start,
                UsagePeriodEnd = start.AddMonths(1),
                StartsAt = DateTime.UtcNow,
                AutoRenew = true,
                Currency = "USD"
            });
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}