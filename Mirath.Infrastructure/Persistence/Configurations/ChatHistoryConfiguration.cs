using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mirath.Infrastructure.Persistence;

namespace Mirath.Infrastructure.Persistence.Configurations;

public class ChatHistoryConfiguration : IEntityTypeConfiguration<ChatHistory>
{
    public void Configure(EntityTypeBuilder<ChatHistory> builder)
    {
        builder.ToTable("ChatHistories");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Role)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(c => c.Content)
            .IsRequired()
            .HasColumnType("text");

        builder.HasIndex(c => c.UserId);
        builder.HasIndex(c => c.CaseId);
        builder.HasIndex(c => c.Timestamp);
    }
}
