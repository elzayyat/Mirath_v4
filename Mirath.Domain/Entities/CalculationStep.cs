namespace Mirath.Domain.Entities;

public class CalculationStep
{
    public int Id { get; set; }
    public string StepName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double? InitialValue { get; set; }
    public double? FinalValue { get; set; }
}