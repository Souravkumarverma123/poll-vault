import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMyPolls } from '@/api/polls';
import PollCard from '@/components/PollCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, BarChart3, AlertCircle, Search, RefreshCw, FileText, Users, Zap } from 'lucide-react';

export default function Dashboard() {
  const [polls, setPolls] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [activeStat, setActiveStat] = useState(null);

  const fetchPolls = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMyPolls({ page, limit: 12, search, sort, status: statusFilter });
      setPolls(res.data.data.polls);
      setPagination(res.data.data.pagination);
      if (res.data.data.summaryStats) setSummaryStats(res.data.data.summaryStats);
    } catch {
      setError('Failed to load polls. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, search, sort, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchPolls, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [fetchPolls]); // eslint-disable-line react-hooks/exhaustive-deps — search is captured via fetchPolls

  // Handlers for filters that should reset to page 1
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };
  
  const handleStatusFilterChange = (val) => {
    setStatusFilter(val);
    setPage(1);
  };
  
  const handleSortChange = (val) => {
    setSort(val);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold">My Polls</h1>
        <p className="text-muted-foreground mt-1">Manage and monitor all your polls</p>
      </div>

      {/* Summary Stats */}
      {summaryStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: FileText, label: summaryStats.totalPolls === 1 ? 'Total Poll' : 'Total Polls',     value: summaryStats.totalPolls },
            { icon: Zap,      label: summaryStats.activePolls === 1 ? 'Active Poll' : 'Active Polls',    value: summaryStats.activePolls },
            { icon: Users,    label: summaryStats.totalResponses === 1 ? 'Total Response' : 'Total Responses', value: summaryStats.totalResponses },
          ].map(({ icon: Icon, label, value }) => {
            const highlight = activeStat === label;
            return (
            <div
              key={label}
              onClick={() => setActiveStat(label)}
              className={`group flex items-center gap-5 rounded-2xl border p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${
                highlight ? 'border-primary/40 bg-primary/5 shadow-[0_0_30px_rgba(99,102,241,0.1)] hover:border-primary/60 hover:bg-primary/10' : 'bg-card/50 border-border/50 hover:border-border hover:bg-card'
              }`}
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl transition-colors duration-300 ${
                highlight ? 'bg-primary/20 text-primary' : 'bg-muted/50 text-muted-foreground group-hover:text-foreground group-hover:bg-muted'
              }`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className={`text-3xl font-heading font-bold tracking-tight ${highlight ? 'text-primary' : ''}`}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search polls..."
            value={search}
            onChange={handleSearchChange}
            className="pl-9 bg-card/50 border-border/50 focus-visible:ring-primary/50 transition-colors hover:bg-card"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-40 bg-card/50 border-border/50 transition-colors hover:bg-card focus:ring-primary/50">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full sm:w-40 bg-card/50 border-border/50 transition-colors hover:bg-card focus:ring-primary/50">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="expiring">Expiring Soon</SelectItem>
            <SelectItem value="title">A → Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={fetchPolls}>
              <RefreshCw className="mr-1 h-3 w-3" />Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Polls Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-3 rounded-xl border p-6">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : polls.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">
            {search || statusFilter ? 'No polls match your filters' : 'No polls yet'}
          </h2>
          <p className="mt-2 max-w-md text-muted-foreground">
            {search || statusFilter
              ? 'Try clearing your filters or search query.'
              : 'Create your first poll to start collecting responses and viewing real-time analytics.'}
          </p>
          {!search && !statusFilter && (
            <Button className="mt-6" asChild>
              <Link to="/polls/create"><Plus className="mr-2 h-4 w-4" />Create Your First Poll</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {polls.map((poll) => <PollCard key={poll._id} poll={poll} />)}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <p className="text-sm text-muted-foreground">
                Showing {polls.length} of {pagination.total} polls
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >Previous</Button>
                <span className="flex items-center px-3 text-sm text-muted-foreground">
                  {page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline" size="sm"
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                >Next</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
