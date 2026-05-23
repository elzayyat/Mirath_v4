# Farayid Engine Update

Implemented `Mirath.Application/Services/FarayidCalculationService.cs` as the backend calculation authority for `/api/cases/{id}/calculate`.

## Included
- Estate calculation from declared values plus gold/silver gram valuation.
- Debts, funeral expenses, and capped bequest deduction.
- Hajb rules requested in the implementation brief.
- Quranic fixed shares for husband, wives, daughters, son's daughters, father, mother, sisters, paternal sisters, and maternal siblings.
- Asaba residual distribution priority including sons/daughters, son's sons, father, grandfather, siblings, nephews, and uncles.
- Awl and Radd processing with madhab-sensitive exclusion of spouses and Maliki no-radd behavior.
- Special-case warnings for Mushtaraka and Akdariyya.
- Special legal blockers: murderer and non-Muslim heir from Muslim decedent.
- Scenario warnings for pregnant and missing heirs.
- Arabic and English summaries, timestamp, and version.

## Important Review Note
Islamic inheritance has court- and madhab-specific edge cases. This implementation is a production-grade backend foundation, but outputs should still be reviewable by a qualified lawyer/scholar before filing or issuing a binding legal opinion.
