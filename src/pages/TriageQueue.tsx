import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { StatusBadge, PriorityBadge } from '@/components/common/StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Clock, AlertTriangle, CheckCircle, UserPlus, StickyNote, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { logAudit } from '@/lib/auditLogger';

export default function TriageQueue() {
  const navigate = useNavigate();
  const { incidents, updateIncident, users } = useData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('new');
  
  // Quick Action Dialog States
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [showQuickActionDialog, setShowQuickActionDialog] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [assignTo, setAssignTo] = useState('');

  // Filter incidents by status
  const newIncidents = incidents.filter(i => i.status === 'new');
  const triageIncidents = incidents.filter(i => i.status === 'triage');
  const investigationIncidents = incidents.filter(i => i.status === 'investigation');

  // Get investigators for assignment
  const investigators = users.filter(u => u.role === 'investigator');

  // Calculate SLA metrics
  const calculateSLA = (createdAt: string, priority: string) => {
    const now = Date.now();
    const created = new Date(createdAt).getTime();
    const elapsedMinutes = Math.floor((now - created) / (1000 * 60));
    
    // SLA targets (in minutes)
    const slaTargets = {
      critical: 30,
      high: 120,
      medium: 480,
      low: 1440
    };
    
    const target = slaTargets[priority as keyof typeof slaTargets] || 1440;
    const remaining = target - elapsedMinutes;
    const percentage = Math.max(0, Math.min(100, (remaining / target) * 100));
    
    return {
      elapsed: elapsedMinutes,
      target,
      remaining,
      percentage,
      breached: remaining <= 0
    };
  };

  // Quick Triage Action
  const handleQuickTriage = (incident: any) => {
    setSelectedIncident(incident);
    setQuickNote('');
    setAssignTo('');
    setShowQuickActionDialog(true);
  };

  const handleQuickActionSubmit = async () => {
    if (!selectedIncident) return;

    try {
      const updates: any = {
        status: 'triage',
      };

      // Add initial note if provided
      if (quickNote.trim()) {
        const newNote = {
          id: `note-${Date.now()}`,
          author: { id: user?.id || '', name: user?.name || '' },
          content: quickNote,
          created_at: new Date().toISOString(),
          category: 'initial_assessment'
        };
        updates.notes = [...(selectedIncident.notes || []), newNote];
      }

      // Assign if selected
      if (assignTo) {
        const investigator = investigators.find(i => i.id === assignTo);
        if (investigator) {
          updates.assigned_to = {
            id: investigator.id,
            name: investigator.name
          };
        }
      }

      await updateIncident(selectedIncident.id, updates);

      await logAudit({
        action: 'quick_triage',
        entity_type: 'incident',
        entity_id: selectedIncident.id,
        details: {
          status_changed: 'new -> triage',
          note_added: !!quickNote,
          assigned_to: assignTo || null,
          performed_by: user?.name
        }
      });

      toast.success('Incident triaged successfully', {
        description: assignTo 
          ? `Assigned to ${investigators.find(i => i.id === assignTo)?.name}`
          : 'Status updated to Triage'
      });

      setShowQuickActionDialog(false);
      setSelectedIncident(null);
    } catch (error) {
      toast.error('Failed to triage incident');
      console.error('Quick triage error:', error);
    }
  };

  const renderIncidentCard = (incident: any) => {
    const sla = calculateSLA(incident.created_at, incident.priority);
    
    return (
      <div
        key={incident.id}
        className="bg-card rounded-xl border p-5 hover:shadow-lg transition-all"
      >
        {/* SLA Indicator */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">SLA Compliance</span>
            <span className={sla.breached ? 'text-red-500 font-semibold' : 'text-green-600'}>
              {sla.breached ? 'BREACHED' : `${sla.remaining}m remaining`}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                sla.percentage > 50 ? 'bg-green-500' :
                sla.percentage > 20 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${sla.percentage}%` }}
            />
          </div>
        </div>

        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span 
              className="font-mono text-sm text-primary font-semibold cursor-pointer hover:underline"
              onClick={() => navigate(`/incidents/${incident.id}`)}
            >
              {incident.id}
            </span>
            <PriorityBadge priority={incident.priority} />
            <StatusBadge status={incident.status} />
          </div>
          <div className="text-xs text-muted-foreground">
            {sla.elapsed} min ago
          </div>
        </div>

        <h3 
          className="text-lg font-semibold mb-2 cursor-pointer hover:text-primary"
          onClick={() => navigate(`/incidents/${incident.id}`)}
        >
          {incident.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {incident.description}
        </p>

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{incident.type}</span>
            <span>•</span>
            <span>Reporter: {incident.reporter?.name}</span>
          </div>
          
          {incident.status === 'new' ? (
            <Button 
              size="sm" 
              onClick={() => handleQuickTriage(incident)}
              className="gap-2"
            >
              <UserPlus className="h-3 w-3" />
              Quick Triage
            </Button>
          ) : incident.assigned_to ? (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              Assigned to {incident.assigned_to.name}
            </span>
          ) : (
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
              Unassigned
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Triage Queue</h1>
        <p className="text-muted-foreground mt-1">
          Manage incoming incidents and assign to investigators
        </p>
      </div>

      {/* Stats Cards with SLA Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">New Incidents</p>
              <p className="text-3xl font-bold text-red-500">{newIncidents.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {newIncidents.filter(i => calculateSLA(i.created_at, i.priority).breached).length} SLA breached
              </p>
            </div>
            <Bell className="h-10 w-10 text-red-500 opacity-20" />
          </div>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Triage</p>
              <p className="text-3xl font-bold text-yellow-500">{triageIncidents.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {triageIncidents.filter(i => !i.assigned_to).length} unassigned
              </p>
            </div>
            <Clock className="h-10 w-10 text-yellow-500 opacity-20" />
          </div>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Under Investigation</p>
              <p className="text-3xl font-bold text-blue-500">{investigationIncidents.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {investigationIncidents.filter(i => i.assigned_to).length} assigned
              </p>
            </div>
            <AlertTriangle className="h-10 w-10 text-blue-500 opacity-20" />
          </div>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
              <p className="text-3xl font-bold text-green-500">
                {Math.floor(
                  triageIncidents.reduce((acc, i) => 
                    acc + calculateSLA(i.created_at, i.priority).elapsed, 0
                  ) / (triageIncidents.length || 1)
                )}m
              </p>
              <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
            </div>
            <Clock className="h-10 w-10 text-green-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="new" className="gap-2">
            <Bell className="h-4 w-4" />
            New ({newIncidents.length})
          </TabsTrigger>
          <TabsTrigger value="triage" className="gap-2">
            <Clock className="h-4 w-4" />
            Triage ({triageIncidents.length})
          </TabsTrigger>
          <TabsTrigger value="investigation" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Investigation ({investigationIncidents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-3">
          {newIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-card rounded-xl border">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
              <p className="text-muted-foreground">No new incidents awaiting triage</p>
            </div>
          ) : (
            newIncidents.map(renderIncidentCard)
          )}
        </TabsContent>

        <TabsContent value="triage" className="space-y-3">
          {triageIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-card rounded-xl border">
              <Clock className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No incidents in triage</p>
            </div>
          ) : (
            triageIncidents.map(renderIncidentCard)
          )}
        </TabsContent>

        <TabsContent value="investigation" className="space-y-3">
          {investigationIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-card rounded-xl border">
              <AlertTriangle className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No incidents under investigation</p>
            </div>
          ) : (
            investigationIncidents.map(renderIncidentCard)
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Triage Dialog */}
      <Dialog open={showQuickActionDialog} onOpenChange={setShowQuickActionDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Quick Triage - {selectedIncident?.id}</DialogTitle>
            <DialogDescription>
              Add initial assessment notes and assign to an investigator
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Initial Notes */}
            <div className="space-y-2">
              <Label htmlFor="quick-note">
                <StickyNote className="h-4 w-4 inline mr-2" />
                Initial Assessment Notes
              </Label>
              <Textarea
                id="quick-note"
                placeholder="Document your initial findings, observations, or recommendations..."
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                rows={4}
              />
            </div>

            {/* Assign To */}
            <div className="space-y-2">
              <Label htmlFor="assign-to">
                <UserPlus className="h-4 w-4 inline mr-2" />
                Assign to Investigator (Optional)
              </Label>
              <Select value={assignTo} onValueChange={setAssignTo}>
                <SelectTrigger id="assign-to">
                  <SelectValue placeholder="Select investigator..." />
                </SelectTrigger>
                <SelectContent>
                  {investigators.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No investigators available
                    </div>
                  ) : (
                    investigators.map(investigator => (
                      <SelectItem key={investigator.id} value={investigator.id}>
                        {investigator.name} - {investigator.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              <strong>Note:</strong> This will move the incident to "Triage" status. 
              You can add evidence and more details in the incident detail page.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuickActionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleQuickActionSubmit}>
              Triage Incident
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}