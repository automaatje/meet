import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './hooks/useToast';
import { ConfirmProvider } from './hooks/useConfirm';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WifiOff } from 'lucide-react';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Home = lazy(() => import('./pages/Home'));
const CustomerDetail = lazy(() => import('./components/customers/CustomerDetail'));
const ProjectDetail = lazy(() => import('./components/projects/ProjectDetail'));
const WorkOrderDetail = lazy(() => import('./pages/WorkOrderDetail'));
const InvoiceDetail = lazy(() => import('./pages/InvoiceDetail'));

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Laden...</p>
      </div>
    </div>
  );
}

function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white px-4 py-2 text-center z-50 shadow-lg">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">Offline modus - Wijzigingen worden gesynchroniseerd zodra je weer online bent</span>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return !user ? <>{children}</> : <Navigate to="/" />;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <OrganizationProvider>
            <ThemeProvider>
              <ToastProvider>
                <ConfirmProvider>
                  <OfflineIndicator />
                  <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  <Route
                    path="/login"
                    element={
                      <PublicRoute>
                        <Login />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <PublicRoute>
                        <Register />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Home />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/customers/:id"
                    element={
                      <ProtectedRoute>
                        <CustomerDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/projects/:id"
                    element={
                      <ProtectedRoute>
                        <ProjectDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/work-orders/:id"
                    element={
                      <ProtectedRoute>
                        <WorkOrderDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/invoices/:id"
                    element={
                      <ProtectedRoute>
                        <InvoiceDetail />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Suspense>
                </ConfirmProvider>
              </ToastProvider>
            </ThemeProvider>
          </OrganizationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
