import { useEffect, useState, useRef } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSocket, useSocketConnected } from '@/context/SocketContext';
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
  const socket = useSocket();
  useSocketConnected();
  const [data, setData] = useState(null);
  const [responseMode, setResponseMode] = useState('anonymous');
  const [loading, setLoading] = useState(true);
  const joinedRef = useRef(false);

  // Fetch initial analytics
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getAnalytics(pollId);
        setData(res.data.data);
        setResponseMode(res.data.data.responseMode || 'anonymous');
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [pollId]);

  // Join the socket room for live analytics updates.
  //
  // Why useSocketConnected() above is necessary:
  //   useSocket() reads socketRef.current (a ref, not state). Refs don't trigger
  //   re-renders when mutated. Without subscribing to the connected state, this
  //   component would render with socket=null on first mount, the effect would
  //   exit early, and would never retry — even after the socket connected.
  //
  // Reconnect strategy:
  //   Socket.IO fires 'connect' on every (re)connect. We always re-join the room
  //   on 'connect' by resetting joinedRef first. This handles the case where an
  //   expired access token caused the previous join to be rejected silently.
  useEffect(() => {
    if (!socket) return;

    const joinRoom = () => {
      if (!joinedRef.current) {
        socket.emit('join:poll', { pollId });
        joinedRef.current = true;
      }
    };

    // On every reconnect: reset guard and re-join.
    // This is critical — after a network drop + reconnect, Socket.IO fires
    // 'connect' again. Without re-joining, the socket is no longer in the room.
    const handleConnect = () => {
      joinedRef.current = false;
      joinRoom();
    };

    const handleNewResponse = (payload) => {
      setData((prev) => {
        if (!prev) return prev;
        const updatedQuestions = prev.questions.map((q) => {
          if (q.questionType === 'text') return q; // text not aggregated in real-time
          const stats = payload.questionStats.find(
            (s) => String(s.questionId) === String(q._id)
          );
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

    // Surface server-side join rejections (e.g. expired JWT after token refresh,
    // or attempting to view a poll you don't own). Without this handler, the
    // socket silently stops receiving 'response:new' events.
    const handleError = (err) => {
      console.warn('[LiveAnalytics] Socket error:', err?.message);
      joinedRef.current = false; // allow retry on next connect
    };

    // If already connected when this effect runs, join immediately.
    // This is the common case when the user navigates to an existing poll page.
    if (socket.connected) {
      joinRoom();
    }

    socket.on('connect', handleConnect);
    socket.on('response:new', handleNewResponse);
    socket.on('error', handleError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('response:new', handleNewResponse);
      socket.off('error', handleError);
      socket.emit('leave:poll', { pollId });
      joinedRef.current = false;
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
                  <div key={oi} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
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
                    {/* Roll-call: show respondent names for named polls */}
                    {responseMode === 'named' && opt.respondents && opt.respondents.length > 0 && (
                      <div className="flex flex-wrap gap-1 pl-5">
                        {opt.respondents.map((r) => (
                          <span
                            key={r._id}
                            className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {r.name}
                          </span>
                        ))}
                      </div>
                    )}
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
