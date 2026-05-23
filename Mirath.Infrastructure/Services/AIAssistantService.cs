using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Runtime.CompilerServices;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Mirath.Infrastructure.Persistence;

namespace Mirath.Infrastructure.Services;

public interface IAIAssistantService
{
    Task<AIResponse> AskQuestionAsync(AIRequest request, CancellationToken cancellationToken = default);
    IAsyncEnumerable<string> AskQuestionStreamingAsync(AIRequest request, CancellationToken cancellationToken = default);
    Task<List<ChatMessage>> GetChatHistoryAsync(Guid userId, Guid? caseId = null);
    Task ClearChatHistoryAsync(Guid userId, Guid? caseId = null);
}

public record AIRequest(
    string Query,
    Guid UserId,
    Guid? CaseId = null,
    List<ChatMessage>? ConversationHistory = null);

public record AIResponse(
    string Answer,
    List<Citation> Citations,
    List<QuickQuestion> SuggestedQuestions,
    DateTime GeneratedAt);

public record Citation(
    string Source, // "Quran", "Hadith", "Fiqh"
    string Reference, // "4:11", "Bukhari 6732"
    string Text,
    string TextAr);

public record ChatMessage(
    string Role, // "user" or "assistant"
    string Content,
    DateTime Timestamp);

public record QuickQuestion(
    string Id,
    string Question,
    string QuestionAr,
    string Category);

public class AIAssistantService : IAIAssistantService
{
    private readonly HttpClient _httpClient;
    private readonly AIOptions _options;
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<AIAssistantService> _logger;
    
    // Islamic Knowledge Base - Pre-defined answers for common questions
    private readonly Dictionary<string, IslamicKnowledgeEntry> _knowledgeBase;
    
    public AIAssistantService(
        IHttpClientFactory httpClientFactory,
        IOptions<AIOptions> options,
        ApplicationDbContext dbContext,
        ILogger<AIAssistantService> logger)
    {
        _httpClient = httpClientFactory.CreateClient();
        _options = options.Value;
        _dbContext = dbContext;
        _logger = logger;
        _knowledgeBase = InitializeKnowledgeBase();
    }
    
    public async Task<AIResponse> AskQuestionAsync(AIRequest request, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("AI Question from User {UserId}: {Query}", request.UserId, request.Query);
        
        // Check knowledge base first for common questions
        var kbMatch = MatchKnowledgeBase(request.Query);
        if (kbMatch != null)
        {
            return new AIResponse(
                kbMatch.Answer,
                kbMatch.Citations,
                GetQuickQuestions(),
                DateTime.UtcNow);
        }
        
        // Build system prompt
        var systemPrompt = BuildSystemPrompt(request.CaseId);
        
        // Build conversation context
        var messages = new List<ChatMessage>();
        messages.Add(new ChatMessage("system", systemPrompt, DateTime.UtcNow));
        
        if (request.ConversationHistory != null && request.ConversationHistory.Any())
        {
            messages.AddRange(request.ConversationHistory.TakeLast(10));
        }
        
        messages.Add(new ChatMessage("user", request.Query, DateTime.UtcNow));
        
        // Call OpenAI API
        var response = await CallOpenAIAsync(messages, cancellationToken);
        
        // Extract citations from response
        var citations = ExtractCitations(response);
        
        // Save to database for authenticated users only
        if (request.UserId != Guid.Empty)
        {
            await SaveChatHistoryAsync(request.UserId, request.CaseId, request.Query, response, cancellationToken);
        }
        
        return new AIResponse(
            CleanResponse(response),
            citations,
            GetQuickQuestions(),
            DateTime.UtcNow);
    }
    
    public async IAsyncEnumerable<string> AskQuestionStreamingAsync(
        AIRequest request,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var systemPrompt = BuildSystemPrompt(request.CaseId);
        
        var messages = new List<ChatMessage>();
        messages.Add(new ChatMessage("system", systemPrompt, DateTime.UtcNow));
        
        if (request.ConversationHistory != null && request.ConversationHistory.Any())
        {
            messages.AddRange(request.ConversationHistory.TakeLast(10));
        }
        
        messages.Add(new ChatMessage("user", request.Query, DateTime.UtcNow));
        
        await foreach (var chunk in CallOpenAIStreamingAsync(messages, cancellationToken))
        {
            yield return chunk;
        }
    }
    
