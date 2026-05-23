using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Mirath.Application.Features.Calculation.DTOs;

namespace Mirath.API.Hubs;

[Authorize]
public class CalculationHub : Hub
{
    private readonly ILogger<CalculationHub> _logger;
    
    public CalculationHub(ILogger<CalculationHub> logger)
    {
        _logger = logger;
    }
    
    public async Task StartCalculation(Guid caseId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"calc_{caseId}");
        _logger.LogInformation("Calculation started for case {CaseId} by user {UserId}", caseId, Context.UserIdentifier);
    }
    
    public async Task SendProgress(Guid caseId, int percentage, string step)
    {
        await Clients.Group($"calc_{caseId}").SendAsync("CalculationProgress", new
        {
            CaseId = caseId,
            Percentage = percentage,
            Step = step,
            Timestamp = DateTime.UtcNow
        });
    }
    
    public async Task SendComplete(Guid caseId, CalculationResultDto result)
    {
        await Clients.Group($"calc_{caseId}").SendAsync("CalculationComplete", result);
        await Clients.Group($"calc_{caseId}").SendAsync("CalculationProgress", new
        {
            CaseId = caseId,
            Percentage = 100,
            Step = "Complete",
            Timestamp = DateTime.UtcNow
        });
    }
    
    public async Task SendError(Guid caseId, string error)
    {
        await Clients.Group($"calc_{caseId}").SendAsync("CalculationError", new
        {
            CaseId = caseId,
            Error = error,
            Timestamp = DateTime.UtcNow
        });
    }
}