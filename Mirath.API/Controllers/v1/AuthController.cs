using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Mirath.API.Controllers;
using Mirath.Domain.Entities;
using Mirath.Domain.Enums;
using Mirath.Infrastructure.Identity;
using Mirath.Infrastructure.Persistence;
using Mirath.Infrastructure.Security;

namespace Mirath.API.Controllers.v1;

[EnableRateLimiting("auth")]
public class AuthController : BaseApiController
{
    private readonly ApplicationDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenGenerator _tokens;

    public AuthController(ApplicationDbContext db, IPasswordHasher hasher, IJwtTokenGenerator tokens)
    {
        _db = db; _hasher = hasher; _tokens = tokens;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8) return BadRequest("Password must be at least 8 characters.");
        var email = request.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(x => x.Email == email, ct)) return BadRequest("Email is already registered.");
        var user = new User
        {
            Email = email,
            PasswordHash = _hasher.HashPassword(request.Password),
            Role = request.Role == UserRole.Admin ? UserRole.Client : request.Role,
            NameEnglish = request.NameEnglish ?? request.FullName ?? string.Empty,
            NameArabic = request.NameArabic ?? string.Empty,
            Phone = request.Phone ?? request.PhoneNumber ?? string.Empty,
            IsActive = true,
            Status = AccountStatus.Active,
            IsEmailVerified = true,
            CreatedAt = DateTime.UtcNow
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);
        return Ok(await IssueSession(user, ct), "Registration successful");
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == email && !x.IsDeleted, ct);
        if (user == null || !user.IsActive || !_hasher.VerifyPassword(user.PasswordHash, request.Password)) return Unauthorized("Invalid email or password.");
        user.LastLoginAt = DateTime.UtcNow;
        return Ok(await IssueSession(user, ct), "Login successful");
    }

    [HttpPost("refresh")]
    [HttpPost("refresh-token")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshRequest request, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(x => x.RefreshToken == request.RefreshToken && x.RefreshTokenExpiry > DateTime.UtcNow && x.IsActive, ct);
        if (user == null) return Unauthorized("Invalid refresh token.");
        return Ok(await IssueSession(user, ct), "Token refreshed");
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        var user = await _db.Users.FindAsync(new object?[] { CurrentUserId }, ct);
        if (user != null)
        {
            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            await _db.SaveChangesAsync(ct);
        }
        return StatusCode(StatusCodes.Status200OK, new { message = "Logged out" });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me(CancellationToken ct)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == CurrentUserId, ct);
        if (user == null) return NotFound("User not found");
        return Ok(MapUser(user));
    }

    private async Task<AuthResponse> IssueSession(User user, CancellationToken ct)
    {
        var token = await _tokens.GenerateTokensAsync(user);
        user.RefreshToken = token.RefreshToken;
        user.RefreshTokenExpiry = token.RefreshTokenExpiry;
        await _db.SaveChangesAsync(ct);
        return new AuthResponse(token.AccessToken, token.RefreshToken, token.AccessTokenExpiry, MapUser(user));
    }

    private static UserDto MapUser(User u) => new(u.Id, u.Email, u.NameEnglish, u.NameArabic, u.FullName, u.Phone, u.Role, u.IsActive, u.CreatedAt);
}

public record RegisterRequest(string Email, string Password, string? FullName, string? NameEnglish, string? NameArabic, string? Phone, string? PhoneNumber, UserRole Role = UserRole.Client);
public record LoginRequest(string Email, string Password);
public record RefreshRequest(string RefreshToken);
public record AuthResponse(string AccessToken, string RefreshToken, DateTime ExpiresAt, UserDto User);
public record UserDto(Guid Id, string Email, string NameEnglish, string NameArabic, string FullName, string Phone, UserRole Role, bool IsActive, DateTime CreatedAt);
