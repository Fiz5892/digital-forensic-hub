import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check,
  AlertTriangle,
  Globe,
  Server,
  Shield,
  Loader2
} from 'lucide-react';
import { incidentTypes, priorityOptions } from '@/lib/mockData';
import { Incident, IncidentPriority, IncidentType } from '@/lib/types';
import { toast } from 'sonner';

const steps = [
  { id: 1, title: 'Basic Info', icon: AlertTriangle },
  { id: 2, title: 'Target Details', icon: Globe },
  { id: 3, title: 'Incident Details', icon: Server },
  { id: 4, title: 'Review & Submit', icon: Check },
];

export default function ReportIncident() {
  const navigate = useNavigate();
  const { addIncident, getNextIncidentId } = useData();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    type: '' as IncidentType | '',
    priority: 'medium' as IncidentPriority,
    target_url: '',
    ip_address: '',
    server_os: '',
    web_server: '',
    cms: '',
    database: '',
    description: '',
    confidentiality: 3,
    integrity: 3,
    availability: 3,
    business_impact: '',
  });

  const updateForm = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.title && formData.type && formData.priority;
      case 2:
        return formData.target_url;
      case 3:
        return formData.description;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to submit an incident');
      return;
    }

    setIsSubmitting(true);

    try {
      const incidentId = getNextIncidentId();
      const newIncident: Incident = {
        id: incidentId,
        title: formData.title,
        description: formData.description,
        type: formData.type as IncidentType,
        status: 'new',
        priority: formData.priority,
        reporter: { id: user.id, name: user.name, email: user.email },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        impact_assessment: {
          confidentiality: formData.confidentiality,
          integrity: formData.integrity,
          availability: formData.availability,
          business_impact: formData.business_impact,
        },
        technical_details: {
          target_url: formData.target_url,
          ip_address: formData.ip_address || 'Unknown',
          server_os: formData.server_os || 'Unknown',
          web_server: formData.web_server || 'Unknown',
          cms: formData.cms || 'Unknown',
          database: formData.database || 'Unknown',
        },
        timeline: [
          {
            id: '1',
            timestamp: new Date().toISOString(),
            event: 'Incident reported via DFIR system',
            type: 'report',
            user: user.name,
          }
        ],
        evidence_ids: [],
        notes: [],
        regulatory_requirements: [],
      };

      await addIncident(newIncident);
      
      toast.success('Incident reported successfully', {
        description: `Incident ${incidentId} has been created and saved to database`
      });
      
      navigate(`/incidents/${incidentId}`);
    } catch (error) {
      console.error('Error submitting incident:', error);
      toast.error('Failed to submit incident', {
        description: 'Please try again or contact support'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Report New Incident</h1>
          <p className="text-muted-foreground">Document and submit a security incident for investigation</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const StepIcon = step.icon;

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCompleted ? 'bg-status-low text-primary-foreground' :
                    isActive ? 'bg-primary text-primary-foreground' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {isCompleted ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs mt-2 ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-24 h-0.5 mx-2 ${
                    isCompleted ? 'bg-status-low' : 'bg-border'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="glass-card rounded-xl p-6">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-lg font-semibold">Basic Information</h2>
            
            <div className="space-y-2">
              <Label>Incident Title *</Label>
              <Input
                placeholder="e.g., Website Defacement - Homepage Compromised"
                value={formData.title}
                onChange={(e) => updateForm('title', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Incident Type *</Label>
              <Select value={formData.type} onValueChange={(v) => updateForm('type', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select incident type..." />
                </SelectTrigger>
                <SelectContent>
                  {incidentTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Priority Level *</Label>
              <RadioGroup
                value={formData.priority}
                onValueChange={(v) => updateForm('priority', v)}
                className="grid grid-cols-2 gap-4"
              >
                {priorityOptions.map(opt => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt.value} id={opt.value} />
                    <Label htmlFor={opt.value} className="flex-1 cursor-pointer">
                      <span className={`font-medium ${
                        opt.value === 'critical' ? 'text-status-critical' :
                        opt.value === 'high' ? 'text-status-high' :
                        opt.value === 'medium' ? 'text-status-medium' :
                        'text-status-low'
                      }`}>
                        {opt.label}
                      </span>
                      <p className="text-xs text-muted-foreground">{opt.description}</p>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        )}

        {/* Step 2: Target Details */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-lg font-semibold">Target Details</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Website URL *</Label>
                <Input
                  placeholder="https://example.com"
                  value={formData.target_url}
                  onChange={(e) => updateForm('target_url', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>IP Address</Label>
                <Input
                  placeholder="192.168.1.1"
                  value={formData.ip_address}
                  onChange={(e) => updateForm('ip_address', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Server OS</Label>
                <Select value={formData.server_os} onValueChange={(v) => updateForm('server_os', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select OS..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ubuntu 20.04">Ubuntu 20.04</SelectItem>
                    <SelectItem value="Ubuntu 22.04">Ubuntu 22.04</SelectItem>
                    <SelectItem value="CentOS 7">CentOS 7</SelectItem>
                    <SelectItem value="CentOS 8">CentOS 8</SelectItem>
                    <SelectItem value="Debian 10">Debian 10</SelectItem>
                    <SelectItem value="Debian 11">Debian 11</SelectItem>
                    <SelectItem value="Windows Server 2019">Windows Server 2019</SelectItem>
                    <SelectItem value="Windows Server 2022">Windows Server 2022</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Web Server</Label>
                <Select value={formData.web_server} onValueChange={(v) => updateForm('web_server', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select web server..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Apache 2.4">Apache 2.4</SelectItem>
                    <SelectItem value="nginx">nginx</SelectItem>
                    <SelectItem value="IIS">IIS</SelectItem>
                    <SelectItem value="LiteSpeed">LiteSpeed</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CMS (if any)</Label>
                <Select value={formData.cms} onValueChange={(v) => updateForm('cms', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select CMS..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WordPress">WordPress</SelectItem>
                    <SelectItem value="Joomla">Joomla</SelectItem>
                    <SelectItem value="Drupal">Drupal</SelectItem>
                    <SelectItem value="Magento">Magento</SelectItem>
                    <SelectItem value="Custom">Custom Application</SelectItem>
                    <SelectItem value="None">None / Static</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Database</Label>
                <Select value={formData.database} onValueChange={(v) => updateForm('database', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select database..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MySQL">MySQL</SelectItem>
                    <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                    <SelectItem value="MongoDB">MongoDB</SelectItem>
                    <SelectItem value="SQL Server">SQL Server</SelectItem>
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Incident Details */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-lg font-semibold">Incident Details</h2>
            
            <div className="space-y-2">
              <Label>Detailed Description *</Label>
              <Textarea
                placeholder="Describe what happened, symptoms observed, error messages displayed, any unusual activities noticed..."
                value={formData.description}
                onChange={(e) => updateForm('description', e.target.value)}
                className="min-h-[150px]"
              />
            </div>

            <div className="space-y-4">
              <Label>Impact Assessment</Label>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Confidentiality</span>
                    <span className="font-mono">{formData.confidentiality}/5</span>
                  </div>
                  <Slider
                    value={[formData.confidentiality]}
                    onValueChange={([v]) => updateForm('confidentiality', v)}
                    min={1}
                    max={5}
                    step={1}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Integrity</span>
                    <span className="font-mono">{formData.integrity}/5</span>
                  </div>
                  <Slider
                    value={[formData.integrity]}
                    onValueChange={([v]) => updateForm('integrity', v)}
                    min={1}
                    max={5}
                    step={1}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Availability</span>
                    <span className="font-mono">{formData.availability}/5</span>
                  </div>
                  <Slider
                    value={[formData.availability]}
                    onValueChange={([v]) => updateForm('availability', v)}
                    min={1}
                    max={5}
                    step={1}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Business Impact Assessment</Label>
              <Textarea
                placeholder="Describe the business impact: revenue loss, reputation damage, regulatory implications..."
                value={formData.business_impact}
                onChange={(e) => updateForm('business_impact', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-lg font-semibold">Review & Submit</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Incident Title</p>
                  <p className="font-medium">{formData.title}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Type</p>
                  <p className="font-medium">{formData.type}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Priority</p>
                  <p className={`font-medium capitalize ${
                    formData.priority === 'critical' ? 'text-status-critical' :
                    formData.priority === 'high' ? 'text-status-high' :
                    formData.priority === 'medium' ? 'text-status-medium' :
                    'text-status-low'
                  }`}>{formData.priority}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Target URL</p>
                  <p className="font-mono text-sm">{formData.target_url}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{formData.description}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-2">Impact Assessment</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold">{formData.confidentiality}</p>
                      <p className="text-xs text-muted-foreground">CIA-C</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{formData.integrity}</p>
                      <p className="text-xs text-muted-foreground">CIA-I</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{formData.availability}</p>
                      <p className="text-xs text-muted-foreground">CIA-A</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-primary">Ready to Submit</p>
                  <p className="text-sm text-muted-foreground">
                    Once submitted, the incident will be saved to the database and assigned an ID. 
                    You'll receive notifications on status updates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1 || isSubmitting}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Submit Incident
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}