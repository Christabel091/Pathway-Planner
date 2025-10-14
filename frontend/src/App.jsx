import "../src/styles/App.css";
import Welcome from "./pages/Welcome";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Info from "./pages/Info";
import Home from "./pages/Home";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
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
  return profileCompleted ? <Navigate to="/" replace /> : <Outlet />;
}

// For public pages: if authed, send them either to Info (if incomplete) or Home.
function PublicRedirect() {
  const { isAuthed, profileCompleted, loading } = useAuth();
  if (loading) return null;
  if (!isAuthed) return <Outlet />;
  return profileCompleted ? (
    <Navigate to="/" replace />
  ) : (
    <Navigate to="/Info" replace />
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRedirect />}>
        <Route path="/Welcome" element={<Welcome />} />
        <Route path="/SignUp" element={<SignUp />} />
        <Route path="/Login" element={<Login />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<BlockIfProfileComplete />}>
          <Route path="/Info" element={<Info />} />
        </Route>
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<RequireProfileComplete />}>
          <Route path="/" element={<Home />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/Welcome" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
