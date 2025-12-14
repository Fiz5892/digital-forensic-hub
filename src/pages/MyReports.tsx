import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge, PriorityBadge } from '@/components/common/StatusBadge';
import { FileText, Search, Plus } from 'lucide-react';

export default function MyReports() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { incidents } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter incidents yang direport oleh user ini
  const myIncidents = incidents.filter(
    (incident) => incident.reporter?.id === user?.id
  );

  // Filter berdasarkan search
  const filteredIncidents = myIncidents.filter((incident) =>
    incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    incident.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Reports</h1>
          <p className="text-muted-foreground mt-1">
            Incidents you have reported ({myIncidents.length})
          </p>
        </div>
        <Button onClick={() => navigate('/report')} className="gap-2">
          <Plus className="h-4 w-4" />
          Report New Incident
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Incidents List */}
      {filteredIncidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-card rounded-xl border">
          <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {myIncidents.length === 0 ? 'No Reports Yet' : 'No Results Found'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {myIncidents.length === 0 
              ? 'Start by reporting your first incident'
              : 'Try a different search term'
            }
          </p>
          {myIncidents.length === 0 && (
            <Button onClick={() => navigate('/report')}>
              <Plus className="h-4 w-4 mr-2" />
              Report Incident
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIncidents.map((incident) => (
            <div
              key={incident.id}
              onClick={() => navigate(`/incidents/${incident.id}`)}
              className="bg-card rounded-xl border p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm text-primary">
                      {incident.id}
                    </span>
                    <PriorityBadge priority={incident.priority} />
                    <StatusBadge status={incident.status} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{incident.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {incident.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Type: {incident.type}</span>
                    <span>•</span>
                    <span>Reported: {new Date(incident.created_at).toLocaleDateString()}</span>
                    {incident.assigned_to && (
                      <>
                        <span>•</span>
                        <span>Assigned to: {incident.assigned_to.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}