// src/components/incident/TimelineTab.tsx
import { useState } from 'react';
import { Incident, TimelineEvent } from '@/lib/types';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { getUserCapabilities } from '@/config/routes.config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  FileText, 
  Users,
  HardDrive,
  Microscope,
  Shield,
  FileCheck,
  PartyPopper,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { logAudit } from '@/lib/auditLogger';

interface TimelineTabProps {
  incident: Incident;
}

const eventTypeConfig: Record<string, { icon: any; color: string; label: string }> = {
  detection: { icon: Search, color: 'bg-status-info', label: 'Detection' },
  report: { icon: FileText, color: 'bg-purple-500', label: 'Report' },
  assignment: { icon: Users, color: 'bg-status-medium', label: 'Assignment' },
  evidence: { icon: HardDrive, color: 'bg-cyan-500', label: 'Evidence Collection' },
  analysis: { icon: Microscope, color: 'bg-pink-500', label: 'Analysis' },
  containment: { icon: Shield, color: 'bg-status-high', label: 'Containment' },
  reporting: { icon: FileCheck, color: 'bg-teal-500', label: 'Reporting' },
  closure: { icon: PartyPopper, color: 'bg-status-low', label: 'Closure' },
};

export function TimelineTab({ incident }: TimelineTabProps) {
  const { updateIncident } = useData();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    event: '',
    type: 'detection' as TimelineEvent['type'],
    timestamp: new Date().toISOString().slice(0, 16),
  });

  const capabilities = user ? getUserCapabilities(user.role) : null;

  const sortedTimeline = [...incident.timeline].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const handleAddEvent = async () => {
    if (!newEvent.event || !user) {
      toast.error('Please provide event description');
      return;
    }

    try {
      const newTimelineEvent: TimelineEvent = {
        id: String(incident.timeline.length + 1),
        timestamp: new Date(newEvent.timestamp).toISOString(),
        event: newEvent.event,
        type: newEvent.type,
        user: user.name,
      };

      await updateIncident(incident.id, {
        timeline: [...incident.timeline, newTimelineEvent],
      });

      await logAudit({
        action: 'add_timeline_event',
        entity_type: 'incident',
        entity_id: incident.id,
        details: {
          event_type: newEvent.type,
          event_description: newEvent.event,
          added_by: user.name,
          role: user.role
        }
      });

      toast.success('Timeline event added');
      setNewEvent({
        event: '',
        type: 'detection',
        timestamp: new Date().toISOString().slice(0, 16),
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error adding timeline event:', error);
      toast.error('Failed to add timeline event');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Incident Timeline</h2>
          <p className="text-muted-foreground">Chronological record of all incident events</p>
        </div>
        {capabilities?.canEdit && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Timeline Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select 
                    value={newEvent.type} 
                    onValueChange={(v) => setNewEvent({ ...newEvent, type: v as TimelineEvent['type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(eventTypeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            <config.icon className="h-4 w-4" />
                            {config.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timestamp</Label>
                  <Input
                    type="datetime-local"
                    value={newEvent.timestamp}
                    onChange={(e) => setNewEvent({ ...newEvent, timestamp: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Event Description *</Label>
                  <Input
                    placeholder="Describe what happened..."
                    value={newEvent.event}
                    onChange={(e) => setNewEvent({ ...newEvent, event: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddEvent} className="w-full" disabled={!newEvent.event}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Timeline */}
      <div className="glass-card rounded-xl p-6">
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

          {/* Timeline Events */}
          <div className="space-y-6">
            {sortedTimeline.map((event, index) => {
              const config = eventTypeConfig[event.type] || eventTypeConfig.detection;
              const IconComponent = config.icon;

              return (
                <div key={event.id} className="relative flex gap-4 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                  {/* Icon */}
                  <div className={`relative z-10 w-12 h-12 rounded-full ${config.color} flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-muted mb-2">
                          {config.label}
                        </span>
                        <p className="font-medium">{event.event}</p>
                        {event.user && (
                          <p className="text-sm text-muted-foreground mt-1">by {event.user}</p>
                        )}
                      </div>
                      <time className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                        {new Date(event.timestamp).toLocaleString()}
                      </time>
                    </div>
                  </div>
                </div>
              );
            })}

            {sortedTimeline.length === 0 && (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No timeline events yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Timeline events will be automatically added as the investigation progresses
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}