using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mirath.Domain.Entities;
using Mirath.Shared.Enums;

namespace Mirath.Infrastructure.Persistence.Configurations;

public class HeirConfiguration : IEntityTypeConfiguration<Heir>
{
    public void Configure(EntityTypeBuilder<Heir> builder)
    {
        builder.ToTable("Heirs");
        builder.HasKey(h => h.Id);
        builder.Property(h => h.Relationship).HasConversion(v => v.ToString(), v => Enum.Parse<HeirType>(v)).IsRequired().HasMaxLength(60);
        builder.Ignore(h => h.Type);
        builder.Property(h => h.Name).IsRequired().HasMaxLength(150);
        builder.Property(h => h.Gender).HasConversion<string>().IsRequired().HasMaxLength(20);
        builder.Property(h => h.ShareFraction).HasMaxLength(50);
        builder.Property(h => h.ShareValue).HasPrecision(18, 2);
        builder.Property(h => h.BlockedBy).HasMaxLength(200);
        builder.Property(h => h.Religion).HasConversion<string>().IsRequired().HasMaxLength(20);
        builder.Property(h => h.IsMurderer).HasDefaultValue(false);
        builder.Property(h => h.IsMissing).HasDefaultValue(false);
        builder.Property(h => h.IsPregnant).HasDefaultValue(false);
        builder.Ignore(h => h.BlockingReason);
        builder.HasOne(h => h.Case).WithMany(c => c.Heirs).HasForeignKey(h => h.CaseId).OnDelete(DeleteBehavior.Cascade);
    }
}
