namespace Mirath.Domain.Entities;

public class Document
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CaseId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public Guid? UploadedBy { get; set; }

    // Backward-compatible fields.
    public string FileUrl { get => FilePath; set => FilePath = value; }
    public long FileSize { get; set; }
    public string Language { get; set; } = "en";
    public string? VerificationCode { get; set; }
    public DateTime CreatedAt { get => UploadedAt; set => UploadedAt = value; }

    public virtual Case Case { get; set; } = null!;
    public virtual User? UploadedByUser { get; set; }
}
