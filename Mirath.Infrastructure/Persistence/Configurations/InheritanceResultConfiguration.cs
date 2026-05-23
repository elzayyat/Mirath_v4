using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mirath.Domain.Entities;

namespace Mirath.Infrastructure.Persistence.Configurations;

public class InheritanceResultConfiguration : IEntityTypeConfiguration<InheritanceResult>
{
    public void Configure(EntityTypeBuilder<InheritanceResult> builder)
    {
        builder.ToTable("InheritanceResults");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.TotalEstate).HasPrecision(18, 2);
        builder.Property(r => r.TotalDebts).HasPrecision(18, 2);
        builder.Property(r => r.NetEstate).HasPrecision(18, 2);
        builder.Property(r => r.Algorithm).HasConversion<string>().IsRequired().HasMaxLength(20);
        builder.Property(r => r.Results).HasColumnType("jsonb").IsRequired();
        builder.Property(r => r.Notes).HasColumnType("text");
        builder.HasOne(r => r.Case).WithMany(c => c.InheritanceResults).HasForeignKey(r => r.CaseId).OnDelete(DeleteBehavior.Cascade);
    }
}
