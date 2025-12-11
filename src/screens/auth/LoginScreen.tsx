import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { signInWithEmailAndPassword, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../../lib/FirebaseConfig";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";


// if you have a RootStackParamList, use that; otherwise `any` is fine
type Nav = NativeStackNavigationProp<any>;

// ❌ remove the leading space
const API_BASE_URL = "https://my-library-pink-psi.vercel.app"; // your Next.js dev server

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();

  const recaptchaVerifier = useRef<any>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  /** 📌 Save token + user info in AsyncStorage */
  const saveAuthData = async (idToken: string, payload: any) => {
    try {
      await AsyncStorage.setItem("study_auth_token", idToken);
      await AsyncStorage.setItem("study_user", JSON.stringify(payload));
    } catch (e) {
      console.log("Error saving auth data", e);
    }
  };

  const callBackendLogin = async (idToken: string, loginMethod: "email" | "phone") => {
    const res = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, loginMethod }),
    });
  
    const data = await res.json();
  
    if (!res.ok || !data.success) throw new Error(data.message || "Login failed");
  
    const payload = {
      uid: data.user.uid,
      email: data.user.email,
      name: data.user.name,
      role: data.role,
      studentId: data.studentId,
      adminToken: data.adminToken,
    };
  
    await saveAuthData(idToken, payload);
  
    // Save userType for RootNavigator
    await AsyncStorage.setItem("userType", payload.role);
  };
  
  /** Email Login */
/** 📌 Email Login using Firebase + /api/login */
const loginEmail = async () => {
  if (!email || !password) {
    Alert.alert("Missing info", "Email and Password are required");
    return;
  }

  try {
    setLoading(true);

    // 1) Firebase Login
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
    const user = cred.user;

    // Force refresh token
    const idToken = await user.getIdToken(true);

    console.log("Firebase Login OK, idToken:", idToken.slice(0, 20) + "...");

    // 2) Call backend login (your existing function)
    await callBackendLogin(idToken, "email");

    // 3) 🔥 Navigate to Profile page after successful login
    navigation.reset({
      index: 0,
      routes: [
        {
          name: "StudentTabs",
          state: {
            index: 1, // tab index (0=Home, 1=Profile)
            routes: [{ name: "Profile" }],
          },
        },
      ],
    });

  } catch (err: any) {
    console.log("Login error:", err);
    Alert.alert("Login failed", err.message);
  } finally {
    setLoading(false);
  }
};

  /** 📌 Google Login (still placeholder – plug expo-auth-session and then call /api/login) */
  const loginGoogle = async () => {
    Alert.alert("Google login not wired", "Integrate expo-auth-session + Firebase, then call /api/login with idToken and loginMethod:'email' or 'google'.");
  };

  /** 📌 Send OTP (Phone Login) using Firebase Phone Auth */
  const sendOTP = async () => {
    try {
      if (!phone.startsWith("+")) {
        Alert.alert("Invalid phone", "Use full number with country code, e.g. +91...");
        return;
      }

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phone,
        recaptchaVerifier.current
      );
      setConfirmation(confirmationResult);
      Alert.alert("OTP Sent", "Check your SMS messages.");
    } catch (err: any) {
      console.log(err);
      Alert.alert("Error sending OTP", err.message || "Try again");
    }
  };

  /** 📌 Verify OTP -> get idToken -> /api/login (phone) */
  const verifyOTP = async () => {
    if (!confirmation) return;

    try {
      setLoading(true);
      const result = await confirmation.confirm(otp);
      const user = result.user;
      const idToken = await user.getIdToken();

      await callBackendLogin(idToken, "phone");
    } catch (err: any) {
      console.log(err);
      Alert.alert("Verification error", err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Login</Text>

        {/* Email Login */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          onPress={loginEmail}
          style={[styles.button, styles.emailBtn]}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Logging in..." : "Login with Email"}
          </Text>
        </TouchableOpacity>

        {/* Google Login */}
        <TouchableOpacity
          onPress={loginGoogle}
          style={[styles.button, styles.googleBtn]}
        >
          <Text style={styles.buttonText}>Login with Google</Text>
        </TouchableOpacity>

        {/* Phone Login */}
        <TextInput
          style={styles.input}
          placeholder="Phone Number (with +91)"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TouchableOpacity
          onPress={sendOTP}
          style={[styles.button, styles.otpBtn]}
        >
          <Text style={styles.buttonText}>Send OTP</Text>
        </TouchableOpacity>

        {confirmation && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Enter OTP"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
            />
            <TouchableOpacity
              onPress={verifyOTP}
              style={[styles.button, styles.verifyBtn]}
            >
              <Text style={styles.buttonText}>Verify OTP</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      <TouchableOpacity
        onPress={() => navigation.navigate("RegisterScreen")} // Navigate to Register screen
        style={{ marginTop: 10, alignItems: "center" }}
      >
        <Text style={{ color: "#2563eb", fontWeight: "600" }}>
          Don't have an account? Register
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "#f5f5f5",
  },
  card: {
    width: "100%",
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    width: "100%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#ddd",
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  button: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  emailBtn: {
    backgroundColor: "#2563eb",
  },
  googleBtn: {
    backgroundColor: "#dc2626",
  },
  otpBtn: {
    backgroundColor: "#16a34a",
  },
  verifyBtn: {
    backgroundColor: "#7c3aed",
  },
});
