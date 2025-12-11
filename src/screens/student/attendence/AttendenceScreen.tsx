import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { apiFetch } from "../../../lib/api";

const API_BASE_URL = "https://my-library-pink-psi.vercel.app";

const theme = {
  primary: "#1976d2",
  secondary: "#0288d1",
  success: "#2e7d32",
  error: "#d32f2f",
  purple: "#6a1b9a",
  bg: "#f5f5f5",
  cardBg: "#ffffff",
};

type Attendance = {
  timestamp: string;
  method: string;
};

type Stats = {
  percentage: number;
  streak: number;
  longestStreak: number;
};

// ---------- Helper to fetch with auth ----------
async function authedFetch(path: string, options: RequestInit = {}) {
  const token = await AsyncStorage.getItem("study_auth_token");
  const headers: any = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
}

// ---------- Main Component ----------
export default function AttendanceScreen() {
  const navigation = useNavigation<any>();
  const now = new Date();

  // ---------- State ----------
  const [loading, setLoading] = useState(false);
  const [monthLoading, setMonthLoading] = useState(false);
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [attendanceMessage, setAttendanceMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [monthDays, setMonthDays] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats>({ percentage: 0, streak: 0, longestStreak: 0 });

  const [scannerOpen, setScannerOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);

  const [authChecking, setAuthChecking] = useState(true);

  // ---------- Fetch today's attendance ----------
  const fetchToday = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authedFetch("/api/attendence/today");
      const data = await res.json();

      if (res.status === 401) {
        // Token expired or unauthorized
        setError("Session expired. Please login again.");
        setAttendanceMessage("❌ Today’s attendance NOT marked");
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      if (data.attendance) {
        setAttendance(data.attendance);
        setAttendanceMessage("✔ Today’s attendance is marked");
      } else {
        setAttendance(null);
        setAttendanceMessage("❌ Today’s attendance NOT marked");
      }
    } catch (err: any) {
      setError(err.message);
      setAttendanceMessage("❌ Today’s attendance NOT marked");
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  // ---------- Try WiFi attendance ----------
  const tryWifiMark = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authedFetch("/api/attendence/mark-wifi", { method: "POST" });
      const data = await res.json();

      if (!data.ok) {
        setError(data.message);
        setAttendanceMessage(`❌ Attendance NOT marked — ${data.message}`);
      } else {
        setAttendance(data.attendance);
        setAttendanceMessage("✔ Attendance marked successfully (WiFi)");
      }
    } catch (err: any) {
      setError(err.message);
      setAttendanceMessage(`❌ Attendance NOT marked — ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------- Handle QR scan ----------
  const handleScan = useCallback(async (tokenValue: string | null) => {
    if (!tokenValue) return;
    setScannerOpen(false);
    setScanning(false);
    setLoading(true);
    setError(null);

    try {
      let token = tokenValue;
      try {
        const url = new URL(tokenValue);
        token = url.searchParams.get("token") || tokenValue;
      } catch {}

      const res = await authedFetch("/api/attendence/mark-qr", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.message);
        setAttendanceMessage(`❌ Attendance NOT marked — ${data.message}`);
      } else {
        setAttendance(data.attendance);
        setAttendanceMessage("✔ Attendance marked successfully (QR)");
      }
    } catch (err: any) {
      setError(err.message);
      setAttendanceMessage(`❌ Attendance NOT marked — ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------- Load monthly attendance ----------
  const loadMonth = useCallback(async (y: number, m: number) => {
    setMonthLoading(true);
    setError(null);
    try {
      const res = await authedFetch(`/api/attendence/month?year=${y}&month=${m}`);
      const data = await res.json();

      if (!data.ok) return;

      setMonthDays(data.days);

      const daysInMonth = new Date(y, m, 0).getDate();
      const today = new Date();
      let streak = 0;
      let longest = 0;
      let currentStreak = 0;

      for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(y, m - 1, d).toISOString().slice(0, 10);
        const present = data.days.includes(dt);

        if (present) {
          streak++;
          longest = Math.max(longest, streak);
        } else streak = 0;

        if (present && d <= today.getDate()) currentStreak++;
        else if (d <= today.getDate()) currentStreak = 0;
      }

      setStats({
        percentage: Math.round((data.days.length / daysInMonth) * 100),
        streak: currentStreak,
        longestStreak: longest,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setMonthLoading(false);
    }
  }, []);

  // ---------- Auth check ----------
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("study_auth_token");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      } else {
        setAuthChecking(false);
      }
    };
    checkAuth();
  }, [navigation]);

  // ---------- Fetch data on focus ----------
  useFocusEffect(
    useCallback(() => {
      if (authChecking) return;
      fetchToday();
      tryWifiMark();
      loadMonth(year, month);
    }, [authChecking, fetchToday, tryWifiMark, loadMonth, year, month])
  );

  // ---------- QR scanner ----------
  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (result.granted) setScannerOpen(true);
    } else {
      setScannerOpen(true);
    }
    setScanning(true);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (!scanning) return;
    handleScan(data);
  };

  // ---------- Render ----------
  if (authChecking) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* SUMMARY */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Attendance Overview</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <Text style={[styles.summaryNumber, { color: theme.success }]}>{stats.percentage}%</Text>
            <Text style={styles.summaryLabel}>Percentage</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={[styles.summaryNumber, { color: theme.secondary }]}>{stats.streak}</Text>
            <Text style={styles.summaryLabel}>Current Streak</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={[styles.summaryNumber, { color: theme.purple }]}>{stats.longestStreak}</Text>
            <Text style={styles.summaryLabel}>Longest Streak</Text>
          </View>
        </View>
      </View>

      {/* TODAY */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's Attendance</Text>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 16 }} color={theme.primary} />
        ) : (
          <View style={{ marginTop: 16 }}>
            <Text style={[styles.attendanceMessage, { color: attendance ? theme.success : theme.error }]}>
              {attendanceMessage}
            </Text>
            {attendance && (
              <>
                <Text style={styles.infoText}>Marked: {new Date(attendance.timestamp).toLocaleString()}</Text>
                <Text style={styles.infoText}>Method: {attendance.method}</Text>
              </>
            )}
            {!attendance && error && <Text style={[styles.infoText, { color: theme.error }]}>{error}</Text>}
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.primaryBtn} onPress={openScanner}>
            <Text style={styles.primaryBtnText}>Scan QR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={tryWifiMark}>
            <Text style={styles.secondaryBtnText}>Try WiFi Mark</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MONTH */}
      <View style={{ marginTop: 24 }}>
        <View style={styles.monthHeader}>
          <TouchableOpacity
            onPress={() => {
              if (month === 1) setYear((y) => y - 1), setMonth(12);
              else setMonth((m) => m - 1);
            }}
            style={styles.navBtn}
          >
            <Text style={styles.navBtnText}>⬅ Previous</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {new Date(year, month - 1).toLocaleString("default", { month: "long" })} {year}
          </Text>
          <TouchableOpacity
            onPress={() => {
              if (month === 12) setYear((y) => y + 1), setMonth(1);
              else setMonth((m) => m + 1);
            }}
            style={styles.navBtn}
          >
            <Text style={styles.navBtnText}>Next ➡</Text>
          </TouchableOpacity>
        </View>

        {monthLoading ? (
          <ActivityIndicator style={{ marginTop: 16 }} color={theme.primary} />
        ) : (
          <View style={styles.grid}>
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const checkDate = new Date(year, month - 1, day);
              checkDate.setHours(0, 0, 0, 0);
              const dateStr = checkDate.toISOString().slice(0, 10);
              const present = monthDays.includes(dateStr);
              const isToday = checkDate.getTime() === todayDate.getTime();
              const isFuture = checkDate.getTime() > todayDate.getTime();

              let bgColor = theme.error;
              if (present) bgColor = theme.success;
              if (isFuture) bgColor = theme.primary;

              return (
                <View key={day} style={[styles.dayBox, { backgroundColor: bgColor, borderWidth: isToday ? 2 : 0, borderColor: theme.secondary }]}>
                  <Text style={styles.dayText}>{day}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* QR SCANNER */}
      <Modal visible={scannerOpen} animationType="slide" onRequestClose={() => setScannerOpen(false)}>
        <View style={styles.scannerContainer}>
          <Text style={styles.scannerTitle}>Scan Attendance QR</Text>
          {!permission?.granted && <Text style={{ color: "red", marginBottom: 16 }}>Camera permission not granted</Text>}
          {permission?.granted && <CameraView style={styles.scanner} barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={scanning ? handleBarCodeScanned : undefined} />}
          <TouchableOpacity style={[styles.secondaryBtn, { marginTop: 16, width: "80%" }]} onPress={() => setScannerOpen(false)}>
            <Text style={styles.secondaryBtnText}>Close Scanner</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

const width = Dimensions.get("window").width;
const daySize = (width - 40) / 7 - 4;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16, backgroundColor: theme.bg },
  summaryCard: { borderRadius: 16, padding: 16, backgroundColor: theme.cardBg, marginBottom: 16, elevation: 4 },
  summaryTitle: { fontSize: 22, fontWeight: "700", marginBottom: 12, textAlign: "center" },
  summaryRow: { flexDirection: "row", justifyContent: "space-around" },
  summaryBox: { alignItems: "center" },
  summaryNumber: { fontSize: 24, fontWeight: "800" },
  summaryLabel: { color: "#555", marginTop: 4, fontSize: 13 },
  card: { borderRadius: 16, padding: 16, backgroundColor: theme.cardBg, elevation: 4 },
  cardTitle: { fontSize: 18, fontWeight: "700" },
  attendanceMessage: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
  infoText: { fontSize: 14, color: "#333", marginTop: 2 },
  buttonRow: { flexDirection: "row", marginTop: 16, justifyContent: "space-between", gap: 10 },
  primaryBtn: { flex: 1, backgroundColor: theme.primary, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "600" },
  secondaryBtn: { flex: 1, backgroundColor: theme.cardBg, paddingVertical: 12, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: theme.primary },
  secondaryBtnText: { color: theme.primary, fontWeight: "600" },
  monthHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  navBtn: { borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.primary },
  navBtnText: { color: theme.primary, fontWeight: "600" },
  monthTitle: { fontSize: 18, fontWeight: "800" },
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 12 },
  dayBox: { width: daySize, height: daySize, borderRadius: 8, justifyContent: "center", alignItems: "center", margin: 2 },
  dayText: { color: "#fff", fontWeight: "700" },
  scannerContainer: { flex: 1, paddingTop: 40, alignItems: "center", backgroundColor: "#000" },
  scannerTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 16 },
  scanner: { width: "90%", height: "60%" },
});
