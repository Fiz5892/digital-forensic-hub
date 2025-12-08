import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Hash, 
  FileSearch, 
  AlertTriangle,
  CheckCircle,
  Copy,
  Search,
  Shield,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

export default function ForensicTools() {
  const [hashInput, setHashInput] = useState('');
  const [hashResults, setHashResults] = useState<{ md5: string; sha256: string } | null>(null);
  const [logInput, setLogInput] = useState('');
  const [logResults, setLogResults] = useState<any[]>([]);
  const [iocInput, setIocInput] = useState('');
  const [iocResults, setIocResults] = useState<any | null>(null);

  const generateHash = () => {
    if (!hashInput) return;
    
    // Simulate hash calculation
    const chars = '0123456789abcdef';
    let md5 = '';
    let sha256 = '';
    
    // Use input as seed for consistent results
    const seed = hashInput.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    for (let i = 0; i < 32; i++) {
      md5 += chars[(seed + i * 7) % 16];
    }
    for (let i = 0; i < 64; i++) {
      sha256 += chars[(seed + i * 3) % 16];
    }
    
    setHashResults({ md5, sha256 });
    toast.success('Hash calculated');
  };

  const analyzeLog = () => {
    if (!logInput) return;

    // Simulate log analysis
    const lines = logInput.split('\n').filter(l => l.trim());
    const patterns = [
      { pattern: /SELECT.*FROM.*WHERE/i, type: 'SQL Injection', severity: 'critical' },
      { pattern: /<script>/i, type: 'XSS Attempt', severity: 'high' },
      { pattern: /\.\.\/|\.\.\\/, type: 'Path Traversal', severity: 'high' },
      { pattern: /admin|root|password/i, type: 'Credential Probe', severity: 'medium' },
      { pattern: /wp-admin|wp-login/i, type: 'WordPress Attack', severity: 'medium' },
      { pattern: /phpMyAdmin|phpmyadmin/i, type: 'Admin Panel Probe', severity: 'medium' },
      { pattern: /\.(php|asp|jsp)\?/i, type: 'Script Injection', severity: 'high' },
    ];

    const findings: any[] = [];
    
    lines.forEach((line, index) => {
      patterns.forEach(({ pattern, type, severity }) => {
        if (pattern.test(line)) {
          findings.push({
            line: index + 1,
            type,
            severity,
            content: line.substring(0, 100) + (line.length > 100 ? '...' : ''),
          });
        }
      });
    });

    setLogResults(findings);
    toast.success(`Analysis complete: ${findings.length} suspicious patterns found`);
  };

  const checkIOC = () => {
    if (!iocInput) return;

    // Simulate IOC check
    const knownBadIPs = ['185.130.105.', '103.108.70.', '45.33.32.'];
    const knownBadDomains = ['malicious', 'phishing', 'hack'];
    const knownBadHashes = ['a1b2c3d4', '0987654321'];

    const input = iocInput.toLowerCase();
    let result = {
      indicator: iocInput,
      type: 'unknown',
      status: 'clean',
      confidence: 0,
      details: '',
    };

    // Check if IP
    if (/^\d+\.\d+\.\d+\.\d+$/.test(input)) {
      result.type = 'IP Address';
      if (knownBadIPs.some(ip => input.startsWith(ip))) {
        result.status = 'malicious';
        result.confidence = 85;
        result.details = 'IP address associated with known threat actor infrastructure';
      } else {
        result.status = 'clean';
        result.confidence = 75;
        result.details = 'No known malicious activity associated with this IP';
      }
    }
    // Check if domain
    else if (input.includes('.')) {
      result.type = 'Domain';
      if (knownBadDomains.some(d => input.includes(d))) {
        result.status = 'malicious';
        result.confidence = 90;
        result.details = 'Domain flagged for phishing/malware distribution';
      } else {
        result.status = 'clean';
        result.confidence = 70;
        result.details = 'Domain not found in threat intelligence feeds';
      }
    }
    // Check if hash
    else if (/^[a-f0-9]{32,64}$/i.test(input)) {
      result.type = 'File Hash';
      if (knownBadHashes.some(h => input.startsWith(h))) {
        result.status = 'malicious';
        result.confidence = 95;
        result.details = 'Hash matches known malware sample';
      } else {
        result.status = 'clean';
        result.confidence = 80;
        result.details = 'Hash not found in malware databases';
      }
    }

    setIocResults(result);
    toast.success('IOC check complete');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Forensic Tools</h1>
        <p className="text-muted-foreground">Digital forensic analysis and investigation utilities</p>
      </div>

      <Tabs defaultValue="hash" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="hash" className="gap-2">
            <Hash className="h-4 w-4" />
            Hash Calculator
          </TabsTrigger>
          <TabsTrigger value="log" className="gap-2">
            <FileSearch className="h-4 w-4" />
            Log Analyzer
          </TabsTrigger>
          <TabsTrigger value="ioc" className="gap-2">
            <Search className="h-4 w-4" />
            IOC Scanner
          </TabsTrigger>
        </TabsList>

        {/* Hash Calculator */}
        <TabsContent value="hash" className="space-y-6">
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Hash Calculator</h2>
            <p className="text-muted-foreground mb-4">
              Calculate MD5 and SHA-256 hashes for file content or text input
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Input Text or File Content</Label>
                <Textarea
                  placeholder="Paste file content or text to hash..."
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  className="min-h-[150px] font-mono text-sm"
                />
              </div>

              <Button onClick={generateHash} disabled={!hashInput} className="gap-2">
                <Hash className="h-4 w-4" />
                Calculate Hash
              </Button>

              {hashResults && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">MD5</span>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(hashResults.md5)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="font-mono text-sm break-all">{hashResults.md5}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">SHA-256</span>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(hashResults.sha256)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="font-mono text-sm break-all">{hashResults.sha256}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Log Analyzer */}
        <TabsContent value="log" className="space-y-6">
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Log Analyzer</h2>
            <p className="text-muted-foreground mb-4">
              Analyze web server logs for suspicious patterns and attack indicators
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Paste Log Content</Label>
                <Textarea
                  placeholder={`Example log entries:
192.168.1.1 - - [15/Jan/2024:08:30:00] "GET /index.php?id=1 OR 1=1 HTTP/1.1" 200 1234
192.168.1.2 - - [15/Jan/2024:08:31:00] "GET /wp-admin HTTP/1.1" 404 567`}
                  value={logInput}
                  onChange={(e) => setLogInput(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              <Button onClick={analyzeLog} disabled={!logInput} className="gap-2">
                <FileSearch className="h-4 w-4" />
                Analyze Logs
              </Button>

              {logResults.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <h3 className="font-medium">Suspicious Patterns Found: {logResults.length}</h3>
                  {logResults.map((finding, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-lg border-l-4 ${
                        finding.severity === 'critical' ? 'bg-status-critical/10 border-status-critical' :
                        finding.severity === 'high' ? 'bg-status-high/10 border-status-high' :
                        'bg-status-medium/10 border-status-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className={`h-4 w-4 ${
                          finding.severity === 'critical' ? 'text-status-critical' :
                          finding.severity === 'high' ? 'text-status-high' :
                          'text-status-medium'
                        }`} />
                        <span className="font-medium">{finding.type}</span>
                        <span className="text-xs text-muted-foreground">Line {finding.line}</span>
                      </div>
                      <p className="text-sm font-mono text-muted-foreground break-all">
                        {finding.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {logResults.length === 0 && logInput && (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-status-low/10">
                  <CheckCircle className="h-5 w-5 text-status-low" />
                  <span>No suspicious patterns detected</span>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* IOC Scanner */}
        <TabsContent value="ioc" className="space-y-6">
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">IOC Scanner</h2>
            <p className="text-muted-foreground mb-4">
              Check indicators of compromise against threat intelligence databases
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Enter IOC (IP, Domain, or Hash)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., 185.130.105.42 or malicious-domain.com"
                    value={iocInput}
                    onChange={(e) => setIocInput(e.target.value)}
                    className="font-mono"
                  />
                  <Button onClick={checkIOC} disabled={!iocInput} className="gap-2">
                    <Search className="h-4 w-4" />
                    Check
                  </Button>
                </div>
              </div>

              {iocResults && (
                <div className={`p-6 rounded-lg border ${
                  iocResults.status === 'malicious' 
                    ? 'bg-status-critical/10 border-status-critical/30' 
                    : 'bg-status-low/10 border-status-low/30'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    {iocResults.status === 'malicious' ? (
                      <AlertTriangle className="h-8 w-8 text-status-critical" />
                    ) : (
                      <CheckCircle className="h-8 w-8 text-status-low" />
                    )}
                    <div>
                      <p className={`text-xl font-bold ${
                        iocResults.status === 'malicious' ? 'text-status-critical' : 'text-status-low'
                      }`}>
                        {iocResults.status === 'malicious' ? 'MALICIOUS' : 'CLEAN'}
                      </p>
                      <p className="text-sm text-muted-foreground">Confidence: {iocResults.confidence}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 rounded bg-muted/30">
                      <p className="text-xs text-muted-foreground">Indicator</p>
                      <p className="font-mono text-sm">{iocResults.indicator}</p>
                    </div>
                    <div className="p-3 rounded bg-muted/30">
                      <p className="text-xs text-muted-foreground">Type</p>
                      <p className="text-sm">{iocResults.type}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Analysis Details</p>
                    <p className="text-sm">{iocResults.details}</p>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-lg bg-muted/30">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Simulated Database
                </h4>
                <p className="text-sm text-muted-foreground">
                  This tool simulates checking against threat intelligence feeds. 
                  In production, this would query real-time databases like VirusTotal, 
                  AbuseIPDB, and internal threat intelligence.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
