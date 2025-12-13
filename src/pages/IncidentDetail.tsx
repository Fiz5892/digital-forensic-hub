import { useState, useEffect } from 'react';
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
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { IncidentStatus } from '@/lib/types';
import { logAudit } from '@/lib/auditLogger';

// Mock data untuk investigator (sesuaikan dengan data real Anda)
const mockInvestigators = [
  { id: '1', name: 'John Investigator' },
  { id: '2', name: 'Jane Analyst' },
  { id: '3', name: 'Mike Responder' },
];

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'triage', label: 'Triage' },
  { value: 'investigation', label: 'Investigation' },
  { value: 'contained', label: 'Contained' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getIncident, updateIncident, getEvidenceForIncident } = useData();
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const incident = getIncident(id || '');
  const incidentEvidence = getEvidenceForIncident(id || '');

  // LOG AUDIT: View incident saat komponen dimount
  useEffect(() => {
    if (incident) {
      logAudit({
        action: 'view',
        entity_type: 'incident',
        entity_id: incident.id,
        details: {
          title: incident.title,
          status: incident.status,
          priority: incident.priority
        }
      });
    }
  }, [incident?.id]); // Hanya run ketika incident.id berubah

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

  const handleStatusChange = async (newStatus: IncidentStatus) => {
    try {
      await updateIncident(incident.id, { status: newStatus });
      
      toast.success('Status updated', { 
        description: `Incident status changed to ${newStatus}` 
      });
    } catch (error) {
      toast.error('Failed to update status');
      console.error('Error updating status:', error);
    }
  };

  const handleAssign = async (userId: string) => {
    try {
      const assignee = mockInvestigators.find(u => u.id === userId);
      if (assignee) {
        await updateIncident(incident.id, { 
          assigned_to: { id: assignee.id, name: assignee.name } 
        });
        
        // LOG AUDIT: Assign incident
        await logAudit({
          action: 'assign',
          entity_type: 'incident',
          entity_id: incident.id,
          details: {
            assigned_to_id: assignee.id,
            assigned_to_name: assignee.name,
            previous_assignee: incident.assigned_to?.name || 'Unassigned'
          }
        });
        
        toast.success('Assigned', { 
          description: `Incident assigned to ${assignee.name}` 
        });
      }
    } catch (error) {
      toast.error('Failed to assign incident');
      console.error('Error assigning incident:', error);
    }
  };

  const handleExportPDF = async () => {
    try {
      // Implementasi export PDF Anda di sini
      // downloadIncidentReport(incident, incidentEvidence);
      
      // LOG AUDIT: Export report
      await logAudit({
        action: 'export',
        entity_type: 'report',
        entity_id: incident.id,
        details: {
          format: 'pdf',
          incident_id: incident.id,
          incident_title: incident.title,
          evidence_count: incidentEvidence.length
        }
      });
      
      toast.success('PDF report generated', { 
        description: `${incident.id}-report.pdf downloaded` 
      });
    } catch (error) {
      toast.error('Failed to generate PDF report');
      console.error('Error generating PDF:', error);
    }
  };

  const impactColors = {
    1: 'text-green-600',
    2: 'text-green-500',
    3: 'text-yellow-500',
    4: 'text-orange-500',
    5: 'text-red-500',
  };

  return (
    <div className="space-y-6 p-6">
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
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleExportPDF}
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
          {canEdit && (
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
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="evidence">Evidence ({incidentEvidence.length})</TabsTrigger>
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
              <div className="bg-card rounded-xl border p-6">
                <h3 className="font-semibold mb-3">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {incident.description || 'No description provided'}
                </p>
              </div>

              {/* Technical Details */}
              {incident.technical_details && (
                <div className="bg-card rounded-xl border p-6">
                  <h3 className="font-semibold mb-4">Technical Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {incident.technical_details.target_url && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <Globe className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Target URL</p>
                          <p className="text-sm font-mono break-all">
                            {incident.technical_details.target_url}
                          </p>
                        </div>
                      </div>
                    )}
                    {incident.technical_details.ip_address && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <LinkIcon className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">IP Address</p>
                          <p className="text-sm font-mono">
                            {incident.technical_details.ip_address}
                          </p>
                        </div>
                      </div>
                    )}
                    {incident.technical_details.server_os && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <Server className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Server OS</p>
                          <p className="text-sm">{incident.technical_details.server_os}</p>
                        </div>
                      </div>
                    )}
                    {incident.technical_details.web_server && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <Server className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Web Server</p>
                          <p className="text-sm">{incident.technical_details.web_server}</p>
                        </div>
                      </div>
                    )}
                    {incident.technical_details.cms && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">CMS</p>
                          <p className="text-sm">{incident.technical_details.cms}</p>
                        </div>
                      </div>
                    )}
                    {incident.technical_details.database && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <Database className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Database</p>
                          <p className="text-sm">{incident.technical_details.database}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Impact Assessment */}
              {incident.impact_assessment && (
                <div className="bg-card rounded-xl border p-6">
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
                  {incident.impact_assessment.business_impact && (
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">Business Impact</p>
                      <p className="text-sm">{incident.impact_assessment.business_impact}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Assignment */}
              <div className="bg-card rounded-xl border p-6">
                <h3 className="font-semibold mb-4">Assignment</h3>
                {canEdit ? (
                  <Select 
                    value={incident.assigned_to?.id || ''} 
                    onValueChange={handleAssign}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Assign to..." />
                    </SelectTrigger>
                    <SelectContent>
                      {mockInvestigators.map(inv => (
                        <SelectItem key={inv.id} value={inv.id}>
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
                      <p className="font-medium">
                        {incident.assigned_to?.name || 'Unassigned'}
                      </p>
                      <p className="text-xs text-muted-foreground">Investigator</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="bg-card rounded-xl border p-6">
                <h3 className="font-semibold mb-4">Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-sm">
                        {new Date(incident.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Last Updated</p>
                      <p className="text-sm">
                        {new Date(incident.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Reported By</p>
                      <p className="text-sm">{incident.reporter.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {incident.reporter.email}
                      </p>
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
              {incident.regulatory_requirements && 
               incident.regulatory_requirements.length > 0 && (
                <div className="bg-card rounded-xl border p-6">
                  <h3 className="font-semibold mb-4">Regulatory Requirements</h3>
                  <div className="flex flex-wrap gap-2">
                    {incident.regulatory_requirements.map(req => (
                      <span 
                        key={req} 
                        className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                      >
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
          <div className="bg-card rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Evidence Items</h3>
            {incidentEvidence.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No evidence collected yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incidentEvidence.map(evidence => (
                  <div 
                    key={evidence.id}
                    className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{evidence.filename}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {evidence.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>ID: {evidence.id}</span>
                          <span>Type: {evidence.file_type}</span>
                          <span>Size: {(evidence.file_size / 1024).toFixed(2)} KB</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-1 rounded text-xs ${
                          evidence.analysis_status === 'analyzed' 
                            ? 'bg-green-100 text-green-700'
                            : evidence.analysis_status === 'analyzing'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {evidence.analysis_status}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          evidence.integrity_status === 'verified'
                            ? 'bg-green-100 text-green-700'
                            : evidence.integrity_status === 'tampered'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {evidence.integrity_status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <div className="bg-card rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Incident Timeline</h3>
            {(!incident.timeline || incident.timeline.length === 0) ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No timeline events recorded</p>
              </div>
            ) : (
              <div className="space-y-4">
                {incident.timeline.map((event: any, index: number) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      {index < incident.timeline.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Chain of Custody Tab */}
        <TabsContent value="custody">
          <div className="bg-card rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Chain of Custody</h3>
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Chain of custody information for all evidence items
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <div className="bg-card rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Investigation Notes</h3>
            {(!incident.notes || incident.notes.length === 0) ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No notes added yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {incident.notes.map((note: any, index: number) => (
                  <div key={index} className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium">{note.author || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(note.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}