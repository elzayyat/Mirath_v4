using System.Collections.Concurrent;

namespace Mirath.API.Middleware;

public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RateLimitingMiddleware> _logger;
    private readonly ConcurrentDictionary<string, ClientRateLimit> _clients;
    
    public RateLimitingMiddleware(RequestDelegate next, ILogger<RateLimitingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
        _clients = new ConcurrentDictionary<string, ClientRateLimit>();
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        var clientId = GetClientId(context);
        var endpoint = context.Request.Path.ToString();
        var key = $"{clientId}:{endpoint}";
        
        var now = DateTime.UtcNow;
        var clientLimit = _clients.GetOrAdd(key, new ClientRateLimit());
        
        var rateLimited = false;
        lock (clientLimit)
        {
            if (clientLimit.Requests.Count >= 100 && clientLimit.Requests.Last() > now.AddMinutes(-1))
            {
                rateLimited = true;
            }
            else
            {
                clientLimit.Requests.Add(now);
                if (clientLimit.Requests.Count > 100)
                    clientLimit.Requests.RemoveAt(0);
            }
        }

        if (rateLimited)
        {
            _logger.LogWarning("Rate limit exceeded for client {ClientId} on {Endpoint}", clientId, endpoint);
            context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
            await context.Response.WriteAsJsonAsync(new
            {
                error = "Rate limit exceeded",
                retryAfter = 60,
                message = "Too many requests. Please try again later."
            });
            return;
        }
        
        await _next(context);
    }
    
    private string GetClientId(HttpContext context)
    {
        // Try to get user ID if authenticated
        var userId = context.User.FindFirst("userId")?.Value;
        if (!string.IsNullOrEmpty(userId))
            return $"user_{userId}";
        
        // Fall back to IP address
        return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
    
    private class ClientRateLimit
    {
        public List<DateTime> Requests { get; } = new();
    }
}