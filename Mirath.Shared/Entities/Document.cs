namespace Mirath.Shared.Entities;

using System;

public class Document
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CaseId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string Language { get; set; } = "en";
    public string? VerificationCode { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}