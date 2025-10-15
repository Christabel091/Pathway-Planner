
import Welcome from "./pages/Welcome";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Info from "./pages/Info";
import Home from "./pages/Home";
//import InfoIntro from "./pages/InfoIntro";
//import InfoPatient from "./pages/InfoPatient";
//import InfoCaregiver from "./pages/InfoCaregiver";
//import InfoPhysician from "./pages/InfoPhysician";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./components/AuthContext";
function ProtectedRoute() {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/Welcome" />;
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