    private string BuildSystemPrompt(Guid? caseId)
    {
        var prompt = new StringBuilder();
        prompt.AppendLine(@"أنت خبير في علم الفرائض (المواريث) الإسلامي. أنت تجيب على الأسئلة بناءً على:
1. القرآن الكريم (سورة النساء 4:11-12، 4:176)
2. السنة النبوية (صحيح البخاري، صحيح مسلم)
3. الفقه الإسلامي (المذاهب الأربعة: حنفي، شافعي، مالكي، حنبلي)

إرشادات:
- قدم إجابات دقيقة ومستندة إلى المصادر
- استخدم اللغة العربية الفصحى مع دعم اللغة الإنجليزية
- اذكر المرجع (الآية أو الحديث) لكل حكم
- إذا كان السؤال خارج نطاق الفرائض، اعتذر بأدب
- قدم أمثلة عملية عندما يكون ذلك مفيدًا
- كن محايدًا بين المذاهب واذكر الخلاف إذا وجد

You are an expert in Islamic Inheritance Law (Faraidh). You answer based on:
- The Holy Quran (Surah An-Nisa 4:11-12, 4:176)
- Authentic Hadith (Sahih Bukhari, Sahih Muslim)
- Islamic Jurisprudence (Hanafi, Shafi'i, Maliki, Hanbali)

Guidelines:
- Provide accurate, source-based answers
- Support both Arabic and English
- Cite references for each ruling
- Politely decline non-inheritance questions
- Provide practical examples
- Be neutral between madhabs and mention differences when applicable");

        // Add case context if available
        if (caseId.HasValue)
        {
            prompt.AppendLine($"\n\nCurrent Case Context: (Available for reference if user asks about specific case)");
        }
        
        return prompt.ToString();
    }
    
    private async Task<string> CallOpenAIAsync(List<ChatMessage> messages, CancellationToken cancellationToken)
    {
        var requestBody = new
        {
            model = _options.Model,
            messages = messages.Select(m => new
            {
                role = m.Role,
                content = m.Content
            }),
            temperature = _options.Temperature,
            max_tokens = _options.MaxTokens
        };
        
        var content = new StringContent(
            JsonSerializer.Serialize(requestBody),
            Encoding.UTF8,
            "application/json");
        
        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_options.ApiKey}");
        
        var response = await _httpClient.PostAsync($"{_options.BaseUrl}/chat/completions", content, cancellationToken);
        
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("OpenAI API Error: {Error}", error);
            return "عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.";
        }
        
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        var jsonResponse = JsonSerializer.Deserialize<OpenAIResponse>(responseBody);
        
        return jsonResponse?.Choices?.FirstOrDefault()?.Message?.Content ?? "No response generated.";
    }
    
    private async IAsyncEnumerable<string> CallOpenAIStreamingAsync(
        List<ChatMessage> messages,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var requestBody = new
        {
            model = _options.Model,
            messages = messages.Select(m => new
            {
                role = m.Role,
                content = m.Content
            }),
            temperature = _options.Temperature,
            max_tokens = _options.MaxTokens,
            stream = true
        };
        
        var content = new StringContent(
            JsonSerializer.Serialize(requestBody),
            Encoding.UTF8,
            "application/json");
        
        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_options.ApiKey}");
        
