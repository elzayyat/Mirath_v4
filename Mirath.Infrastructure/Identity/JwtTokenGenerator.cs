using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Mirath.Domain.Entities;
using Mirath.Domain.Enums;
using Mirath.Infrastructure.Persistence;

namespace Mirath.Infrastructure.Identity;

public interface IJwtTokenGenerator
{
    Task<JwtTokenResult> GenerateTokensAsync(User user);
    Task<ClaimsPrincipal> ValidateRefreshTokenAsync(string refreshToken);
    string GenerateRefreshToken();
}

public record JwtTokenResult(
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiry,
    DateTime RefreshTokenExpiry);

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly JwtSettings _jwtSettings;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<JwtTokenGenerator> _logger;
    
    public JwtTokenGenerator(
        IOptions<JwtSettings> jwtSettings,
        ApplicationDbContext context,
        ILogger<JwtTokenGenerator> logger)
    {
        _jwtSettings = jwtSettings.Value;
        _context = context;
        _logger = logger;
    }
    
    public async Task<JwtTokenResult> GenerateTokensAsync(User user)
    {
        var accessTokenExpiry = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpiryMinutes);
        var refreshTokenExpiry = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays);
        
        var accessToken = await GenerateAccessToken(user, accessTokenExpiry);
        var refreshToken = GenerateRefreshToken();
        
        _logger.LogInformation("Tokens generated for user: {UserId}", user.Id);
        
        return new JwtTokenResult(accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry);
    }
    
    private async Task<string> GenerateAccessToken(User user, DateTime expiry)
    {
        var subscription = await _context.UserSubscriptions
            .Include(x => x.Plan)
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(x => x.UserId == user.Id && x.Status == SubscriptionStatus.Active);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim("userId", user.Id.ToString()),
            new Claim("email", user.Email),
            new Claim("fullName", user.FullName),
            new Claim("role", user.Role.ToString()),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("status", user.Status.ToString()),
            new Claim("authProvider", user.AuthProvider.ToString()),
            new Claim("isVerified", user.IsEmailVerified.ToString()),
            new Claim("has2FA", user.IsTwoFactorEnabled.ToString())
        };

        if (subscription != null)
        {
            claims.Add(new Claim("plan", subscription.Plan.PlanType.ToString()));
            claims.Add(new Claim("subscriptionStatus", subscription.Status.ToString()));
        }
        
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        
        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: expiry,
            signingCredentials: credentials);
        
        return await Task.FromResult(new JwtSecurityTokenHandler().WriteToken(token));
    }
    
    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }
    
    public async Task<ClaimsPrincipal> ValidateRefreshTokenAsync(string refreshToken)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret)),
            ValidateIssuer = true,
            ValidIssuer = _jwtSettings.Issuer,
            ValidateAudience = true,
            ValidAudience = _jwtSettings.Audience,
            ValidateLifetime = false, // Don't validate lifetime for refresh token
            ClockSkew = TimeSpan.Zero
        };
        
        var tokenHandler = new JwtSecurityTokenHandler();
        
        try
        {
            var principal = tokenHandler.ValidateToken(refreshToken, tokenValidationParameters, out var securityToken);
            
            if (securityToken is not JwtSecurityToken jwtSecurityToken ||
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                throw new SecurityTokenException("Invalid token");
            }
            
            return await Task.FromResult(principal);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Refresh token validation failed: {Message}", ex.Message);
            throw new SecurityTokenException("Invalid refresh token");
        }
    }
}

public class JwtSettings
{
    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int AccessTokenExpiryMinutes { get; set; } = 15;
    public int RefreshTokenExpiryDays { get; set; } = 7;
}
