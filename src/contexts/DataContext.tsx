import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Incident, Evidence } from '@/lib/types';

interface DataContextType {
  incidents: Incident[];
  evidence: Evidence[];
  isLoading: boolean;
  addIncident: (incident: Incident) => Promise<void>;
  updateIncident: (id: string, updates: Partial<Incident>) => Promise<void>;
  getIncident: (id: string) => Incident | undefined;
  getEvidenceForIncident: (incidentId: string) => Evidence[];
  addEvidence: (evidence: Evidence) => Promise<void>;
  updateEvidence: (id: string, updates: Partial<Evidence>) => Promise<void>;
  getNextIncidentId: () => string;
  getNextEvidenceId: (incidentId: string) => string;
  refreshIncidents: () => Promise<void>;
  refreshEvidence: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch incidents from Supabase
  const fetchIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Transform database format to app format
        const transformedIncidents: Incident[] = data.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          type: item.type,
          status: item.status,
          priority: item.priority,
          reporter: {
            id: item.reporter_id,
            name: item.reporter_name,
            email: item.reporter_email,
          },
          created_at: item.created_at,
          updated_at: item.updated_at,
          impact_assessment: item.impact_assessment,
          technical_details: item.technical_details,
          timeline: item.timeline || [],
          evidence_ids: item.evidence_ids || [],
          notes: item.notes || [],
          regulatory_requirements: item.regulatory_requirements || [],
        }));

        setIncidents(transformedIncidents);
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
    }
  };

  // Fetch evidence from Supabase
  const fetchEvidence = async () => {
    try {
      const { data, error } = await supabase
        .from('evidence')
        .select('*')
        .order('collected_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Transform database format to app format
        const transformedEvidence: Evidence[] = data.map(item => ({
          id: item.id,
          incident_id: item.incident_id,
          type: item.type,
          description: item.description,
          file_name: item.file_name,
          file_size: item.file_size,
          file_type: item.file_type,
          hash_md5: item.hash_md5,
          hash_sha256: item.hash_sha256,
          collected_by: {
            id: item.collected_by_id,
            name: item.collected_by_name,
          },
          collected_at: item.collected_at,
          chain_of_custody: item.chain_of_custody || [],
          storage_location: item.storage_location,
          tags: item.tags || [],
          analysis_results: item.analysis_results,
        }));

        setEvidence(transformedEvidence);
      }
    } catch (error) {
      console.error('Error fetching evidence:', error);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchIncidents(), fetchEvidence()]);
      setIsLoading(false);
    };

    loadData();

    // Set up realtime subscriptions for live updates
    const incidentsSubscription = supabase
      .channel('incidents_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'incidents' },
        () => fetchIncidents()
      )
      .subscribe();

    const evidenceSubscription = supabase
      .channel('evidence_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'evidence' },
        () => fetchEvidence()
      )
      .subscribe();

    return () => {
      incidentsSubscription.unsubscribe();
      evidenceSubscription.unsubscribe();
    };
  }, []);

  const addIncident = async (incident: Incident) => {
    try {
      const { error } = await supabase
        .from('incidents')
        .insert({
          id: incident.id,
          title: incident.title,
          description: incident.description,
          type: incident.type,
          status: incident.status,
          priority: incident.priority,
          reporter_id: incident.reporter.id,
          reporter_name: incident.reporter.name,
          reporter_email: incident.reporter.email,
          created_at: incident.created_at,
          updated_at: incident.updated_at,
          impact_assessment: incident.impact_assessment,
          technical_details: incident.technical_details,
          timeline: incident.timeline,
          evidence_ids: incident.evidence_ids,
          notes: incident.notes,
          regulatory_requirements: incident.regulatory_requirements,
        });

      if (error) throw error;

      // Refresh local state
      await fetchIncidents();
    } catch (error) {
      console.error('Error adding incident:', error);
      throw error;
    }
  };

  const updateIncident = async (id: string, updates: Partial<Incident>) => {
    try {
      // Prepare update object
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.title) updateData.title = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.type) updateData.type = updates.type;
      if (updates.status) updateData.status = updates.status;
      if (updates.priority) updateData.priority = updates.priority;
      if (updates.impact_assessment) updateData.impact_assessment = updates.impact_assessment;
      if (updates.technical_details) updateData.technical_details = updates.technical_details;
      if (updates.timeline) updateData.timeline = updates.timeline;
      if (updates.evidence_ids) updateData.evidence_ids = updates.evidence_ids;
      if (updates.notes) updateData.notes = updates.notes;
      if (updates.regulatory_requirements) updateData.regulatory_requirements = updates.regulatory_requirements;

      const { error } = await supabase
        .from('incidents')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Refresh local state
      await fetchIncidents();
    } catch (error) {
      console.error('Error updating incident:', error);
      throw error;
    }
  };

  const getIncident = (id: string) => {
    return incidents.find(inc => inc.id === id);
  };

  const getEvidenceForIncident = (incidentId: string) => {
    return evidence.filter(e => e.incident_id === incidentId);
  };

  const addEvidence = async (newEvidence: Evidence) => {
    try {
      const { error } = await supabase
        .from('evidence')
        .insert({
          id: newEvidence.id,
          incident_id: newEvidence.incident_id,
          type: newEvidence.type,
          description: newEvidence.description,
          file_name: newEvidence.file_name,
          file_size: newEvidence.file_size,
          file_type: newEvidence.file_type,
          hash_md5: newEvidence.hash_md5,
          hash_sha256: newEvidence.hash_sha256,
          collected_by_id: newEvidence.collected_by.id,
          collected_by_name: newEvidence.collected_by.name,
          collected_at: newEvidence.collected_at,
          chain_of_custody: newEvidence.chain_of_custody,
          storage_location: newEvidence.storage_location,
          tags: newEvidence.tags,
          analysis_results: newEvidence.analysis_results,
        });

      if (error) throw error;

      // Also update incident's evidence_ids
      const incident = incidents.find(i => i.id === newEvidence.incident_id);
      if (incident && !incident.evidence_ids.includes(newEvidence.id)) {
        await updateIncident(newEvidence.incident_id, {
          evidence_ids: [...incident.evidence_ids, newEvidence.id]
        });
      }

      // Refresh local state
      await fetchEvidence();
    } catch (error) {
      console.error('Error adding evidence:', error);
      throw error;
    }
  };

  const updateEvidence = async (id: string, updates: Partial<Evidence>) => {
    try {
      const updateData: any = {};

      if (updates.description) updateData.description = updates.description;
      if (updates.type) updateData.type = updates.type;
      if (updates.chain_of_custody) updateData.chain_of_custody = updates.chain_of_custody;
      if (updates.storage_location) updateData.storage_location = updates.storage_location;
      if (updates.tags) updateData.tags = updates.tags;
      if (updates.analysis_results) updateData.analysis_results = updates.analysis_results;

      const { error } = await supabase
        .from('evidence')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Refresh local state
      await fetchEvidence();
    } catch (error) {
      console.error('Error updating evidence:', error);
      throw error;
    }
  };

  const getNextIncidentId = () => {
    const year = new Date().getFullYear();
    const existingIds = incidents
      .filter(i => i.id.startsWith(`INC-${year}`))
      .map(i => parseInt(i.id.split('-')[2], 10))
      .filter(n => !isNaN(n));
    
    const nextNum = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
    return `INC-${year}-${String(nextNum).padStart(3, '0')}`;
  };

  const getNextEvidenceId = (incidentId: string) => {
    const incidentEvidence = evidence.filter(e => e.incident_id === incidentId);
    const nextNum = incidentEvidence.length + 1;
    return `EVD-${incidentId.replace('INC-', '')}-${String(nextNum).padStart(2, '0')}`;
  };

  const refreshIncidents = async () => {
    await fetchIncidents();
  };

  const refreshEvidence = async () => {
    await fetchEvidence();
  };

  return (
    <DataContext.Provider value={{
      incidents,
      evidence,
      isLoading,
      addIncident,
      updateIncident,
      getIncident,
      getEvidenceForIncident,
      addEvidence,
      updateEvidence,
      getNextIncidentId,
      getNextEvidenceId,
      refreshIncidents,
      refreshEvidence,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}