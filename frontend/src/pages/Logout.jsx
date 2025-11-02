/** @format */
import { useAuth } from "../components/AuthContext";
import Modal from "../components/Modal";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const [modalMessage, setModalMessage] = useState(
    "You have been logged out successfully."
  );
  const [modalType] = useState("success");
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Immediately log out the user when the component mounts
    logout();

    // Wait 2 seconds so the modal can show before redirect
    const timer = setTimeout(() => {
      navigate("/Welcome", { replace: true });
    }, 2500);

    return () => clearTimeout(timer);
  }, [logout, navigate]);

  return (
    <div className="tw-min-h-screen tw-flex tw-items-center tw-justify-center tw-bg-gradient-to-b tw-from-[#f9f6f1] tw-via-[#f5ece5] tw-to-[#e7b19d] tw-backdrop-blur-sm">
      {modalMessage && (
        <Modal
          message={modalMessage}
          type={modalType}
          duration={7000}
          onClose={() => setModalMessage("")}
        />
      )}
    </div>
  );
};

export default Logout;
