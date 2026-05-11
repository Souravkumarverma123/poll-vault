import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import StatusBadge from './StatusBadge';
import { Users, Clock, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function PollCard({ poll }) {
  const navigate = useNavigate();
  const isClosed = poll.status === 'closed' || poll.status === 'published';
  const expiryText = poll.expiresAt
    ? formatDistanceToNow(new Date(poll.expiresAt), { addSuffix: true })
    : 'No expiry';

  return (
    <Card
      className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 ${
        isClosed ? 'opacity-65 hover:opacity-90' : ''
      }`}
      onClick={() => navigate(`/polls/${poll._id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {poll.title}
          </h3>
          <StatusBadge status={poll.status} />
        </div>
        {poll.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {poll.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>{poll.responseCount || 0} responses</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>
              {poll.status === 'closed' || poll.status === 'published'
                ? `Expired ${expiryText}`
                : `Expires ${expiryText}`}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="flex w-full items-center justify-between">
          <span className="text-xs text-muted-foreground capitalize">
            {poll.responseMode} mode
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
            View details
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
