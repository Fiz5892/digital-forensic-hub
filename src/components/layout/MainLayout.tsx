import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function MainLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
