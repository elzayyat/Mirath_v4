# Fix Notes

## Backend build fix

Fixed `CS1673` in `Mirath.Application/Services/FarayidCalculationService.cs` by copying the `Fraction.Value` instance property into a local variable before using it inside the `OrderBy` lambda in `Fraction.ToString()`.

## Frontend dev fix

The error:

```text
'vite' is not recognized as an internal or external command
```

means frontend dependencies were not installed. The root `package.json` now includes `predev`, so running `npm run dev` from the repository root will install frontend dependencies before starting Vite.

Manual equivalent:

```powershell
npm --prefix frontend install
npm run dev
```
