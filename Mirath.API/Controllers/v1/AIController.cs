using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mirath.Application.Features.AI.Commands;
using Mirath.Application.Features.AI.DTOs;
using Mirath.Infrastructure.Services;
using MediatR;

namespace Mirath.API.Controllers.v1;

[ApiController]
[Route("api/v1/[controller]")]
public class AIController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IAIAssistantService _aiService;

    public AIController(IMediator mediator, IAIAssistantService aiService)
    {
        _mediator = mediator;
        _aiService = aiService;
    }

    [HttpPost("ask")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AIResponseDto), 200)]
    public async Task<ActionResult<AIResponseDto>> AskQuestion([FromBody] AskAICommand command)
    {
        var userId = GetOptionalUserId();
        var request = new AIRequest(command.Query, userId, command.CaseId);
        var response = await _aiService.AskQuestionAsync(request);

        return Ok(new AIResponseDto
        {
            Answer = response.Answer,
            Citations = response.Citations.Select(c => new CitationDto
            {
                Source = c.Source,
                Reference = c.Reference,
                Text = c.Text,
                TextAr = c.TextAr
            }).ToList(),
            SuggestedQuestions = response.SuggestedQuestions.Select(q => new QuickQuestionDto
            {
                Id = q.Id,
                Question = q.Question,
                QuestionAr = q.QuestionAr,
                Category = q.Category
            }).ToList()
        });
    }

    [HttpPost("ask-stream")]
    [AllowAnonymous]
    public async IAsyncEnumerable<string> AskQuestionStreaming([FromBody] AskAICommand command)
    {
        var userId = GetOptionalUserId();
        var request = new AIRequest(command.Query, userId, command.CaseId);

        await foreach (var chunk in _aiService.AskQuestionStreamingAsync(request))
        {
            yield return chunk;
        }
    }

    [HttpGet("history")]
    [Authorize]
    public async Task<ActionResult<List<ChatMessageDto>>> GetHistory([FromQuery] Guid? caseId = null)
    {
        var userId = GetRequiredUserId();
        var history = await _aiService.GetChatHistoryAsync(userId, caseId);

        return Ok(history.Select(h => new ChatMessageDto
        {
            Role = h.Role,
            Content = h.Content,
            Timestamp = h.Timestamp
        }).ToList());
    }

    [HttpDelete("history")]
    [Authorize]
    public async Task<IActionResult> ClearHistory([FromQuery] Guid? caseId = null)
    {
        var userId = GetRequiredUserId();
        await _aiService.ClearChatHistoryAsync(userId, caseId);
        return new OkObjectResult(new { message = "Chat history cleared" });
    }

    [HttpGet("quick-questions")]
    [AllowAnonymous]
    public ActionResult<List<QuickQuestionDto>> GetQuickQuestions()
    {
        var questions = new List<QuickQuestionDto>
        {
            new() { Id = "q1", Question = "What is Faraidh?", QuestionAr = "ما هو علم الفرائض؟", Category = "basics" },
            new() { Id = "q2", Question = "What is Awl (العول)?", QuestionAr = "ما هو العول؟", Category = "concepts" },
            new() { Id = "q3", Question = "What is Radd (الرد)?", QuestionAr = "ما هو الرد؟", Category = "concepts" },
            new() { Id = "q4", Question = "What is Hajb (الحجب)?", QuestionAr = "ما هو الحجب؟", Category = "concepts" },
            new() { Id = "q5", Question = "How do sons and daughters inherit together?", QuestionAr = "كيف يرث الأبناء والبنات معاً؟", Category = "heirs" },
            new() { Id = "q6", Question = "What happens if there are no children?", QuestionAr = "ماذا يحدث إذا لم يوجد أبناء؟", Category = "scenarios" },
            new() { Id = "q7", Question = "How much does the wife get?", QuestionAr = "كم نصيب الزوجة؟", Category = "shares" },
            new() { Id = "q8", Question = "What are the differences between madhabs?", QuestionAr = "ما هي اختلافات المذاهب؟", Category = "madhabs" },
            new() { Id = "q9", Question = "How are debts handled?", QuestionAr = "كيف يتم التعامل مع الديون؟", Category = "estate" },
            new() { Id = "q10", Question = "What is the maximum bequest?", QuestionAr = "ما هو الحد الأقصى للوصية؟", Category = "estate" }
        };

        return Ok(questions);
    }

    private Guid GetRequiredUserId()
    {
        var userIdClaim = User.FindFirst("userId")?.Value;
        if (string.IsNullOrEmpty(userIdClaim))
            throw new UnauthorizedAccessException();
        return Guid.Parse(userIdClaim);
    }

    private Guid GetOptionalUserId()
    {
        var userIdClaim = User.FindFirst("userId")?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
    }
}
