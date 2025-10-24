import Welcome from "./pages/Welcome";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Navbar from "./pages/navbar";
import Intro from "./pages/intro";
import About from "./pages/About";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import PatientOnboarding from "./pages/PatientOnboarding";
import ClinicianOnboarding from "./pages/ClinicianOnboarding";
import CaretakerOnboarding from "./pages/CaretakerOnboarding";
import AdminOnboarding from "./pages/AdminOnboarding";

import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
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
  return profileCompleted ? <Navigate to="/home" replace /> : <Outlet />;
}

// Public pages: if authed, send them to the right place
function PublicRedirect() {
  const { isAuthed, profileCompleted, loading } = useAuth();
  if (loading) return null;
  if (!isAuthed) return <Outlet />;
  return profileCompleted ? (
    <Navigate to="/home" replace />
  ) : (
    <Navigate to="/onboarding" replace />
  );
}

function AppRoutes() {
  const { user } = useAuth();
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
            element={<PatientOnboarding setUserProfile={setUserProfile} />}
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
          <Route path="/home" element={<Home profile={userProfile} />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/Welcome" replace />} />
    </Routes>
  );
}

function Layout() {
  const location = useLocation();
  // Hide navbar on the splash pages if you want (optional)
  const hideNavOn = new Set(["/", "/Welcome", "/Login", "/SignUp"]);
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
      <Router>
        <Layout />
      </Router>
    </AuthProvider>
  );
}

export default App;
