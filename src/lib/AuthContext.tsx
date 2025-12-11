"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./FirebaseConfig";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  token: string | null;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  token: null,
  logout: async () => {},
});

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 📌 1. Load user from storage (cold start)
  const loadStoredUser = async () => {
    const token = await AsyncStorage.getItem("token");
    const userJson = await AsyncStorage.getItem("user");

    if (token && userJson) {
      setToken(token);
      setUser(JSON.parse(userJson));
    }

    setLoading(false);
  };

  // 📌 2. Firebase auth listener
  useEffect(() => {
    loadStoredUser();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const freshToken = await firebaseUser.getIdToken(true);

        await AsyncStorage.setItem("token", freshToken);
        await AsyncStorage.setItem("user", JSON.stringify(firebaseUser));

        setToken(freshToken);
        setUser(firebaseUser);
      } else {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");
        setUser(null);
        setToken(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 📌 3. Automatic Token Refresh every 30 minutes
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const freshToken = await user.getIdToken(true);

      await AsyncStorage.setItem("token", freshToken);
      setToken(freshToken);

      console.log("🔄 Firebase token refreshed");
    }, 30 * 60 * 1000); // 30 min

    return () => clearInterval(interval);
  }, [user]);

  // 📌 4. Logout function
  const logout = async () => {
    await auth.signOut();
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
