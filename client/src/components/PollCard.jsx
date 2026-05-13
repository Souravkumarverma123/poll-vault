import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import StatusBadge from './StatusBadge';
import { Users, Clock, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function PollCard({ poll }) {
  const navigate = useNavigate();
  const isClosed = poll.status === 'closed' || poll.status === 'published';
  let expiryDisplay = 'No expiry';
  if (poll.expiresAt) {
    const isPast = new Date(poll.expiresAt) < new Date();
    const distance = formatDistanceToNow(new Date(poll.expiresAt));
    if (isClosed) {
      expiryDisplay = isPast ? `Ended ${distance} ago` : 'Ended';
    } else {
      expiryDisplay = isPast ? `Ended ${distance} ago` : `Ends in ${distance}`;
    }
  } else if (isClosed) {
    expiryDisplay = 'Ended';
  }

  return (
    <Card
      className={`group flex flex-col h-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/40 bg-card/40 ${
        isClosed ? 'opacity-70 hover:opacity-100' : ''
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
      <CardContent className="pb-5 flex-1">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>{poll.responseCount || 0} response{(poll.responseCount || 0) === 1 ? '' : 's'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{expiryDisplay}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-4 pb-4 border-t border-border/40 mt-auto bg-muted/10">
        <div className="flex w-full items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {poll.responseMode === 'named'
              ? '👥 Named (Roll-Call)'
              : '🔒 Anonymous'}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
            View details
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
