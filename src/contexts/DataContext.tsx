// src/contexts/DataContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase'; // Pastikan path ini sesuai
import { Incident, Evidence, AuditLog, CustodyChainEntry, User } from '@/lib/types';

interface DataContextType {
  incidents: Incident[];
  evidence: Evidence[];
  auditLogs: AuditLog[];
  users: User[];
  isLoading: boolean;
  addIncident: (incident: Incident) => Promise<void>;
  updateIncident: (id: string, updates: Partial<Incident>) => Promise<void>;
  getIncident: (id: string) => Incident | undefined;
  getEvidenceForIncident: (incidentId: string) => Evidence[];
  addEvidence: (evidence: Evidence) => Promise<void>;
  updateEvidence: (id: string, updates: Partial<Evidence>) => Promise<void>;
  deleteEvidence: (id: string) => Promise<void>;
  getNextIncidentId: () => string;
  getNextEvidenceId: (incidentId: string) => string;
  refreshIncidents: () => Promise<void>;
  refreshEvidence: () => Promise<void>;
  refreshAuditLogs: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  // ✅ Tambahkan fungsi untuk upload/download file
  uploadEvidenceFile: (file: File, incidentId: string) => Promise<{
    path: string;
    publicUrl: string;
    filename: string;
  }>;
  downloadEvidenceFile: (storagePath: string) => Promise<Blob>;
  getSignedUrl: (storagePath: string, expiresIn?: number) => Promise<string>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ FUNGSI: Upload file ke Supabase Storage
  const uploadEvidenceFile = async (file: File, incidentId: string) => {
    try {
      // Generate unique filename dengan UUID
      const { v4: uuidv4 } = await import('uuid');
      const fileExtension = file.name.split('.').pop();
      const uniqueFilename = `${uuidv4()}.${fileExtension}`;
      const storagePath = `evidence/${incidentId}/${uniqueFilename}`;

      // Upload file ke Supabase Storage
      const { data, error } = await supabase.storage
        .from('incident-evidence')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Supabase upload error: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('incident-evidence')
        .getPublicUrl(storagePath);

      return {
        path: storagePath,
        publicUrl: urlData.publicUrl,
        filename: uniqueFilename
      };

    } catch (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }
  };

