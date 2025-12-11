import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Database, 
  Mail, 
  Clock,
  Save,
  RefreshCw,
  Palette,
  Sun,
  Moon,
  Leaf
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState({
    // General
    incidentPrefix: 'INC',
    timezone: 'UTC',
    dateFormat: 'yyyy-MM-dd',
    language: 'en',
    
    // Notifications
    emailNotifications: true,
    slackNotifications: false,
    criticalAlerts: true,
    dailyDigest: true,
    
    // Security
    sessionTimeout: 30,
    mfaEnabled: false,
    passwordExpiry: 90,
    auditLogging: true,
    
    // Evidence
    maxFileSize: 50,
    retentionDays: 365,
    autoArchive: true,
    hashAlgorithm: 'SHA-256',
    
    // Email
    smtpServer: 'smtp.dfir.com',
    smtpPort: '587',
    senderEmail: 'noreply@dfir.com',
    senderName: 'DFIR System',
  });

  const handleSave = () => {
    localStorage.setItem('dfir_settings', JSON.stringify(settings));
    toast.success('Settings saved successfully');
  };

  const handleReset = () => {
    toast.info('Settings reset to default values');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage system configuration and preferences</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="general" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="evidence" className="gap-2">
            <Database className="h-4 w-4" />
            Evidence
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">General Settings</CardTitle>
              <CardDescription>Configure basic system preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="prefix">Incident ID Prefix</Label>
                  <Input
                    id="prefix"
                    value={settings.incidentPrefix}
                    onChange={(e) => setSettings({ ...settings, incidentPrefix: e.target.value })}
                    placeholder="INC"
                  />
                  <p className="text-xs text-muted-foreground">Prefix for new incident IDs (e.g., INC-2024-001)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={settings.timezone}
                    onValueChange={(value) => setSettings({ ...settings, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">GMT (London)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Japan Standard Time</SelectItem>
                      <SelectItem value="Asia/Singapore">Singapore Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select 
                    value={settings.dateFormat}
                    onValueChange={(value) => setSettings({ ...settings, dateFormat: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yyyy-MM-dd">2024-01-15 (ISO)</SelectItem>
                      <SelectItem value="MM/dd/yyyy">01/15/2024 (US)</SelectItem>
                      <SelectItem value="dd/MM/yyyy">15/01/2024 (EU)</SelectItem>
                      <SelectItem value="dd-MMM-yyyy">15-Jan-2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select 
                    value={settings.language}
                    onValueChange={(value) => setSettings({ ...settings, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="id">Bahasa Indonesia</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Appearance</CardTitle>
              <CardDescription>Customize the look and feel of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-foreground">Theme</Label>
                <p className="text-sm text-muted-foreground mb-4">Select your preferred color scheme</p>
                
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                      theme === 'light' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-white border flex items-center justify-center">
                      <Sun className="h-6 w-6 text-amber-500" />
                    </div>
                    <span className="font-medium text-foreground">Light</span>
                    {theme === 'light' && (
                      <span className="text-xs text-primary">Active</span>
                    )}
                  </button>

                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                      theme === 'dark' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center">
                      <Moon className="h-6 w-6 text-slate-300" />
                    </div>
                    <span className="font-medium text-foreground">Dark</span>
                    {theme === 'dark' && (
                      <span className="text-xs text-primary">Active</span>
                    )}
                  </button>

                  <button
                    onClick={() => setTheme('cyber')}
                    className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                      theme === 'cyber' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-900 to-black border border-emerald-500/50 flex items-center justify-center">
                      <Leaf className="h-6 w-6 text-emerald-400" />
                    </div>
                    <span className="font-medium text-foreground">Cyber Green</span>
                    {theme === 'cyber' && (
                      <span className="text-xs text-primary">Active</span>
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Notification Settings</CardTitle>
              <CardDescription>Configure how you receive alerts and updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive incident updates via email</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Slack Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send alerts to Slack channels</p>
                  </div>
                  <Switch
                    checked={settings.slackNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, slackNotifications: checked })}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Critical Alerts</Label>
                    <p className="text-sm text-muted-foreground">Immediate alerts for critical incidents</p>
                  </div>
                  <Switch
                    checked={settings.criticalAlerts}
                    onCheckedChange={(checked) => setSettings({ ...settings, criticalAlerts: checked })}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Daily Digest</Label>
                    <p className="text-sm text-muted-foreground">Receive daily summary of all incidents</p>
                  </div>
                  <Switch
                    checked={settings.dailyDigest}
                    onCheckedChange={(checked) => setSettings({ ...settings, dailyDigest: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Security Settings</CardTitle>
              <CardDescription>Configure authentication and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">Auto logout after inactivity</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                  <Input
                    id="passwordExpiry"
                    type="number"
                    value={settings.passwordExpiry}
                    onChange={(e) => setSettings({ ...settings, passwordExpiry: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">Force password change after period</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Multi-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Require MFA for all users</p>
                  </div>
                  <Switch
                    checked={settings.mfaEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, mfaEnabled: checked })}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">Log all user actions for compliance</p>
                  </div>
                  <Switch
                    checked={settings.auditLogging}
                    onCheckedChange={(checked) => setSettings({ ...settings, auditLogging: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evidence Settings */}
        <TabsContent value="evidence">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Evidence Settings</CardTitle>
              <CardDescription>Configure evidence storage and retention policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Maximum File Size (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={settings.maxFileSize}
                    onChange={(e) => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retentionDays">Retention Period (days)</Label>
                  <Input
                    id="retentionDays"
                    type="number"
                    value={settings.retentionDays}
                    onChange={(e) => setSettings({ ...settings, retentionDays: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hashAlgorithm">Hash Algorithm</Label>
                  <Select 
                    value={settings.hashAlgorithm}
                    onValueChange={(value) => setSettings({ ...settings, hashAlgorithm: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MD5">MD5</SelectItem>
                      <SelectItem value="SHA-1">SHA-1</SelectItem>
                      <SelectItem value="SHA-256">SHA-256</SelectItem>
                      <SelectItem value="SHA-512">SHA-512</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-foreground">Auto-Archive</Label>
                  <p className="text-sm text-muted-foreground">Automatically archive closed incidents</p>
                </div>
                <Switch
                  checked={settings.autoArchive}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoArchive: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Email Settings</CardTitle>
              <CardDescription>Configure SMTP server for email notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtpServer">SMTP Server</Label>
                  <Input
                    id="smtpServer"
                    value={settings.smtpServer}
                    onChange={(e) => setSettings({ ...settings, smtpServer: e.target.value })}
                    placeholder="smtp.example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    value={settings.smtpPort}
                    onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                    placeholder="587"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senderEmail">Sender Email</Label>
                  <Input
                    id="senderEmail"
                    type="email"
                    value={settings.senderEmail}
                    onChange={(e) => setSettings({ ...settings, senderEmail: e.target.value })}
                    placeholder="noreply@dfir.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senderName">Sender Name</Label>
                  <Input
                    id="senderName"
                    value={settings.senderName}
                    onChange={(e) => setSettings({ ...settings, senderName: e.target.value })}
                    placeholder="DFIR System"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button variant="outline" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Send Test Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
