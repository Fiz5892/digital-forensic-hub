// components/common/StatusBadge.tsx
import { Badge } from '@/components/ui/badge';
import { IncidentStatus, IncidentPriority } from '@/lib/types';

interface StatusBadgeProps {
  status: IncidentStatus;
}

interface PriorityBadgeProps {
  priority: IncidentPriority;
}

const statusConfig = {
  new: {
    label: 'New',
    className: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200',
  },
  triage: {
    label: 'Triage',
    className: 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200',
  },
  investigation: {
    label: 'Investigation',
    className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200',
  },
  contained: {
    label: 'Contained',
    className: 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200',
  },
  resolved: {
    label: 'Resolved',
    className: 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200',
  },
  closed: {
    label: 'Closed',
    className: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200',
  },
};

const priorityConfig = {
  low: {
    label: 'Low',
    className: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200',
  },
  medium: {
    label: 'Medium',
    className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200',
  },
  high: {
    label: 'High',
    className: 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200',
  },
  critical: {
    label: 'Critical',
    className: 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.new;
  
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority] || priorityConfig.medium;
  
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}