import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { MainLayout } from "@/components/layout/MainLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import IncidentList from "@/pages/IncidentList";
import IncidentDetail from "@/pages/IncidentDetail";
import ReportIncident from "@/pages/ReportIncident";
import ForensicTools from "@/pages/ForensicTools";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/report" element={<ReportIncident />} />
                <Route path="/incidents" element={<IncidentList />} />
                <Route path="/incidents/:id" element={<IncidentDetail />} />
                <Route path="/tools" element={<ForensicTools />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
