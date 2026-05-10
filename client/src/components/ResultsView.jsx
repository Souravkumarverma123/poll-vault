import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Users } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);


const CHART_COLORS = [
  'rgba(99, 102, 241, 0.8)', 'rgba(236, 72, 153, 0.8)', 'rgba(34, 197, 94, 0.8)',
  'rgba(249, 115, 22, 0.8)', 'rgba(168, 85, 247, 0.8)', 'rgba(14, 165, 233, 0.8)',
];

export default function ResultsView({ analytics, title, description }) {
  if (!analytics) return null;
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && <p className="mt-2 text-muted-foreground">{description}</p>}
        <div className="mt-4 flex items-center justify-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold">{analytics.totalResponses} responses</span>
        </div>
      </div>
      {analytics.questionStats?.map((q, idx) => {
        const labels = q.options.map((o) => o.optionText);
        const counts = q.options.map((o) => o.count);
        const colors = q.options.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);
        return (
          <Card key={q.questionId}>
            <CardHeader>
              <CardTitle className="text-base">Question {idx + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <Bar data={{ labels, datasets: [{ label: 'Responses', data: counts, backgroundColor: colors, borderRadius: 6 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} />
              </div>
              <div className="mt-4 space-y-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: CHART_COLORS[oi % CHART_COLORS.length] }} />{opt.optionText}</span>
                    <Badge variant="secondary">{opt.count} ({opt.percentage}%)</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
