// src/components/incident/ChainOfCustodyTab.tsx
import { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { getUserCapabilities } from '@/config/routes.config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowRight, 
  CheckCircle, 
  XCircle,
  User,
  Clock,
  FileText,
  Shield,
  Lock,
  AlertCircle,
  Hash
} from 'lucide-react';
import { Evidence, CustodyChainEntry } from '@/lib/types';
import { toast } from 'sonner';
import { logAudit } from '@/lib/auditLogger';
import { v4 as uuidv4 } from 'uuid';

interface ChainOfCustodyTabProps {
  incidentId: string;
}

interface TransferFormData {
  to: string;
  reason: string;
  witness: string;
  hashVerified: boolean;
  location: string;
}

export function ChainOfCustodyTab({ incidentId }: ChainOfCustodyTabProps) {
  const { getEvidenceForIncident, updateEvidence, users } = useData();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  const evidence = getEvidenceForIncident(incidentId);
  const capabilities = user ? getUserCapabilities(user.role) : null;

  // Debug: Check data structure
  useEffect(() => {
    console.log('🔍 Chain of Custody - Evidence Data:', evidence);
    if (evidence.length > 0) {
      evidence.forEach((item, index) => {
        console.log(`Evidence ${index}:`, {
          id: item.id,
          filename: item.filename,
          current_custodian: item.current_custodian,
          custody_chain_type: typeof item.custody_chain,
          custody_chain_length: Array.isArray(item.custody_chain) ? item.custody_chain.length : 'not array',
          custody_chain_sample: Array.isArray(item.custody_chain) && item.custody_chain.length > 0 
            ? item.custody_chain[0] 
            : null
        });
      });
    }
  }, [evidence]);

  const [transfer, setTransfer] = useState<TransferFormData>({
    to: '',
    reason: '',
    witness: '',
    hashVerified: true,
    location: 'secure-lab-01',
  });

  // Filter users who can receive evidence
  const availableRecipients = users.filter(u => 
    u.id !== user?.id && 
    ['investigator', 'first_responder', 'manager', 'admin'].includes(u.role)
  );

  // ❌ PERMISSION CHECK
  if (!capabilities?.canManageCustody && !capabilities?.canViewEvidence) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <Lock className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
        <p className="text-muted-foreground">
          You don't have permission to access chain of custody records.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Chain of custody can only be managed by Investigators and Managers.
        </p>
      </div>
    );
  }

  // Helper function to safely get custodian name
  const getCustodianName = (custodian: any): string => {
    if (!custodian) return 'Unknown';
    if (typeof custodian === 'string') return custodian;
    if (typeof custodian === 'object' && custodian.name) return custodian.name;
    return 'Unknown';
  };

  // Helper function to safely get transfer party name
  const getTransferPartyName = (party: any): string => {
    if (!party) return 'Unknown';
    if (typeof party === 'string') return party;
    if (typeof party === 'object') {
      // Handle both {id, name} format and {from: {id, name}} format
      if (party.name) return party.name;
      if (party.from && typeof party.from === 'object' && party.from.name) return party.from.name;
    }
    return 'Unknown';
  };

  const handleTransfer = async () => {
    if (!selectedEvidenceId || !transfer.to || !transfer.reason || !user) {
      toast.error('Please fill in all required fields');
      return;
    }

    const targetEvidence = evidence.find(e => e.id === selectedEvidenceId);
    if (!targetEvidence) {
      toast.error('Evidence not found');
      return;
    }

    const toUser = users.find(u => u.id === parseInt(transfer.to));
    if (!toUser) {
      toast.error('Invalid user selection');
      return;
    }

    setIsLoading(true);

    try {
      // Ensure custody_chain is an array
      const currentChain: CustodyChainEntry[] = Array.isArray(targetEvidence.custody_chain) 
        ? targetEvidence.custody_chain 
        : [];

      // Create new custody chain entry
      const newTransfer: CustodyChainEntry = {
        from: { 
          id: user.id, 
          name: user.name 
        },
        to: { 
          id: toUser.id, 
          name: toUser.name 
        },
        transferred_at: new Date().toISOString(),
        reason: transfer.reason,
        witness: transfer.witness ? { 
          id: 0, // Placeholder - should be actual witness ID
          name: transfer.witness 
        } : null,
        location: transfer.location,
      };

      // Update evidence with new custody chain
      await updateEvidence(selectedEvidenceId, {
        custody_chain: [...currentChain, newTransfer],
        current_custodian: { 
          id: toUser.id, 
          name: toUser.name 
        },
        storage_location: transfer.location,
      });

      // Log audit trail
      await logAudit({
        action: 'transfer_custody',
        entity_type: 'evidence',
        entity_id: selectedEvidenceId,
        details: {
          incident_id: incidentId,
          evidence_filename: targetEvidence.filename,
          from_user_id: user.id,
          from_user_name: user.name,
          to_user_id: toUser.id,
          to_user_name: toUser.name,
          reason: transfer.reason,
          hash_verified: transfer.hashVerified,
          witness: transfer.witness,
          location: transfer.location
        }
      });

      toast.success('Custody transferred successfully', { 
        description: `${targetEvidence.filename} transferred to ${toUser.name}` 
      });
      
      // Reset form
      setTransfer({ 
        to: '', 
        reason: '', 
        witness: '', 
        hashVerified: true,
        location: 'secure-lab-01'
      });
      setSelectedEvidenceId('');
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error transferring custody:', error);
      toast.error('Failed to transfer custody', {
        description: error.message || 'Please check the console for details'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Chain of Custody</h2>
          <p className="text-muted-foreground">Track evidence handling and custody transfers</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
            <span>Critical for legal admissibility and evidence integrity</span>
          </div>
        </div>
        {capabilities?.canManageCustody && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="gap-2" 
                disabled={evidence.length === 0 || isLoading}
              >
                <ArrowRight className="h-4 w-4" />
                Transfer Evidence
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Transfer Evidence Custody</DialogTitle>
                <DialogDescription>
                  Document the transfer of evidence to maintain chain of custody
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Evidence Selection */}
                <div className="space-y-2">
                  <Label htmlFor="evidence-select">Evidence Item *</Label>
                  <Select 
                    value={selectedEvidenceId} 
                    onValueChange={setSelectedEvidenceId}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="evidence-select">
                      <SelectValue placeholder="Select evidence to transfer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {evidence.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No evidence available for transfer
                        </div>
                      ) : (
                        evidence.map(e => (
                          <SelectItem key={e.id} value={e.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{e.filename}</span>
                              <span className="text-xs text-muted-foreground">
                                Current: {getCustodianName(e.current_custodian)}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Current Custodian Info */}
                {selectedEvidenceId && (
                  <div className="p-3 rounded-lg bg-muted/30 border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Current Custodian</p>
                        <p className="font-medium">
                          {getCustodianName(
                            evidence.find(e => e.id === selectedEvidenceId)?.current_custodian
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Evidence ID</p>
                        <p className="font-mono text-sm">{selectedEvidenceId}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recipient Selection */}
                <div className="space-y-2">
                  <Label htmlFor="recipient-select">Transfer To *</Label>
                  <Select 
                    value={transfer.to} 
                    onValueChange={(v) => setTransfer({ ...transfer, to: v })}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="recipient-select">
                      <SelectValue placeholder="Select recipient..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRecipients.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No available recipients
                        </div>
                      ) : (
                        availableRecipients.map(recipient => (
                          <SelectItem 
                            key={recipient.id} 
                            value={recipient.id.toString()}
                          >
                            <div className="flex items-center gap-2">
                              <span>{recipient.name}</span>
                              <span className="text-xs text-muted-foreground capitalize">
                                ({recipient.role.replace('_', ' ')})
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Transfer Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Transfer Location *</Label>
                  <Select 
                    value={transfer.location} 
                    onValueChange={(v) => setTransfer({ ...transfer, location: v })}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="location">
                      <SelectValue placeholder="Select location..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="secure-lab-01">Secure Lab 01</SelectItem>
                      <SelectItem value="secure-lab-02">Secure Lab 02</SelectItem>
                      <SelectItem value="evidence-vault-a">Evidence Vault A</SelectItem>
                      <SelectItem value="evidence-vault-b">Evidence Vault B</SelectItem>
                      <SelectItem value="digital-forensics-lab">Digital Forensics Lab</SelectItem>
                      <SelectItem value="remote-secure-storage">Remote Secure Storage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Transfer Reason */}
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Transfer *</Label>
                  <Textarea
                    id="reason"
                    placeholder="e.g., Handover for forensic analysis, transfer to investigation team, storage relocation..."
                    value={transfer.reason}
                    onChange={(e) => setTransfer({ ...transfer, reason: e.target.value })}
                    disabled={isLoading}
                    rows={3}
                  />
                </div>

                {/* Witness */}
                <div className="space-y-2">
                  <Label htmlFor="witness">Witness (Optional)</Label>
                  <Input
                    id="witness"
                    placeholder="Name of witness present during transfer..."
                    value={transfer.witness}
                    onChange={(e) => setTransfer({ ...transfer, witness: e.target.value })}
                    disabled={isLoading}
                  />
                </div>

                {/* Hash Verification */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Checkbox
                    id="hashVerified"
                    checked={transfer.hashVerified}
                    onCheckedChange={(checked) => setTransfer({ ...transfer, hashVerified: checked === true })}
                    disabled={isLoading}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="hashVerified" className="text-sm cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-primary" />
                        Verify file integrity hash before transfer
                      </div>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Confirm MD5/SHA-256 hash matches before transferring custody
                    </p>
                  </div>
                </div>

                {/* Legal Warning */}
                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-700">Legal Requirement</p>
                      <p className="text-xs text-yellow-600">
                        Chain of custody documentation is required for evidence to be admissible in court.
                        Ensure all details are accurate.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  onClick={handleTransfer} 
                  className="w-full gap-2"
                  disabled={!selectedEvidenceId || !transfer.to || !transfer.reason || isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing Transfer...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4" />
                      Complete Transfer
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Evidence Custody Cards */}
      <div className="space-y-6">
        {evidence.length > 0 ? (
          evidence.map((item) => {
            // Safely handle custody_chain data
            const custodyChain: CustodyChainEntry[] = Array.isArray(item.custody_chain) 
              ? item.custody_chain 
              : [];
            
            return (
              <div key={item.id} className="glass-card rounded-xl p-6">
                {/* Evidence Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-primary text-sm bg-primary/10 px-2 py-0.5 rounded">
                        {item.id}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.file_type?.split('/')[1]?.toUpperCase() || 'FILE'}
                      </span>
                    </div>
                    <p className="font-semibold truncate">{item.filename}</p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">Current Custodian</p>
                    <p className="font-medium">{getCustodianName(item.current_custodian)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.storage_location || 'Location not specified'}
                    </p>
                  </div>
                </div>

                {/* Hash Information */}
                <div className="mb-6 p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">File Integrity Hashes</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">MD5</p>
                      <p className="font-mono text-xs truncate">{item.hash_md5 || 'Not calculated'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">SHA-256</p>
                      <p className="font-mono text-xs truncate">{item.hash_sha256 || 'Not calculated'}</p>
                    </div>
                  </div>
                </div>

                {/* Custody Chain */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold">Custody Chain</h3>
                    <span className="text-xs text-muted-foreground">
                      {custodyChain.length} transfer{custodyChain.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {custodyChain.length > 0 ? (
                    <div className="relative pl-6">
                      {/* Vertical line */}
                      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
                      
                      {custodyChain.map((transfer, index) => (
                        <div key={index} className="relative mb-4 last:mb-0">
                          {/* Connector dot */}
                          <div className="absolute -left-3 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                          
                          <div className="ml-4 p-4 rounded-lg bg-muted/30 border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                                Transfer #{index + 1}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(transfer.transferred_at)}
                              </span>
                            </div>
                            
                            {/* Transfer parties */}
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">From</p>
                                    <p className="text-sm font-medium">
                                      {getTransferPartyName(transfer.from)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <ArrowRight className="h-4 w-4 text-primary flex-shrink-0" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">To</p>
                                    <p className="text-sm font-medium">
                                      {getTransferPartyName(transfer.to)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Transfer details */}
                            <div className="space-y-2">
                              <div>
                                <p className="text-xs text-muted-foreground">Reason</p>
                                <p className="text-sm">{transfer.reason}</p>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                {transfer.location && (
                                  <div>
                                    <p className="text-xs text-muted-foreground">Location</p>
                                    <p className="text-sm">{transfer.location}</p>
                                  </div>
                                )}
                                {transfer.witness && (
                                  <div>
                                    <p className="text-xs text-muted-foreground">Witness</p>
                                    <p className="text-sm">{getTransferPartyName(transfer.witness)}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground">No custody transfers recorded</p>
                      <p className="text-sm text-muted-foreground">
                        This evidence hasn't been transferred yet
                      </p>
                      {capabilities?.canManageCustody && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3 gap-1"
                          onClick={() => {
                            setSelectedEvidenceId(item.id);
                            setIsDialogOpen(true);
                          }}
                        >
                          <ArrowRight className="h-3 w-3" />
                          Initiate First Transfer
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="glass-card rounded-xl p-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Evidence Found</h3>
            <p className="text-muted-foreground mb-2">
              No evidence has been collected for this incident yet.
            </p>
            <p className="text-sm text-muted-foreground">
              Upload evidence first to establish chain of custody
            </p>
          </div>
        )}
      </div>
    </div>
  );
}