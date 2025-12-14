// src/components/incident/NotesTab.tsx
import { useState } from 'react';
import { Incident, IncidentNote } from '@/lib/types';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { getUserCapabilities } from '@/config/routes.config';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Lightbulb, 
  CheckCircle, 
  HelpCircle,
  AlertTriangle,
  MessageSquare,
  Eye,
  ClipboardCheck,
  FileCheck,
  TrendingUp,
  Shield,
  CheckCircle2,
  Microscope,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { logAudit } from '@/lib/auditLogger';

interface NotesTabProps {
  incident: Incident;
}

// Extended category configuration for all roles
const categoryConfig: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
  // First Responder categories
  triage_note: { 
    icon: ClipboardCheck, 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-50',
    label: 'Triage Note' 
  },
  initial_observation: { 
    icon: Eye, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-50',
    label: 'Initial Observation' 
  },
  
  // Investigator categories
  hypothesis: { 
    icon: Lightbulb, 
    color: 'text-yellow-600', 
    bgColor: 'bg-yellow-50',
    label: 'Hypothesis' 
  },
  finding: { 
    icon: CheckCircle, 
    color: 'text-green-600', 
    bgColor: 'bg-green-50',
    label: 'Finding' 
  },
  action_item: { 
    icon: AlertTriangle, 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-50',
    label: 'Action Item' 
  },
  question: { 
    icon: HelpCircle, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-50',
    label: 'Question' 
  },
  technical_analysis: { 
    icon: Microscope, 
    color: 'text-indigo-600', 
    bgColor: 'bg-indigo-50',
    label: 'Technical Analysis' 
  },
  
  // Manager categories
  management_review: { 
    icon: FileCheck, 
    color: 'text-slate-600', 
    bgColor: 'bg-slate-50',
    label: 'Management Review' 
  },
  escalation: { 
    icon: TrendingUp, 
    color: 'text-red-600', 
    bgColor: 'bg-red-50',
    label: 'Escalation' 
  },
  approval: { 
    icon: Shield, 
    color: 'text-green-700', 
    bgColor: 'bg-green-50',
    label: 'Approval' 
  },
  closure_note: { 
    icon: CheckCircle2, 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-50',
    label: 'Closure Note' 
  },

  // Admin categories
  system_note: {
    icon: Shield,
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    label: 'System Note'
  },
  audit_note: {
    icon: FileCheck,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    label: 'Audit Note'
  },
  admin_action: {
    icon: Shield,
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    label: 'Admin Action'
  }
};

export function NotesTab({ incident }: NotesTabProps) {
  const { updateIncident } = useData();
  const { user } = useAuth();
  const [newNote, setNewNote] = useState({
    content: '',
    category: '' as IncidentNote['category'] | '',
  });
  const [filter, setFilter] = useState<string>('all');

  // Get role capabilities
  const capabilities = user ? getUserCapabilities(user.role) : null;

  // ❌ PERMISSION CHECK - Block unauthorized users
  if (!capabilities?.canAddNotes) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <Lock className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
        <p className="text-muted-foreground">
          You don't have permission to add investigation notes.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Notes can only be added by the investigation team (First Responders, Investigators, Managers).
        </p>
        {incident.notes.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-muted-foreground mb-4">
              However, you can view existing notes below:
            </p>
            <div className="text-left space-y-3 max-h-96 overflow-y-auto">
              {incident.notes.slice(0, 3).map((note) => {
                const config = categoryConfig[note.category] || categoryConfig.finding;
                const IconComponent = config.icon;
                
                return (
                  <div key={note.id} className="p-4 rounded-lg bg-muted/30 border">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${config.bgColor}`}>
                        <IconComponent className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.bgColor} ${config.color}`}>
                            {config.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(note.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm line-clamp-2">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          — {note.created_by.name}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Get allowed categories for current role
  const allowedCategories = capabilities.noteCategories;

  // Set default category if not set
  if (!newNote.category && allowedCategories.length > 0) {
    setNewNote({ ...newNote, category: allowedCategories[0] as IncidentNote['category'] });
  }

  const handleAddNote = async () => {
    if (!newNote.content || !user || !newNote.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const note: IncidentNote = {
        id: String(incident.notes.length + 1),
        content: newNote.content,
        category: newNote.category as IncidentNote['category'],
        created_by: { id: user.id, name: user.name },
        created_at: new Date().toISOString(),
      };

      await updateIncident(incident.id, {
        notes: [...incident.notes, note],
      });

      await logAudit({
        action: 'add_note',
        entity_type: 'incident',
        entity_id: incident.id,
        details: {
          note_category: note.category,
          note_preview: note.content.substring(0, 100),
          author: user.name,
          role: user.role
        }
      });

      toast.success('Note added');
      setNewNote({ content: '', category: allowedCategories[0] as IncidentNote['category'] });
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    }
  };

  const filteredNotes = incident.notes.filter(note => 
    filter === 'all' || note.category === filter
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Get available category options for dropdown
  const categoryOptions = Object.entries(categoryConfig)
    .filter(([key]) => allowedCategories.includes(key));

  return (
    <div className="space-y-6">
      {/* Add Note Form */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-semibold mb-4">Add Investigation Note</h3>
        
        {/* Role Badge */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Adding note as:</strong> {user?.role.replace('_', ' ')}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Available categories: {allowedCategories.map(cat => categoryConfig[cat]?.label || cat).join(', ')}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label>Note Content *</Label>
              <Textarea
                placeholder="Document your findings, hypotheses, or questions..."
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label>Category: *</Label>
              <Select 
                value={newNote.category} 
                onValueChange={(v) => setNewNote({ ...newNote, category: v as IncidentNote['category'] })}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <config.icon className={`h-4 w-4 ${config.color}`} />
                        {config.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddNote} disabled={!newNote.content || !newNote.category} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Note
            </Button>
          </div>
        </div>
      </div>

      {/* Filter and Notes List */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Investigation Notes ({incident.notes.length})</h3>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Notes</SelectItem>
            {Object.entries(categoryConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNotes.map((note) => {
          const config = categoryConfig[note.category] || categoryConfig.finding;
          const IconComponent = config.icon;

          return (
            <div 
              key={note.id} 
              className="glass-card rounded-xl p-5 border-l-4"
              style={{ borderLeftColor: config.color.replace('text-', '') }}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${config.bgColor}`}>
                  <IconComponent className={`h-5 w-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.bgColor} ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(note.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-3">
                    — {note.created_by.name}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {filteredNotes.length === 0 && (
          <div className="col-span-full glass-card rounded-xl p-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {filter === 'all' ? 'No notes yet' : `No ${categoryConfig[filter]?.label || filter} notes`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Start documenting your investigation findings above</p>
          </div>
        )}
      </div>
    </div>
  );
}