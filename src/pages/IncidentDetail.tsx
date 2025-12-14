// src/pages/IncidentDetail.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { getUserCapabilities } from "@/config/routes.config";
import { StatusBadge, PriorityBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Clock,
  User,
  Globe,
  Server,
  Database,
  FileText,
  Link as LinkIcon,
  AlertTriangle,
  Shield,
  Download,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { IncidentStatus } from "@/lib/types";
import { logAudit } from "@/lib/auditLogger";
import { downloadIncidentReport } from "@/lib/pdfGenerator";

// Import Tab Components
import { EvidenceTab } from "@/components/incident/EvidenceTab";
import { NotesTab } from "@/components/incident/NotesTab";
import { TimelineTab } from "@/components/incident/TimelineTab";
import { ChainOfCustodyTab } from "@/components/incident/ChainOfCustodyTab";

const statusOptions = [
  { value: "new", label: "New" },
  { value: "triage", label: "Triage" },
  { value: "investigation", label: "Investigation" },
  { value: "contained", label: "Contained" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getIncident, updateIncident, users } = useData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const incident = getIncident(id || "");

  // Get role-based capabilities
  const capabilities = user ? getUserCapabilities(user.role) : null;

  /**
   * ASSIGNMENT RULES:
   * 1. First Responder → Can assign to Investigators only
   * 2. Manager → Can assign to First Responders, Investigators, or other Managers
   * 3. Admin → Can assign to anyone
   */
  const getAssignableUsers = () => {
    if (!users || !user) return [];

    switch (user.role) {
      case "first_responder":
        // First responder can only assign to investigators
        return users.filter((u) => u.role === "investigator");

      case "manager":
        // Manager can assign to first responders, investigators, and other managers
        return users.filter((u) =>
          ["first_responder", "investigator", "manager"].includes(u.role)
        );

      case "admin":
        // Admin can assign to anyone except reporters
        return users.filter((u) => u.role !== "reporter");

      default:
        return [];
    }
  };

  const assignableUsers = getAssignableUsers();

  // LOG AUDIT: View incident
  useEffect(() => {
    if (incident) {
      logAudit({
        action: "view",
        entity_type: "incident",
        entity_id: incident.id,
        details: {
          title: incident.title,
          status: incident.status,
          priority: incident.priority,
        },
      });
    }
  }, [incident?.id]);

  // Check if user can see this tab
  const canSeeTab = (tabName: string): boolean => {
    if (!capabilities) return false;
    return capabilities.visibleTabs.includes(tabName);
  };

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Shield className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Incident Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The incident you're looking for doesn't exist.
        </p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  // Check if user is authorized to view this incident
  if (user?.role === "reporter" && incident.reporter.id !== user.id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Lock className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-4">
          You can only view incidents that you reported.
        </p>
        <Button onClick={() => navigate("/my-reports")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Reports
        </Button>
      </div>
    );
  }

  const handleStatusChange = async (newStatus: IncidentStatus) => {
    if (!capabilities?.canEdit) {
      toast.error("You do not have permission to change status");
      return;
    }

    try {
      await updateIncident(incident.id, { status: newStatus });

      await logAudit({
        action: "update_status",
        entity_type: "incident",
        entity_id: incident.id,
        details: {
          previous_status: incident.status,
          new_status: newStatus,
        },
      });

      toast.success("Status updated", {
        description: `Incident status changed to ${newStatus}`,
      });
    } catch (error) {
      toast.error("Failed to update status");
      console.error("Error updating status:", error);
    }
  };

  const handleAssign = async (userId: string) => {
    if (!capabilities?.canAssign) {
      toast.error("You do not have permission to assign incidents");
      return;
    }

    try {
      const assignee = assignableUsers.find((u) => u.id === userId);
      if (!assignee) {
        toast.error("Invalid user selection");
        return;
      }

      await updateIncident(incident.id, {
        assigned_to: { id: assignee.id, name: assignee.name },
      });

      await logAudit({
        action: "assign",
        entity_type: "incident",
        entity_id: incident.id,
        details: {
          assigned_to_id: assignee.id,
          assigned_to_name: assignee.name,
          assigned_to_role: assignee.role,
          assigned_by_id: user?.id,
          assigned_by_name: user?.name,
          assigned_by_role: user?.role,
          previous_assignee: incident.assigned_to?.name || "Unassigned",
        },
      });

      toast.success("Assigned", {
        description: `Incident assigned to ${
          assignee.name
        } (${assignee.role.replace("_", " ")})`,
      });
    } catch (error) {
      toast.error("Failed to assign incident");
      console.error("Error assigning incident:", error);
    }
  };

  const handleExportPDF = async () => {
    if (!capabilities?.canExportReport) {
      toast.error("You do not have permission to export reports");
      return;
    }

    try {
      const evidence = []; // Get evidence if needed
      downloadIncidentReport(incident, evidence);

      await logAudit({
        action: "export",
        entity_type: "report",
        entity_id: incident.id,
        details: {
          format: "pdf",
          incident_id: incident.id,
          incident_title: incident.title,
        },
      });

      toast.success("PDF report generated", {
        description: `${incident.id}-report.pdf downloaded`,
      });
    } catch (error) {
      toast.error("Failed to generate PDF report");
      console.error("Error generating PDF:", error);
    }
  };

  const impactColors = {
    1: "text-green-600",
    2: "text-green-500",
    3: "text-yellow-500",
    4: "text-orange-500",
    5: "text-red-500",
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-primary text-lg">
              {incident.id}
            </span>
            <PriorityBadge priority={incident.priority} />
            <StatusBadge status={incident.status} />
          </div>
          <h1 className="text-2xl font-bold">{incident.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {capabilities?.canExportReport && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleExportPDF}
            >
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          )}
          {capabilities?.canEdit && (
            <Select value={incident.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Role-based info banner */}
      {user?.role === "reporter" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> You are viewing this incident as a reporter.
            You can view details but cannot modify the investigation.
          </p>
        </div>
      )}

      {/* Tabs - Only show tabs user has access to */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="bg-muted/50 p-1">
          {canSeeTab("overview") && (
            <TabsTrigger value="overview">Overview</TabsTrigger>
          )}
          {canSeeTab("evidence") && (
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
          )}
          {canSeeTab("timeline") && (
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          )}
          {canSeeTab("custody") && (
            <TabsTrigger value="custody">Chain of Custody</TabsTrigger>
          )}
          {canSeeTab("notes") && <TabsTrigger value="notes">Notes</TabsTrigger>
          }
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div className="bg-card rounded-xl border p-6">
                <h3 className="font-semibold mb-3">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {incident.description || "No description provided"}
                </p>
              </div>

              {/* Technical Details */}
              {incident.technical_details && (
                <div className="bg-card rounded-xl border p-6">
                  <h3 className="font-semibold mb-4">Technical Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {incident.technical_details.target_url && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <Globe className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Target URL
                          </p>
                          <p className="text-sm font-mono break-all">
                            {incident.technical_details.target_url}
                          </p>
                        </div>
                      </div>
                    )}
                    {incident.technical_details.ip_address && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <LinkIcon className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            IP Address
                          </p>
                          <p className="text-sm font-mono">
                            {incident.technical_details.ip_address}
                          </p>
                        </div>
                      </div>
                    )}
                    {incident.technical_details.server_os && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <Server className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Server OS
                          </p>
                          <p className="text-sm">
                            {incident.technical_details.server_os}
                          </p>
                        </div>
                      </div>
                    )}
                    {incident.technical_details.web_server && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <Server className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Web Server
                          </p>
                          <p className="text-sm">
                            {incident.technical_details.web_server}
                          </p>
                        </div>
                      </div>
                    )}
                    {incident.technical_details.cms && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">CMS</p>
                          <p className="text-sm">
                            {incident.technical_details.cms}
                          </p>
                        </div>
                      </div>
                    )}
                    {incident.technical_details.database && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <Database className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Database
                          </p>
                          <p className="text-sm">
                            {incident.technical_details.database}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Impact Assessment */}
              {incident.impact_assessment && (
                <div className="bg-card rounded-xl border p-6">
                  <h3 className="font-semibold mb-4">Impact Assessment</h3>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-4 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">
                        Confidentiality
                      </p>
                      <p
                        className={`text-3xl font-bold ${
                          impactColors[
                            incident.impact_assessment
                              .confidentiality as keyof typeof impactColors
                          ]
                        }`}
                      >
                        {incident.impact_assessment.confidentiality}/5
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">
                        Integrity
                      </p>
                      <p
                        className={`text-3xl font-bold ${
                          impactColors[
                            incident.impact_assessment
                              .integrity as keyof typeof impactColors
                          ]
                        }`}
                      >
                        {incident.impact_assessment.integrity}/5
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">
                        Availability
                      </p>
                      <p
                        className={`text-3xl font-bold ${
                          impactColors[
                            incident.impact_assessment
                              .availability as keyof typeof impactColors
                          ]
                        }`}
                      >
                        {incident.impact_assessment.availability}/5
                      </p>
                    </div>
                  </div>
                  {incident.impact_assessment.business_impact && (
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">
                        Business Impact
                      </p>
                      <p className="text-sm">
                        {incident.impact_assessment.business_impact}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Assignment */}
              <div className="bg-card rounded-xl border p-6">
                <h3 className="font-semibold mb-4">Assignment</h3>
                {capabilities?.canAssign ? (
                  <div className="space-y-3">
                    <Select
                      value={incident.assigned_to?.id || ""}
                      onValueChange={handleAssign}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Assign to..." />
                      </SelectTrigger>
                      <SelectContent>
                        {assignableUsers.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No users available to assign
                          </div>
                        ) : (
                          assignableUsers.map((assignableUser) => (
                            <SelectItem
                              key={assignableUser.id}
                              value={assignableUser.id}
                            >
                              <div className="flex items-center gap-2">
                                <span>{assignableUser.name}</span>
                                <span className="text-xs text-muted-foreground capitalize">
                                  ({assignableUser.role.replace("_", " ")})
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {user?.role === "first_responder" &&
                        "You can assign to Investigators"}
                      {user?.role === "manager" &&
                        "You can assign to First Responders, Investigators, or Managers"}
                      {user?.role === "admin" &&
                        "You can assign to any team member"}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {incident.assigned_to?.name || "Unassigned"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {incident.assigned_to
                          ? "Investigator"
                          : "Not yet assigned"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="bg-card rounded-xl border p-6">
                <h3 className="font-semibold mb-4">Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-sm">
                        {new Date(incident.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Last Updated
                      </p>
                      <p className="text-sm">
                        {new Date(incident.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Reported By
                      </p>
                      <p className="text-sm">{incident.reporter.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {incident.reporter.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Type</p>
                      <p className="text-sm">{incident.type}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Regulatory */}
              {incident.regulatory_requirements &&
                incident.regulatory_requirements.length > 0 && (
                  <div className="bg-card rounded-xl border p-6">
                    <h3 className="font-semibold mb-4">
                      Regulatory Requirements
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {incident.regulatory_requirements.map((req) => (
                        <span
                          key={req}
                          className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                        >
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </TabsContent>

        {/* Evidence Tab - Using Component */}
        {canSeeTab("evidence") && (
          <TabsContent value="evidence">
            <EvidenceTab incidentId={incident.id} />
          </TabsContent>
        )}

        {/* Timeline Tab - Using Component */}
        {canSeeTab("timeline") && (
          <TabsContent value="timeline">
            <TimelineTab incident={incident} />
          </TabsContent>
        )}

        {/* Chain of Custody Tab - Using Component */}
        {canSeeTab("custody") && (
          <TabsContent value="custody">
            <ChainOfCustodyTab incidentId={incident.id} />
          </TabsContent>
        )}

        {/* Notes Tab - Using Component */}
        {canSeeTab("notes") && (
          <TabsContent value="notes">
            <NotesTab incident={incident} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}