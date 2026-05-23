using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mirath.Domain.Entities;

namespace Mirath.Infrastructure.Persistence.Configurations;

public class CaseConfiguration : IEntityTypeConfiguration<Case>
{
    public void Configure(EntityTypeBuilder<Case> builder)
    {
        builder.ToTable("Cases");
        builder.HasKey(c => c.Id);
        builder.HasIndex(c => c.CaseNumber).IsUnique();
        builder.Property(c => c.CaseNumber).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Title).IsRequired().HasMaxLength(250);
        builder.Property(c => c.Status).HasConversion<string>().IsRequired().HasMaxLength(30);
        builder.Property(c => c.Notes).HasColumnType("text");
        builder.Property(c => c.TotalAssets).HasPrecision(18, 2);
        builder.Property(c => c.TotalDebts).HasPrecision(18, 2);
        builder.Property(c => c.FuneralExpenses).HasPrecision(18, 2);
        builder.Property(c => c.WillAmount).HasPrecision(18, 2);
        builder.Property(c => c.NetEstate).HasPrecision(18, 2);
    }
}
