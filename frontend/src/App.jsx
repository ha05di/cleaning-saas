import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import CustomersPage from "./pages/CustomersPage";
import JobsPage from "./pages/JobsPage";
import CleanersPage from "./pages/CleanersPage";
import NewCleanerPage from "./pages/NewCleanerPage";
import JobDetailPage from "./pages/JobDetailPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import SchedulePage from "./pages/SchedulePage";
import LandingPage from "./pages/LandingPage";
import { useAuth } from "./context/AuthContext";
import NewJobPage from "./pages/NewJobPage";
import NewCustomerPage from "./pages/NewCustomerPage";
import { DEV_BYPASS_AUTH } from "./config";

function PrivateRoute({ children }) {
  const { session, loading } = useAuth();

  if (DEV_BYPASS_AUTH) {
    return children;
  }

  if (loading) {
    return <div className="p-6">Checking session...</div>;
  }

  return session ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/schedule"
        element={
          <PrivateRoute>
            <SchedulePage />
          </PrivateRoute>
        }
      />

      <Route
        path="/customers"
        element={
          <PrivateRoute>
            <CustomersPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/customers/new"
        element={
          <PrivateRoute>
            <NewCustomerPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/customers/:id"
        element={
          <PrivateRoute>
            <CustomerDetailPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/jobs"
        element={
          <PrivateRoute>
            <JobsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/jobs/new"
        element={
          <PrivateRoute>
            <NewJobPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/jobs/:id"
        element={
          <PrivateRoute>
            <JobDetailPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/cleaners"
        element={
          <PrivateRoute>
            <CleanersPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/cleaners/new"
        element={
          <PrivateRoute>
            <NewCleanerPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/cleaners/:id"
        element={
          <PrivateRoute>
            <NewCleanerPage />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}