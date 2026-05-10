import { Badge } from '@/components/ui/badge';

const statusConfig = {
  active: { label: 'Active', variant: 'default', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10' },
  closed: { label: 'Closed', variant: 'destructive', className: 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/10' },
  published: { label: 'Published', variant: 'secondary', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/10' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.active;
  return (
    <Badge variant="outline" className={config.className}>
      <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
        status === 'active' ? 'bg-emerald-500 animate-pulse' :
        status === 'closed' ? 'bg-red-500' : 'bg-blue-500'
      }`} />
      {config.label}
    </Badge>
  );
}
