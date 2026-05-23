namespace Mirath.Application.Features.Notifications.DTOs;

public record NotificationDto(
    Guid Id,
    string Title,
    string Message,
    DateTime CreatedAt,
    bool IsRead);
