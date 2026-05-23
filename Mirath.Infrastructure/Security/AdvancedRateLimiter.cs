using System.Collections.Concurrent;

namespace Mirath.Infrastructure.Security;

public interface IAdvancedRateLimiter
{
    Task<bool> IsAllowedAsync(string key, string endpoint, string role);
}

public class AdvancedRateLimiter : IAdvancedRateLimiter
{
    private readonly ConcurrentDictionary<string, RateLimitRecord> _records;
    private readonly ILogger<AdvancedRateLimiter> _logger;
    
    private readonly Dictionary<string, RateLimitConfig> _limits = new()
    {
        ["anonymous"] = new RateLimitConfig(10, 60),      // 10 requests per minute
        ["authenticated"] = new RateLimitConfig(100, 60), // 100 requests per minute
        ["admin"] = new RateLimitConfig(500, 60),         // 500 requests per minute
        ["sensitive"] = new RateLimitConfig(5, 60),       // 5 requests per minute for sensitive ops
        ["calculation"] = new RateLimitConfig(30, 60)     // 30 calculations per minute
    };
    
    public AdvancedRateLimiter(ILogger<AdvancedRateLimiter> logger)
    {
        _records = new ConcurrentDictionary<string, RateLimitRecord>();
        _logger = logger;
        
        // Cleanup expired records periodically
        _ = Task.Run(CleanupExpiredRecords);
    }
    
    public async Task<bool> IsAllowedAsync(string key, string endpoint, string role)
    {
        var limitType = GetLimitType(endpoint, role);
        var limit = _limits[limitType];
        var recordKey = $"{key}:{limitType}";
        
        var now = DateTime.UtcNow;
        var record = _records.GetOrAdd(recordKey, new RateLimitRecord());
        
        lock (record)
        {
            // Remove old requests
            record.Requests.RemoveAll(t => t < now.AddSeconds(-limit.WindowSeconds));
            
            if (record.Requests.Count >= limit.MaxRequests)
            {
                _logger.LogWarning("Rate limit exceeded for {Key} on {Endpoint}", key, endpoint);
                return false;
            }
            
            record.Requests.Add(now);
        }
        
        return await Task.FromResult(true);
    }
    
    private string GetLimitType(string endpoint, string role)
    {
        if (endpoint.Contains("/calculate"))
            return "calculation";
        
        if (endpoint.Contains("/auth") || endpoint.Contains("/password"))
            return "sensitive";
        
        return role switch
        {
            "Admin" => "admin",
            "" or null => "anonymous",
            _ => "authenticated"
        };
    }
    
    private async Task CleanupExpiredRecords()
    {
        while (true)
        {
            try
            {
                await Task.Delay(TimeSpan.FromMinutes(5));
                
                var now = DateTime.UtcNow;
                var expiredKeys = _records
                    .Where(kv => !kv.Value.Requests.Any() || 
                                 kv.Value.Requests.Max() < now.AddMinutes(-10))
                    .Select(kv => kv.Key)
                    .ToList();

                foreach (var key in expiredKeys)
                {
                    _records.TryRemove(key, out _);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during rate limit cleanup task");
            }
        }
    }
    
    private class RateLimitRecord
    {
        public List<DateTime> Requests { get; } = new();
    }
    
    private record RateLimitConfig(int MaxRequests, int WindowSeconds);
}