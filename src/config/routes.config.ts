/**
 * ROUTE CONFIGURATION
 * Clear role-based routing with no redundancy
 */

import { lazy } from 'react';
import { UserRole } from '@/lib/types';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const ReportIncident = lazy(() => import('@/pages/ReportIncident'));
const MyReports = lazy(() => import('@/pages/MyReports'));
const TriageQueue = lazy(() => import('@/pages/TriageQueue'));
const ActiveIncidents = lazy(() => import('@/pages/ActiveIncidents'));
const MyCases = lazy(() => import('@/pages/MyCases'));
const IncidentList = lazy(() => import('@/pages/IncidentList'));
const IncidentDetail = lazy(() => import('@/pages/IncidentDetail'));
const ForensicTools = lazy(() => import('@/pages/ForensicTools'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const AuditLogs = lazy(() => import('@/pages/AuditLogs'));
const UserManagement = lazy(() => import('@/pages/UserManagement'));
const Settings = lazy(() => import('@/pages/Settings'));

export type { UserRole } from '@/lib/types';

export interface RouteConfig {
  path: string;
  element: React.LazyExoticComponent<() => JSX.Element>;
  roles: UserRole[];
  title: string;
  description: string;
}

/**
 * ROUTE DEFINITIONS - Organized by Feature Area
 */
export const routes: RouteConfig[] = [
  // ============================================
  // COMMON ROUTES (All Authenticated Users)
  // ============================================
  {
    path: '/dashboard',
    element: Dashboard,
    roles: ['reporter', 'first_responder', 'investigator', 'manager', 'admin'],
    title: 'Dashboard',
    description: 'Overview and statistics'
  },
  {
    path: '/report',
    element: ReportIncident,
    roles: ['reporter', 'first_responder', 'investigator', 'manager', 'admin'],
    title: 'Report Incident',
    description: 'Create a new incident report'
  },
  {
    path: '/incidents/:id',
    element: IncidentDetail,
    roles: ['reporter', 'first_responder', 'investigator', 'manager', 'admin'],
    title: 'Incident Details',
    description: 'View incident details (permissions vary by role)'
  },

  // ============================================
  // REPORTER ROUTES
  // ============================================
  {
    path: '/my-reports',
    element: MyReports,
    roles: ['reporter'],
    title: 'My Reports',
    description: 'View incidents you have reported'
  },

  // ============================================
  // FIRST RESPONDER ROUTES
  // ============================================
  {
    path: '/triage',
    element: TriageQueue,
    roles: ['first_responder'],
    title: 'Triage Queue',
    description: 'New incidents awaiting triage'
  },
  {
    path: '/incidents/active',
    element: ActiveIncidents,
    roles: ['first_responder', 'investigator', 'manager'],
    title: 'Active Incidents',
    description: 'Currently active incidents'
  },

  // ============================================
  // INVESTIGATOR ROUTES
  // ============================================
  {
    path: '/my-cases',
    element: MyCases,
    roles: ['investigator'],
    title: 'My Cases',
    description: 'Cases assigned to you'
  },
  {
    path: '/tools',
    element: ForensicTools,
    roles: ['investigator', 'manager', 'admin'],
    title: 'Forensic Tools',
    description: 'Digital forensics analysis tools'
  },

  // ============================================
  // MANAGER ROUTES
  // ============================================
  {
    path: '/incidents',
    element: IncidentList,
    roles: ['manager', 'admin'],
    title: 'All Incidents',
    description: 'View and manage all incidents'
  },
  {
    path: '/analytics',
    element: Analytics,
    roles: ['manager', 'admin'],
    title: 'Analytics',
    description: 'Reports, metrics, and insights'
  },
  {
    path: '/audit-logs',
    element: AuditLogs,
    roles: ['manager', 'admin'],
    title: 'Audit Logs',
    description: 'System activity and compliance logs'
  },

  // ============================================
  // ADMIN ROUTES
  // ============================================
  {
    path: '/users',
    element: UserManagement,
    roles: ['admin'],
    title: 'User Management',
    description: 'Manage users and permissions'
  },
  {
    path: '/settings',
    element: Settings,
    roles: ['admin'],
    title: 'System Settings',
    description: 'Configure system parameters'
  },
];

/**
 * ROLE-BASED LANDING PAGES
 * Redirect users to their primary workflow after login
 */
export const roleLandingPages: Record<UserRole, string> = {
  reporter: '/my-reports',           // See their own reports
  first_responder: '/triage',        // Start triaging new incidents
  investigator: '/my-cases',         // Jump to assigned cases
  manager: '/dashboard',             // Executive overview
  admin: '/dashboard',               // System overview
};

/**
 * ROLE CAPABILITIES - EXTENDED VERSION
 * Define what each role can do on Incident Detail page and related features
 */
export interface RoleCapabilities {
  // Basic permissions
  canView: boolean;
  canEdit: boolean;
  canAssign: boolean;
  canClose: boolean;
  canDelete: boolean;
  canViewAll: boolean;

  // Evidence management
  canUploadEvidence: boolean;
  canEditEvidence: boolean;
  canViewEvidence: boolean;
  canExportEvidence: boolean; // ✅ NEW: Export evidence permission
  canManageCustody: boolean;

  // Investigation notes
  canAddNotes: boolean;
  noteCategories: string[];

  // Reporting
  canExportReport: boolean;
  canApproveReport: boolean;

  // Evidence auto-tagging
  evidenceTag: string;

  // Visible tabs in incident detail
  visibleTabs: string[];
}

export const roleCapabilities: Record<UserRole, RoleCapabilities> = {
  reporter: {
    // Basic permissions
    canView: true,              // ✅ Can view own incidents only
    canEdit: false,             // ❌ Cannot modify incidents
    canAssign: false,           // ❌ Cannot assign
    canClose: false,            // ❌ Cannot close
    canDelete: false,           // ❌ Cannot delete
    canViewAll: false,          // ❌ Can only see own reports

    // Evidence management
    canUploadEvidence: false,   // ❌ Cannot upload evidence
    canEditEvidence: false,     // ❌ Cannot edit evidence
    canViewEvidence: false,     // ❌ Cannot view evidence details
    canExportEvidence: false,   // ❌ Cannot export evidence
    canManageCustody: false,    // ❌ Cannot manage custody

    // Investigation notes
    canAddNotes: false,         // ❌ Cannot add investigation notes
    noteCategories: [],         // No note categories available

    // Reporting
    canExportReport: false,     // ❌ Cannot export reports
    canApproveReport: false,    // ❌ Cannot approve

    // Evidence tagging
    evidenceTag: 'reporter-submission',

    // Visible tabs - Reporter only sees overview
    visibleTabs: ['overview'],
  },

  first_responder: {
    // Basic permissions
    canView: true,              // ✅ Can view all incidents
    canEdit: true,              // ✅ Can update status
    canAssign: true,            // ✅ Can assign to investigators
    canClose: false,            // ❌ Cannot close (manager only)
    canDelete: false,           // ❌ Cannot delete
    canViewAll: true,           // ✅ Can see all incidents

    // Evidence management
    canUploadEvidence: true,    // ✅ Can upload initial evidence
    canEditEvidence: false,     // ❌ Cannot edit (investigator only)
    canViewEvidence: true,      // ✅ Can view evidence
    canExportEvidence: false,   // ❌ Cannot export evidence (investigator only)
    canManageCustody: false,    // ❌ Cannot manage custody (investigator only)

    // Investigation notes
    canAddNotes: true,          // ✅ Can add triage notes
    noteCategories: [
      'triage_note',            // Triage assessment
      'initial_observation',    // First observations
    ],

    // Reporting
    canExportReport: false,     // ❌ Cannot export (investigator only)
    canApproveReport: false,    // ❌ Cannot approve

    // Evidence tagging
    evidenceTag: 'initial-collection',

    // Visible tabs
    visibleTabs: ['overview', 'evidence', 'timeline', 'notes'],
  },

  investigator: {
    // Basic permissions
    canView: true,              // ✅ Can view all incidents
    canEdit: true,              // ✅ Can update details
    canAssign: false,           // ❌ Cannot reassign (first responder/manager only)
    canClose: false,            // ❌ Cannot close (manager only)
    canDelete: false,           // ❌ Cannot delete
    canViewAll: true,           // ✅ Can see all incidents

    // Evidence management
    canUploadEvidence: true,    // ✅ Main evidence collector
    canEditEvidence: true,      // ✅ Can edit evidence metadata
    canViewEvidence: true,      // ✅ Can view all evidence
    canExportEvidence: true,    // ✅ Can export evidence metadata
    canManageCustody: true,     // ✅ Can transfer evidence custody

    // Investigation notes
    canAddNotes: true,          // ✅ Can add detailed notes
    noteCategories: [
      'hypothesis',             // Investigation hypothesis
      'finding',                // Key findings
      'action_item',            // Actions needed
      'question',               // Questions to investigate
      'technical_analysis',     // Technical deep-dive
    ],

    // Reporting
    canExportReport: true,      // ✅ Can generate forensic reports
    canApproveReport: false,    // ❌ Cannot approve (manager only)

    // Evidence tagging
    evidenceTag: 'forensic-evidence',

    // Visible tabs - Full investigation access
    visibleTabs: ['overview', 'evidence', 'timeline', 'custody', 'notes', 'forensic-tools'],
  },

  manager: {
    // Basic permissions
    canView: true,              // ✅ Can view all incidents
    canEdit: true,              // ✅ Can update everything
    canAssign: true,            // ✅ Can assign to anyone
    canClose: true,             // ✅ Final approval to close
    canDelete: false,           // ❌ Cannot delete (admin only)
    canViewAll: true,           // ✅ Can see all incidents

    // Evidence management
    canUploadEvidence: true,    // ✅ Can upload (rare, but allowed)
    canEditEvidence: true,      // ✅ Can edit evidence
    canViewEvidence: true,      // ✅ Can view all evidence
    canExportEvidence: true,    // ✅ Can export evidence
    canManageCustody: true,     // ✅ Can manage custody

    // Investigation notes
    canAddNotes: true,          // ✅ Can add management notes
    noteCategories: [
      'management_review',      // Management review comments
      'escalation',             // Escalation notes
      'approval',               // Approval decisions
      'closure_note',           // Closure justification
    ],

    // Reporting
    canExportReport: true,      // ✅ Can export reports
    canApproveReport: true,     // ✅ Can approve final reports

    // Evidence tagging
    evidenceTag: 'management-provided',

    // Visible tabs - Same as investigator
    visibleTabs: ['overview', 'evidence', 'timeline', 'custody', 'notes', 'forensic-tools'],
  },

  admin: {
    // Basic permissions
    canView: true,              // ✅ Can view all incidents
    canEdit: true,              // ✅ Can edit everything
    canAssign: true,            // ✅ Can assign to anyone
    canClose: true,             // ✅ Can close
    canDelete: true,            // ✅ Only admins can delete
    canViewAll: true,           // ✅ Can see all incidents

    // Evidence management
    canUploadEvidence: true,    // ✅ Can upload
    canEditEvidence: true,      // ✅ Can edit
    canViewEvidence: true,      // ✅ Can view all
    canExportEvidence: true,    // ✅ Can export evidence
    canManageCustody: true,     // ✅ Can manage custody

    // Investigation notes
    canAddNotes: true,          // ✅ Can add any notes
    noteCategories: [
      'system_note',            // System-level notes
      'audit_note',             // Audit/compliance notes
      'admin_action',           // Administrative actions
    ],

    // Reporting
    canExportReport: true,      // ✅ Can export
    canApproveReport: true,     // ✅ Can approve

    // Evidence tagging
    evidenceTag: 'admin-provided',

    // Visible tabs - Full access
    visibleTabs: ['overview', 'evidence', 'timeline', 'custody', 'notes', 'forensic-tools'],
  },
};

/**
 * HELPER: Check if user has permission to access route
 */
export const canAccessRoute = (route: RouteConfig, userRole: UserRole): boolean => {
  return route.roles.includes(userRole);
};

/**
 * HELPER: Get user's capabilities
 */
export const getUserCapabilities = (userRole: UserRole): RoleCapabilities => {
  return roleCapabilities[userRole];
};

/**
 * HELPER: Get redirect path after login
 */
export const getLoginRedirect = (userRole: UserRole): string => {
  return roleLandingPages[userRole];
};

/**
 * HELPER: Check specific permission
 */
export const hasPermission = (
  userRole: UserRole,
  permission: keyof RoleCapabilities
): boolean => {
  const capabilities = getUserCapabilities(userRole);
  return !!capabilities[permission];
};

/**
 * HELPER: Get allowed note categories for role
 */
export const getAllowedNoteCategories = (userRole: UserRole): string[] => {
  return roleCapabilities[userRole].noteCategories;
};

/**
 * HELPER: Get evidence tag for role
 */
export const getEvidenceTag = (userRole: UserRole): string => {
  return roleCapabilities[userRole].evidenceTag;
};