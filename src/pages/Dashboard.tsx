import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { StatsCard } from '@/components/common/StatsCard';
import { StatusBadge, PriorityBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  FileText, 
  Clock, 
  CheckCircle, 
  Plus,
  ArrowRight,
  Shield,
  Activity,
  Users,
  TrendingUp
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { incidents } = useData();
  const navigate = useNavigate();

  const stats = {
    total: incidents.length,
    critical: incidents.filter(i => i.priority === 'critical' && i.status !== 'closed').length,
    high: incidents.filter(i => i.priority === 'high' && i.status !== 'closed').length,
    new: incidents.filter(i => i.status === 'new').length,
    inProgress: incidents.filter(i => ['triage', 'investigation', 'contained'].includes(i.status)).length,
    resolved: incidents.filter(i => i.status === 'resolved' || i.status === 'closed').length,
  };

  const myIncidents = user?.role === 'reporter' 
    ? incidents.filter(i => i.reporter.email === user.email)
    : user?.role === 'investigator'
    ? incidents.filter(i => i.assigned_to?.name === user.name)
    : incidents;

  const recentIncidents = [...incidents]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass-card rounded-xl p-6 bg-gradient-to-r from-primary/10 via-transparent to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {user?.name.split(' ')[0]}
            </h1>
            <p className="text-muted-foreground mt-1">
              {user?.role === 'reporter' 
                ? 'Report and track your security incidents'
                : user?.role === 'first_responder'
                ? 'Triage and respond to incoming incidents'
                : user?.role === 'investigator'
                ? 'Investigate assigned cases and collect evidence'
                : 'Monitor and manage all security incidents'}
            </p>
          </div>
          <Button onClick={() => navigate('/report')} className="gap-2">
            <Plus className="h-4 w-4" />
            Report Incident
          </Button>
        </div>
      </div>

      {/* Alert Panel for Critical/High */}
      {(stats.critical > 0 || stats.high > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.critical > 0 && (
            <div className="glass-card rounded-xl p-4 border-l-4 border-status-critical bg-status-critical/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-status-critical/20">
                  <AlertTriangle className="h-5 w-5 text-status-critical" />
                </div>
                <div>
                  <p className="font-semibold text-status-critical">{stats.critical} Critical Incidents</p>
                  <p className="text-sm text-muted-foreground">Require immediate attention</p>
                </div>
              </div>
            </div>
          )}
          {stats.high > 0 && (
            <div className="glass-card rounded-xl p-4 border-l-4 border-status-high bg-status-high/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-status-high/20">
                  <AlertTriangle className="h-5 w-5 text-status-high" />
                </div>
                <div>
                  <p className="font-semibold text-status-high">{stats.high} High Priority</p>
                  <p className="text-sm text-muted-foreground">Major functionality affected</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Incidents"
          value={stats.total}
          subtitle="All time"
          icon={Shield}
          variant="info"
        />
        <StatsCard
          title="New / Awaiting Triage"
          value={stats.new}
          subtitle="Needs attention"
          icon={FileText}
          variant={stats.new > 0 ? 'high' : 'default'}
        />
        <StatsCard
          title="In Progress"
          value={stats.inProgress}
          subtitle="Under investigation"
          icon={Clock}
          variant="medium"
        />
        <StatsCard
          title="Resolved"
          value={stats.resolved}
          subtitle="Successfully closed"
          icon={CheckCircle}
          variant="low"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Incidents */}
        <div className="lg:col-span-2 glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Incidents</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/incidents')} className="gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {recentIncidents.map((incident) => (
              <div 
                key={incident.id}
                onClick={() => navigate(`/incidents/${incident.id}`)}
                className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono text-primary">{incident.id}</span>
                    <PriorityBadge priority={incident.priority} />
                  </div>
                  <p className="font-medium truncate">{incident.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {incident.type} • {new Date(incident.created_at).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={incident.status} />
              </div>
            ))}
            {recentIncidents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No incidents yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / My Cases */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => navigate('/report')}
              >
                <Plus className="h-4 w-4" />
                Report New Incident
              </Button>
              {user?.role !== 'reporter' && (
                <>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => navigate('/incidents')}
                  >
                    <FileText className="h-4 w-4" />
                    View All Incidents
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => navigate('/tools')}
                  >
                    <Activity className="h-4 w-4" />
                    Forensic Tools
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* My Assigned Cases */}
          {user?.role === 'investigator' && (
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">My Cases</h2>
              <div className="space-y-3">
                {myIncidents.filter(i => i.status !== 'closed').slice(0, 3).map((incident) => (
                  <div 
                    key={incident.id}
                    onClick={() => navigate(`/incidents/${incident.id}`)}
                    className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-mono text-primary">{incident.id}</span>
                      <StatusBadge status={incident.status} />
                    </div>
                    <p className="text-sm font-medium truncate">{incident.title}</p>
                  </div>
                ))}
                {myIncidents.filter(i => i.status !== 'closed').length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No active cases assigned</p>
                )}
              </div>
            </div>
          )}

          {/* System Status */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">System Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="flex items-center gap-2 text-sm text-status-low">
                  <span className="w-2 h-2 rounded-full bg-status-low animate-pulse" />
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Users</span>
                <span className="text-sm font-medium">5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Storage Used</span>
                <span className="text-sm font-medium">45 GB / 100 GB</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
