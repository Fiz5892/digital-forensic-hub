import { User, Incident, Evidence } from './types';

export const mockUsers: User[] = [
  { id: '1', name: 'John Reporter', email: 'reporter@dfir.com', role: 'reporter', department: 'IT Support' },
  { id: '2', name: 'Mike Responder', email: 'responder@dfir.com', role: 'first_responder', department: 'SOC' },
  { id: '3', name: 'Sarah Investigator', email: 'investigator@dfir.com', role: 'investigator', department: 'Forensics' },
  { id: '4', name: 'Lisa Manager', email: 'manager@dfir.com', role: 'manager', department: 'Security' },
  { id: '5', name: 'Admin User', email: 'admin@dfir.com', role: 'admin', department: 'IT' },
];

export const mockIncidents: Incident[] = [
  {
    id: 'INC-2024-001',
    title: 'Corporate Website Defaced - Political Message',
    description: 'Main corporate homepage replaced with political message "Hacked by CyberPhantom". Index.php modified. Found backdoor shell at /wp-admin/temp-shell.php. Immediate containment required.',
    type: 'Website Defacement',
    status: 'investigation',
    priority: 'critical',
    reporter: { id: '1', name: 'John Reporter', email: 'john@company.com' },
    assigned_to: { id: '3', name: 'Sarah Investigator' },
    created_at: '2024-01-15T08:30:00Z',
    updated_at: '2024-01-15T14:45:00Z',
    impact_assessment: {
      confidentiality: 2,
      integrity: 5,
      availability: 4,
      business_impact: 'High - Brand damage, customer trust affected, estimated $50k/day revenue loss'
    },
    technical_details: {
      target_url: 'https://company.com',
      ip_address: '203.0.113.45',
      server_os: 'Ubuntu 20.04 LTS',
      web_server: 'Apache 2.4.41',
      cms: 'WordPress 6.0.2',
      database: 'MySQL 8.0.28'
    },
    timeline: [
      { id: '1', timestamp: '2024-01-15T06:15:00Z', event: 'Attacker gained initial access via vulnerable plugin', type: 'detection' },
      { id: '2', timestamp: '2024-01-15T08:30:00Z', event: 'Defacement detected by monitoring system', type: 'detection' },
      { id: '3', timestamp: '2024-01-15T08:45:00Z', event: 'Incident reported via DFIR system', type: 'report', user: 'John Reporter' },
      { id: '4', timestamp: '2024-01-15T09:00:00Z', event: 'Case assigned to forensic investigator', type: 'assignment', user: 'Mike Responder' },
      { id: '5', timestamp: '2024-01-15T09:30:00Z', event: 'Initial evidence collection started', type: 'evidence', user: 'Sarah Investigator' },
    ],
    evidence_ids: ['EVD-2024-001-01', 'EVD-2024-001-02', 'EVD-2024-001-03'],
    notes: [
      { id: '1', content: 'Backdoor shell found at /wp-admin/temp-shell.php - appears to be WSO shell variant', category: 'finding', created_by: { id: '3', name: 'Sarah Investigator' }, created_at: '2024-01-15T10:00:00Z' },
      { id: '2', content: 'Hypothesis: Attack originated from vulnerable Contact Form 7 plugin', category: 'hypothesis', created_by: { id: '3', name: 'Sarah Investigator' }, created_at: '2024-01-15T11:30:00Z' },
    ],
    regulatory_requirements: ['GDPR', 'PDPA']
  },
  {
    id: 'INC-2024-002',
    title: 'Customer Database Leak - SQL Injection Attack',
    description: 'SQL injection vulnerability in contact form allowed data extraction. Approximately 5,000 customer records accessed including emails and hashed passwords. Attack originated from IP 185.130.105.42.',
    type: 'Data Breach',
    status: 'contained',
    priority: 'high',
    reporter: { id: '2', name: 'Mike Responder', email: 'mike@company.com' },
    assigned_to: { id: '3', name: 'Sarah Investigator' },
    created_at: '2024-01-14T14:20:00Z',
    updated_at: '2024-01-15T09:00:00Z',
    impact_assessment: {
      confidentiality: 5,
      integrity: 3,
      availability: 1,
      business_impact: 'Very High - Regulatory fines potential $500k, customer notification required within 72h'
    },
    technical_details: {
      target_url: 'https://portal.company.com',
      ip_address: '198.51.100.23',
      server_os: 'CentOS 7',
      web_server: 'nginx 1.20.1',
      cms: 'Custom PHP Application',
      database: 'PostgreSQL 13.4'
    },
    timeline: [
      { id: '1', timestamp: '2024-01-14T12:00:00Z', event: 'SQLi attack initiated from malicious IP', type: 'detection' },
      { id: '2', timestamp: '2024-01-14T14:20:00Z', event: 'Anomaly detected in database access logs', type: 'detection' },
      { id: '3', timestamp: '2024-01-14T14:30:00Z', event: 'Incident reported and triage initiated', type: 'report' },
      { id: '4', timestamp: '2024-01-14T15:00:00Z', event: 'Malicious IP blocked at WAF level', type: 'containment' },
    ],
    evidence_ids: ['EVD-2024-002-01', 'EVD-2024-002-02'],
    notes: [
      { id: '1', content: 'Confirmed 5,247 records accessed. All passwords were bcrypt hashed.', category: 'finding', created_by: { id: '3', name: 'Sarah Investigator' }, created_at: '2024-01-14T16:00:00Z' },
    ],
    regulatory_requirements: ['GDPR', 'CCPA', 'PDPA']
  },
  {
    id: 'INC-2024-003',
    title: 'DDoS Attack on Payment Gateway',
    description: 'Distributed denial of service attack targeting payment processing endpoint. Traffic peaked at 50Gbps. Service was intermittently unavailable for 4 hours.',
    type: 'DDoS Attack',
    status: 'resolved',
    priority: 'critical',
    reporter: { id: '2', name: 'Mike Responder', email: 'mike@company.com' },
    assigned_to: { id: '3', name: 'Sarah Investigator' },
    created_at: '2024-01-12T03:00:00Z',
    updated_at: '2024-01-12T12:00:00Z',
    closed_at: '2024-01-13T09:00:00Z',
    impact_assessment: {
      confidentiality: 1,
      integrity: 1,
      availability: 5,
      business_impact: 'Critical - $200k revenue loss during 4-hour outage'
    },
    technical_details: {
      target_url: 'https://pay.company.com',
      ip_address: '203.0.113.100',
      server_os: 'Ubuntu 22.04',
      web_server: 'nginx 1.22',
      cms: 'Custom Node.js',
      database: 'MongoDB 6.0'
    },
    timeline: [
      { id: '1', timestamp: '2024-01-12T03:00:00Z', event: 'DDoS attack initiated', type: 'detection' },
      { id: '2', timestamp: '2024-01-12T03:15:00Z', event: 'Cloudflare mitigation activated', type: 'containment' },
      { id: '3', timestamp: '2024-01-12T07:00:00Z', event: 'Attack subsided, services restored', type: 'containment' },
      { id: '4', timestamp: '2024-01-12T12:00:00Z', event: 'Post-incident analysis completed', type: 'analysis' },
    ],
    evidence_ids: ['EVD-2024-003-01'],
    notes: [],
    regulatory_requirements: ['PCI-DSS']
  },
  {
    id: 'INC-2024-004',
    title: 'Phishing Campaign Targeting Employees',
    description: 'Sophisticated phishing emails impersonating IT department sent to 500+ employees. 12 credentials compromised before detection.',
    type: 'Phishing',
    status: 'new',
    priority: 'high',
    reporter: { id: '1', name: 'John Reporter', email: 'john@company.com' },
    created_at: '2024-01-15T11:00:00Z',
    updated_at: '2024-01-15T11:00:00Z',
    impact_assessment: {
      confidentiality: 4,
      integrity: 2,
      availability: 1,
      business_impact: 'High - 12 compromised accounts require immediate password reset and investigation'
    },
    technical_details: {
      target_url: 'https://fake-it-portal.malicious.com',
      ip_address: '103.108.70.55',
      server_os: 'Unknown',
      web_server: 'Unknown',
      cms: 'Phishing Kit',
      database: 'Unknown'
    },
    timeline: [
      { id: '1', timestamp: '2024-01-15T09:00:00Z', event: 'Phishing emails sent to employees', type: 'detection' },
      { id: '2', timestamp: '2024-01-15T11:00:00Z', event: 'Reported by security-aware employee', type: 'report' },
    ],
    evidence_ids: [],
    notes: [],
    regulatory_requirements: []
  },
  {
    id: 'INC-2024-005',
    title: 'Malware Detected on Web Server',
    description: 'Crypto mining malware discovered on production web server. CPU usage spiked to 95%. Server compromised via outdated OpenSSH.',
    type: 'Malware Infection',
    status: 'triage',
    priority: 'medium',
    reporter: { id: '2', name: 'Mike Responder', email: 'mike@company.com' },
    assigned_to: { id: '2', name: 'Mike Responder' },
    created_at: '2024-01-15T07:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    impact_assessment: {
      confidentiality: 2,
      integrity: 3,
      availability: 3,
      business_impact: 'Medium - Performance degradation, potential for lateral movement'
    },
    technical_details: {
      target_url: 'https://app.company.com',
      ip_address: '192.168.1.50',
      server_os: 'Debian 10',
      web_server: 'Apache 2.4.38',
      cms: 'Custom Laravel',
      database: 'MySQL 5.7'
    },
    timeline: [
      { id: '1', timestamp: '2024-01-15T06:00:00Z', event: 'Unusual CPU usage detected by monitoring', type: 'detection' },
      { id: '2', timestamp: '2024-01-15T07:00:00Z', event: 'Incident created for investigation', type: 'report' },
    ],
    evidence_ids: [],
    notes: [],
    regulatory_requirements: []
  }
];

