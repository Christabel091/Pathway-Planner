import "../src/styles/App.css";
import Welcome from "./pages/Welcome";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Home from "./pages/Home";

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
  const { user } = useAuth();
  return (
    <>
      <Routes>
        <Route
          path="/Welcome"
          element={!user ? <Welcome /> : <Navigate to="/" />}
        />
        <Route
          path="/SignUp"
          element={!user ? <SignUp /> : <Navigate to="/" />}
        />
        <Route
          path="/Login"
          element={!user ? <Login /> : <Navigate to="/" />}
        />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
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
