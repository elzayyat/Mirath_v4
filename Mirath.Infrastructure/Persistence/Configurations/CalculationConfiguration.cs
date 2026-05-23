using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mirath.Domain.Entities;

namespace Mirath.Infrastructure.Persistence.Configurations;

public class CalculationConfiguration : IEntityTypeConfiguration<Calculation>
{
    public void Configure(EntityTypeBuilder<Calculation> builder)
    {
        builder.ToTable("Calculations");
        builder.HasKey(c => c.Id);
    }
}
