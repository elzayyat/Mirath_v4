using Mirath.Shared.Entities;
using Mirath.Domain.Enums;

namespace Mirath.Domain.Services;

public class GrandFatherCalculator
{
    public static GrandFatherResult Calculate(GrandFatherContext context)
    {
        var results = new List<GrandFatherOption>();
        
        // Calculate the three options for grandfather
        // Option 1: 1/6 (السدس)
        double option1 = 1.0 / 6.0;
        
        // Option 2: Muqasama (المقاسمة) - treated as a brother
        int siblingCount = context.Siblings.Count;
        double option2 = context.Remainder / (siblingCount + 1);
        
        // Option 3: 1/3 of remainder (ثلث الباقي)
        double option3 = context.Remainder / 3.0;
        
        results.Add(new GrandFatherOption("السدس", option1, option1));
        results.Add(new GrandFatherOption("المقاسمة", option2, option2));
        results.Add(new GrandFatherOption("ثلث الباقي", option3, option3));
        
        // Take the best option (maximum share)
        var bestOption = results.OrderByDescending(r => r.Share).First();
        
        return new GrandFatherResult(bestOption, results);
    }
}

public record GrandFatherContext(
    List<Heir> Siblings,
    double Remainder,
    Madhab Madhab);

public record GrandFatherOption(string Method, double Share, double OriginalValue);
public record GrandFatherResult(GrandFatherOption BestOption, List<GrandFatherOption> AllOptions);