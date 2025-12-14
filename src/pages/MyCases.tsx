import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge, PriorityBadge } from '@/components/common/StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Folder, Search, Clock, CheckCircle2 } from 'lucide-react';

export default function MyCases() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { incidents } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  // Filter incidents yang di-assign ke user ini
  const myCases = incidents.filter(
    (incident) => incident.assigned_to?.id === user?.id
  );

  // Separate by status
  const activeCases = myCases.filter(
    i => ['investigation', 'contained'].includes(i.status)
  );
  const resolvedCases = myCases.filter(
    i => ['resolved', 'closed'].includes(i.status)
  );

  // Apply search filter
  const filterCases = (cases: any[]) => {
    return cases.filter((incident) =>
      incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredActiveCases = filterCases(activeCases);
  const filteredResolvedCases = filterCases(resolvedCases);

  const renderCaseCard = (incident: any) => {
    const daysOpen = Math.floor(
      (Date.now() - new Date(incident.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <div
        key={incident.id}
        onClick={() => navigate(`/incidents/${incident.id}`)}
        className="bg-card rounded-xl border p-5 hover:shadow-lg transition-all cursor-pointer"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-primary font-semibold">
              {incident.id}
            </span>
            <PriorityBadge priority={incident.priority} />
            <StatusBadge status={incident.status} />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {daysOpen} {daysOpen === 1 ? 'day' : 'days'} open
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-2">{incident.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {incident.description}
        </p>

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{incident.type}</span>
            <span>•</span>
            <span>Reporter: {incident.reporter?.name}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            Updated: {new Date(incident.updated_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Cases</h1>
          <p className="text-muted-foreground mt-1">
            Incidents assigned to you for investigation
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary">{myCases.length}</div>
          <div className="text-sm text-muted-foreground">Total Cases</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Cases</p>
              <p className="text-3xl font-bold text-blue-500">{activeCases.length}</p>
            </div>
            <Folder className="h-10 w-10 text-blue-500 opacity-20" />
          </div>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Resolved Cases</p>
              <p className="text-3xl font-bold text-green-500">{resolvedCases.length}</p>
            </div>
            <CheckCircle2 className="h-10 w-10 text-green-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search cases by title or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <Folder className="h-4 w-4" />
            Active ({activeCases.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Resolved ({resolvedCases.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3">
          {filteredActiveCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-card rounded-xl border">
              <Folder className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {activeCases.length === 0 ? 'No Active Cases' : 'No Results Found'}
              </h3>
              <p className="text-muted-foreground">
                {activeCases.length === 0
                  ? 'You have no active cases assigned to you'
                  : 'Try a different search term'
                }
              </p>
            </div>
          ) : (
            filteredActiveCases.map(renderCaseCard)
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-3">
          {filteredResolvedCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-card rounded-xl border">
              <CheckCircle2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {resolvedCases.length === 0 ? 'No Resolved Cases' : 'No Results Found'}
              </h3>
              <p className="text-muted-foreground">
                {resolvedCases.length === 0
                  ? 'You have not resolved any cases yet'
                  : 'Try a different search term'
                }
              </p>
            </div>
          ) : (
            filteredResolvedCases.map(renderCaseCard)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}