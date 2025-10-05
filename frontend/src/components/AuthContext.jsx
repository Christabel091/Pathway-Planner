/** @format */

import { createContext, useContext, useState, useEffect } from "react";
const AuthContext = createContext();
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const base_URL = import.meta.env.VITE_BACKEND_URL;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      fetch(`${base_URL}/auth/me`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) setUser(data.user);
        })
        .catch(setUser(null))
        .finally(() => setLoading(false));
    } catch (error) {
      throw new Error(error);
    }
  }, []);

  const login = async (email, password) => {
    const res = await fetch(`${base_URL}/auth/Login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (data.user) setUser(data.user);
    return data;
  };

  const signUp = async (username, email, password, role) => {
    const res = await fetch(`${base_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ username, email, password, role }),
    });
    const data = await res.json();
    if (data.user) setUser(data.user);
    return data;
  };

  const logout = async () => {
    await fetch(`${base_URL}/auth/logout`, {
      credentials: "include",
    });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signUp, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
