import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyPolls } from '@/api/polls';
import PollCard from '@/components/PollCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, BarChart3 } from 'lucide-react';

export default function Dashboard() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getMyPolls();
        setPolls(res.data.data.polls);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-12 pb-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-heading font-bold">My Polls</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor your polls</p>
        </div>
        <Button asChild>
          <Link to="/polls/create"><Plus className="mr-2 h-4 w-4" />Create Poll</Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3 rounded-xl border p-6">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : polls.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">No polls yet</h2>
          <p className="mt-2 max-w-md text-muted-foreground">Create your first poll to start collecting responses and viewing real-time analytics.</p>
          <Button className="mt-6" asChild>
            <Link to="/polls/create"><Plus className="mr-2 h-4 w-4" />Create Your First Poll</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => <PollCard key={poll._id} poll={poll} />)}
        </div>
      )}
    </div>
  );
}
