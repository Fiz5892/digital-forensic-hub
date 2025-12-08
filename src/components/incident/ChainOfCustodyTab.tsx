import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
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
  Shield
} from 'lucide-react';
import { Evidence, CustodyTransfer } from '@/lib/types';
import { mockUsers } from '@/lib/mockData';
import { toast } from 'sonner';

interface ChainOfCustodyTabProps {
  incidentId: string;
}

export function ChainOfCustodyTab({ incidentId }: ChainOfCustodyTabProps) {
  const { getEvidenceForIncident, updateEvidence } = useData();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string>('');
  
  const evidence = getEvidenceForIncident(incidentId);

  const [transfer, setTransfer] = useState({
    to: '',
    reason: '',
    witness: '',
    hashVerified: true,
  });

  const investigators = mockUsers.filter(u => 
    ['investigator', 'first_responder', 'manager'].includes(u.role)
  );

  const handleTransfer = () => {
    if (!selectedEvidenceId || !transfer.to || !transfer.reason || !user) return;

    const targetEvidence = evidence.find(e => e.id === selectedEvidenceId);
    if (!targetEvidence) return;

    const toUser = mockUsers.find(u => u.id === parseInt(transfer.to));
    if (!toUser) return;

    const newTransfer: CustodyTransfer = {
      sequence: targetEvidence.custody_chain.length + 1,
      from: user.name,
      to: toUser.name,
      timestamp: new Date().toISOString(),
      reason: transfer.reason,
      hash_verified: transfer.hashVerified,
      witness: transfer.witness || undefined,
    };

    updateEvidence(selectedEvidenceId, {
      custody_chain: [...targetEvidence.custody_chain, newTransfer],
      current_custodian: { id: toUser.id, name: toUser.name },
    });

    toast.success('Custody transferred', { 
      description: `Evidence transferred to ${toUser.name}` 
    });
    
    setTransfer({ to: '', reason: '', witness: '', hashVerified: true });
    setSelectedEvidenceId('');
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Chain of Custody</h2>
          <p className="text-muted-foreground">Track evidence handling and transfers</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={evidence.length === 0}>
              <ArrowRight className="h-4 w-4" />
              Transfer Evidence
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transfer Evidence Custody</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Evidence Item *</Label>
                <Select value={selectedEvidenceId} onValueChange={setSelectedEvidenceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select evidence..." />
                  </SelectTrigger>
                  <SelectContent>
                    {evidence.map(e => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.id} - {e.filename}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedEvidenceId && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Current Custodian</p>
                  <p className="font-medium">
                    {evidence.find(e => e.id === selectedEvidenceId)?.current_custodian.name}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Transfer To *</Label>
                <Select value={transfer.to} onValueChange={(v) => setTransfer({ ...transfer, to: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient..." />
                  </SelectTrigger>
                  <SelectContent>
                    {investigators.filter(i => i.id !== user?.id).map(inv => (
                      <SelectItem key={inv.id} value={inv.id.toString()}>
                        {inv.name} ({inv.role.replace('_', ' ')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reason for Transfer *</Label>
                <Textarea
                  placeholder="e.g., Handover for specialized analysis..."
                  value={transfer.reason}
                  onChange={(e) => setTransfer({ ...transfer, reason: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Witness (Optional)</Label>
                <Input
                  placeholder="Name of witness..."
                  value={transfer.witness}
                  onChange={(e) => setTransfer({ ...transfer, witness: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="hashVerified"
                  checked={transfer.hashVerified}
                  onCheckedChange={(checked) => setTransfer({ ...transfer, hashVerified: !!checked })}
                />
                <Label htmlFor="hashVerified" className="text-sm">
                  Hash verified before transfer
                </Label>
              </div>

              <Button onClick={handleTransfer} className="w-full">
                Complete Transfer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Evidence Custody Cards */}
      <div className="space-y-6">
        {evidence.map((item) => (
          <div key={item.id} className="glass-card rounded-xl p-6">
            {/* Evidence Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <span className="font-mono text-primary text-sm">{item.id}</span>
                <p className="font-semibold">{item.filename}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Current Custodian</p>
                <p className="font-medium">{item.current_custodian.name}</p>
              </div>
            </div>

            {/* Custody Chain */}
            <div className="relative pl-6">
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
              
              {item.custody_chain.map((transfer, index) => (
                <div key={index} className="relative mb-4 last:mb-0">
                  {/* Connector dot */}
                  <div className="absolute -left-3 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                  
                  <div className="ml-4 p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                        #{transfer.sequence}
                      </span>
                      <span className={`flex items-center gap-1 text-xs ${transfer.hash_verified ? 'text-status-low' : 'text-status-critical'}`}>
                        {transfer.hash_verified ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {transfer.hash_verified ? 'Hash Verified' : 'Hash Not Verified'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{transfer.from}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-primary" />
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{transfer.to}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">{transfer.reason}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(transfer.timestamp).toLocaleString()}
                      </span>
                      {transfer.witness && (
                        <span>Witness: {transfer.witness}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {evidence.length === 0 && (
          <div className="glass-card rounded-xl p-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No evidence to track</p>
            <p className="text-sm text-muted-foreground mt-1">Upload evidence first to track chain of custody</p>
          </div>
        )}
      </div>
    </div>
  );
}
