/** @format */
import { createContext, useContext, useState, useEffect, useMemo } from "react";
const AuthContext = createContext();
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

import { setToken, getToken, clearToken } from "../utility/auth";

export const AuthProvider = ({ children }) => {
  const base_URL = import.meta.env.VITE_BACKEND_URL;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${base_URL}/auth/protected`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data?.user) setUser(data.user);
        else setUser(null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [base_URL]);

  // Derived helpers
  const isAuthed = !!user;
  const profileCompleted = !!user?.profileCompleted;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const login = async (email, password) => {
    const res = await fetch(`${base_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data?.error || "Login failed" };
    }

    if (data.token && data.user) {
      setToken(data.token);
      setUser(data.user);
      console.log("Login successful, user:", data.user);
      return data;
    } else {
      throw new Error("Invalid login response");
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const signUp = async (username, email, password, role) => {
    const res = await fetch(`${base_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, email, password, role }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data?.error || "Signup failed" };
    }

    if (data.token && data.user) {
      setToken(data.token);
      setUser(data.user);
      return data;
    } else {
      throw new Error("Invalid signup response");
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const logout = async () => {
    try {
      await fetch(`${base_URL}/auth/logout`, { credentials: "include" });
    } catch {
      /* empty */
    }
    clearToken();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      setUser,
      isAuthed,
      profileCompleted,
      login,
      signUp,
      logout,
      loading,
    }),
    [user, setUser, isAuthed, profileCompleted, login, signUp, logout, loading]
  );



  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
