import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import type { CalculationStep } from '@/lib/inheritance';

interface Props {
  steps: CalculationStep[];
}

const CalculationSteps = ({ steps }: Props) => {
  if (!steps || steps.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-arabic text-xl flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-accent" />
          Step-by-Step Explanation
          <span className="text-accent text-sm font-normal">الشرح خطوة بخطوة</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step) => (
            <div key={step.stepNumber} className="relative pl-8 pb-4 last:pb-0">
              <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-border last:hidden" />
              <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full gold-gradient flex items-center justify-center">
                <span className="text-xs font-bold text-emerald-dark">{step.stepNumber}</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm text-foreground">{step.title}</h4>
                  <span className="text-xs text-muted-foreground font-arabic">{step.titleAr}</span>
                </div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {step.formula && (
                  <code className="block mt-2 text-xs bg-background p-2 rounded font-mono text-accent">
                    {step.formula}
                  </code>
                )}
                <p className="text-xs text-muted-foreground font-arabic mt-1 text-right" dir="rtl">
                  {step.descriptionAr}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CalculationSteps;
