namespace Mirath.Application.Features.AI.Commands;

public record AskAICommand(string Query, Guid? CaseId = null);
