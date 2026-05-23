using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Mirath.Application.Features.Notifications.DTOs;

namespace Mirath.API.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    private static readonly Dictionary<string, string> _userConnections = new();
    private readonly ILogger<NotificationHub> _logger;
    
    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }
    
    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            _userConnections[userId] = Context.ConnectionId;
            _logger.LogInformation("User {UserId} connected to notification hub", userId);
        }
        
        await base.OnConnectedAsync();
    }
    
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            _userConnections.Remove(userId);
            _logger.LogInformation("User {UserId} disconnected from notification hub", userId);
        }
        
        await base.OnDisconnectedAsync(exception);
    }
    
    public async Task SubscribeToCase(Guid caseId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"case_{caseId}");
        _logger.LogInformation("User {UserId} subscribed to case {CaseId}", Context.UserIdentifier, caseId);
    }
    
    public async Task UnsubscribeFromCase(Guid caseId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"case_{caseId}");
    }
    
    public static async Task SendNotificationToUser(
        IHubContext<NotificationHub> hubContext,
        string userId,
        NotificationDto notification)
    {
        await hubContext.Clients.User(userId).SendAsync("ReceiveNotification", notification);
    }
    
    public static async Task SendNotificationToCase(
        IHubContext<NotificationHub> hubContext,
        Guid caseId,
        NotificationDto notification)
    {
        await hubContext.Clients.Group($"case_{caseId}").SendAsync("ReceiveNotification", notification);
    }
}