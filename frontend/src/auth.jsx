import { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin, register as apiRegister, me, setAuthToken, setOnUnauthorized } from "./api";

const STORAGE_KEY = "helmsman_token";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
    setAuthToken(null);
  }

  useEffect(() => {
    setOnUnauthorized(clear);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setAuthToken(token);
    me()
      .then(setUser)
      .catch(() => clear())
      .finally(() => setLoading(false));
  }, [token]);

  function applySession(data) {
    localStorage.setItem(STORAGE_KEY, data.access_token);
    setAuthToken(data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  }

  async function login(email, password) {
    applySession(await apiLogin(email, password));
  }

  async function register(email, password) {
    await apiRegister(email, password);
    await login(email, password);
  }

  function logout() {
    clear();
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
