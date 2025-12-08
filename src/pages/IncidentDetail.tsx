import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBadge, PriorityBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Globe, 
  Server, 
  Database,
  FileText,
  Link as LinkIcon,
  AlertTriangle,
  Shield,
  CheckCircle,
  Download,
  Plus
} from 'lucide-react';
import { statusOptions, mockUsers } from '@/lib/mockData';
import { toast } from 'sonner';
import { EvidenceTab } from '@/components/incident/EvidenceTab';
import { TimelineTab } from '@/components/incident/TimelineTab';
import { ChainOfCustodyTab } from '@/components/incident/ChainOfCustodyTab';
import { NotesTab } from '@/components/incident/NotesTab';
import { IncidentStatus } from '@/lib/types';

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getIncident, updateIncident } = useData();
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const incident = getIncident(id || '');

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Shield className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Incident Not Found</h2>
        <p className="text-muted-foreground mb-4">The incident you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/incidents')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Incidents
        </Button>
      </div>
    );
  }

  const canEdit = hasRole(['first_responder', 'investigator', 'manager', 'admin']);
  const investigators = mockUsers.filter(u => ['investigator', 'first_responder'].includes(u.role));

  const handleStatusChange = (newStatus: IncidentStatus) => {
    updateIncident(incident.id, { status: newStatus });
    toast.success('Status updated', { description: `Incident status changed to ${newStatus}` });
  };

  const handleAssign = (userId: string) => {
    const assignee = mockUsers.find(u => u.id === parseInt(userId));
    if (assignee) {
      updateIncident(incident.id, { assigned_to: { id: assignee.id, name: assignee.name } });
      toast.success('Assigned', { description: `Incident assigned to ${assignee.name}` });
    }
  };

  const impactColors = {
    1: 'text-status-low',
    2: 'text-status-low',
    3: 'text-status-medium',
    4: 'text-status-high',
    5: 'text-status-critical',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/incidents')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-primary text-lg">{incident.id}</span>
            <PriorityBadge priority={incident.priority} />
            <StatusBadge status={incident.status} />
          </div>
          <h1 className="text-2xl font-bold">{incident.title}</h1>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Select value={incident.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="custody">Chain of Custody</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-semibold mb-3">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{incident.description}</p>
              </div>

              {/* Technical Details */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-semibold mb-4">Technical Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <Globe className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Target URL</p>
                      <p className="text-sm font-mono">{incident.technical_details.target_url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <LinkIcon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">IP Address</p>
                      <p className="text-sm font-mono">{incident.technical_details.ip_address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <Server className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Server OS</p>
                      <p className="text-sm">{incident.technical_details.server_os}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <Server className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Web Server</p>
                      <p className="text-sm">{incident.technical_details.web_server}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">CMS</p>
                      <p className="text-sm">{incident.technical_details.cms}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <Database className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Database</p>
                      <p className="text-sm">{incident.technical_details.database}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Impact Assessment */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-semibold mb-4">Impact Assessment</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Confidentiality</p>
                    <p className={`text-3xl font-bold ${impactColors[incident.impact_assessment.confidentiality as keyof typeof impactColors]}`}>
                      {incident.impact_assessment.confidentiality}/5
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Integrity</p>
                    <p className={`text-3xl font-bold ${impactColors[incident.impact_assessment.integrity as keyof typeof impactColors]}`}>
                      {incident.impact_assessment.integrity}/5
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Availability</p>
                    <p className={`text-3xl font-bold ${impactColors[incident.impact_assessment.availability as keyof typeof impactColors]}`}>
                      {incident.impact_assessment.availability}/5
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Business Impact</p>
                  <p className="text-sm">{incident.impact_assessment.business_impact}</p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Assignment */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-semibold mb-4">Assignment</h3>
                {canEdit ? (
                  <Select 
                    value={incident.assigned_to?.id.toString() || ''} 
                    onValueChange={handleAssign}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Assign to..." />
                    </SelectTrigger>
                    <SelectContent>
                      {investigators.map(inv => (
                        <SelectItem key={inv.id} value={inv.id.toString()}>
                          {inv.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{incident.assigned_to?.name || 'Unassigned'}</p>
                      <p className="text-xs text-muted-foreground">Investigator</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-semibold mb-4">Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-sm">{new Date(incident.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Last Updated</p>
                      <p className="text-sm">{new Date(incident.updated_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Reported By</p>
                      <p className="text-sm">{incident.reporter.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Type</p>
                      <p className="text-sm">{incident.type}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Regulatory */}
              {incident.regulatory_requirements.length > 0 && (
                <div className="glass-card rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Regulatory Requirements</h3>
                  <div className="flex flex-wrap gap-2">
                    {incident.regulatory_requirements.map(req => (
                      <span key={req} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Evidence Tab */}
        <TabsContent value="evidence">
          <EvidenceTab incidentId={incident.id} />
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <TimelineTab incident={incident} />
        </TabsContent>

        {/* Chain of Custody Tab */}
        <TabsContent value="custody">
          <ChainOfCustodyTab incidentId={incident.id} />
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <NotesTab incident={incident} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