        var response = await _httpClient.PostAsync($"{_options.BaseUrl}/chat/completions", content, cancellationToken);
        var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        
        using var reader = new StreamReader(stream);
        while (!reader.EndOfStream && !cancellationToken.IsCancellationRequested)
        {
            var line = await reader.ReadLineAsync();
            if (string.IsNullOrEmpty(line) || !line.StartsWith("data: ")) continue;
            
            var data = line.Substring(6);
            if (data == "[DONE]") break;
            
            string? contentChunk = null;
            try
            {
                var chunk = JsonSerializer.Deserialize<OpenAIStreamChunk>(data);
                contentChunk = chunk?.Choices?.FirstOrDefault()?.Delta?.Content;
            }
            catch
            {
                // ignore malformed stream lines
            }

            if (!string.IsNullOrEmpty(contentChunk))
            {
                yield return contentChunk;
            }
        }
    }
    
    private IslamicKnowledgeEntry? MatchKnowledgeBase(string query)
    {
        var normalizedQuery = query.ToLower().Trim();
        
        foreach (var entry in _knowledgeBase)
        {
            if (entry.Key.Split('|').Any(k => normalizedQuery.Contains(k)))
            {
                return entry.Value;
            }
        }
        
        return null;
    }
    
    private Dictionary<string, IslamicKnowledgeEntry> InitializeKnowledgeBase()
    {
        return new Dictionary<string, IslamicKnowledgeEntry>
        {
            ["what is faraidh|ما هو علم الفرائض|الفرائض"] = new IslamicKnowledgeEntry
            {
                Answer = "علم الفرائض هو علم شرعي يهتم بتوزيع تركة المتوفى على ورثته وفق أحكام الشريعة الإسلامية. قال الله تعالى: 'يُوصِيكُمُ اللَّهُ فِي أَوْلَادِكُمْ ۖ لِلذَّكَرِ مِثْلُ حَظِّ الْأُنثَيَيْنِ' (النساء: 11).",
                Citations = new List<Citation>
                {
                    new Citation("Quran", "4:11", "يُوصِيكُمُ اللَّهُ فِي أَوْلَادِكُمْ", "Allah instructs you concerning your children")
                }
            },
            ["what is awl|ما هو العول|العول"] = new IslamicKnowledgeEntry
            {
                Answer = "العول هو زيادة في مجموع فروض الورثة عن التركة، مما يستدعي تخفيض جميع الأنصبة بنسبة معينة. أول من طبق العول هو سيدنا عمر بن الخطاب رضي الله عنه. مثال: زوج + أخت شقيقة + أم (1/2 + 1/2 + 1/3 = 8/6) يتم تخفيض الكل إلى 6/8.",
                Citations = new List<Citation>
                {
                    new Citation("Fiqh", "Awl", "مبدأ العول في المواريث", "Principle of Awl in inheritance")
                }
            },
            ["what is radd|ما هو الرد|الرد"] = new IslamicKnowledgeEntry
            {
                Answer = "الرد هو إعادة الفائض من التركة بعد توزيع الفروض إلى الورثة بنسبة فروضهم، وذلك عندما لا يوجد عصبة. مثال: أم + بنت (1/6 + 1/2 = 2/3) يبقى 1/3 يرد عليهما بنسبة 1:3.",
                Citations = new List<Citation>
                {
                    new Citation("Fiqh", "Radd", "مبدأ الرد في المواريث", "Principle of Radd in inheritance")
                }
            },
            ["how to calculate inheritance|كيفية حساب الميراث|طريقة حساب"] = new IslamicKnowledgeEntry
            {
                Answer = "خطوات حساب الميراث:\n1. حساب التركة (الأصول - الديون - تكاليف الجنازة - الوصية)\n2. تحديد الورثة وتطبيق الحجب\n3. توزيع الفروض (الأنصبة المقدرة)\n4. توزيع الباقي على العصبات\n5. تطبيق العول إذا زادت الأنصبة عن 100%\n6. تطبيق الرد إذا نقصت الأنصبة عن 100%",
                Citations = new List<Citation>
                {
                    new Citation("Quran", "4:11-12", "آيات المواريث", "Inheritance verses")
                }
            }
        };
    }
    
    private List<Citation> ExtractCitations(string response)
    {
        var citations = new List<Citation>();
        
        // Extract Quran references (e.g., "النساء: 11" or "4:11")
        var quranPattern = new Regex(@"(?:النساء|Quran|القرآن)\s*[:\-]?\s*(\d+)[:\-](\d+)", RegexOptions.IgnoreCase);
        var matches = quranPattern.Matches(response);
        
        foreach (Match match in matches)
        {
            citations.Add(new Citation(
                "Quran",
                $"{match.Groups[1]}:{match.Groups[2]}",
                $"سورة النساء آية {match.Groups[2]}",
                $"Surah An-Nisa {match.Groups[1]}:{match.Groups[2]}"));
        }
        
        // Extract Hadith references
        var hadithPattern = new Regex(@"(?:Bukhari|Muslim|البخاري|مسلم)\s*(\d+)", RegexOptions.IgnoreCase);
        var hadithMatches = hadithPattern.Matches(response);
        
        foreach (Match match in hadithMatches)
        {
            citations.Add(new Citation(
                "Hadith",
                match.Value,
                $"حديث رقم {match.Groups[1]}",
                $"Hadith No. {match.Groups[1]}"));
        }
        
        return citations.DistinctBy(c => c.Reference).ToList();
    }
    
    private string CleanResponse(string response)
    {
        // Remove any markdown or special characters
        response = Regex.Replace(response, @"\*\*(.*?)\*\*", "$1");
        response = Regex.Replace(response, @"\*(.*?)\*", "$1");
        return response.Trim();
    }
    
    private List<QuickQuestion> GetQuickQuestions()
    {
        return new List<QuickQuestion>
        {
            new QuickQuestion("q1", "What is Faraidh?", "ما هو علم الفرائض؟", "basics"),
            new QuickQuestion("q2", "What is Awl (العول)?", "ما هو العول؟", "concepts"),
            new QuickQuestion("q3", "What is Radd (الرد)?", "ما هو الرد؟", "concepts"),
            new QuickQuestion("q4", "What is Hajb (الحجب)?", "ما هو الحجب؟", "concepts"),
            new QuickQuestion("q5", "How do sons and daughters inherit together?", "كيف يرث الأبناء والبنات معاً؟", "heirs"),
            new QuickQuestion("q6", "What happens if there are no children?", "ماذا يحدث إذا لم يوجد أبناء؟", "scenarios"),
            new QuickQuestion("q7", "How much does the wife get?", "كم نصيب الزوجة؟", "shares"),
            new QuickQuestion("q8", "What are the differences between madhabs?", "ما هي اختلافات المذاهب؟", "madhabs"),
            new QuickQuestion("q9", "How are debts handled?", "كيف يتم التعامل مع الديون؟", "estate"),
            new QuickQuestion("q10", "What is the maximum bequest?", "ما هو الحد الأقصى للوصية؟", "estate"),
        };
    }
    
    private async Task SaveChatHistoryAsync(Guid userId, Guid? caseId, string query, string response, CancellationToken cancellationToken)
    {
        var userQuestion = new ChatHistory
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CaseId = caseId,
            Role = "user",
            Content = query,
            Timestamp = DateTime.UtcNow
        };
        
        var aiResponse = new ChatHistory
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CaseId = caseId,
            Role = "assistant",
            Content = response,
            Timestamp = DateTime.UtcNow
        };
        
        await _dbContext.ChatHistories.AddRangeAsync(new[] { userQuestion, aiResponse }, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
    
    public async Task<List<ChatMessage>> GetChatHistoryAsync(Guid userId, Guid? caseId = null)
    {
        var query = _dbContext.ChatHistories
            .Where(c => c.UserId == userId && !c.IsDeleted);
        
        if (caseId.HasValue)
            query = query.Where(c => c.CaseId == caseId);
        
        var history = await query
            .OrderBy(c => c.Timestamp)
            .Take(50)
            .Select(c => new ChatMessage(c.Role, c.Content, c.Timestamp))
            .ToListAsync();
        
        return history;
    }
    
    public async Task ClearChatHistoryAsync(Guid userId, Guid? caseId = null)
    {
        var query = _dbContext.ChatHistories
            .Where(c => c.UserId == userId);
        
        if (caseId.HasValue)
            query = query.Where(c => c.CaseId == caseId);
        
        var histories = await query.ToListAsync();
        foreach (var history in histories)
        {
            history.IsDeleted = true;
        }
        
        await _dbContext.SaveChangesAsync();
    }
}

// Supporting classes
public record IslamicKnowledgeEntry
{
    public string Answer { get; init; } = string.Empty;
    public List<Citation> Citations { get; init; } = new();
}

public record OpenAIResponse
{
    public List<Choice> Choices { get; init; } = new();
}

public record Choice
{
    public Message Message { get; init; } = new();
    public Delta Delta { get; init; } = new();
}

public record Message
{
    public string Content { get; init; } = string.Empty;
}

public record Delta
{
    public string Content { get; init; } = string.Empty;
}

public record OpenAIStreamChunk
{
    public List<Choice> Choices { get; init; } = new();
}

public class AIOptions
{
    public string ApiKey { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://api.openai.com/v1";
    public string Model { get; set; } = "gpt-4";
    public double Temperature { get; set; } = 0.7;
    public int MaxTokens { get; set; } = 1000;
}
