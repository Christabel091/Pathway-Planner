import Intro from "./pages/intro"; 
import Welcome from "./pages/Welcome";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Navbar from "./pages/navbar";
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
function ProtectedRoute() {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/Welcome" />;
}
function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <>
      {location.pathname !== "/" && <Navbar />}
      <Routes>
        <Route
          path="/"
          element={!user ? <Intro /> : <Navigate to="/home" replace />}
        />
        <Route
          path="/Welcome"
          element={!user ? <Welcome /> : <Navigate to="/" />}
        />
        <Route path="/About" element={<About />} />
        <Route path="/Services" element={<Services />} />
        <Route path="/Contact" element={<Contact />} />
        <Route
          path="/SignUp"
          element={!user ? <SignUp /> : <Navigate to="/" />}
        />
        <Route
          path="/Login"
          element={!user ? <Login /> : <Navigate to="/" />}
        />

        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
        </Route>
      </Routes>
    </>
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
