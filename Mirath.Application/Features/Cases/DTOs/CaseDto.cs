using Mirath.Domain.Enums;
using Mirath.Application.Features.Calculation.DTOs;
using Mirath.Shared.Entities;
using Mirath.Shared.Enums;

namespace Mirath.Application.Features.Cases.DTOs;

public record CaseDto(
    Guid Id,
    string CaseNumber,
    string DeceasedName,
    DateTime DateOfDeath,
    CaseStatus Status,
    Madhab Madhab,
    decimal NetEstate,
    DateTime CreatedAt);

public record CaseDetailDto(
    Guid Id,
    string CaseNumber,
    Guid UserId,
    string DeceasedName,
    string DeceasedGender,
    DateTime DateOfDeath,
    CaseStatus Status,
    Madhab Madhab,
    string? Description,
    AssetSummaryDto Assets,
    DebtSummaryDto Debts,
    List<HeirDto> Heirs,
    CalculationResultDto? LastCalculation,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public record CaseListDto(
    Guid Id,
    string CaseNumber,
    string DeceasedName,
    DateTime DateOfDeath,
    CaseStatus Status,
    decimal NetEstate,
    DateTime CreatedAt,
    int HeirsCount);

public record HeirDto(
    Guid Id,
    HeirType Type,
    string Name,
    string Gender,
    int Count,
    bool IsAlive,
    bool IsBlocked,
    string? BlockingReason);

public record AssetDto(
    Guid Id,
    AssetType Type,
    string Description,
    decimal Value,
    string Currency,
    DateTime ValuationDate);

public record AssetSummaryDto(
    int TotalAssets,
    decimal TotalValue,
    string Currency,
    List<AssetByTypeDto> ByType);

public record AssetByTypeDto(AssetType Type, decimal Value, int Count);

public record DebtDto(
    Guid Id,
    DebtType Type,
    string CreditorName,
    decimal Amount,
    string Currency,
    string? Description);

public record DebtSummaryDto(
    int TotalDebts,
    decimal TotalAmount,
    decimal FuneralExpenses,
    decimal WillAmount,
    string Currency);