import { useAuth } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";
const Logout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  logout();
  navigate("/Welcome", { replace: true });
};
export default Logout;
