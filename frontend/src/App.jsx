import Welcome from "./pages/Welcome";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Navbar from "./pages/navbar";
import Intro from "./pages/Intro";
import About from "./pages/About";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import PatientOnboarding from "./pages/PatientOnboarding";
import ClinicianOnboarding from "./pages/ClinicianOnboarding";
import CaretakerOnboarding from "./pages/CaretakerOnboarding";
import AdminOnboarding from "./pages/AdminOnboarding";
import RoleBasedDashboard from "./pages/RoleBasedDashboard";
import PatientDashboard from "./pages/dashboard/PatientDashboard";
import ClinicianDashboard from "./pages/dashboard/ClinicianDashboard";
import CaretakerDashboard from "./pages/dashboard/CaretakerDashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import LabsPage from "./pages/Patients/LabsPage";
import MedicationsPage from "./pages/Patients/MedicationsPage";
import ClinicianMedUpdate from "./pages/Clinicians/ClinicianMedUpdate";
import ClinicianMedReview from "./pages/Clinicians/ClinicianMedReview";
import Account from "./pages/Patients/Account";
import DailyLogsPage from "./pages/Patients/DailyLogsPage";
import InboxPage from "./pages/Patients/InboxPage";
import GoalsPage from "./pages/Patients/GoalsPage";
import Logout from "./pages/Logout";

import { useState } from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthContext";
// ——— Guards ———
function RequireAuth() {
  const { isAuthed, loading } = useAuth();
  if (loading) return null; // TODO: replace with spinner
  return isAuthed ? <Outlet /> : <Navigate to="/Welcome" replace />;
}

function RequireProfileComplete() {
  const { profileCompleted, loading } = useAuth();
  if (loading) return null;
  return profileCompleted ? <Outlet /> : <Navigate to="/onboarding" replace />;
}

function BlockIfProfileComplete() {
  const { profileCompleted, loading } = useAuth();
  if (loading) return null;
  return profileCompleted ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

function PublicRedirect() {
  const { isAuthed, profileCompleted, loading } = useAuth();
  if (loading) return null;
  if (!isAuthed) return <Outlet />; // let unauthenticated users see public pages

  return profileCompleted ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/onboarding" replace />
  );
}

function AppRoutes() {
  const { user } = useAuth();
  const [patientInfo, setPatientInfo] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicRedirect />}>
        <Route path="/" element={<Intro />} />
        <Route path="/Welcome" element={<Welcome />} />
        <Route path="/SignUp" element={<SignUp />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/About" element={<About />} />
        <Route path="/Services" element={<Services />} />
        <Route path="/Contact" element={<Contact />} />
      </Route>

      {/* Auth required but profile incomplete → onboarding */}
      <Route element={<RequireAuth />}>
        <Route element={<BlockIfProfileComplete />}>
          {/* Generic /onboarding chooses based on role */}
          <Route
            path="/onboarding"
            element={
              user?.role === "patient" ? (
                <Navigate to="/onboarding/patient" replace />
              ) : user?.role === "physician" ? (
                <Navigate to="/onboarding/clinician" replace />
              ) : user?.role === "caretaker" ? (
                <Navigate to="/onboarding/caretaker" replace />
              ) : user?.role === "admin" ? (
                <Navigate to="/onboarding/admin" replace />
              ) : (
                <Navigate to="/Welcome" replace />
              )
            }
          />
          {/* Explicit role routes (so redirects have targets) */}
          <Route
            path="/onboarding/patient"
            element={
              <PatientOnboarding
                setUserProfile={setUserProfile}
                userProfile={userProfile}
              />
            }
          />
          <Route
            path="/onboarding/clinician"
            element={<ClinicianOnboarding setUserProfile={setUserProfile} />}
          />
          <Route
            path="/onboarding/caretaker"
            element={<CaretakerOnboarding setUserProfile={setUserProfile} />}
          />
          <Route
            path="/onboarding/admin"
            element={<AdminOnboarding setUserProfile={setUserProfile} />}
          />
        </Route>
      </Route>

      {/* Fully authed + profile complete */}
      <Route element={<RequireAuth />}>
        <Route element={<RequireProfileComplete />}>
          <Route path="/dashboard">
            <Route index element={<RoleBasedDashboard />} />
            {""}
            {/* exact match for /dashboard */}
            <Route
              path="patient"
              element={
                <PatientDashboard
                  patientInfo={patientInfo}
                  setPatientInfo={setPatientInfo}
                />
              }
            />
            <Route path="clinician" element={<ClinicianDashboard />} />

            <Route path="clinician/medications" element={<ClinicianMedUpdate />} />
            <Route path="clinician/medications-review" element={<ClinicianMedReview />} />


            <Route path="caretaker" element={<CaretakerDashboard />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route
              path="goals"
              element={
                <GoalsPage
                  patientInfo={patientInfo}
                  setPatientInfo={setPatientInfo}
                />
              }
            />
            <Route path="daily-log" element={<DailyLogsPage />} />
            <Route path="medications" element={<MedicationsPage />} />
            <Route path="lab-results" element={<LabsPage />} />
            <Route path="inbox" element={<InboxPage />} />
            <Route path="account-settings" element={<Account />} />
          </Route>
        </Route>
      </Route>

      <Route path="/logout" element={<Logout />} />
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/Welcome" replace />} />
    </Routes>
  );
}

function Layout() {
  const location = useLocation();
  // Hide navbar on the splash pages if you want (optional)
  const hideNavOn = new Set([
    "/",
    "/Welcome",
    "/Login",
    "/SignUp",
    "/dashboard", //hidden when dashboard is open as well
    "/dashboard/caretaker",
    "/dashboard/patient",
    "/dashboard/clinician",
    "/dashboard/admin",
    "/dashboard/goals",
    "/dashboard/daily-log",
    "/dashboard/medications",
    "/dashboard/lab-results",
    "/dashboard/meals",
    "/dashboard/inbox",
    "/dashboard/account-settings",
     "/dashboard/clinician/medications",
     "/dashboard/clinician/medications-review"
     
  ]);

  return (
    <>
      {!hideNavOn.has(location.pathname) && <Navbar />}
      <AppRoutes />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  );
}

export default App;
