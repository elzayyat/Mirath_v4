using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mirath.Domain.Entities;

namespace Mirath.Infrastructure.Persistence.Configurations;

public class AssetConfiguration : IEntityTypeConfiguration<Asset>
{
    public void Configure(EntityTypeBuilder<Asset> builder)
    {
        builder.ToTable("Assets");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Type).HasConversion<string>().IsRequired().HasMaxLength(40);
        builder.Property(a => a.Description).HasMaxLength(500);
        builder.Property(a => a.Value).HasPrecision(18, 2);
        builder.Property(a => a.Currency).IsRequired().HasMaxLength(8);
        builder.Property(a => a.Weight).HasPrecision(18, 3);
        builder.Property(a => a.Unit).HasMaxLength(30);
        builder.HasOne(a => a.Case).WithMany(c => c.Assets).HasForeignKey(a => a.CaseId).OnDelete(DeleteBehavior.Cascade);
    }
}
