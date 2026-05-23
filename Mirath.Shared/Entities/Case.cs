namespace Mirath.Shared.Entities;

using System;
using System.Collections.Generic;

public class Case
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string CaseNumber { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string DeceasedName { get; set; } = string.Empty;
    public string DeceasedGender { get; set; } = string.Empty;
    public DateTime DateOfDeath { get; set; }
    public string Status { get; set; } = "Draft";
    public string Madhab { get; set; } = "General";
    public string? Description { get; set; }
    public decimal TotalAssets { get; set; }
    public decimal TotalDebts { get; set; }
    public decimal FuneralExpenses { get; set; }
    public decimal WillAmount { get; set; }
    public decimal NetEstate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
}