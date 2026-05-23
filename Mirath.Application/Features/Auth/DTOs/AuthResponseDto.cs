using Mirath.Domain.Enums;

namespace Mirath.Application.Features.Auth.DTOs;

public record AuthResponseDto(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserDto User);

public record UserDto(
    Guid Id,
    string Email,
    string FullName,
    UserRole Role,
    AccountStatus Status,
    AuthProvider AuthProvider,
    bool IsEmailVerified,
    bool IsTwoFactorEnabled,
    Madhab DefaultMadhab,
    string Language,
    SubscriptionSummaryDto? Subscription);

public record SubscriptionSummaryDto(
    Guid? SubscriptionId,
    SubscriptionPlanType? PlanType,
    string? PlanName,
    SubscriptionStatus? Status,
    int CasesUsedThisPeriod,
    int MonthlyCaseLimit,
    DateTime? UsagePeriodEnd,
    bool HasAdvancedCalculator,
    bool HasPdfExports,
    bool HasPrioritySupport,
    bool HasClientManagement,
    bool HasAdminAccess);

public record TwoFactorSetupDto(
    string SecretKey,
    string QrCodeImageUrl,
    string ManualEntryKey);

public record LoginDto(string Email, string Password);
public record RegisterDto(string Email, string FullName, string Password, string? PhoneNumber);
