"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, LoginCredentials } from "../types";
import { authService } from "../lib/api";

interface AuthContextType {
  user: User | null;
  jwt: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithOtp: (email: string, otp: string) => Promise<void>;
  setAuthFromOtp: (jwt: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedJwt = localStorage.getItem("jwt");
    const storedUser = localStorage.getItem("user");
    if (storedJwt && storedUser) {
      setJwt(storedJwt);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const persist = (jwt: string, user: User) => {
    setUser(user);
    setJwt(jwt);
    localStorage.setItem("jwt", jwt);
    localStorage.setItem("user", JSON.stringify(user));
  };

  const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    persist(response.jwt, response.user);
  };

  const loginWithOtp = async (email: string, otp: string) => {
    const response = await authService.verifyOtpLogin(email, otp);
    persist(response.jwt, response.user);
  };

  const setAuthFromOtp = (jwt: string, user: User) => {
    persist(jwt, user);
  };

  const logout = () => {
    setUser(null);
    setJwt(null);
    localStorage.removeItem("jwt");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, jwt, login, loginWithOtp, setAuthFromOtp, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
