import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Incident, Evidence } from '@/lib/types';
import { mockIncidents, mockEvidence } from '@/lib/mockData';

interface DataContextType {
  incidents: Incident[];
  evidence: Evidence[];
  addIncident: (incident: Incident) => void;
  updateIncident: (id: string, updates: Partial<Incident>) => void;
  getIncident: (id: string) => Incident | undefined;
  getEvidenceForIncident: (incidentId: string) => Evidence[];
  addEvidence: (evidence: Evidence) => void;
  updateEvidence: (id: string, updates: Partial<Evidence>) => void;
  getNextIncidentId: () => string;
  getNextEvidenceId: (incidentId: string) => string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);

  useEffect(() => {
    // Load from localStorage or use mock data
    const storedIncidents = localStorage.getItem('dfir_incidents');
    const storedEvidence = localStorage.getItem('dfir_evidence');
    
    if (storedIncidents) {
      setIncidents(JSON.parse(storedIncidents));
    } else {
      setIncidents(mockIncidents);
      localStorage.setItem('dfir_incidents', JSON.stringify(mockIncidents));
    }

    if (storedEvidence) {
      setEvidence(JSON.parse(storedEvidence));
    } else {
      setEvidence(mockEvidence);
      localStorage.setItem('dfir_evidence', JSON.stringify(mockEvidence));
    }
  }, []);

  const saveIncidents = (newIncidents: Incident[]) => {
    setIncidents(newIncidents);
    localStorage.setItem('dfir_incidents', JSON.stringify(newIncidents));
  };

  const saveEvidence = (newEvidence: Evidence[]) => {
    setEvidence(newEvidence);
    localStorage.setItem('dfir_evidence', JSON.stringify(newEvidence));
  };

  const addIncident = (incident: Incident) => {
    const newIncidents = [...incidents, incident];
    saveIncidents(newIncidents);
  };

  const updateIncident = (id: string, updates: Partial<Incident>) => {
    const newIncidents = incidents.map(inc => 
      inc.id === id ? { ...inc, ...updates, updated_at: new Date().toISOString() } : inc
    );
    saveIncidents(newIncidents);
  };

  const getIncident = (id: string) => {
    return incidents.find(inc => inc.id === id);
  };

  const getEvidenceForIncident = (incidentId: string) => {
    return evidence.filter(e => e.incident_id === incidentId);
  };

  const addEvidence = (newEvidence: Evidence) => {
    const newEvidenceList = [...evidence, newEvidence];
    saveEvidence(newEvidenceList);
    
    // Also update incident's evidence_ids
    const incident = incidents.find(i => i.id === newEvidence.incident_id);
    if (incident && !incident.evidence_ids.includes(newEvidence.id)) {
      updateIncident(newEvidence.incident_id, {
        evidence_ids: [...incident.evidence_ids, newEvidence.id]
      });
    }
  };

  const updateEvidence = (id: string, updates: Partial<Evidence>) => {
    const newEvidenceList = evidence.map(e => 
      e.id === id ? { ...e, ...updates } : e
    );
    saveEvidence(newEvidenceList);
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

  return (
    <DataContext.Provider value={{
      incidents,
      evidence,
      addIncident,
      updateIncident,
      getIncident,
      getEvidenceForIncident,
      addEvidence,
      updateEvidence,
      getNextIncidentId,
      getNextEvidenceId,
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
