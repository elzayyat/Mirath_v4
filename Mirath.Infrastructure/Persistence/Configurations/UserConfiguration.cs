using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mirath.Domain.Entities;

namespace Mirath.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(u => u.Id);
        builder.HasIndex(u => u.Email).IsUnique();
        builder.Property(u => u.Email).IsRequired().HasMaxLength(255);
        builder.Property(u => u.PasswordHash).IsRequired();
        builder.Property(u => u.Role).HasConversion<string>().IsRequired().HasMaxLength(20);
        builder.Property(u => u.NameEnglish).IsRequired().HasMaxLength(200);
        builder.Property(u => u.NameArabic).HasMaxLength(200);
        builder.Property(u => u.Phone).HasMaxLength(40);
        builder.Ignore(u => u.FullName);
        builder.Ignore(u => u.PhoneNumber);
        builder.Property(u => u.Status).HasConversion<int>();
        builder.Property(u => u.AuthProvider).HasConversion<int>();
        builder.Property(u => u.EmailVerificationToken).HasMaxLength(200);
        builder.Property(u => u.PasswordResetToken).HasMaxLength(200);
        builder.Property(u => u.GoogleSubjectId).HasMaxLength(200);
        builder.HasMany(u => u.Cases).WithOne(c => c.User).HasForeignKey(c => c.UserId).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(u => u.LawyerCases).WithOne(c => c.Lawyer).HasForeignKey(c => c.LawyerId).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(u => u.ClientCases).WithOne(c => c.Client).HasForeignKey(c => c.ClientId).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(u => u.Subscriptions).WithOne(s => s.User).HasForeignKey(s => s.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}
