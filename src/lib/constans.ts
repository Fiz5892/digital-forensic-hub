// Department options for user registration and management
export const DEPARTMENTS = [
  'Security Operations Center (SOC)',
  'IT Security',
  'Information Technology',
  'Network Operations',
  'Cybersecurity',
  'Digital Forensics',
  'Incident Response',
  'Compliance & Audit',
  'Risk Management',
  'Other'
] as const;

export type Department = typeof DEPARTMENTS[number];

// Helper function to get department display name
export const getDepartmentLabel = (department: string | null): string => {
  return department || 'Not specified';
};