using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mirath.Domain.Entities;

namespace Mirath.Infrastructure.Persistence.Configurations;

public class DocumentConfiguration : IEntityTypeConfiguration<Document>
{
    public void Configure(EntityTypeBuilder<Document> builder)
    {
        builder.ToTable("Documents");
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Type).IsRequired().HasMaxLength(80);
        builder.Property(d => d.FileName).IsRequired().HasMaxLength(260);
        builder.Property(d => d.FilePath).IsRequired().HasMaxLength(1000);
        builder.Ignore(d => d.FileUrl);
        builder.Ignore(d => d.CreatedAt);
        builder.HasOne(d => d.Case).WithMany(c => c.Documents).HasForeignKey(d => d.CaseId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(d => d.UploadedByUser).WithMany().HasForeignKey(d => d.UploadedBy).OnDelete(DeleteBehavior.SetNull);
    }
}
