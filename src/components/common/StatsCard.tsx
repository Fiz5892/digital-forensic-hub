import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'critical' | 'high' | 'medium' | 'low' | 'info';
  className?: string;
}

const variantStyles = {
  default: 'bg-card border-border',
  critical: 'bg-status-critical/10 border-status-critical/30',
  high: 'bg-status-high/10 border-status-high/30',
  medium: 'bg-status-medium/10 border-status-medium/30',
  low: 'bg-status-low/10 border-status-low/30',
  info: 'bg-status-info/10 border-status-info/30',
};

const iconVariantStyles = {
  default: 'bg-primary/10 text-primary',
  critical: 'bg-status-critical/20 text-status-critical',
  high: 'bg-status-high/20 text-status-high',
  medium: 'bg-status-medium/20 text-status-medium',
  low: 'bg-status-low/20 text-status-low',
  info: 'bg-status-info/20 text-status-info',
};

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  variant = 'default',
  className 
}: StatsCardProps) {
  return (
    <div className={cn(
      "rounded-xl border p-6 transition-all hover:shadow-lg hover:-translate-y-0.5",
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "mt-2 text-xs font-medium flex items-center gap-1",
              trend.isPositive ? "text-status-low" : "text-status-critical"
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}% from last period</span>
            </div>
          )}
        </div>
        <div className={cn(
          "rounded-lg p-3",
          iconVariantStyles[variant]
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
