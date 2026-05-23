using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Mirath.Application.Features.Auth.DTOs;
using Mirath.Domain.Entities;
using Mirath.Domain.Enums;
using Mirath.Domain.Exceptions;
using Mirath.Infrastructure.Identity;
using Mirath.Infrastructure.Persistence;
using Mirath.Infrastructure.Security;

namespace Mirath.Application.Features.Auth.Commands;

public record RegisterCommand(
    string Email,
    string FullName,
    string Password,
    string? PhoneNumber,
    SubscriptionPlanType PlanType = SubscriptionPlanType.NormalUser) : IRequest<AuthResponseDto>;

public record RefreshTokenCommand(string RefreshToken) : IRequest<AuthResponseDto>;

public record LogoutCommand(Guid UserId) : IRequest<Unit>;

public record VerifyEmailCommand(string Email, string Code) : IRequest<Unit>;

public record ForgotPasswordCommand(string Email) : IRequest<Unit>;

public record ResetPasswordCommand(string Email, string Token, string NewPassword) : IRequest<Unit>;

public record Enable2FACommand(Guid UserId) : IRequest<TwoFactorSetupDto>;

public record Verify2FACommand(Guid UserId, string Code) : IRequest<Unit>;

internal static class AuthDtoMapper
{
    public static UserDto ToUserDto(User user, SubscriptionSummaryDto? subscription) =>
        new(
            user.Id,
            user.Email,
            user.FullName,
            user.Role,
            user.Status,
            user.AuthProvider,
            user.IsEmailVerified,
            user.IsTwoFactorEnabled,
            user.DefaultMadhab,
            user.Language,
            subscription);

    public static IQueryable<SubscriptionSummaryDto> ActiveSubscriptionQuery(
        IQueryable<UserSubscription> subscriptions,
        Guid userId)
    {
        return subscriptions
            .Where(x => x.UserId == userId && x.Status == SubscriptionStatus.Active)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new SubscriptionSummaryDto(
                x.Id,
                x.Plan.PlanType,
                x.Plan.Name,
                x.Status,
                x.CasesUsedThisPeriod,
                x.Plan.MonthlyCaseLimit,
                x.UsagePeriodEnd,
                x.Plan.HasAdvancedCalculator,
                x.Plan.HasPdfExports,
                x.Plan.HasPrioritySupport,
                x.Plan.HasClientManagement,
                x.Plan.HasAdminAccess));
    }
}

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, AuthResponseDto>
{
    private readonly ApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtGenerator;
    private readonly ILogger<RegisterCommandHandler> _logger;

    public RegisterCommandHandler(
        ApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtGenerator,
        ILogger<RegisterCommandHandler> logger)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtGenerator = jwtGenerator;
        _logger = logger;
    }

    public async Task<AuthResponseDto> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.Password))
            throw new ValidationException("Email, full name, and password are required.");

        if (request.Password.Length < 8)
            throw new ValidationException("Password must be at least 8 characters long.");

        if (request.PlanType == SubscriptionPlanType.Admin)
            throw new ValidationException("Admin accounts cannot be self-registered.");

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var exists = await _context.Users.AnyAsync(u => u.Email == normalizedEmail, cancellationToken);
        if (exists)
            throw new ValidationException("Email is already registered.");

        var selectedPlan = await _context.SubscriptionPlans
            .FirstOrDefaultAsync(x => x.PlanType == request.PlanType, cancellationToken)
            ?? throw new ValidationException("Selected subscription plan is invalid.");

        var periodStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var user = new User
        {
            Email = normalizedEmail,
            FullName = request.FullName.Trim(),
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            PhoneNumber = request.PhoneNumber?.Trim() ?? string.Empty,
            Role = request.PlanType == SubscriptionPlanType.Lawyer ? UserRole.Lawyer : UserRole.EndUser,
            Status = AccountStatus.PendingVerification,
            AuthProvider = AuthProvider.EmailPassword,
            IsEmailVerified = false,
            EmailVerificationToken = Guid.NewGuid().ToString("N"),
            EmailVerificationTokenExpiry = DateTime.UtcNow.AddDays(1)
        };

        var subscription = new UserSubscription
        {
            User = user,
            PlanId = selectedPlan.Id,
            Status = SubscriptionStatus.Active,
            CasesUsedThisPeriod = 0,
            UsagePeriodStart = periodStart,
            UsagePeriodEnd = periodStart.AddMonths(1),
            StartsAt = DateTime.UtcNow,
            AutoRenew = true,
            Currency = "USD"
        };

        _context.Users.Add(user);
        _context.UserSubscriptions.Add(subscription);
        await _context.SaveChangesAsync(cancellationToken);

        var tokens = await _jwtGenerator.GenerateTokensAsync(user);
        user.RefreshToken = tokens.RefreshToken;
        user.RefreshTokenExpiry = tokens.RefreshTokenExpiry;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Registered user {Email} on plan {PlanType}", user.Email, request.PlanType);

        var subscriptionDto = new SubscriptionSummaryDto(
            subscription.Id,
            selectedPlan.PlanType,
            selectedPlan.Name,
            subscription.Status,
            subscription.CasesUsedThisPeriod,
            selectedPlan.MonthlyCaseLimit,
            subscription.UsagePeriodEnd,
            selectedPlan.HasAdvancedCalculator,
            selectedPlan.HasPdfExports,
            selectedPlan.HasPrioritySupport,
            selectedPlan.HasClientManagement,
            selectedPlan.HasAdminAccess);

        return new AuthResponseDto(
            tokens.AccessToken,
            tokens.RefreshToken,
            tokens.AccessTokenExpiry,
            AuthDtoMapper.ToUserDto(user, subscriptionDto));
    }
}

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthResponseDto>
{
    private readonly ApplicationDbContext _context;
    private readonly IJwtTokenGenerator _jwtGenerator;
    private readonly ILogger<RefreshTokenCommandHandler> _logger;

    public RefreshTokenCommandHandler(
        ApplicationDbContext context,
        IJwtTokenGenerator jwtGenerator,
        ILogger<RefreshTokenCommandHandler> logger)
    {
        _context = context;
        _jwtGenerator = jwtGenerator;
        _logger = logger;
    }

    public async Task<AuthResponseDto> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(
                u => u.RefreshToken == request.RefreshToken && u.RefreshTokenExpiry > DateTime.UtcNow && !u.IsDeleted,
                cancellationToken);

        if (user == null)
            throw new UnauthorizedException("Invalid or expired refresh token.");

        var tokens = await _jwtGenerator.GenerateTokensAsync(user);
        user.RefreshToken = tokens.RefreshToken;
        user.RefreshTokenExpiry = tokens.RefreshTokenExpiry;
        await _context.SaveChangesAsync(cancellationToken);

        var subscription = await AuthDtoMapper.ActiveSubscriptionQuery(_context.UserSubscriptions.Include(x => x.Plan), user.Id)
            .FirstOrDefaultAsync(cancellationToken);

        _logger.LogInformation("Refreshed tokens for user {UserId}", user.Id);

        return new AuthResponseDto(
            tokens.AccessToken,
            tokens.RefreshToken,
            tokens.AccessTokenExpiry,
            AuthDtoMapper.ToUserDto(user, subscription));
    }
}

