import React, { useState } from "react";
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

const API_BASE_URL = "https://my-library-pink-psi.vercel.app";

export default function RegisterScreen() {
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const register = async () => {
    if (!email || !password) {
      Alert.alert("Missing info", "Email and Password are required");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "email",
          email,
          password,
          name: "New User",      // <-- Must send
          phoneNumber: null      // <-- Optional
        }),
      });
      

      const data = await res.json();
      console.log("Register Response:", data);

      if (data.error) {
        setMessage(data.error);
      } else {
        setMessage("Account Created Successfully!");
        Alert.alert("Success", "Account Created!", [
          { text: "Login", onPress: () => navigation.navigate("Login") },
        ]);
      }
    } catch (err: any) {
      console.log(err);
      setMessage("Something went wrong");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Register</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          onChangeText={setPassword}
        />

        <TouchableOpacity onPress={register} style={styles.button}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>

        {message !== "" && (
          <Text style={styles.message}>{message}</Text>
        )}

        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          style={{ marginTop: 10 }}
        >
          <Text style={styles.link}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    padding: 22,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#ddd",
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  button: {
    width: "100%",
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  message: {
    marginTop: 10,
    textAlign: "center",
    color: "#444",
  },
  link: {
    textAlign: "center",
    color: "#2563eb",
    fontWeight: "600",
  },
});