export const mockEvidence: Evidence[] = [
  {
    id: 'EVD-2024-001-01',
    incident_id: 'INC-2024-001',
    filename: 'defacement-screenshot.png',
    file_type: 'image/png',
    file_size: 2457600,
    hash_md5: '5d41402abc4b2a76b9719d911017c592',
    hash_sha256: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    collected_by: { id: '3', name: 'Sarah Investigator' },
    collected_at: '2024-01-15T09:30:00Z',
    current_custodian: { id: '3', name: 'Sarah Investigator' },
    storage_location: 'Secure Server #1 /evidence/INC-2024-001/',
    analysis_status: 'analyzed',
    integrity_status: 'verified',
    description: 'Screenshot of defaced homepage showing hacker message',
    custody_chain: [
      { sequence: 1, from: 'System', to: 'Sarah Investigator', timestamp: '2024-01-15T09:30:00Z', reason: 'Initial collection', hash_verified: true, witness: 'Mike Responder' }
    ]
  },
  {
    id: 'EVD-2024-001-02',
    incident_id: 'INC-2024-001',
    filename: 'apache-access.log',
    file_type: 'text/plain',
    file_size: 10485760,
    hash_md5: '098f6bcd4621d373cade4e832627b4f6',
    hash_sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    collected_by: { id: '3', name: 'Sarah Investigator' },
    collected_at: '2024-01-15T10:00:00Z',
    current_custodian: { id: '3', name: 'Sarah Investigator' },
    storage_location: 'Secure Server #1 /evidence/INC-2024-001/',
    analysis_status: 'analyzing',
    integrity_status: 'verified',
    description: 'Apache access logs from the compromised server for the past 7 days',
    custody_chain: [
      { sequence: 1, from: 'Production Server', to: 'Sarah Investigator', timestamp: '2024-01-15T10:00:00Z', reason: 'Log extraction for analysis', hash_verified: true }
    ]
  },
  {
    id: 'EVD-2024-001-03',
    incident_id: 'INC-2024-001',
    filename: 'backdoor-shell.php',
    file_type: 'application/x-php',
    file_size: 45678,
    hash_md5: 'abc123def456789012345678901234ab',
    hash_sha256: 'def456abc789012345678901234567890abcdef123456789012345678901234ab',
    collected_by: { id: '3', name: 'Sarah Investigator' },
    collected_at: '2024-01-15T10:30:00Z',
    current_custodian: { id: '3', name: 'Sarah Investigator' },
    storage_location: 'Secure Server #1 /evidence/INC-2024-001/',
    analysis_status: 'pending',
    integrity_status: 'verified',
    description: 'Malicious PHP backdoor shell found in wp-admin directory',
    custody_chain: [
      { sequence: 1, from: 'Production Server', to: 'Sarah Investigator', timestamp: '2024-01-15T10:30:00Z', reason: 'Malware sample collection', hash_verified: true, witness: 'Mike Responder' }
    ]
  },
  {
    id: 'EVD-2024-002-01',
    incident_id: 'INC-2024-002',
    filename: 'postgresql-queries.log',
    file_type: 'text/plain',
    file_size: 5242880,
    hash_md5: '11111111111111111111111111111111',
    hash_sha256: '2222222222222222222222222222222222222222222222222222222222222222',
    collected_by: { id: '3', name: 'Sarah Investigator' },
    collected_at: '2024-01-14T15:00:00Z',
    current_custodian: { id: '3', name: 'Sarah Investigator' },
    storage_location: 'Secure Server #1 /evidence/INC-2024-002/',
    analysis_status: 'analyzed',
    integrity_status: 'verified',
    description: 'Database query logs showing SQLi attack patterns',
    custody_chain: [
      { sequence: 1, from: 'Database Server', to: 'Sarah Investigator', timestamp: '2024-01-14T15:00:00Z', reason: 'SQLi attack evidence collection', hash_verified: true }
    ]
  },
  {
    id: 'EVD-2024-002-02',
    incident_id: 'INC-2024-002',
    filename: 'waf-blocked-requests.json',
    file_type: 'application/json',
    file_size: 1048576,
    hash_md5: '33333333333333333333333333333333',
    hash_sha256: '4444444444444444444444444444444444444444444444444444444444444444',
    collected_by: { id: '2', name: 'Mike Responder' },
    collected_at: '2024-01-14T14:45:00Z',
    current_custodian: { id: '3', name: 'Sarah Investigator' },
    storage_location: 'Secure Server #1 /evidence/INC-2024-002/',
    analysis_status: 'pending',
    integrity_status: 'verified',
    description: 'WAF logs showing blocked malicious requests',
    custody_chain: [
      { sequence: 1, from: 'WAF System', to: 'Mike Responder', timestamp: '2024-01-14T14:45:00Z', reason: 'WAF log extraction', hash_verified: true },
      { sequence: 2, from: 'Mike Responder', to: 'Sarah Investigator', timestamp: '2024-01-14T16:00:00Z', reason: 'Transfer to lead investigator', hash_verified: true, witness: 'Lisa Manager' }
    ]
  },
  {
    id: 'EVD-2024-003-01',
    incident_id: 'INC-2024-003',
    filename: 'ddos-traffic-capture.pcap',
    file_type: 'application/vnd.tcpdump.pcap',
    file_size: 52428800,
    hash_md5: '55555555555555555555555555555555',
    hash_sha256: '6666666666666666666666666666666666666666666666666666666666666666',
    collected_by: { id: '2', name: 'Mike Responder' },
    collected_at: '2024-01-12T04:00:00Z',
    current_custodian: { id: '3', name: 'Sarah Investigator' },
    storage_location: 'Secure Server #1 /evidence/INC-2024-003/',
    analysis_status: 'archived',
    integrity_status: 'verified',
    description: 'Network packet capture during DDoS attack peak',
    custody_chain: [
      { sequence: 1, from: 'Network TAP', to: 'Mike Responder', timestamp: '2024-01-12T04:00:00Z', reason: 'Traffic capture during attack', hash_verified: true },
      { sequence: 2, from: 'Mike Responder', to: 'Sarah Investigator', timestamp: '2024-01-12T08:00:00Z', reason: 'Analysis handover', hash_verified: true }
    ]
  }
];

export const incidentTypes = [
  'Website Defacement',
  'SQL Injection',
  'Data Breach',
  'DDoS Attack',
  'Malware Infection',
  'Phishing',
  'Unauthorized Access',
  'Credential Stuffing',
  'XSS Attack',
  'Other'
];

export const priorityOptions = [
  { value: 'critical', label: 'Critical', description: 'Service down, data loss' },
  { value: 'high', label: 'High', description: 'Major functionality affected' },
  { value: 'medium', label: 'Medium', description: 'Limited impact' },
  { value: 'low', label: 'Low', description: 'Minor issue' }
];

export const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'triage', label: 'Triage' },
  { value: 'investigation', label: 'Investigation' },
  { value: 'contained', label: 'Contained' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' }
];
