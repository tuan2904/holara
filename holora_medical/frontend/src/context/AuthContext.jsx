/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import { logoutApi } from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = useCallback((authData) => {
    const { token, refreshToken, user } = authData;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }

    setToken(token);
    setUser(user);
  }, []);

  const logout = useCallback(async () => {
    const rt = localStorage.getItem("refreshToken");
    if (rt) {
      try { await logoutApi(rt); } catch { /* ignore */ }
    }

    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    setToken("");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      role: user?.role || null,
      roles: user?.roles || [], // Add all roles array
      isAuthenticated: !!token,
      hasRole: (requiredRole) => {
        // Check if user has a specific role (primary or in roles array)
        if (!user) return false;
        if (user.role === requiredRole) return true;
        return user.roles && user.roles.includes(requiredRole);
      },
      hasAnyRole: (requiredRoles) => {
        // Check if user has any of the required roles
        if (!user) return false;
        return requiredRoles.some(role => 
          user.role === role || (user.roles && user.roles.includes(role))
        );
      },
      login,
      logout,
    }),
    [token, user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);