import { cn } from '@/lib/utils';
import { IncidentStatus, IncidentPriority } from '@/lib/types';

interface StatusBadgeProps {
  status: IncidentStatus;
  className?: string;
}

const statusConfig: Record<IncidentStatus, { label: string; className: string }> = {
  new: { label: 'New', className: 'bg-status-info/20 text-status-info border-status-info/30' },
  triage: { label: 'Triage', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  investigation: { label: 'Investigation', className: 'bg-status-medium/20 text-status-medium border-status-medium/30' },
  contained: { label: 'Contained', className: 'bg-status-high/20 text-status-high border-status-high/30' },
  resolved: { label: 'Resolved', className: 'bg-status-low/20 text-status-low border-status-low/30' },
  closed: { label: 'Closed', className: 'bg-muted text-muted-foreground border-border' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: IncidentPriority;
  className?: string;
}

const priorityConfig: Record<IncidentPriority, { label: string; className: string; icon: string }> = {
  critical: { label: 'Critical', className: 'bg-status-critical/20 text-status-critical border-status-critical/30', icon: '🔴' },
  high: { label: 'High', className: 'bg-status-high/20 text-status-high border-status-high/30', icon: '🟠' },
  medium: { label: 'Medium', className: 'bg-status-medium/20 text-status-medium border-status-medium/30', icon: '🟡' },
  low: { label: 'Low', className: 'bg-status-low/20 text-status-low border-status-low/30', icon: '🟢' },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border",
      config.className,
      className
    )}>
      <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'currentColor' }} />
      {config.label}
    </span>
  );
}
