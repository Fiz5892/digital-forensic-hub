import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
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
} from '@/components/ui/dialog';
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
  Shield
} from 'lucide-react';
import { Evidence } from '@/lib/types';
import { toast } from 'sonner';

interface EvidenceTabProps {
  incidentId: string;
}

const fileTypeIcons: Record<string, React.ElementType> = {
  'image/png': Image,
  'image/jpeg': Image,
  'text/plain': FileText,
  'application/x-php': Code,
  'application/json': Code,
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
  const { getEvidenceForIncident, addEvidence, getNextEvidenceId } = useData();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);

  const evidence = getEvidenceForIncident(incidentId);

  const [newEvidence, setNewEvidence] = useState({
    filename: '',
    description: '',
    file_type: 'text/plain',
  });

  const generateHash = () => {
    // Simulate hash generation
    const chars = '0123456789abcdef';
    let md5 = '';
    let sha256 = '';
    for (let i = 0; i < 32; i++) md5 += chars[Math.floor(Math.random() * 16)];
    for (let i = 0; i < 64; i++) sha256 += chars[Math.floor(Math.random() * 16)];
    return { md5, sha256 };
  };

  const handleAddEvidence = () => {
    if (!newEvidence.filename || !user) return;

    const hashes = generateHash();
    const evidenceItem: Evidence = {
      id: getNextEvidenceId(incidentId),
      incident_id: incidentId,
      filename: newEvidence.filename,
      file_type: newEvidence.file_type,
      file_size: Math.floor(Math.random() * 10000000),
      hash_md5: hashes.md5,
      hash_sha256: hashes.sha256,
      collected_by: { id: user.id, name: user.name },
      collected_at: new Date().toISOString(),
      current_custodian: { id: user.id, name: user.name },
      storage_location: `Secure Server #1 /evidence/${incidentId}/`,
      analysis_status: 'pending',
      integrity_status: 'verified',
      description: newEvidence.description,
      custody_chain: [{
        sequence: 1,
        from: 'System',
        to: user.name,
        timestamp: new Date().toISOString(),
        reason: 'Initial collection',
        hash_verified: true,
      }]
    };

    addEvidence(evidenceItem);
    toast.success('Evidence added', { description: `${newEvidence.filename} has been uploaded` });
    setNewEvidence({ filename: '', description: '', file_type: 'text/plain' });
    setIsDialogOpen(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Evidence Management</h2>
          <p className="text-muted-foreground">Collect and manage digital evidence with chain of custody</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Upload Evidence
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Evidence</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Filename *</Label>
                <Input
                  placeholder="e.g., access-log-2024-01-15.log"
                  value={newEvidence.filename}
                  onChange={(e) => setNewEvidence({ ...newEvidence, filename: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>File Type</Label>
                <select 
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={newEvidence.file_type}
                  onChange={(e) => setNewEvidence({ ...newEvidence, file_type: e.target.value })}
                >
                  <option value="text/plain">Log File (.log, .txt)</option>
                  <option value="image/png">Image (.png)</option>
                  <option value="image/jpeg">Image (.jpg)</option>
                  <option value="application/json">JSON (.json)</option>
                  <option value="application/x-php">PHP Script (.php)</option>
                  <option value="application/octet-stream">Binary File</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the evidence and its relevance..."
                  value={newEvidence.description}
                  onChange={(e) => setNewEvidence({ ...newEvidence, description: e.target.value })}
                />
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-dashed border-border">
                <p className="text-sm text-muted-foreground text-center">
                  Drag & drop files here or click to browse<br />
                  <span className="text-xs">(Simulation - files are not actually uploaded)</span>
                </p>
              </div>
              <Button onClick={handleAddEvidence} className="w-full">
                Upload & Calculate Hash
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
            <div key={item.id} className="glass-card rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <IconComponent className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-primary text-sm">{item.id}</span>
                    <span className={`flex items-center gap-1 text-xs ${statusCfg.className}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusCfg.label}
                    </span>
                    <span className={`flex items-center gap-1 text-xs ${integrityCfg.className}`}>
                      <IntegrityIcon className="h-3 w-3" />
                      {integrityCfg.label}
                    </span>
                  </div>
                  <p className="font-medium">{item.filename}</p>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Size</p>
                      <p className="font-mono">{formatFileSize(item.file_size)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Collected By</p>
                      <p>{item.collected_by.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Custodian</p>
                      <p>{item.current_custodian.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Collected At</p>
                      <p>{new Date(item.collected_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">MD5 Hash</p>
                    <p className="font-mono text-xs break-all">{item.hash_md5}</p>
                    <p className="text-xs text-muted-foreground mb-1 mt-2">SHA-256 Hash</p>
                    <p className="font-mono text-xs break-all">{item.hash_sha256}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" className="gap-1">
                    <Eye className="h-3 w-3" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="h-3 w-3" />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {evidence.length === 0 && (
          <div className="glass-card rounded-xl p-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No evidence collected yet</p>
            <Button variant="outline" className="mt-4 gap-2" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Upload First Evidence
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
