using Mirath.Domain.Enums;

namespace Mirath.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Client;
    public string NameEnglish { get; set; } = string.Empty;
    public string NameArabic { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    // Backward-compatible fields used by the current auth/security code.
    public string FullName { get => string.IsNullOrWhiteSpace(NameEnglish) ? NameArabic : NameEnglish; set => NameEnglish = value; }
    public string PhoneNumber { get => Phone; set => Phone = value; }
    public AccountStatus Status { get; set; } = AccountStatus.Active;
    public AuthProvider AuthProvider { get; set; } = AuthProvider.EmailPassword;
    public string? GoogleSubjectId { get; set; }
    public bool IsEmailVerified { get; set; }
    public bool IsTwoFactorEnabled { get; set; }
    public string? TwoFactorSecret { get; set; }
    public string? BackupCodes { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }
    public string? EmailVerificationToken { get; set; }
    public DateTime? EmailVerificationTokenExpiry { get; set; }
    public string? PasswordResetToken { get; set; }
    public DateTime? PasswordResetTokenExpiry { get; set; }
    public Madhab DefaultMadhab { get; set; } = Madhab.General;
    public string Language { get; set; } = "en";
    public DateTime? LastLoginAt { get; set; }
    public bool IsSystemProtected { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }

    public virtual ICollection<Case> LawyerCases { get; set; } = new List<Case>();
    public virtual ICollection<Case> ClientCases { get; set; } = new List<Case>();
    public virtual ICollection<Case> Cases { get; set; } = new List<Case>();
    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public virtual ICollection<UserSubscription> Subscriptions { get; set; } = new List<UserSubscription>();
}
