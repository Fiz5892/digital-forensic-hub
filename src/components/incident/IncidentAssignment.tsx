import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { logAudit } from '@/lib/auditLogger';
import { Incident } from '@/lib/types';

interface IncidentAssignmentProps {
  incident: Incident;
  onSuccess?: () => void;
}

export default function IncidentAssignment({ incident, onSuccess }: IncidentAssignmentProps) {
  const { users, updateIncident } = useData();
  const { user: currentUser } = useAuth();
  const { notifyIncidentCreated } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Filter users yang bisa di-assign (investigators and first responders)
  const assignableUsers = users.filter(u => 
    ['investigator', 'first_responder', 'manager'].includes(u.role) && u.is_active
  );

  const handleAssign = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user to assign');
      return;
    }

    const selectedUser = users.find(u => u.id === selectedUserId);
    if (!selectedUser) {
      toast.error('Selected user not found');
      return;
    }

    setIsAssigning(true);

    try {
      // Update incident with assigned user
      const updatedIncident: Incident = {
        ...incident,
        assigned_to: {
          id: selectedUser.id,
          name: selectedUser.name,
          email: selectedUser.email,
        },
        updated_at: new Date().toISOString(),
        // Update status if still 'new'
        status: incident.status === 'new' ? 'triage' : incident.status,
        timeline: [
          ...incident.timeline,
          {
            timestamp: new Date().toISOString(),
            title: 'Incident Assigned',
            description: `Assigned to ${selectedUser.name} by ${currentUser?.name}`,
            user: currentUser?.name || 'System',
          }
        ]
      };

      // Save to database
      await updateIncident(updatedIncident);

      // Send notification to assigned user
      await notifyIncidentCreated(
        incident.id,
        incident.title,
        selectedUser.email,
        false // Show toast for this important action
      );

      // Log audit trail
      await logAudit({
        action: 'update',
        entity_type: 'incident',
        entity_id: incident.id,
        details: {
          action: 'assign_incident',
          assigned_to: selectedUser.email,
          assigned_by: currentUser?.email,
          previous_assignee: incident.assigned_to?.email || 'unassigned',
          new_status: updatedIncident.status,
        },
      });

      toast.success('Incident assigned successfully', {
        description: `${selectedUser.name} has been notified via email`
      });

      setIsOpen(false);
      setSelectedUserId('');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error assigning incident:', error);
      
      // Log failed attempt
      await logAudit({
        action: 'update',
        entity_type: 'incident',
        entity_id: incident.id,
        details: {
          action: 'assign_incident_failed',
          error: 'Failed to assign incident',
          attempted_assignee: selectedUser?.email,
          attempted_by: currentUser?.email,
        },
      });

      toast.error('Failed to assign incident', {
        description: 'Please try again or contact support'
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="h-4 w-4" />
          {incident.assigned_to ? 'Reassign' : 'Assign Incident'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Incident</DialogTitle>
          <DialogDescription>
            Select a user to assign this incident to. They will receive a notification via email and in-app.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Investigator</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent>
                {assignableUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <span>{user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({user.role})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {incident.assigned_to && (
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="text-muted-foreground">Currently assigned to:</p>
              <p className="font-medium">{incident.assigned_to.name}</p>
              <p className="text-xs text-muted-foreground">{incident.assigned_to.email}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isAssigning}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedUserId || isAssigning}
            className="gap-2"
          >
            {isAssigning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Assign & Notify
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}