  // ✅ FUNGSI: Download file dari Supabase
  const downloadEvidenceFile = async (storagePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('incident-evidence')
        .download(storagePath);

      if (error) {
        throw new Error(`Download error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data received');
      }

      return data;
    } catch (error) {
      console.error('Supabase download error:', error);
      throw error;
    }
  };

  // ✅ FUNGSI: Get signed URL untuk download (lebih aman)
  const getSignedUrl = async (storagePath: string, expiresIn = 3600) => {
    try {
      const { data, error } = await supabase.storage
        .from('incident-evidence')
        .createSignedUrl(storagePath, expiresIn);

      if (error) {
        throw new Error(`Signed URL error: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Signed URL error:', error);
      throw error;
    }
  };

  // Fetch users from Supabase
  const fetchUsers = async () => {
    try {
      console.log('🔄 Fetching users...');
      
      // Ambil data dari profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email, is_active')
        .eq('is_active', true);

      // Ambil data dari user_roles table
      const { data: userRolesData, error: userRolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (profilesError || userRolesError) {
        console.error('❌ Error fetching users:', { profilesError, userRolesError });
        return;
      }

      if (profilesData && userRolesData) {
        // Manual JOIN profiles dengan user_roles
        const transformedUsers: User[] = profilesData
          .map(profile => {
            const userRole = userRolesData.find(ur => ur.user_id === profile.user_id);
            return {
              id: profile.user_id, // GUNAKAN user_id dari auth.users
              name: profile.full_name,
              email: profile.email,
              role: (userRole?.role || 'reporter') as User['role']
            };
          })
          .filter((u): u is User => u !== null);

        setUsers(transformedUsers);
        console.log('✅ Users fetched successfully:', transformedUsers.length);
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error);
    }
  };

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
          assigned_to: item.assigned_to_id ? {
            id: item.assigned_to_id,
            name: item.assigned_to_name,
          } : undefined,
          created_at: item.created_at,
          updated_at: item.updated_at,
          closed_at: item.closed_at,
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
          filename: item.filename,
          file_type: item.file_type,
          file_size: item.file_size || 0,
          hash_md5: item.hash_md5,
          hash_sha256: item.hash_sha256,
          storage_path: item.storage_path,
          storage_url: item.storage_url,
          collected_by: {
            id: item.collected_by_id,
            name: item.collected_by_name,
          },
          collected_at: item.collected_at,
          current_custodian: {
            id: item.current_custodian_id,
            name: item.current_custodian_name,
          },
          custody_chain: item.custody_chain as CustodyChainEntry[] || [],
          storage_location: item.storage_location,
          analysis_status: item.analysis_status,
          integrity_status: item.integrity_status,
          description: item.description,
          tags: item.tags || [],
          analysis_results: item.analysis_results,
        }));

        setEvidence(transformedEvidence);
      }
    } catch (error) {
      console.error('Error fetching evidence:', error);
    }
  };

  // Fetch audit logs from Supabase
  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setAuditLogs(data);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchIncidents(), 
        fetchEvidence(), 
        fetchAuditLogs(),
        fetchUsers()
      ]);
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

    const auditLogsSubscription = supabase
      .channel('audit_logs_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'audit_logs' },
        () => fetchAuditLogs()
      )
      .subscribe();

    const profilesSubscription = supabase
      .channel('profiles_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchUsers()
      )
      .subscribe();

    const userRolesSubscription = supabase
      .channel('user_roles_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        () => fetchUsers()
      )
      .subscribe();

    return () => {
      incidentsSubscription.unsubscribe();
      evidenceSubscription.unsubscribe();
      auditLogsSubscription.unsubscribe();
      profilesSubscription.unsubscribe();
      userRolesSubscription.unsubscribe();
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
          assigned_to_id: incident.assigned_to?.id,
          assigned_to_name: incident.assigned_to?.name,
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
      
      // Handle assigned_to update
      if (updates.assigned_to !== undefined) {
        updateData.assigned_to_id = updates.assigned_to?.id || null;
        updateData.assigned_to_name = updates.assigned_to?.name || null;
      }

      // Handle closed_at for status changes
      if (updates.status === 'closed') {
        updateData.closed_at = new Date().toISOString();
      }

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

  // ✅ UPDATE: Fungsi addEvidence untuk support Supabase Storage
  const addEvidence = async (newEvidence: Evidence) => {
    try {
      const { error } = await supabase
        .from('evidence')
        .insert({
          id: newEvidence.id,
          incident_id: newEvidence.incident_id,
          filename: newEvidence.filename,
          file_type: newEvidence.file_type,
          file_size: newEvidence.file_size,
          hash_md5: newEvidence.hash_md5,
          hash_sha256: newEvidence.hash_sha256,
          storage_path: newEvidence.storage_path,
          storage_url: newEvidence.storage_url,
          collected_by_id: newEvidence.collected_by.id,
          collected_by_name: newEvidence.collected_by.name,
          collected_at: newEvidence.collected_at,
          current_custodian_id: newEvidence.current_custodian.id,
          current_custodian_name: newEvidence.current_custodian.name,
          custody_chain: newEvidence.custody_chain,
          storage_location: newEvidence.storage_location,
          analysis_status: newEvidence.analysis_status,
          integrity_status: newEvidence.integrity_status,
          description: newEvidence.description,
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

  // ✅ UPDATE: Fungsi updateEvidence untuk support Supabase Storage
  const updateEvidence = async (id: string, updates: Partial<Evidence>) => {
    try {
      const updateData: any = {};

      if (updates.description) updateData.description = updates.description;
      if (updates.custody_chain) updateData.custody_chain = updates.custody_chain;
      if (updates.storage_location) updateData.storage_location = updates.storage_location;
      if (updates.storage_path) updateData.storage_path = updates.storage_path;
      if (updates.storage_url) updateData.storage_url = updates.storage_url;
      if (updates.tags) updateData.tags = updates.tags;
      if (updates.analysis_results) updateData.analysis_results = updates.analysis_results;
      if (updates.analysis_status) updateData.analysis_status = updates.analysis_status;
      if (updates.integrity_status) updateData.integrity_status = updates.integrity_status;
      if (updates.current_custodian) {
        updateData.current_custodian_id = updates.current_custodian.id;
        updateData.current_custodian_name = updates.current_custodian.name;
      }

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

  // ✅ NEW: Fungsi deleteEvidence untuk delete file dari Supabase Storage
  const deleteEvidence = async (id: string) => {
    try {
      // 1. Get evidence data to find storage_path
      const evidenceItem = evidence.find(e => e.id === id);
      if (!evidenceItem) {
        throw new Error('Evidence not found');
      }

      // 2. Delete file from Supabase Storage jika ada storage_path
      if (evidenceItem.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('incident-evidence')
          .remove([evidenceItem.storage_path]);

        if (storageError) {
          console.warn('Failed to delete file from storage:', storageError);
          // Lanjutkan dengan delete metadata meski file tidak terhapus
        }
      }

      // 3. Delete metadata dari database
      const { error: dbError } = await supabase
        .from('evidence')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      // 4. Update incident's evidence_ids
      const incident = incidents.find(i => i.id === evidenceItem.incident_id);
      if (incident && incident.evidence_ids.includes(id)) {
        await updateIncident(evidenceItem.incident_id, {
          evidence_ids: incident.evidence_ids.filter(eid => eid !== id)
        });
      }

      // 5. Refresh local state
      await fetchEvidence();
    } catch (error) {
      console.error('Error deleting evidence:', error);
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

  const refreshAuditLogs = async () => {
    await fetchAuditLogs();
  };

  const refreshUsers = async () => {
    await fetchUsers();
  };

  return (
    <DataContext.Provider value={{
      incidents,
      evidence,
      auditLogs,
      users,
      isLoading,
      addIncident,
      updateIncident,
      getIncident,
      getEvidenceForIncident,
      addEvidence,
      updateEvidence,
      deleteEvidence, // ✅ Tambahkan ke context
      getNextIncidentId,
      getNextEvidenceId,
      refreshIncidents,
      refreshEvidence,
      refreshAuditLogs,
      refreshUsers,
      // ✅ Tambahkan fungsi storage
      uploadEvidenceFile,
      downloadEvidenceFile,
      getSignedUrl,
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