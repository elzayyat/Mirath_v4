using Microsoft.Extensions.Caching.Memory;

namespace Mirath.Infrastructure.Security;

public interface IAccountLockoutService
{
    Task RecordFailedAttemptAsync(string email);
    Task<bool> IsAccountLockedAsync(string email);
    Task<int> GetRemainingAttemptsAsync(string email);
    Task ResetAttemptsAsync(string email);
}

public class AccountLockoutService : IAccountLockoutService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<AccountLockoutService> _logger;
    
    private const int MaxFailedAttempts = 5;
    private const int LockoutDurationMinutes = 15;
    
    public AccountLockoutService(IMemoryCache cache, ILogger<AccountLockoutService> logger)
    {
        _cache = cache;
        _logger = logger;
    }
    
    public async Task RecordFailedAttemptAsync(string email)
    {
        var key = $"lockout_{email}";
        var attempts = _cache.Get<int?>(key) ?? 0;
        attempts++;
        
        _cache.Set(key, attempts, TimeSpan.FromMinutes(LockoutDurationMinutes));
        
        if (attempts >= MaxFailedAttempts)
        {
            _logger.LogWarning("Account locked for {Email} after {Attempts} failed attempts", email, attempts);
        }
        
        await Task.CompletedTask;
    }
    
    public async Task<bool> IsAccountLockedAsync(string email)
    {
        var key = $"lockout_{email}";
        var attempts = _cache.Get<int?>(key) ?? 0;
        
        return await Task.FromResult(attempts >= MaxFailedAttempts);
    }
    
    public async Task<int> GetRemainingAttemptsAsync(string email)
    {
        var key = $"lockout_{email}";
        var attempts = _cache.Get<int?>(key) ?? 0;
        
        var remaining = Math.Max(0, MaxFailedAttempts - attempts);
        return await Task.FromResult(remaining);
    }
    
    public async Task ResetAttemptsAsync(string email)
    {
        var key = $"lockout_{email}";
        _cache.Remove(key);
        
        _logger.LogInformation("Lockout reset for {Email}", email);
        await Task.CompletedTask;
    }
}