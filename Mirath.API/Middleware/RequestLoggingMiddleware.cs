using System.Diagnostics;
using System.Text;

namespace Mirath.API.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;
    
    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var requestBody = await ReadRequestBody(context.Request);
        
        // Log request
        _logger.LogInformation(
            "Request: {Method} {Path} | User: {User} | IP: {IP} | Body: {Body}",
            context.Request.Method,
            context.Request.Path,
            context.User.Identity?.Name ?? "anonymous",
            context.Connection.RemoteIpAddress,
            requestBody.Length > 500 ? requestBody[..500] + "..." : requestBody);
        
        // Capture response
        var originalBodyStream = context.Response.Body;
        using var responseBody = new MemoryStream();
        context.Response.Body = responseBody;
        
        try
        {
            await _next(context);
            
            stopwatch.Stop();
            
            // Log response
            _logger.LogInformation(
                "Response: {Method} {Path} | Status: {StatusCode} | Duration: {Duration}ms",
                context.Request.Method,
                context.Request.Path,
                context.Response.StatusCode,
                stopwatch.ElapsedMilliseconds);
        }
        finally
        {
            responseBody.Seek(0, SeekOrigin.Begin);
            await responseBody.CopyToAsync(originalBodyStream);
            context.Response.Body = originalBodyStream;
        }
    }
    
    private async Task<string> ReadRequestBody(HttpRequest request)
    {
        request.EnableBuffering();
        using var reader = new StreamReader(request.Body, Encoding.UTF8, leaveOpen: true);
        var body = await reader.ReadToEndAsync();
        request.Body.Position = 0;
        return body;
    }
}