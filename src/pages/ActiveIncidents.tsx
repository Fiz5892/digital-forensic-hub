import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Input } from '@/components/ui/input';
import { StatusBadge, PriorityBadge } from '@/components/common/StatusBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Activity, Search, Filter } from 'lucide-react';

export default function ActiveIncidents() {
  const navigate = useNavigate();
  const { incidents } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Filter active incidents (not closed)
  const activeIncidents = incidents.filter(
    (incident) => !['closed'].includes(incident.status)
  );

  // Apply filters
  const filteredIncidents = activeIncidents.filter((incident) => {
    const matchesSearch =
      incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus =
      statusFilter === 'all' || incident.status === statusFilter;
    
    const matchesPriority =
      priorityFilter === 'all' || incident.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Group by priority
  const criticalCount = activeIncidents.filter(i => i.priority === 'critical').length;
  const highCount = activeIncidents.filter(i => i.priority === 'high').length;
  const mediumCount = activeIncidents.filter(i => i.priority === 'medium').length;
  const lowCount = activeIncidents.filter(i => i.priority === 'low').length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Active Incidents</h1>
        <p className="text-muted-foreground mt-1">
          Currently active incidents across all teams ({activeIncidents.length})
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border p-4">
          <p className="text-xs text-muted-foreground mb-1">Critical</p>
          <p className="text-2xl font-bold text-red-500">{criticalCount}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-xs text-muted-foreground mb-1">High</p>
          <p className="text-2xl font-bold text-orange-500">{highCount}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-xs text-muted-foreground mb-1">Medium</p>
          <p className="text-2xl font-bold text-yellow-500">{mediumCount}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-xs text-muted-foreground mb-1">Low</p>
          <p className="text-2xl font-bold text-green-500">{lowCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search incidents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="triage">Triage</SelectItem>
            <SelectItem value="investigation">Investigation</SelectItem>
            <SelectItem value="contained">Contained</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Incidents List */}
      {filteredIncidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-card rounded-xl border">
          <Activity className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {activeIncidents.length === 0 ? 'No Active Incidents' : 'No Results Found'}
          </h3>
          <p className="text-muted-foreground">
            {activeIncidents.length === 0
              ? 'All incidents have been resolved or closed'
              : 'Try adjusting your filters or search term'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIncidents.map((incident) => (
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
                <span className="text-xs text-muted-foreground">
                  {new Date(incident.updated_at).toLocaleDateString()}
                </span>
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
                {incident.assigned_to ? (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {incident.assigned_to.name}
                  </span>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    Unassigned
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}