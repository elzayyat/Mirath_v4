using System.Net;
using System.Text.Json;
using Mirath.Domain.Exceptions;

namespace Mirath.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IWebHostEnvironment _env;
    
    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IWebHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }
    
    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        
        var response = new ExceptionResponse
        {
            Success = false,
            Path = context.Request.Path,
            Timestamp = DateTime.UtcNow,
            RequestId = context.TraceIdentifier
        };
        
        switch (exception)
        {
            case ValidationException validationEx:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                response.Message = "Validation failed";
                response.Errors = validationEx.Errors;
                break;
                
            case NotFoundException notFoundEx:
                context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                response.Message = notFoundEx.Message;
                break;
                
            case UnauthorizedException:
                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                response.Message = "Unauthorized access";
                break;
                
            case ForbiddenException:
                context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                response.Message = "Access denied";
                break;
                
            case CalculationException calcEx:
                context.Response.StatusCode = (int)HttpStatusCode.UnprocessableEntity;
                response.Message = calcEx.Message;
                response.Details = calcEx.Details;
                break;
                
            default:
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                response.Message = _env.IsDevelopment() ? exception.Message : "An internal error occurred";
                if (_env.IsDevelopment())
                {
                    response.Details = exception.StackTrace;
                }
                break;
        }
        
        var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        
        await context.Response.WriteAsync(jsonResponse);
    }
}

public class ExceptionResponse
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public Dictionary<string, string[]>? Errors { get; set; }
    public string? Details { get; set; }
    public string? Path { get; set; }
    public DateTime Timestamp { get; set; }
    public string? RequestId { get; set; }
}