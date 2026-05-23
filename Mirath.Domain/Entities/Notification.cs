namespace Mirath.Domain.Entities;

public class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? Link { get; set; }

    // Backward-compatible fields.
    public string Title { get; set; } = string.Empty;
    public string? Metadata { get; set; }

    public virtual User User { get; set; } = null!;
}
