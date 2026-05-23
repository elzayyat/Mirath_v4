namespace Mirath.Shared.Entities;

using System;
using Mirath.Shared.Enums;

public class Heir
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CaseId { get; set; }
    public HeirType Type { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public int Count { get; set; } = 1;
    public bool IsAlive { get; set; } = true;
    public bool IsBlocked { get; set; }
    public string? BlockingReason { get; set; }
}