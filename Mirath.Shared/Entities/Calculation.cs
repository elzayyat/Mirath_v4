namespace Mirath.Shared.Entities;

using System;
using System.Collections.Generic;

public class Calculation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CaseId { get; set; }
    public string Madhab { get; set; } = string.Empty;
    public decimal NetEstate { get; set; }
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
    public bool IsAwlApplied { get; set; }
    public bool IsRaddApplied { get; set; }
    public double TotalSharesRatio { get; set; }
    
    public virtual Case Case { get; set; } = null!;
    public virtual ICollection<HeirShare> HeirShares { get; set; } = new List<HeirShare>();
}

public class HeirShare
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CalculationId { get; set; }
    public string HeirType { get; set; } = string.Empty;
    public string HeirName { get; set; } = string.Empty;
    public double FractionNumerator { get; set; }
    public double FractionDenominator { get; set; }
    public double Percentage { get; set; }
    public decimal Amount { get; set; }
    public string ShareType { get; set; } = string.Empty;
    public string? Explanation { get; set; }
}