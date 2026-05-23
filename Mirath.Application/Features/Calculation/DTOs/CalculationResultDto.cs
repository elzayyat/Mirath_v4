using Mirath.Domain.Enums;
using Mirath.Shared.Enums;

namespace Mirath.Application.Features.Calculation.DTOs;

public record CalculationResultDto(
    Guid CalculationId,
    Guid CaseId,
    DateTime CalculatedAt,
    Madhab Madhab,
    decimal NetEstate,
    List<HeirShareDto> Shares,
    List<CalculationStepDto> Steps,
    bool IsAwlApplied,
    bool IsRaddApplied,
    double TotalRatio,
    string Summary);

public record HeirShareDto(
    HeirType HeirType,
    string HeirName,
    string Fraction,
    double Percentage,
    decimal Amount,
    string ShareType,
    string Explanation);

public record CalculationStepDto(
    int StepOrder,
    string Title,
    string Description,
    string? Formula,
    double? BeforeValue,
    double? AfterValue);

public record MadhabComparisonDto(
    Guid CaseId,
    Dictionary<Madhab, MadhabResultDto> Results);

public record MadhabResultDto(
    Madhab Madhab,
    string MadhabName,
    List<HeirShareDto> Shares,
    double TotalRatio,
    string KeyDifference);

public record ValidationResultDto(
    bool IsValid,
    List<ValidationErrorDto> Errors,
    List<ValidationWarningDto> Warnings);

public record ValidationErrorDto(string Code, string Message, string? Field);
public record ValidationWarningDto(string Code, string Message, string? Field);

public record ExplanationDto(
    Guid CalculationId,
    string OverallExplanation,
    List<StepExplanationDto> Steps,
    List<string> QuranicReferences);

public record StepExplanationDto(
    int StepNumber,
    string Title,
            string DetailedExplanation,
    string? IslamicBasis);