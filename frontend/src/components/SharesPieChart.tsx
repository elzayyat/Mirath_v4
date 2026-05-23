import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { HeirShare } from '@/lib/inheritance';

const COLORS = [
  'hsl(160, 85%, 25%)',
  'hsl(42, 65%, 52%)',
  'hsl(200, 70%, 45%)',
  'hsl(340, 60%, 50%)',
  'hsl(280, 50%, 55%)',
  'hsl(30, 70%, 50%)',
  'hsl(160, 50%, 40%)',
  'hsl(45, 80%, 60%)',
  'hsl(220, 60%, 50%)',
  'hsl(10, 65%, 55%)',
];

interface Props {
  shares: HeirShare[];
  distributableEstate: number;
}

const SharesPieChart = ({ shares, distributableEstate }: Props) => {
  const activeShares = shares.filter(s => !s.blocked && s.amount > 0);

  if (activeShares.length === 0) return null;

  const data = activeShares.map(s => ({
    name: s.heir.name + (s.heir.count > 1 ? ` (×${s.heir.count})` : ''),
    value: s.amount,
    percentage: distributableEstate > 0 ? ((s.amount / distributableEstate) * 100).toFixed(1) : '0',
  }));

  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-arabic text-xl flex items-center gap-2">
          Distribution Chart
          <span className="text-accent text-sm font-normal">مخطط التوزيع</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
                label={({ name, payload }: any) => `${name}: ${payload?.percentage}%`}
                labelLine={{ strokeWidth: 1 }}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => fmt(value)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  color: 'hsl(var(--foreground))',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SharesPieChart;
