import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TimerProvider } from "@/contexts/TimerContext";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Entries from "@/pages/Entries";
import Reports from "@/pages/Reports";
import Projects from "@/pages/Projects";
import EODReport from "@/pages/EODReport";
import AdminDashboard from "@/pages/AdminDashboard";
import { Toaster } from "@/components/ui/sonner";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" />;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  return user && user.role === "admin" ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <AuthProvider>
      <TimerProvider>
        <div className="App">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/entries"
                element={
                  <ProtectedRoute>
                    <Entries />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <Projects />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/eod"
                element={
                  <ProtectedRoute>
                    <EODReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" />
        </div>
      </TimerProvider>
    </AuthProvider>
  );
}

export default App;