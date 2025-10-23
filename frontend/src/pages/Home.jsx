import React from "react";
import { useAuth } from "../components/AuthContext";
const Home = () => {
  const { user } = useAuth();
  console.log("User in Home:", user);
  return (
    <div>
      <h1>Home Page - Dashbord welcome {user.username}</h1>
    </div>
  );
};

export default Home;
