import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { getAnalytics } from '@/api/polls';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Users, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const CHART_COLORS = [
  'rgba(99, 102, 241, 0.8)', 'rgba(236, 72, 153, 0.8)', 'rgba(34, 197, 94, 0.8)',
  'rgba(249, 115, 22, 0.8)', 'rgba(168, 85, 247, 0.8)', 'rgba(14, 165, 233, 0.8)',
  'rgba(245, 158, 11, 0.8)', 'rgba(239, 68, 68, 0.8)',
];

export default function LiveAnalytics({ pollId }) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getAnalytics(pollId);
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [pollId]);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;
    socket.on('connect', () => {
      socket.emit('join:poll', { pollId, token });
    });
    socket.on('response:new', (payload) => {
      setData((prev) => {
        if (!prev) return prev;
        const updatedQuestions = prev.questions.map((q) => {
          const stats = payload.questionStats.find((s) => s.questionId === q._id);
          if (!stats) return q;
          return {
            ...q,
            options: q.options.map((opt) => {
              const s = stats.options.find((o) => o.optionText === opt.optionText);
              return s ? { ...opt, count: s.count, percentage: s.percentage } : opt;
            }),
          };
        });
        return { totalResponses: payload.totalResponses, questions: updatedQuestions };
      });
    });
    return () => {
      socket.emit('leave:poll', { pollId });
      socket.disconnect();
    };
  }, [pollId, token]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) return <p className="text-muted-foreground">No analytics available.</p>;

  return (
    <div className="space-y-6">
      <Card className="animate-pulse-glow">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-3xl font-bold">{data.totalResponses}</p>
            <p className="text-sm text-muted-foreground">Total Responses</p>
          </div>
          <div className="ml-auto flex items-center gap-1 text-emerald-500">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">Live</span>
          </div>
        </CardContent>
      </Card>

      {data.questions.map((q, idx) => {
        const labels = q.options.map((o) => o.optionText);
        const counts = q.options.map((o) => o.count);
        const colors = q.options.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);
        const chartData = { labels, datasets: [{ label: 'Responses', data: counts, backgroundColor: colors, borderRadius: 6 }] };
        const doughnutData = { labels, datasets: [{ data: counts, backgroundColor: colors, borderWidth: 0 }] };
        return (
          <Card key={q._id}>
            <CardHeader>
              <CardTitle className="text-base">{idx + 1}. {q.questionText}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="bar">
                <TabsList className="mb-4">
                  <TabsTrigger value="bar">Bar Chart</TabsTrigger>
                  <TabsTrigger value="doughnut">Doughnut</TabsTrigger>
                </TabsList>
                <TabsContent value="bar">
                  <div className="h-64"><Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} /></div>
                </TabsContent>
                <TabsContent value="doughnut">
                  <div className="mx-auto h-64 w-64"><Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} /></div>
                </TabsContent>
              </Tabs>
              <div className="mt-4 space-y-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: CHART_COLORS[oi % CHART_COLORS.length] }} />{opt.optionText}</span>
                    <span className="text-muted-foreground">{opt.count} ({opt.percentage}%)</span>
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
