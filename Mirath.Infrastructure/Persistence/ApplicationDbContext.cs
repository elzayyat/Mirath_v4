using Microsoft.EntityFrameworkCore;
using DomainEntities = Mirath.Domain.Entities;
using Mirath.Infrastructure.Persistence.Configurations;

namespace Mirath.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<DomainEntities.User> Users => Set<DomainEntities.User>();
    public DbSet<DomainEntities.Case> Cases => Set<DomainEntities.Case>();
    public DbSet<DomainEntities.Decedent> Decedents => Set<DomainEntities.Decedent>();
    public DbSet<DomainEntities.Heir> Heirs => Set<DomainEntities.Heir>();
    public DbSet<DomainEntities.Asset> Assets => Set<DomainEntities.Asset>();
    public DbSet<DomainEntities.Debt> Debts => Set<DomainEntities.Debt>();
    public DbSet<DomainEntities.Calculation> Calculations => Set<DomainEntities.Calculation>();
    public DbSet<DomainEntities.InheritanceResult> InheritanceResults => Set<DomainEntities.InheritanceResult>();
    public DbSet<DomainEntities.HeirShare> HeirShares => Set<DomainEntities.HeirShare>();
    public DbSet<DomainEntities.CalculationStep> CalculationSteps => Set<DomainEntities.CalculationStep>();
    public DbSet<DomainEntities.Document> Documents => Set<DomainEntities.Document>();
    public DbSet<DomainEntities.Notification> Notifications => Set<DomainEntities.Notification>();
    public DbSet<DomainEntities.AuditLog> AuditLogs => Set<DomainEntities.AuditLog>();
    public DbSet<DomainEntities.SubscriptionPlan> SubscriptionPlans => Set<DomainEntities.SubscriptionPlan>();
    public DbSet<DomainEntities.UserSubscription> UserSubscriptions => Set<DomainEntities.UserSubscription>();
    public DbSet<ChatHistory> ChatHistories => Set<ChatHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new CaseConfiguration());
        modelBuilder.ApplyConfiguration(new DecedentConfiguration());
        modelBuilder.ApplyConfiguration(new AssetConfiguration());
        modelBuilder.ApplyConfiguration(new HeirConfiguration());
        modelBuilder.ApplyConfiguration(new InheritanceResultConfiguration());
        modelBuilder.ApplyConfiguration(new DocumentConfiguration());
        modelBuilder.ApplyConfiguration(new AuditLogConfiguration());
        modelBuilder.ApplyConfiguration(new NotificationConfiguration());
        modelBuilder.ApplyConfiguration(new CalculationConfiguration());
        modelBuilder.ApplyConfiguration(new ChatHistoryConfiguration());
        modelBuilder.ApplyConfiguration(new SubscriptionPlanConfiguration());
        modelBuilder.ApplyConfiguration(new UserSubscriptionConfiguration());
    }
}
