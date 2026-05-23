namespace Mirath.Application.Common.Models;

public record ApiResponse<T>(
    bool Success,
    T? Data,
    string Message,
    Dictionary<string, string[]>? Errors = null);

public record PaginatedResult<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    int TotalCount);
