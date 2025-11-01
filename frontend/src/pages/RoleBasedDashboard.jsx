import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../components/AuthContext";   // ✅ added

export default function RoleBasedDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (location.pathname !== "/dashboard") return;

    switch (user.role) {
      case "patient":
        navigate("/dashboard/patient", { replace: true });
        break;
      case "clinician":
        navigate("/dashboard/clinician", { replace: true });
        break;
      case "caretaker":
        navigate("/dashboard/caretaker", { replace: true });
        break;
      case "admin":
        navigate("/dashboard/admin", { replace: true });
        break;
      default:
        navigate("/", { replace: true });
    }
  }, [user, location.pathname, navigate]);

  return null;
}
