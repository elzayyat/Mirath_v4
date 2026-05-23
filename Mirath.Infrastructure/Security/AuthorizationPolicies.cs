using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Mirath.Infrastructure.Persistence;

namespace Mirath.Infrastructure.Security;

public static class AuthorizationPolicies
{
    public static void AddPolicies(AuthorizationOptions options)
    {
        // Admin only policy
        options.AddPolicy("AdminOnly", policy =>
            policy.RequireRole("Admin")
                  .RequireClaim("isVerified", "True"));
        
        // Lawyer or Admin policy
        options.AddPolicy("LawyerOrAdmin", policy =>
            policy.RequireRole("Lawyer", "Admin")
                  .RequireClaim("isVerified", "True"));
        
        // Case owner policy (dynamic)
        options.AddPolicy("CaseOwner", policy =>
            policy.Requirements.Add(new CaseOwnerRequirement()));
        
        // Two-factor authentication required for sensitive operations
        options.AddPolicy("Require2FA", policy =>
            policy.RequireClaim("has2FA", "True"));
        
        // Email verified required
        options.AddPolicy("EmailVerified", policy =>
            policy.RequireClaim("isVerified", "True"));
    }
}

public class CaseOwnerRequirement : IAuthorizationRequirement { }

public class CaseOwnerHandler : AuthorizationHandler<CaseOwnerRequirement>
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ApplicationDbContext _context;
    
    public CaseOwnerHandler(IHttpContextAccessor httpContextAccessor, ApplicationDbContext context)
    {
        _httpContextAccessor = httpContextAccessor;
        _context = context;
    }
    
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        CaseOwnerRequirement requirement)
    {
        var userId = context.User.FindFirst("userId")?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            context.Fail();
            return;
        }
        
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null)
        {
            context.Fail();
            return;
        }
        
        // Get case ID from route
        var caseIdString = httpContext.GetRouteValue("id")?.ToString() ??
                          httpContext.GetRouteValue("caseId")?.ToString();
        
        if (string.IsNullOrEmpty(caseIdString) || !Guid.TryParse(caseIdString, out var caseId))
        {
            context.Fail();
            return;
        }
        
        var userGuid = Guid.Parse(userId);
        var isOwner = await _context.Cases.AnyAsync(c => c.Id == caseId && c.UserId == userGuid);
        
        if (isOwner)
        {
            context.Succeed(requirement);
        }
        else
        {
            context.Fail();
        }
    }
}