import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/contexts/DataContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { TrendingUp, Clock, Shield, CheckCircle } from 'lucide-react';

const COLORS = ['hsl(var(--status-critical))', 'hsl(var(--status-high))', 'hsl(var(--status-medium))', 'hsl(var(--status-low))'];
const TYPE_COLORS = ['#3182ce', '#38a169', '#d69e2e', '#e53e3e', '#805ad5', '#ed8936'];

export default function Analytics() {
  const { incidents } = useData();

  // Calculate metrics
  const totalIncidents = incidents.length;
  const resolvedIncidents = incidents.filter(i => i.status === 'resolved' || i.status === 'closed').length;
  const activeIncidents = incidents.filter(i => !['resolved', 'closed'].includes(i.status)).length;
  const criticalIncidents = incidents.filter(i => i.priority === 'critical').length;

  // Incidents by priority
  const priorityData = [
    { name: 'Critical', value: incidents.filter(i => i.priority === 'critical').length },
    { name: 'High', value: incidents.filter(i => i.priority === 'high').length },
    { name: 'Medium', value: incidents.filter(i => i.priority === 'medium').length },
    { name: 'Low', value: incidents.filter(i => i.priority === 'low').length },
  ].filter(d => d.value > 0);

  // Incidents by type
  const typeData = incidents.reduce((acc, incident) => {
    const existing = acc.find(a => a.name === incident.type);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: incident.type, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Incidents by status
  const statusData = [
    { name: 'New', value: incidents.filter(i => i.status === 'new').length },
    { name: 'Triage', value: incidents.filter(i => i.status === 'triage').length },
    { name: 'Investigation', value: incidents.filter(i => i.status === 'investigation').length },
    { name: 'Contained', value: incidents.filter(i => i.status === 'contained').length },
    { name: 'Resolved', value: incidents.filter(i => i.status === 'resolved').length },
    { name: 'Closed', value: incidents.filter(i => i.status === 'closed').length },
  ].filter(d => d.value > 0);

  // Trend data (last 7 days)
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date()
  });

  const trendData = last7Days.map(day => {
    const dayStart = startOfDay(day);
    const count = incidents.filter(i => {
      const created = startOfDay(new Date(i.created_at));
      return created.getTime() === dayStart.getTime();
    }).length;
    return {
      date: format(day, 'MMM dd'),
      incidents: count
    };
  });



  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">Incident trends, metrics, and team performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalIncidents}</p>
                <p className="text-sm text-muted-foreground">Total Incidents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-status-critical/10">
                <Shield className="h-6 w-6 text-status-critical" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{criticalIncidents}</p>
                <p className="text-sm text-muted-foreground">Critical Incidents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-status-medium/10">
                <Clock className="h-6 w-6 text-status-medium" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{activeIncidents}</p>
                <p className="text-sm text-muted-foreground">Active Incidents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-status-low/10">
                <CheckCircle className="h-6 w-6 text-status-low" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{resolvedIncidents}</p>
                <p className="text-sm text-muted-foreground">Resolved Incidents</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Trends */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Incident Trends (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="incidents" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {priorityData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incidents by Type */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Incidents by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} width={120} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
