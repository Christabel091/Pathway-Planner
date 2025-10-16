import Welcome from "./pages/Welcome";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Info from "./pages/Info";
import Home from "./pages/Home";
import Navbar from "./pages/navbar";
import Intro from "./pages/intro"; // keep path/case matching your file
import About from "./pages/About";
import Services from "./pages/Services";
import Contact from "./pages/Contact";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./components/AuthContext";

function RequireAuth() {
  const { isAuthed, loading } = useAuth();
  if (loading) return null; // or a spinner
  return isAuthed ? <Outlet /> : <Navigate to="/Welcome" replace />;
}

function RequireProfileComplete() {
  const { profileCompleted, loading } = useAuth();
  if (loading) return null;
  return profileCompleted ? <Outlet /> : <Navigate to="/Info" replace />;
}

function BlockIfProfileComplete() {
  const { profileCompleted, loading } = useAuth();
  if (loading) return null;
  return profileCompleted ? <Navigate to="/home" replace /> : <Outlet />;
}

// For public pages: if authed, send them either to Info (if incomplete) or Home.
function PublicRedirect() {
  const { isAuthed, profileCompleted, loading } = useAuth();
  if (loading) return null;
  if (!isAuthed) return <Outlet />;
  return profileCompleted ? (
    <Navigate to="/home" replace />
  ) : (
    <Navigate to="/Info" replace />
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicRedirect />}> 
        <Route path="/" element={<Intro />} />
        <Route path="/Welcome" element={<Welcome />} />
        <Route path="/SignUp" element={<SignUp />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/About" element={<About />} />
        <Route path="/Services" element={<Services />} />
        <Route path="/Contact" element={<Contact />} />
      </Route>

      {/* Auth required but profile not complete: allow Info wizard */}
      <Route element={<RequireAuth />}> 
        <Route element={<BlockIfProfileComplete />}>
          <Route path="/Info" element={<Info />} />
        </Route>
      </Route>

      {/* Fully authed + profile complete */}
      <Route element={<RequireAuth />}> 
        <Route element={<RequireProfileComplete />}>
          <Route path="/home" element={<Home />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Layout() {
  const location = useLocation();
  return (
    <>
      {location.pathname !== "/" && <Navbar />}
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