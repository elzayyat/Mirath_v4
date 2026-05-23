using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Mirath.Domain.Entities;
using Mirath.Domain.Enums;
using Mirath.Domain.Exceptions;
using Mirath.Application.Features.Auth.DTOs;
using Mirath.Infrastructure.Identity;
using Mirath.Infrastructure.Persistence;
using Mirath.Infrastructure.Security;

namespace Mirath.Application.Features.Auth.Commands;

public record LoginCommand(
    string Email,
    string Password,
    string? TwoFactorCode = null,
    string? BackupCode = null) : IRequest<AuthResponseDto>;

public class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResponseDto>
{
    private readonly ApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtGenerator;
    private readonly ITwoFactorService _twoFactorService;
    private readonly IAccountLockoutService _lockoutService;
    private readonly IAuditService _auditService;
    private readonly ILogger<LoginCommandHandler> _logger;

    public LoginCommandHandler(
        ApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtGenerator,
        ITwoFactorService twoFactorService,
        IAccountLockoutService lockoutService,
        IAuditService auditService,
        ILogger<LoginCommandHandler> logger)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtGenerator = jwtGenerator;
        _twoFactorService = twoFactorService;
        _lockoutService = lockoutService;
        _auditService = auditService;
        _logger = logger;
    }

    public async Task<AuthResponseDto> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        if (await _lockoutService.IsAccountLockedAsync(normalizedEmail))
        {
            _logger.LogWarning("Login attempt on locked account: {Email}", request.Email);
            throw new UnauthorizedException("Account is temporarily locked. Please try again later.");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail && !u.IsDeleted, cancellationToken);

        if (user == null)
        {
            await _lockoutService.RecordFailedAttemptAsync(normalizedEmail);
            throw new UnauthorizedException("Invalid email or password");
        }

        if (user.Status is AccountStatus.Locked or AccountStatus.Deactivated or AccountStatus.Suspended)
            throw new UnauthorizedException("This account is not allowed to sign in.");

        if (!_passwordHasher.VerifyPassword(user.PasswordHash, request.Password))
        {
            await _lockoutService.RecordFailedAttemptAsync(normalizedEmail);
            await _auditService.LogAsync(new AuditEntry(
                user.Id,
                "LOGIN_FAILED",
                "User",
                user.Id.ToString(),
                null,
                new { Email = request.Email },
                GetIpAddress(),
                GetUserAgent(),
                false,
                "Invalid password"));

            throw new UnauthorizedException("Invalid email or password");
        }

        if (user.IsTwoFactorEnabled)
        {
            if (string.IsNullOrEmpty(request.TwoFactorCode) && string.IsNullOrEmpty(request.BackupCode))
                throw new UnauthorizedException("2FA code required");

            var isValid2Fa = false;

            if (!string.IsNullOrEmpty(request.TwoFactorCode))
            {
                isValid2Fa = _twoFactorService.VerifyCode(user.TwoFactorSecret!, request.TwoFactorCode);
            }
            else if (!string.IsNullOrEmpty(request.BackupCode))
            {
                var backupCodes = user.BackupCodes?.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                  ?? Array.Empty<string>();
                isValid2Fa = _twoFactorService.VerifyBackupCode(backupCodes, request.BackupCode);

                if (isValid2Fa)
                {
                    var newBackupCodes = backupCodes.Where(c => c != request.BackupCode).ToArray();
                    user.BackupCodes = newBackupCodes.Length > 0 ? string.Join(",", newBackupCodes) : null;
                    await _context.SaveChangesAsync(cancellationToken);
                }
            }

            if (!isValid2Fa)
            {
                await _auditService.LogAsync(new AuditEntry(
                    user.Id,
                    "LOGIN_FAILED_2FA",
                    "User",
                    user.Id.ToString(),
                    null,
                    null,
                    GetIpAddress(),
                    GetUserAgent(),
                    false,
                    "Invalid 2FA code"));

                throw new UnauthorizedException("Invalid 2FA code");
            }
        }

        var tokens = await _jwtGenerator.GenerateTokensAsync(user);

        user.RefreshToken = tokens.RefreshToken;
        user.RefreshTokenExpiry = tokens.RefreshTokenExpiry;
        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        await _lockoutService.ResetAttemptsAsync(normalizedEmail);

        var subscription = await AuthDtoMapper.ActiveSubscriptionQuery(_context.UserSubscriptions.Include(x => x.Plan), user.Id)
            .FirstOrDefaultAsync(cancellationToken);

        await _auditService.LogAsync(new AuditEntry(
            user.Id,
            "LOGIN_SUCCESS",
            "User",
            user.Id.ToString(),
            null,
            null,
            GetIpAddress(),
            GetUserAgent(),
            true));

        _logger.LogInformation("User logged in: {Email} with role {Role}", user.Email, user.Role);

        return new AuthResponseDto(
            tokens.AccessToken,
            tokens.RefreshToken,
            tokens.AccessTokenExpiry,
            new UserDto(
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
                subscription));
    }

    private static string GetIpAddress() => "0.0.0.0";

    private static string GetUserAgent() => "Unknown";
}
