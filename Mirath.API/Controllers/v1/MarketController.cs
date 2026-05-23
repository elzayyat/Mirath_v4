using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Mirath.API.Controllers;

namespace Mirath.API.Controllers.v1;

[Authorize]
public class MarketController : BaseApiController
{
    private readonly IHttpClientFactory _http;
    private readonly IMemoryCache _cache;
    private readonly IConfiguration _config;
    public MarketController(IHttpClientFactory http, IMemoryCache cache, IConfiguration config) { _http = http; _cache = cache; _config = config; }

    [HttpGet("gold-price")]
    [AllowAnonymous]
    public async Task<ActionResult<GoldPriceDto>> GetGoldPrice(CancellationToken ct)
    {
        if (_cache.TryGetValue<GoldPriceDto>("gold-usd-gram", out var cached)) return Ok(cached!);
        var apiKey = _config["GoldApi:ApiKey"] ?? Environment.GetEnvironmentVariable("GOLD_API_KEY");
        decimal price = 0m;
        string source = "configured-fallback";
        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            using var req = new HttpRequestMessage(HttpMethod.Get, "https://www.goldapi.io/api/XAU/USD");
            req.Headers.Add("x-access-token", apiKey);
            using var res = await _http.CreateClient().SendAsync(req, ct);
            if (res.IsSuccessStatusCode)
            {
                using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync(ct));
                if (doc.RootElement.TryGetProperty("price_gram_24k", out var p)) { price = p.GetDecimal(); source = "goldapi.io"; }
            }
        }
        if (price <= 0) price = decimal.TryParse(_config["GoldApi:FallbackUsdPerGram"], out var f) ? f : 75m;
        var dto = new GoldPriceDto(price, "USD", "gram", DateTime.UtcNow, source);
        _cache.Set("gold-usd-gram", dto, TimeSpan.FromHours(1));
        return Ok(dto);
    }
}
public record GoldPriceDto(decimal Price, string Currency, string Unit, DateTime RetrievedAt, string Source);
