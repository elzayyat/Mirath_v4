using System.Text;
using Mirath.Infrastructure.Security;

namespace Mirath.Infrastructure.Security;

public class AuditMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IServiceScopeFactory _scopeFactory;
    
    public AuditMiddleware(RequestDelegate next, IServiceScopeFactory scopeFactory)
    {
        _next = next;
        _scopeFactory = scopeFactory;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        var userId = GetUserId(context);
        var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var userAgent = context.Request.Headers["User-Agent"].ToString();
        var action = $"{context.Request.Method} {context.Request.Path}";
        
        // Capture request body for sensitive operations
        string? requestBody = null;
        if (IsSensitiveOperation(context.Request.Path))
        {
            requestBody = await ReadRequestBody(context.Request);
        }
        
        var originalBodyStream = context.Response.Body;
        using var responseBody = new MemoryStream();
        context.Response.Body = responseBody;
        
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        
        try
        {
            await _next(context);
            stopwatch.Stop();
            
            // Log successful operation
            using var scope = _scopeFactory.CreateScope();
            var auditService = scope.ServiceProvider.GetRequiredService<IAuditService>();
            
            await auditService.LogAsync(new AuditEntry(
                userId,
                action,
                GetEntityType(context.Request.Path),
                GetEntityId(context.Request.Path),
                null,
                requestBody != null ? new { Body = requestBody } : null,
                ipAddress,
                userAgent,
                true));
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            
            // Log failed operation
            using var scope = _scopeFactory.CreateScope();
            var auditService = scope.ServiceProvider.GetRequiredService<IAuditService>();
            
            await auditService.LogAsync(new AuditEntry(
                userId,
                action,
                GetEntityType(context.Request.Path),
                GetEntityId(context.Request.Path),
                null,
                requestBody != null ? new { Body = requestBody } : null,
                ipAddress,
                userAgent,
                false,
                ex.Message));
            
            throw;
        }
        finally
        {
            responseBody.Seek(0, SeekOrigin.Begin);
            await responseBody.CopyToAsync(originalBodyStream);
            context.Response.Body = originalBodyStream;
        }
    }
    
    private Guid? GetUserId(HttpContext context)
    {
        var userIdClaim = context.User.FindFirst("userId");
        if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
            return userId;
        return null;
    }
    
    private string GetEntityType(PathString path)
    {
        var segments = path.ToString().Split('/');
        if (segments.Length >= 3)
            return segments[2]; // /api/v1/{entityType}
        return "unknown";
    }
    
    private string GetEntityId(PathString path)
    {
        var segments = path.ToString().Split('/');
        if (segments.Length >= 4 && Guid.TryParse(segments[3], out _))
            return segments[3];
        return string.Empty;
    }
    
    private bool IsSensitiveOperation(PathString path)
    {
        var sensitivePaths = new[] { "/api/v1/auth", "/api/v1/cases", "/api/v1/calculation" };
        return sensitivePaths.Any(p => path.ToString().StartsWith(p));
    }
    
    private async Task<string> ReadRequestBody(HttpRequest request)
    {
        request.EnableBuffering();
        using var reader = new StreamReader(request.Body, Encoding.UTF8, leaveOpen: true);
        var body = await reader.ReadToEndAsync();
        request.Body.Position = 0;
        
        // Limit body size for audit
        if (body.Length > 1000)
            body = body.Substring(0, 1000) + "... [truncated]";
        
        return body;
    }
}