public class LogoutCommandHandler : IRequestHandler<LogoutCommand, Unit>
{
    private readonly ApplicationDbContext _context;

    public LogoutCommandHandler(ApplicationDbContext context) => _context = context;

    public async Task<Unit> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { request.UserId }, cancellationToken);
        if (user != null)
        {
            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            await _context.SaveChangesAsync(cancellationToken);
        }

        return Unit.Value;
    }
}

public class VerifyEmailCommandHandler : IRequestHandler<VerifyEmailCommand, Unit>
{
    private readonly ApplicationDbContext _context;

    public VerifyEmailCommandHandler(ApplicationDbContext context) => _context = context;

    public async Task<Unit> Handle(VerifyEmailCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);
        if (user == null)
            return Unit.Value;

        if (!string.IsNullOrWhiteSpace(user.EmailVerificationToken) &&
            !string.Equals(user.EmailVerificationToken, request.Code, StringComparison.Ordinal))
        {
            throw new ValidationException("Invalid verification code.");
        }

        user.IsEmailVerified = true;
        user.Status = AccountStatus.Active;
        user.EmailVerificationToken = null;
        user.EmailVerificationTokenExpiry = null;
        await _context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}

public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand, Unit>
{
    private readonly ApplicationDbContext _context;

    public ForgotPasswordCommandHandler(ApplicationDbContext context) => _context = context;

    public async Task<Unit> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(x => x.Email == normalizedEmail, cancellationToken);
        if (user == null)
            return Unit.Value;

        user.PasswordResetToken = Guid.NewGuid().ToString("N");
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(2);
        await _context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}

public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand, Unit>
{
    private readonly ApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public ResetPasswordCommandHandler(ApplicationDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<Unit> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);
        if (user == null)
            return Unit.Value;

        if (string.IsNullOrWhiteSpace(user.PasswordResetToken) ||
            !string.Equals(user.PasswordResetToken, request.Token, StringComparison.Ordinal) ||
            user.PasswordResetTokenExpiry <= DateTime.UtcNow)
        {
            throw new ValidationException("Invalid or expired password reset token.");
        }

        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiry = null;
        await _context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}

public class Enable2FACommandHandler : IRequestHandler<Enable2FACommand, TwoFactorSetupDto>
{
    private readonly ApplicationDbContext _context;
    private readonly ITwoFactorService _twoFactor;

    public Enable2FACommandHandler(ApplicationDbContext context, ITwoFactorService twoFactor)
    {
        _context = context;
        _twoFactor = twoFactor;
    }

    public async Task<TwoFactorSetupDto> Handle(Enable2FACommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { request.UserId }, cancellationToken)
                   ?? throw new NotFoundException("User not found");

        var setup = _twoFactor.GenerateSetupCode(user.Email);
        user.TwoFactorSecret = setup.SecretKey;
        await _context.SaveChangesAsync(cancellationToken);

        return new TwoFactorSetupDto(setup.SecretKey, setup.QrCodeImageUrl, setup.ManualEntryKey);
    }
}

public class Verify2FACommandHandler : IRequestHandler<Verify2FACommand, Unit>
{
    private readonly ApplicationDbContext _context;
    private readonly ITwoFactorService _twoFactor;

    public Verify2FACommandHandler(ApplicationDbContext context, ITwoFactorService twoFactor)
    {
        _context = context;
        _twoFactor = twoFactor;
    }

    public async Task<Unit> Handle(Verify2FACommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { request.UserId }, cancellationToken)
                   ?? throw new NotFoundException("User not found");

        if (user.TwoFactorSecret == null || !_twoFactor.VerifyCode(user.TwoFactorSecret, request.Code))
            throw new UnauthorizedException("Invalid verification code.");

        user.IsTwoFactorEnabled = true;
        user.BackupCodes = _twoFactor.GenerateBackupCodes();
        await _context.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
