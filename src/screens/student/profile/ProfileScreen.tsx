import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

const API_BASE_URL = "https://my-library-pink-psi.vercel.app";

// 🎨 same theme as other screens
const theme = {
  primary: "#1976d2",
  primaryLight: "#E3F2FD",
  bg: "#f5f5f5",
  cardBg: "#ffffff",
  border: "#ddd",
  textMuted: "#666",
  danger: "#d32f2f",
};

type Student = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  enrollmentNo?: string;
  libraryId?: string;
  branch?: string;
  year?: string | number;
  section?: string;
  [key: string]: any;
};

async function authedFetch(path: string, options: RequestInit = {}) {
  const token = await AsyncStorage.getItem("study_auth_token");
  const headers: any = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);

  // ⛑ auth guard + load student
  useEffect(() => {
    let active = true;

    (async () => {
      const token = await AsyncStorage.getItem("study_auth_token");
      const userStr = await AsyncStorage.getItem("study_user");

      if (!active) return;

      if (!token || !userStr) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      try {
        const user = JSON.parse(userStr);
        if (!user?.uid) {
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
          return;
        }

        const res = await authedFetch(`/api/students/by-uid?uid=${user.uid}`);
        const data = await res.json();
        const st = data?.student || null;

        if (st && st._id) {
          setStudent(st);
        } else {
          // fallback: at least show basic user data
          setStudent({
            _id: "unknown",
            name: user.name,
            email: user.email,
          });
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
        setAuthChecking(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [navigation]);

  const logout = async () => {
    await AsyncStorage.removeItem("study_auth_token");
    await AsyncStorage.removeItem("study_user");
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  if (authChecking || loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!student) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <Text style={{ textAlign: "center" }}>
          Could not load profile. Please login again.
        </Text>
        <TouchableOpacity style={[styles.logoutBtn, { marginTop: 16 }]} onPress={logout}>
          <Text style={styles.logoutText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const infoRows = [
    { label: "Name", value: student.name },
    { label: "Email", value: student.email },
    { label: "Phone", value: student.phone },
    { label: "Enrollment No.", value: student.enrollmentNo },
    { label: "Library ID", value: student.libraryId },
    { label: "Branch", value: student.branch },
    { label: "Year", value: student.year?.toString() },
    { label: "Section", value: student.section },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {student.name?.[0]?.toUpperCase() || "S"}
          </Text>
        </View>
        <Text style={styles.nameText}>{student.name || "Student"}</Text>
        {student.email && (
          <Text style={styles.emailText}>{student.email}</Text>
        )}
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Profile Details</Text>

        {infoRows.map(
          (row) =>
            row.value && (
              <View key={row.label} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            )
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionsCard}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => {
            // future: navigate to "EditProfile"
          }}
        >
          <Text style={styles.actionText}>Edit Profile (coming soon)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerCard: {
    alignItems: "center",
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: theme.cardBg,
    marginBottom: 16,
    elevation: 4,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: theme.primary,
  },
  nameText: {
    fontSize: 20,
    fontWeight: "700",
  },
  emailText: {
    fontSize: 14,
    color: theme.textMuted,
    marginTop: 4,
  },
  infoCard: {
    borderRadius: 16,
    backgroundColor: theme.cardBg,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.textMuted,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionsCard: {
    borderRadius: 16,
    backgroundColor: theme.cardBg,
    padding: 16,
    elevation: 3,
  },
  actionItem: {
    paddingVertical: 10,
  },
  actionText: {
    color: theme.primary,
    fontWeight: "600",
  },
  logoutBtn: {
    marginTop: 10,
    backgroundColor: theme.danger,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontWeight: "700",
  },
});
