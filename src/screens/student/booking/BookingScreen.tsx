import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

const API_BASE_URL = "https://my-library-pink-psi.vercel.app";

const theme = {
  primary: "#1976d2",
  primaryLight: "#E3F2FD",
  border: "#ccc",
  bg: "#f5f5f5",
  cardBg: "#ffffff",
  error: "#d32f2f",
};

type Room = {
  _id: string;
  name: string;
};

type Seat = {
  _id: string;
  label: string;
  roomId: string;
  isBooked?: boolean;
  isMine?: boolean;
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

export default function BookSeatScreen() {
  const navigation = useNavigation<any>();

  const [studentId, setStudentId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [roomId, setRoomId] = useState<string>("");
  const [selectedSeat, setSelectedSeat] = useState<string>("");

  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [booking, setBooking] = useState(false);

  const [authChecking, setAuthChecking] = useState(true);

  const timeSlots = [
    "06:00",
    "07:00",
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
    "22:00",
  ];

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // ⛑ AUTH GUARD + CURRENT STUDENT
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

        // mimic getCurrentStudent() from web
        const res = await authedFetch(
          `/api/students/by-uid?uid=${user.uid}`
        );
        const data = await res.json();
        const student = data?.student || null;
        if (student && student._id) {
          setStudentId(student._id);
        } else {
          Alert.alert(
            "Error",
            "Could not load student profile. Please login again."
          );
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
          return;
        }
      } catch (err) {
        console.log(err);
        Alert.alert("Error", "Failed to load student info");
      } finally {
        setAuthChecking(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [navigation]);

  // FETCH ROOMS
  const fetchRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const res = await authedFetch("/api/admin/rooms/list");
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load rooms");
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  // 🔄 Refresh rooms when screen focused
  useFocusEffect(
    useCallback(() => {
      if (!authChecking) {
        fetchRooms();
      }
    }, [authChecking, fetchRooms])
  );

  // LOAD SEATS FOR SELECTED ROOM
  const loadSeats = async (id: string) => {
    if (!studentId) {
      Alert.alert("Not logged in", "Please login first");
      return;
    }

    setRoomId(id);
    setSeats([]);
    setSelectedSeat("");
    setLoadingSeats(true);

    try {
      // seats
      const resSeats = await authedFetch("/api/admin/seats/list");
      const seatsData = await resSeats.json();
      const roomSeats: Seat[] = (seatsData.seats || []).filter(
        (s: Seat) => s.roomId === id
      );

      // bookings
      const resBookings = await authedFetch(
        `/api/booking/list?roomId=${id}`
      );
      const bookingsData = await resBookings.json();
      const bookings = bookingsData.bookings || [];

      const updatedSeats = roomSeats.map((s: any) => {
        const booking = bookings.find((b: any) => b.seatId === s._id);
        return {
          ...s,
          isBooked: !!booking,
          isMine: booking?.studentId === studentId,
        };
      });

      setSeats(updatedSeats);
    } catch (err) {
      console.error("Error loading seats:", err);
      Alert.alert("Error", "Failed to load seats");
    } finally {
      setLoadingSeats(false);
    }
  };

  // BOOK SEAT
  const bookSeat = async () => {
    if (!studentId) {
      Alert.alert("Not logged in", "You are not logged in!");
      return;
    }
    if (!roomId || !selectedSeat) {
      Alert.alert("Missing info", "Select a room and seat!");
      return;
    }
    if (!startTime || !endTime) {
      Alert.alert("Missing time", "Select start and end time!");
      return;
    }

    setBooking(true);
    console.log("Start:", startTime, "End:", endTime);

    try {
      const res = await authedFetch("/api/booking", {
        method: "POST",
        body: JSON.stringify({
          studentId,
          roomId,
          seatId: selectedSeat,
          startTime,
          endTime,
        }),
      });

      const data = await res.json();

      if (data.success) {
        Alert.alert("Success", "Seat booked successfully!");
        loadSeats(roomId); // refresh
      } else {
        Alert.alert("Booking failed", data.message || "Booking failed");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Booking failed. Check console for details.");
    } finally {
      setBooking(false);
    }
  };

  if (authChecking) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const filteredEndSlots = timeSlots.filter((t) => t > startTime);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <Text style={styles.title}>Book a Seat</Text>

      {/* Start Time */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Start Time</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={startTime}
            onValueChange={(v: string) => {
              setStartTime(v);
              if (endTime && endTime <= v) setEndTime(""); // reset invalid
            }}
          >
            <Picker.Item label="Select start time" value="" />
            {timeSlots.map((t) => (
              <Picker.Item key={t} label={t} value={t} />
            ))}
          </Picker>
        </View>
      </View>

      {/* End Time */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>End Time</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={endTime}
            onValueChange={(v: string) => setEndTime(v)}
            enabled={!!startTime}
          >
            <Picker.Item
              label={startTime ? "Select end time" : "Select start time first"}
              value=""
            />
            {filteredEndSlots.map((t) => (
              <Picker.Item key={t} label={t} value={t} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Room Select */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Select Room</Text>
        <View style={styles.pickerWrapper}>
          {loadingRooms ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <Picker
              selectedValue={roomId}
              enabled={rooms.length > 0}
              onValueChange={(v: string) => {
                if (v) loadSeats(v);
              }}
            >
              <Picker.Item label="Choose a room" value="" />
              {rooms.map((r) => (
                <Picker.Item key={r._id} label={r.name} value={r._id} />
              ))}
            </Picker>
          )}
        </View>
      </View>

      {/* Seats Grid */}
      {loadingSeats && (
        <ActivityIndicator
          style={{ marginTop: 12 }}
          color={theme.primary}
        />
      )}

      {roomId && !loadingSeats && (
        <View style={styles.seatGrid}>
          {seats.map((s) => {
            const isDisabled = s.isBooked && !s.isMine;
            const isSelected = selectedSeat === s._id;

            let borderColor = theme.border;
            if (s.isMine || isSelected) borderColor = theme.primary;

            let backgroundColor = "#fff";
            if (s.isMine) backgroundColor = theme.primaryLight;
            else if (s.isBooked && !s.isMine) backgroundColor = "#f0f0f0";

            const opacity = s.isBooked && !s.isMine ? 0.6 : 1;

            return (
              <TouchableOpacity
                key={s._id}
                disabled={isDisabled}
                onPress={() => !isDisabled && setSelectedSeat(s._id)}
                style={[
                  styles.seatCard,
                  {
                    borderColor,
                    backgroundColor,
                    opacity,
                  },
                ]}
              >
                <Text style={styles.seatLabel}>{s.label}</Text>

                {s.isBooked && !s.isMine && (
                  <Text style={styles.seatStatusBooked}>Booked</Text>
                )}

                {s.isMine && (
                  <Text style={styles.seatStatusMine}>Your Seat</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Confirm Button */}
      {selectedSeat && (
        <TouchableOpacity
          style={[
            styles.confirmBtn,
            booking && { opacity: 0.7 },
          ]}
          onPress={bookSeat}
          disabled={booking}
        >
          {booking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmBtnText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>
      )}
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
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  seatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  seatCard: {
    width: "30%",
    minHeight: 60,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  seatLabel: {
    fontWeight: "600",
    marginBottom: 2,
  },
  seatStatusBooked: {
    fontSize: 11,
    color: theme.error,
  },
  seatStatusMine: {
    fontSize: 11,
    color: theme.primary,
  },
  confirmBtn: {
    marginTop: 8,
    backgroundColor: theme.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
});
