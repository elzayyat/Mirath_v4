using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mirath.Domain.Entities;

namespace Mirath.Infrastructure.Persistence.Configurations;

public class DecedentConfiguration : IEntityTypeConfiguration<Decedent>
{
    public void Configure(EntityTypeBuilder<Decedent> builder)
    {
        builder.ToTable("Decedents");
        builder.HasKey(d => d.Id);
        builder.HasIndex(d => d.CaseId).IsUnique();
        builder.Property(d => d.Name).IsRequired().HasMaxLength(200);
        builder.Property(d => d.Religion).HasConversion<string>().IsRequired().HasMaxLength(20);
        builder.Property(d => d.MaritalStatus).HasConversion<string>().IsRequired().HasMaxLength(20);
        builder.Property(d => d.Notes).HasColumnType("text");
        builder.HasOne(d => d.Case).WithOne(c => c.Decedent).HasForeignKey<Decedent>(d => d.CaseId).OnDelete(DeleteBehavior.Cascade);
    }
}
