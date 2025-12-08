import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { StatusBadge, PriorityBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Plus, 
  Filter, 
  Eye,
  LayoutGrid,
  List,
  Calendar,
  User
} from 'lucide-react';
import { IncidentStatus, IncidentPriority } from '@/lib/types';
import { incidentTypes, statusOptions, priorityOptions } from '@/lib/mockData';

export default function IncidentList() {
  const navigate = useNavigate();
  const { incidents } = useData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      const matchesSearch = search === '' || 
        incident.id.toLowerCase().includes(search.toLowerCase()) ||
        incident.title.toLowerCase().includes(search.toLowerCase()) ||
        incident.description.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || incident.priority === priorityFilter;
      const matchesType = typeFilter === 'all' || incident.type === typeFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesType;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [incidents, search, statusFilter, priorityFilter, typeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Incidents</h1>
          <p className="text-muted-foreground">Manage and investigate security incidents</p>
        </div>
        <Button onClick={() => navigate('/report')} className="gap-2">
          <Plus className="h-4 w-4" />
          Report Incident
        </Button>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, title, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {priorityOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {incidentTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'card' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('card')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredIncidents.length} of {incidents.length} incidents
      </p>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">ID</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Title</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Priority</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Assigned To</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Created</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredIncidents.map((incident) => (
                  <tr 
                    key={incident.id} 
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/incidents/${incident.id}`)}
                  >
                    <td className="p-4">
                      <span className="font-mono text-primary text-sm">{incident.id}</span>
                    </td>
                    <td className="p-4">
                      <p className="font-medium max-w-[300px] truncate">{incident.title}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">{incident.type}</span>
                    </td>
                    <td className="p-4">
                      <PriorityBadge priority={incident.priority} />
                    </td>
                    <td className="p-4">
                      <StatusBadge status={incident.status} />
                    </td>
                    <td className="p-4">
                      <span className="text-sm">
                        {incident.assigned_to?.name || <span className="text-muted-foreground">Unassigned</span>}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">
                        {new Date(incident.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/incidents/${incident.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredIncidents.length === 0 && (
            <div className="p-12 text-center">
              <Filter className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No incidents match your filters</p>
            </div>
          )}
        </div>
      )}

      {/* Card View */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIncidents.map((incident) => (
            <div
              key={incident.id}
              onClick={() => navigate(`/incidents/${incident.id}`)}
              className="glass-card rounded-xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-primary text-sm">{incident.id}</span>
                <PriorityBadge priority={incident.priority} />
              </div>
              <h3 className="font-semibold mb-2 line-clamp-2">{incident.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{incident.description}</p>
              
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <StatusBadge status={incident.status} />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(incident.created_at).toLocaleDateString()}
                </div>
              </div>

              {incident.assigned_to && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border text-sm">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Assigned to:</span>
                  <span className="font-medium">{incident.assigned_to.name}</span>
                </div>
              )}
            </div>
          ))}
          {filteredIncidents.length === 0 && (
            <div className="col-span-full p-12 text-center glass-card rounded-xl">
              <Filter className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No incidents match your filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
