import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Existing Pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import IncidentList from "@/pages/IncidentList";
import IncidentDetail from "@/pages/IncidentDetail";
import ReportIncident from "@/pages/ReportIncident";
import ForensicTools from "@/pages/ForensicTools";
import Analytics from "@/pages/Analytics";
import UserManagement from "@/pages/UserManagement";
import Settings from "@/pages/Settings";
import AuditLogs from "@/pages/AuditLogs";
import NotFound from "@/pages/NotFound";

// New Pages for Role-Based Flow
import MyReports from "@/pages/MyReports";
import TriageQueue from "@/pages/TriageQueue";
import MyCases from "@/pages/MyCases";
import ActiveIncidents from "@/pages/ActiveIncidents";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  console.log('🚀 App mounting...');
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <DataProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<Login />} />
                  
                  {/* Protected Routes - MainLayout handles auth check */}
                  <Route element={<MainLayout />}>
                    {/* Root redirect */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    
                    {/* Common Routes - All authenticated users */}
                    <Route 
                      path="/dashboard" 
                      element={
                        <ProtectedRoute allowedRoles={['reporter', 'first_responder', 'investigator', 'manager', 'admin']}>
                          <Dashboard />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/report" 
                      element={
                        <ProtectedRoute allowedRoles={['reporter', 'first_responder', 'investigator', 'manager', 'admin']}>
                          <ReportIncident />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/incidents/:id" 
                      element={
                        <ProtectedRoute allowedRoles={['reporter', 'first_responder', 'investigator', 'manager', 'admin']}>
                          <IncidentDetail />
                        </ProtectedRoute>
                      } 
                    />

                    {/* Reporter Routes */}
                    <Route 
                      path="/my-reports" 
                      element={
                        <ProtectedRoute allowedRoles={['reporter']}>
                          <MyReports />
                        </ProtectedRoute>
                      } 
                    />

                    {/* First Responder Routes */}
                    <Route 
                      path="/triage" 
                      element={
                        <ProtectedRoute allowedRoles={['first_responder']}>
                          <TriageQueue />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/incidents/active" 
                      element={
                        <ProtectedRoute allowedRoles={['first_responder', 'investigator', 'manager']}>
                          <ActiveIncidents />
                        </ProtectedRoute>
                      } 
                    />

                    {/* Investigator Routes */}
                    <Route 
                      path="/my-cases" 
                      element={
                        <ProtectedRoute allowedRoles={['investigator']}>
                          <MyCases />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/tools" 
                      element={
                        <ProtectedRoute allowedRoles={['investigator', 'manager', 'admin']}>
                          <ForensicTools />
                        </ProtectedRoute>
                      } 
                    />

                    {/* Manager & Admin Routes */}
                    <Route 
                      path="/incidents" 
                      element={
                        <ProtectedRoute allowedRoles={['manager', 'admin']}>
                          <IncidentList />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/analytics" 
                      element={
                        <ProtectedRoute allowedRoles={['manager', 'admin']}>
                          <Analytics />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/audit-logs" 
                      element={
                        <ProtectedRoute allowedRoles={['manager', 'admin']}>
                          <AuditLogs />
                        </ProtectedRoute>
                      } 
                    />

                    {/* Admin Only Routes */}
                    <Route 
                      path="/users" 
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <UserManagement />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/settings" 
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <Settings />
                        </ProtectedRoute>
                      } 
                    />
                  </Route>

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </TooltipProvider>
            </DataProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
  );
};

export default App;