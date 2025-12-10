import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  Download, 
  Filter,
  Clock,
  User,
  FileText,
  Shield,
  Eye,
  Edit,
  Trash2,
  Plus,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: unknown;
  ip_address: string | null;
  created_at: string;
}

const actionIcons: Record<string, React.ReactNode> = {
  create: <Plus className="h-4 w-4 text-status-success" />,
  view: <Eye className="h-4 w-4 text-primary" />,
  update: <Edit className="h-4 w-4 text-status-warning" />,
  delete: <Trash2 className="h-4 w-4 text-destructive" />,
  login: <User className="h-4 w-4 text-status-success" />,
  logout: <User className="h-4 w-4 text-muted-foreground" />,
};

const actionColors: Record<string, string> = {
  create: 'bg-status-success/10 text-status-success border-status-success/20',
  view: 'bg-primary/10 text-primary border-primary/20',
  update: 'bg-status-warning/10 text-status-warning border-status-warning/20',
  delete: 'bg-destructive/10 text-destructive border-destructive/20',
  login: 'bg-status-success/10 text-status-success border-status-success/20',
  logout: 'bg-muted text-muted-foreground border-muted',
};

// Mock audit logs for demo
const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    user_id: '1',
    user_email: 'admin@dfir.com',
    action: 'login',
    entity_type: 'session',
    entity_id: null,
    details: { method: 'email' },
    ip_address: '192.168.1.100',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    user_id: '3',
    user_email: 'investigator@dfir.com',
    action: 'create',
    entity_type: 'incident',
    entity_id: 'INC-2024-003',
    details: { title: 'New SQL Injection Detected' },
    ip_address: '192.168.1.105',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    user_id: '3',
    user_email: 'investigator@dfir.com',
    action: 'update',
    entity_type: 'evidence',
    entity_id: 'EVD-2024-001-01',
    details: { field: 'status', old: 'pending', new: 'analyzing' },
    ip_address: '192.168.1.105',
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '4',
    user_id: '4',
    user_email: 'manager@dfir.com',
    action: 'view',
    entity_type: 'report',
    entity_id: 'RPT-2024-001',
    details: { format: 'pdf' },
    ip_address: '192.168.1.110',
    created_at: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: '5',
    user_id: '2',
    user_email: 'responder@dfir.com',
    action: 'update',
    entity_type: 'incident',
    entity_id: 'INC-2024-001',
    details: { field: 'status', old: 'new', new: 'investigation' },
    ip_address: '192.168.1.102',
    created_at: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: '6',
    user_id: '5',
    user_email: 'reporter@dfir.com',
    action: 'create',
    entity_type: 'incident',
    entity_id: 'INC-2024-002',
    details: { title: 'Website Defacement Detected' },
    ip_address: '192.168.1.120',
    created_at: new Date(Date.now() - 18000000).toISOString(),
  },
  {
    id: '7',
    user_id: '1',
    user_email: 'admin@dfir.com',
    action: 'delete',
    entity_type: 'user',
    entity_id: 'USR-007',
    details: { reason: 'Account deactivated' },
    ip_address: '192.168.1.100',
    created_at: new Date(Date.now() - 21600000).toISOString(),
  },
  {
    id: '8',
    user_id: '3',
    user_email: 'investigator@dfir.com',
    action: 'create',
    entity_type: 'evidence',
    entity_id: 'EVD-2024-002-01',
    details: { filename: 'access.log', size: '2.5MB' },
    ip_address: '192.168.1.105',
    created_at: new Date(Date.now() - 25200000).toISOString(),
  },
];

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      // Try to fetch from Supabase first
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) {
        console.log('Using mock data:', error.message);
        setLogs(mockAuditLogs);
      } else if (data && data.length > 0) {
        setLogs(data as AuditLog[]);
      } else {
        setLogs(mockAuditLogs);
      }
    } catch (err) {
      console.log('Using mock data');
      setLogs(mockAuditLogs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;
    
    return matchesSearch && matchesAction && matchesEntity;
  });

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'Details'].join(','),
      ...filteredLogs.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.user_email || 'System',
        log.action,
        log.entity_type,
        log.entity_id || '-',
        log.ip_address || '-',
        JSON.stringify(log.details || {})
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Audit logs exported successfully');
  };

  const uniqueActions = [...new Set(logs.map(l => l.action))];
  const uniqueEntities = [...new Set(logs.map(l => l.entity_type))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">Track all system activities and user actions</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchLogs} disabled={isLoading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportLogs} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{logs.length}</p>
                <p className="text-sm text-muted-foreground">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-status-success/10">
                <Plus className="h-6 w-6 text-status-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {logs.filter(l => l.action === 'create').length}
                </p>
                <p className="text-sm text-muted-foreground">Creates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-status-warning/10">
                <Edit className="h-6 w-6 text-status-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {logs.filter(l => l.action === 'update').length}
                </p>
                <p className="text-sm text-muted-foreground">Updates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-destructive/10">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {logs.filter(l => l.action === 'delete').length}
                </p>
                <p className="text-sm text-muted-foreground">Deletes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, entity ID, or action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {uniqueEntities.map(entity => (
                  <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-foreground">{log.user_email || 'System'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`gap-1 ${actionColors[log.action] || 'bg-muted'}`}
                    >
                      {actionIcons[log.action]}
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-foreground capitalize">{log.entity_type}</p>
                      {log.entity_id && (
                        <p className="text-xs text-muted-foreground font-mono">{log.entity_id}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.details && (
                      <code className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                        {JSON.stringify(log.details).slice(0, 50)}
                        {JSON.stringify(log.details).length > 50 ? '...' : ''}
                      </code>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {log.ip_address || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No audit logs found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
