import { useState } from 'react';
import { Incident, IncidentNote } from '@/lib/types';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
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
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

interface NotesTabProps {
  incident: Incident;
}

const categoryConfig = {
  hypothesis: { icon: Lightbulb, color: 'text-status-medium', bgColor: 'bg-status-medium/10', label: 'Hypothesis' },
  finding: { icon: CheckCircle, color: 'text-status-low', bgColor: 'bg-status-low/10', label: 'Finding' },
  action_item: { icon: AlertTriangle, color: 'text-status-high', bgColor: 'bg-status-high/10', label: 'Action Item' },
  question: { icon: HelpCircle, color: 'text-status-info', bgColor: 'bg-status-info/10', label: 'Question' },
};

export function NotesTab({ incident }: NotesTabProps) {
  const { updateIncident } = useData();
  const { user } = useAuth();
  const [newNote, setNewNote] = useState({
    content: '',
    category: 'finding' as IncidentNote['category'],
  });
  const [filter, setFilter] = useState<string>('all');

  const handleAddNote = () => {
    if (!newNote.content || !user) return;

    const note: IncidentNote = {
      id: incident.notes.length + 1,
      content: newNote.content,
      category: newNote.category,
      created_by: { id: user.id, name: user.name },
      created_at: new Date().toISOString(),
    };

    updateIncident(incident.id, {
      notes: [...incident.notes, note],
    });

    toast.success('Note added');
    setNewNote({ content: '', category: 'finding' });
  };

  const filteredNotes = incident.notes.filter(note => 
    filter === 'all' || note.category === filter
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-6">
      {/* Add Note Form */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-semibold mb-4">Add Investigation Note</h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label>Note Content</Label>
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
              <Label>Category:</Label>
              <Select 
                value={newNote.category} 
                onValueChange={(v) => setNewNote({ ...newNote, category: v as IncidentNote['category'] })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryConfig).map(([key, config]) => (
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
            <Button onClick={handleAddNote} disabled={!newNote.content} className="gap-2">
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
          <SelectTrigger className="w-[160px]">
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
          const config = categoryConfig[note.category];
          const IconComponent = config.icon;

          return (
            <div 
              key={note.id} 
              className={`glass-card rounded-xl p-5 border-l-4 ${config.bgColor}`}
              style={{ borderLeftColor: `hsl(var(--status-${note.category === 'finding' ? 'low' : note.category === 'hypothesis' ? 'medium' : note.category === 'action_item' ? 'high' : 'info'}))` }}
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
            <p className="text-muted-foreground">No notes yet</p>
            <p className="text-sm text-muted-foreground mt-1">Start documenting your investigation findings above</p>
          </div>
        )}
      </div>
    </div>
  );
}
