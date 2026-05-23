using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mirath.Domain.Entities;

namespace Mirath.Infrastructure.Persistence.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("AuditLogs");
        builder.HasKey(a => a.Id);
        builder.HasIndex(a => new { a.UserId, a.Timestamp });
        builder.Property(a => a.Action).IsRequired().HasMaxLength(120);
        builder.Property(a => a.EntityType).HasMaxLength(120);
        builder.Property(a => a.EntityId).HasMaxLength(120);
        builder.Property(a => a.Details).HasColumnType("jsonb");
    }
}
