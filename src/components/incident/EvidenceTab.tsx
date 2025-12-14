// src/components/incident/EvidenceTab.tsx
import { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { getUserCapabilities } from '@/config/routes.config';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  Plus, 
  FileText, 
  Image, 
  Code, 
  File,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Eye,
  Shield,
  Upload,
  Hash,
  Lock,
  X,
  Copy,
  Calendar,
  User,
  Server,
  Tag,
  FileSearch,
  Database,
  ExternalLink,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { Evidence, CustodyChainEntry } from '@/lib/types';
import { toast } from 'sonner';
import { logAudit } from '@/lib/auditLogger';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

interface EvidenceTabProps {
  incidentId: string;
}

const fileTypeIcons: Record<string, React.ElementType> = {
  'image/png': Image,
  'image/jpeg': Image,
  'text/plain': FileText,
  'application/x-php': Code,
  'application/json': Code,
  'application/pdf': FileText,
  'application/msword': FileText,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileText,
  'application/vnd.ms-excel': FileText,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileText,
  default: File,
};

const statusConfig = {
  pending: { icon: Clock, className: 'text-status-medium', label: 'Pending' },
  analyzing: { icon: Clock, className: 'text-status-info', label: 'Analyzing' },
  analyzed: { icon: CheckCircle, className: 'text-status-low', label: 'Analyzed' },
  archived: { icon: Shield, className: 'text-muted-foreground', label: 'Archived' },
};

const integrityConfig = {
  verified: { icon: CheckCircle, className: 'text-status-low', label: 'Verified' },
  tampered: { icon: AlertCircle, className: 'text-status-critical', label: 'Tampered' },
  unknown: { icon: AlertCircle, className: 'text-status-medium', label: 'Unknown' },
};

export function EvidenceTab({ incidentId }: EvidenceTabProps) {
  const { getEvidenceForIncident, addEvidence, updateEvidence, deleteEvidence, getNextEvidenceId } = useData();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [evidence, setEvidence] = useState<Evidence[]>([]);

  // Real file upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [md5Hash, setMd5Hash] = useState('');
  const [sha256Hash, setSha256Hash] = useState('');

  // Load evidence dari database
  useEffect(() => {
    loadEvidence();
  }, [incidentId]);

  const loadEvidence = async () => {
    try {
      const evidenceData = getEvidenceForIncident(incidentId);
      setEvidence(evidenceData);
    } catch (error) {
      console.error('Error loading evidence:', error);
      toast.error('Failed to load evidence');
    }
  };

  // Get role capabilities
  const capabilities = user ? getUserCapabilities(user.role) : null;

  const [newEvidence, setNewEvidence] = useState({
    description: '',
    file_type: 'text/plain',
    storage_location: 'supabase-storage',
    tags: [] as string[],
  });

  const [tagInput, setTagInput] = useState('');

  // ❌ PERMISSION CHECK - Block unauthorized users
  if (!capabilities?.canUploadEvidence && !capabilities?.canViewEvidence) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <Lock className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
        <p className="text-muted-foreground">
          You don't have permission to access evidence management.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Evidence can only be accessed by the investigation team.
        </p>
      </div>
    );
  }

  // Auto-tag evidence based on role
  const getAutoTags = (): string[] => {
    const baseTags = ['evidence', 'investigation'];
    
    if (!capabilities) return baseTags;
    
    return [...baseTags, capabilities.evidenceTag];
  };

  // ✅ FUNGSI: Upload file ke Supabase Storage
  const uploadFileToSupabase = async (file: File): Promise<{
    path: string;
    publicUrl: string;
    filename: string;
  }> => {
    // Generate unique filename dengan UUID
    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    const storagePath = `evidence/${incidentId}/${uniqueFilename}`;

    try {
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
  const downloadFileFromSupabase = async (evidence: Evidence) => {
    if (!evidence.storage_path) {
      throw new Error('File path not found');
    }

    try {
      const { data, error } = await supabase.storage
        .from('incident-evidence')
        .download(evidence.storage_path);

      if (error) {
        throw new Error(`Download error: ${error.message}`);
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

  // Real hash calculation using crypto-js
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 100MB for Supabase)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast.error('File too large', {
        description: 'Maximum file size is 100MB'
      });
      return;
    }

    setSelectedFile(file);
    setCalculating(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);

      const md5 = CryptoJS.MD5(wordArray).toString();
      const sha256 = CryptoJS.SHA256(wordArray).toString();

      setMd5Hash(md5);
      setSha256Hash(sha256);
      
      setNewEvidence(prev => ({
        ...prev,
        file_type: file.type || 'application/octet-stream'
      }));

      toast.success('Hashes calculated', {
        description: 'File integrity hashes generated successfully'
      });
    } catch (error) {
      console.error('Hash calculation error:', error);
      toast.error('Failed to calculate file hashes');
      setMd5Hash('');
      setSha256Hash('');
    } finally {
      setCalculating(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !newEvidence.tags.includes(tagInput.trim())) {
      setNewEvidence({
        ...newEvidence,
        tags: [...newEvidence.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setNewEvidence({
      ...newEvidence,
      tags: newEvidence.tags.filter(t => t !== tag)
    });
  };

  // Fungsi untuk melihat detail evidence
  const handleViewEvidence = async (evidence: Evidence) => {
    if (!capabilities?.canViewEvidence) {
      toast.error("You don't have permission to view evidence details");
      return;
    }

    try {
      // Log audit untuk view evidence
      await logAudit({
        action: 'view_evidence_detail',
        entity_type: 'evidence',
        entity_id: evidence.id,
        details: {
          filename: evidence.filename,
          file_type: evidence.file_type,
          file_size: evidence.file_size,
          incident_id: evidence.incident_id,
          viewed_by: user?.name,
          role: user?.role
        }
      });

      // Set evidence yang dipilih dan buka sheet
      setSelectedEvidence(evidence);
      setIsViewSheetOpen(true);

    } catch (error) {
      console.error('Error viewing evidence:', error);
      toast.error('Failed to view evidence details');
    }
  };

  // ✅ FUNGSI: Download file evidence dari Supabase
  const handleDownloadEvidence = async (evidence: Evidence) => {
    if (!capabilities?.canExportEvidence) {
      toast.error("You don't have permission to download evidence");
      return;
    }

    if (!evidence.storage_path) {
      toast.error('File not available for download');
      return;
    }

    try {
      setDownloading(true);

      // Get signed URL (lebih aman daripada public URL)
      const signedUrl = await getSignedUrl(evidence.storage_path, 300); // Expires in 5 minutes

      // Log audit untuk download
      await logAudit({
        action: 'download_evidence',
        entity_type: 'evidence',
        entity_id: evidence.id,
        details: {
          filename: evidence.filename,
          file_size: evidence.file_size,
          downloaded_by: user?.name,
          role: user?.role,
          storage_path: evidence.storage_path
        }
      });

      // Download file menggunakan signed URL
      const response = await fetch(signedUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = evidence.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('File downloaded', {
        description: `${evidence.filename} has been downloaded securely from Supabase Storage`
      });

    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  // ✅ FUNGSI: Export metadata evidence sebagai JSON
  const handleExportEvidence = async (evidence: Evidence) => {
    if (!capabilities?.canExportEvidence) {
      toast.error("You don't have permission to export evidence");
      return;
    }

    try {
      // Log audit untuk export evidence
      await logAudit({
        action: 'export_evidence_metadata',
        entity_type: 'evidence',
        entity_id: evidence.id,
        details: {
          filename: evidence.filename,
          file_type: evidence.file_type,
          incident_id: evidence.incident_id,
          exported_by: user?.name,
          role: user?.role,
          export_type: 'metadata_json'
        }
      });

      // Buat metadata JSON untuk diekspor
      const evidenceData = {
        evidence_id: evidence.id,
        incident_id: evidence.incident_id,
        filename: evidence.filename,
        file_type: evidence.file_type,
        file_size: evidence.file_size,
        description: evidence.description,
        collected_at: evidence.collected_at,
        collected_by: evidence.collected_by,
        current_custodian: evidence.current_custodian,
        storage_location: evidence.storage_location,
        storage_path: evidence.storage_path,
        storage_url: evidence.storage_url,
        analysis_status: evidence.analysis_status,
        integrity_status: evidence.integrity_status,
        tags: evidence.tags,
        
        // Integrity hashes
        hash_md5: evidence.hash_md5,
        hash_sha256: evidence.hash_sha256,
        
        // Chain of custody
        custody_chain: evidence.custody_chain?.map(chain => ({
          transferred_at: chain.transferred_at,
          from: chain.from,
          to: chain.to,
          reason: chain.reason,
          location: chain.location
        })),
        
        // Analysis results
        analysis_results: evidence.analysis_results,
        
        // Metadata
        export_timestamp: new Date().toISOString(),
        exported_by: user?.name,
        exported_by_role: user?.role,
        system_version: 'DFIR-Manager v1.0',
        storage_provider: 'Supabase'
      };

      // Konversi ke JSON string dengan format rapi
      const jsonString = JSON.stringify(evidenceData, null, 2);
      
      // Buat blob dan download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evidence-${evidence.id}-metadata.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Evidence metadata exported", {
        description: `${evidence.filename} metadata downloaded as JSON`
      });

    } catch (error) {
      console.error('Error exporting evidence:', error);
      toast.error('Failed to export evidence metadata');
    }
  };

  // ✅ FUNGSI: Upload evidence baru ke Supabase
  const handleAddEvidence = async () => {
    if (!selectedFile || !user || !md5Hash || !sha256Hash) {
      toast.error('Please select a file and wait for hash calculation');
      return;
    }

    try {
      setUploading(true);

      // 1. Upload file ke Supabase Storage
      toast.info('Uploading file to secure storage...');
      
      const uploadResult = await uploadFileToSupabase(selectedFile);

      toast.success('File uploaded to secure storage', {
        description: 'Now saving evidence metadata...'
      });

      // 2. Generate evidence ID
      const evidenceId = getNextEvidenceId(incidentId);
      
      // 3. Combine user tags with auto tags
      const finalTags = [...new Set([...newEvidence.tags, ...getAutoTags()])];
      
      // 4. Create evidence record dengan Supabase storage info
      const evidenceItem: Evidence = {
        id: evidenceId,
        incident_id: incidentId,
        filename: selectedFile.name,
        file_type: selectedFile.type || 'application/octet-stream',
        file_size: selectedFile.size,
        hash_md5: md5Hash,
        hash_sha256: sha256Hash,
        storage_path: uploadResult.path, // ✅ Path di Supabase Storage
        storage_url: uploadResult.publicUrl, // ✅ Public URL
        collected_by: { id: user.id, name: user.name },
        collected_at: new Date().toISOString(),
        current_custodian: { id: user.id, name: user.name },
        custody_chain: [{
          from: { id: user.id, name: user.name },
          to: { id: user.id, name: user.name },
          transferred_at: new Date().toISOString(),
          reason: 'Initial collection',
          witness: null,
          location: 'supabase-storage'
        }],
        storage_location: 'supabase-storage',
        analysis_status: 'pending',
        integrity_status: 'verified',
        description: newEvidence.description || 'Evidence collected during investigation',
        tags: finalTags,
        analysis_results: null
      };

      // 5. Save to database via useData context
      await addEvidence(evidenceItem);

      // 6. Log audit
      await logAudit({
        action: 'upload_evidence',
        entity_type: 'evidence',
        entity_id: evidenceId,
        details: {
          incident_id: incidentId,
          filename: selectedFile.name,
          file_size: selectedFile.size,
          hash_md5: md5Hash,
          hash_sha256: sha256Hash,
          storage_path: uploadResult.path,
          collected_by: user.name,
          role: user.role,
          storage_provider: 'Supabase'
        }
      });

      toast.success('Evidence added successfully', { 
        description: `${selectedFile.name} has been uploaded and stored in secure cloud storage` 
      });

      // 7. Reload evidence list
      await loadEvidence();

      // 8. Reset form
      setSelectedFile(null);
      setMd5Hash('');
      setSha256Hash('');
      setNewEvidence({ 
        description: '', 
        file_type: 'text/plain',
        storage_location: 'supabase-storage',
        tags: []
      });
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Evidence upload error:', error);
      toast.error(`Failed to upload evidence: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // ✅ FUNGSI: Delete evidence dari Supabase
  const handleDeleteEvidence = async (evidence: Evidence) => {
    if (!capabilities?.canEditEvidence) {
      toast.error("You don't have permission to delete evidence");
      return;
    }

    if (!confirm(`Are you sure you want to delete "${evidence.filename}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // 1. Delete file from Supabase Storage jika ada storage_path
      if (evidence.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('incident-evidence')
          .remove([evidence.storage_path]);

        if (storageError) {
          console.warn('Failed to delete file from storage:', storageError);
          // Lanjutkan dengan delete metadata meski file tidak terhapus
        }
      }

      // 2. Delete metadata dari database
      await deleteEvidence(evidence.id);

      // 3. Log audit
      await logAudit({
        action: 'delete_evidence',
        entity_type: 'evidence',
        entity_id: evidence.id,
        details: {
          filename: evidence.filename,
          deleted_by: user?.name,
          role: user?.role,
          storage_path: evidence.storage_path
        }
      });

      // 4. Reload evidence list
      await loadEvidence();

      toast.success('Evidence deleted', {
        description: `${evidence.filename} has been removed from storage`
      });

    } catch (error) {
      console.error('Error deleting evidence:', error);
      toast.error('Failed to delete evidence');
    }
  };

  // Fungsi untuk menyalin hash ke clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`Copied to clipboard`, {
        description: `${label} copied successfully`
      });
    }).catch(err => {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy to clipboard');
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Modal/Sheet untuk melihat detail evidence
  const EvidenceDetailSheet = () => {
    if (!selectedEvidence) return null;

    const IconComponent = fileTypeIcons[selectedEvidence.file_type] || fileTypeIcons.default;
    const statusCfg = statusConfig[selectedEvidence.analysis_status];
    const integrityCfg = integrityConfig[selectedEvidence.integrity_status];
    const StatusIcon = statusCfg.icon;
    const IntegrityIcon = integrityCfg.icon;

    return (
      <Sheet open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen}>
        <SheetContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <IconComponent className="h-6 w-6 text-primary" />
              <div>
                <p className="text-lg">{selectedEvidence.filename}</p>
                <p className="text-sm text-muted-foreground font-normal">
                  {selectedEvidence.id}
                </p>
              </div>
            </SheetTitle>
            <SheetDescription>
              Evidence stored securely in Supabase Storage
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Storage Provider Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 w-fit">
              <Database className="h-4 w-4" />
              <span className="text-sm font-medium">Supabase Storage</span>
            </div>

            {/* Status & Integrity Badges */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusCfg.className} bg-opacity-10`}>
                <StatusIcon className="h-4 w-4" />
                <span className="text-sm font-medium">{statusCfg.label}</span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${integrityCfg.className} bg-opacity-10`}>
                <IntegrityIcon className="h-4 w-4" />
                <span className="text-sm font-medium">{integrityCfg.label}</span>
              </div>
            </div>

            {/* Description */}
            {selectedEvidence.description && (
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Description</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedEvidence.description}
                </p>
              </div>
            )}

            {/* File Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">File Type</p>
                <p className="text-sm font-medium">{selectedEvidence.file_type}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">File Size</p>
                <p className="text-sm font-medium">{formatFileSize(selectedEvidence.file_size)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Storage Location</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  {selectedEvidence.storage_location}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Collected At</p>
                <p className="text-sm font-medium">{formatDate(selectedEvidence.collected_at)}</p>
              </div>
            </div>

            {/* Storage Path */}
            {selectedEvidence.storage_path && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-700">Storage Path</p>
                </div>
                <p className="text-xs font-mono bg-blue-100 p-2 rounded break-all">
                  {selectedEvidence.storage_path}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => copyToClipboard(selectedEvidence.storage_path || '', 'Storage path')}
                  >
                    <Copy className="h-3 w-3" />
                    Copy Path
                  </Button>
                  {selectedEvidence.storage_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => window.open(selectedEvidence.storage_url || '', '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open URL
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* People Involved */}
            <div className="space-y-4">
              <p className="text-sm font-medium">People Involved</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-primary" />
                    <p className="text-xs text-muted-foreground">Collected By</p>
                  </div>
                  <p className="text-sm font-medium">{selectedEvidence.collected_by.name}</p>
                  <p className="text-xs text-muted-foreground">ID: {selectedEvidence.collected_by.id}</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <p className="text-xs text-muted-foreground">Current Custodian</p>
                  </div>
                  <p className="text-sm font-medium">{selectedEvidence.current_custodian.name}</p>
                  <p className="text-xs text-muted-foreground">ID: {selectedEvidence.current_custodian.id}</p>
                </div>
              </div>
            </div>

            {/* Tags */}
            {selectedEvidence.tags && selectedEvidence.tags.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedEvidence.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Integrity Hashes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Integrity Hashes
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadEvidence(selectedEvidence)}
                    disabled={!capabilities?.canExportEvidence || downloading || !selectedEvidence.storage_path}
                  >
                    {downloading ? (
                      <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin mr-1" />
                    ) : (
                      <Download className="h-3 w-3 mr-1" />
                    )}
                    Download File
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportEvidence(selectedEvidence)}
                    disabled={!capabilities?.canExportEvidence}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Export Metadata
                  </Button>
                </div>
              </div>
              
              {/* MD5 Hash */}
              <div className="bg-background border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">MD5</p>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(selectedEvidence.hash_md5, 'MD5 hash')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500"
                      onClick={() => handleDeleteEvidence(selectedEvidence)}
                      disabled={!capabilities?.canEditEvidence}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="font-mono text-xs break-all bg-muted/30 p-2 rounded">
                  {selectedEvidence.hash_md5}
                </p>
              </div>

              {/* SHA-256 Hash */}
              <div className="bg-background border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">SHA-256</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(selectedEvidence.hash_sha256, 'SHA-256 hash')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="font-mono text-xs break-all bg-muted/30 p-2 rounded">
                  {selectedEvidence.hash_sha256}
                </p>
              </div>
            </div>

            {/* Chain of Custody */}
            {selectedEvidence.custody_chain && selectedEvidence.custody_chain.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium">Chain of Custody</p>
                <div className="space-y-3">
                  {selectedEvidence.custody_chain.map((chain, index) => (
                    <div key={index} className="bg-muted/30 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Transfer #{index + 1}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(chain.transferred_at)}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-2">
                        <div>
                          <p className="text-xs text-muted-foreground">From</p>
                          <p className="text-sm font-medium">{chain.from.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">To</p>
                          <p className="text-sm font-medium">{chain.to.name}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Reason</p>
                        <p className="text-sm">{chain.reason}</p>
                      </div>
                      {chain.location && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">Location</p>
                          <p className="text-sm">{chain.location}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis Results */}
            {selectedEvidence.analysis_results && (
              <div className="space-y-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <FileSearch className="h-4 w-4" />
                  Analysis Results
                </p>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(selectedEvidence.analysis_results, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Evidence Management</h2>
          <p className="text-muted-foreground">
            Collect and manage digital evidence with chain of custody
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Database className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">
              Files are securely stored in Supabase Storage
            </p>
          </div>
        </div>
        {capabilities?.canUploadEvidence && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Upload Evidence
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Upload New Evidence</DialogTitle>
                <DialogDescription>
                  Upload digital evidence to Supabase Storage with automatic hash calculation.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="evidence-file">Evidence File *</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="evidence-file"
                      type="file"
                      onChange={handleFileSelect}
                      disabled={calculating || uploading}
                      className="flex-1"
                    />
                  </div>
                  {selectedFile && (
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(selectedFile.size)} • {selectedFile.type}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          setMd5Hash('');
                          setSha256Hash('');
                        }}
                        disabled={calculating || uploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Hash Display */}
                {(md5Hash || sha256Hash || calculating) && (
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-medium">File Integrity Hashes</Label>
                    </div>
                    {calculating ? (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span>Calculating file hashes...</span>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-muted-foreground">MD5</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => copyToClipboard(md5Hash, 'MD5 hash')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs font-mono bg-background p-2 rounded border break-all">
                            {md5Hash}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-muted-foreground">SHA-256</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => copyToClipboard(sha256Hash, 'SHA-256 hash')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs font-mono bg-background p-2 rounded border break-all">
                            {sha256Hash}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the evidence, where it was found, and its relevance to the investigation..."
                    value={newEvidence.description}
                    onChange={(e) => setNewEvidence({ ...newEvidence, description: e.target.value })}
                    rows={3}
                    disabled={uploading}
                  />
                </div>

                {/* Storage Location - Fixed to Supabase */}
                <div className="space-y-2">
                  <Label>Storage Location</Label>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                    <Database className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-700">Supabase Storage</p>
                      <p className="text-xs text-blue-600">
                        Secure cloud storage with encryption
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      placeholder="Add tag (e.g., malware, logs, screenshot, network)"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      disabled={uploading}
                    />
                    <Button 
                      type="button" 
                      onClick={addTag} 
                      variant="outline"
                      disabled={uploading}
                    >
                      Add
                    </Button>
                  </div>
                  {newEvidence.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newEvidence.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="hover:text-red-500"
                            disabled={uploading}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Auto-tag Info */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Role-based auto-tagging:</strong> Evidence will be automatically tagged as "{capabilities?.evidenceTag}"
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Collected as: {user?.role.replace('_', ' ').toUpperCase()}
                  </p>
                </div>

                {/* Supabase Info */}
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Database className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-700">Secure Cloud Storage</p>
                      <p className="text-xs text-green-600">
                        Files are encrypted and stored in Supabase Storage
                      </p>
                    </div>
                  </div>
                  <ul className="text-xs text-green-600 space-y-1">
                    <li>• End-to-end encryption</li>
                    <li>• Automatic backups</li>
                    <li>• Access control with signed URLs</li>
                    <li>• 100MB maximum file size</li>
                  </ul>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  onClick={handleAddEvidence} 
                  className="w-full gap-2"
                  disabled={!selectedFile || calculating || !md5Hash || uploading}
                >
                  {uploading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading to Supabase...
                    </>
                  ) : calculating ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Calculating Hashes...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4" />
                      Upload to Supabase Storage
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Evidence Grid */}
      <div className="grid grid-cols-1 gap-4">
        {evidence.map((item) => {
          const IconComponent = fileTypeIcons[item.file_type] || fileTypeIcons.default;
          const statusCfg = statusConfig[item.analysis_status];
          const integrityCfg = integrityConfig[item.integrity_status];
          const StatusIcon = statusCfg.icon;
          const IntegrityIcon = integrityCfg.icon;

          return (
            <div key={item.id} className="glass-card rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                  <IconComponent className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-primary text-sm bg-primary/10 px-2 py-0.5 rounded">
                      {item.id}
                    </span>
                    <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${statusCfg.className} bg-opacity-10`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusCfg.label}
                    </span>
                    <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${integrityCfg.className} bg-opacity-10`}>
                      <IntegrityIcon className="h-3 w-3" />
                      {integrityCfg.label}
                    </span>
                    <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      <Database className="h-3 w-3" />
                      Supabase
                    </span>
                  </div>
                  <p className="font-medium truncate">{item.filename}</p>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  
                  {/* Tags Display */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {item.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Size</p>
                      <p className="font-mono">{formatFileSize(item.file_size)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Collected By</p>
                      <p className="truncate">{item.collected_by.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Custodian</p>
                      <p className="truncate">{item.current_custodian.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Collected At</p>
                      <p className="truncate">{formatDate(item.collected_at)}</p>
                    </div>
                  </div>
                  
                  {/* Storage Info */}
                  {item.storage_path && (
                    <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="h-3 w-3 text-blue-600" />
                        <p className="text-xs text-blue-700">Supabase Storage Path</p>
                      </div>
                      <p className="font-mono text-xs text-blue-600 break-all line-clamp-1">
                        {item.storage_path}
                      </p>
                    </div>
                  )}
                  
                  {/* Hash Preview */}
                  <div className="mt-4 p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">File Integrity Hashes</p>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">MD5:</p>
                        <p className="font-mono text-xs break-all line-clamp-1">
                          {item.hash_md5}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">SHA-256:</p>
                        <p className="font-mono text-xs break-all line-clamp-1">
                          {item.hash_sha256}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1"
                    onClick={() => handleViewEvidence(item)}
                    disabled={!capabilities?.canViewEvidence}
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1"
                    onClick={() => handleDownloadEvidence(item)}
                    disabled={!capabilities?.canExportEvidence || !item.storage_path || downloading}
                  >
                    {downloading ? (
                      <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download className="h-3 w-3" />
                    )}
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1"
                    onClick={() => handleExportEvidence(item)}
                    disabled={!capabilities?.canExportEvidence}
                  >
                    <FileText className="h-3 w-3" />
                    Metadata
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteEvidence(item)}
                    disabled={!capabilities?.canEditEvidence}
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {evidence.length === 0 && (
          <div className="glass-card rounded-xl p-12 text-center">
            <Database className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Evidence Collected</h3>
            <p className="text-muted-foreground mb-2">
              No evidence has been collected for this incident yet.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Files will be securely stored in Supabase Storage.
            </p>
            {capabilities?.canUploadEvidence && (
              <Button 
                variant="outline" 
                className="mt-4 gap-2" 
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Upload First Evidence
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Evidence Detail Sheet */}
      <EvidenceDetailSheet />
    </div>
  );
}