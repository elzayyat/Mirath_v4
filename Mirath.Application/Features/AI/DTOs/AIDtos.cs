namespace Mirath.Application.Features.AI.DTOs;

public class AIResponseDto
{
    public string Answer { get; set; } = string.Empty;
    public List<CitationDto> Citations { get; set; } = new();
    public List<QuickQuestionDto> SuggestedQuestions { get; set; } = new();
}

public class CitationDto
{
    public string Source { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public string TextAr { get; set; } = string.Empty;
}

public class QuickQuestionDto
{
    public string Id { get; set; } = string.Empty;
    public string Question { get; set; } = string.Empty;
    public string QuestionAr { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
}

public class ChatMessageDto
{
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}
