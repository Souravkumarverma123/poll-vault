import { useEffect, useState, useRef } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSocket } from '@/context/SocketContext';
import { getAnalytics } from '@/api/polls';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Users, TrendingUp, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { sanitize } from '@/lib/utils';

// Single-hue palette: slate/neutral gradient that matches the monochrome brand
const CHART_COLORS = [
  'rgba(15, 15, 15, 0.85)',
  'rgba(45, 45, 45, 0.80)',
  'rgba(90, 90, 90, 0.75)',
  'rgba(130, 130, 130, 0.70)',
  'rgba(170, 170, 170, 0.65)',
  'rgba(200, 200, 200, 0.60)',
  'rgba(220, 220, 220, 0.55)',
  'rgba(240, 240, 240, 0.50)',
];

// Accent colors used only when dark-mode context is needed — kept for doughnut labels
const ACCENT_COLORS = [
  '#1a1a1a', '#3d3d3d', '#666666', '#999999',
  '#b3b3b3', '#cccccc', '#e0e0e0', '#f0f0f0',
];

export default function LiveAnalytics({ pollId }) {
  const socket = useSocket(); // singleton — no new connection created
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const joinedRef = useRef(false);

  // Fetch initial analytics
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

  // Use singleton socket — join room, listen for live analytics updates.
  // Design notes:
  //  1. joinedRef guards against emitting join:poll twice on the same connection
  //     (once from the connected-state check + once from the 'connect' listener).
  //  2. On reconnect, Socket.IO fires 'connect' again — joinedRef is reset in the
  //     cleanup so the new connection correctly re-joins the room.
  useEffect(() => {
    if (!socket) return;

    const joinRoom = () => {
      if (!joinedRef.current) {
        socket.emit('join:poll', { pollId });
        joinedRef.current = true;
      }
    };

    // Re-join on every reconnect (Socket.IO fires 'connect' on each reconnect)
    const handleReconnectJoin = () => {
      joinedRef.current = false; // reset so joinRoom() emits again
      joinRoom();
    };

    const handleNewResponse = (payload) => {
      setData((prev) => {
        if (!prev) return prev;
        const updatedQuestions = prev.questions.map((q) => {
          if (q.questionType === 'text') return q; // text not aggregated in real-time
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
    };

    // If already connected, join immediately; otherwise wait for 'connect'
    if (socket.connected) {
      joinRoom();
    }
    socket.on('connect', handleReconnectJoin);
    socket.on('response:new', handleNewResponse);

    return () => {
      socket.off('connect', handleReconnectJoin);
      socket.off('response:new', handleNewResponse);
      socket.emit('leave:poll', { pollId });
      joinedRef.current = false; // reset so a future mount re-joins correctly
    };
  }, [socket, pollId]);


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
      {/* Total Responses Card — visually elevated as the primary metric */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="text-4xl font-bold tracking-tight">{data.totalResponses}</p>
            <p className="text-sm text-muted-foreground">Total Responses</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-semibold">Live</span>
          </div>
        </CardContent>
      </Card>

      {data.questions.map((q, idx) => {
        const isText = q.questionType === 'text';

        if (isText) {
          return (
            <Card key={q._id}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  {idx + 1}. {q.questionText}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(!q.answers || q.answers.length === 0) ? (
                  <p className="text-sm text-muted-foreground italic">No text responses yet.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {q.answers.map((text, i) => (
                      <div key={i} className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">{sanitize(text)}</div>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-xs text-muted-foreground">{q.totalForQuestion} response(s)</p>
              </CardContent>
            </Card>
          );
        }

        // Only include options that have votes in the bar chart to prevent empty bars
        const allOptions = q.options;
        const votedOptions = allOptions.filter((o) => o.count > 0);
        const barOptions = votedOptions.length > 0 ? votedOptions : allOptions; // fallback: show all if 0 votes total

        const barLabels = barOptions.map((o) => o.optionText);
        const barCounts = barOptions.map((o) => o.count);
        const barColors = barOptions.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

        const allLabels = allOptions.map((o) => o.optionText);
        const allCounts = allOptions.map((o) => o.count);
        const allColors = allOptions.map((_, i) => ACCENT_COLORS[i % ACCENT_COLORS.length]);

        const chartData = {
          labels: barLabels,
          datasets: [{ label: 'Responses', data: barCounts, backgroundColor: barColors, borderRadius: 8 }],
        };
        const doughnutData = {
          labels: allLabels,
          datasets: [{ data: allCounts, backgroundColor: allColors, borderWidth: 0 }],
        };

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
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded"
                        style={{ backgroundColor: ACCENT_COLORS[oi % ACCENT_COLORS.length] }}
                      />
                      {opt.optionText}
                    </span>
                    <span className={`tabular-nums ${opt.count === 0 ? 'text-muted-foreground/50' : 'text-foreground'}`}>
                      {opt.count} ({opt.percentage}%)
                    </span>
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
