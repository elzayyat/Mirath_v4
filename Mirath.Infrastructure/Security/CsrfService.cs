using System.Security.Cryptography;
using Microsoft.Extensions.Caching.Memory;

namespace Mirath.Infrastructure.Security;

public interface ICsrfService
{
    string GenerateToken();
    bool ValidateToken(string token, string expectedToken);
}

public class CsrfService : ICsrfService
{
    private readonly IMemoryCache _cache;
    
    public CsrfService(IMemoryCache cache)
    {
        _cache = cache;
    }
    
    public string GenerateToken()
    {
        var tokenBytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(tokenBytes);
        
        var token = Convert.ToBase64String(tokenBytes);
        var tokenId = Guid.NewGuid().ToString();
        
        // Store token with expiration
        _cache.Set($"csrf_{tokenId}", token, TimeSpan.FromMinutes(30));
        
        return $"{tokenId}:{token}";
    }
    
    public bool ValidateToken(string token, string expectedToken)
    {
        if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(expectedToken))
            return false;
        
        var parts = token.Split(':');
        if (parts.Length != 2)
            return false;
        
        var tokenId = parts[0];
        var storedToken = _cache.Get<string>($"csrf_{tokenId}");
        
        if (storedToken == null)
            return false;
        
        // Remove used token
        _cache.Remove($"csrf_{tokenId}");
        
        return storedToken == parts[1] && storedToken == expectedToken;
    }
}