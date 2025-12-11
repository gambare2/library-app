# 📚 Study System App
---
# 🚀 Overview

The Study System App is a cross-platform mobile application built using React Native + Expo with a backend powered by Node.js, Express, and MongoDB.
This system is designed for students and admins, enabling seamless attendance tracking, booking management, and profile handling—all with secure authentication.
--

## ✨ Features
### 🔐 Authentication

- Login & Register (Email + Password)
- Secure token storage using AsyncStorage
- Auto-redirect based on user type (Student/Admin)
### 🎓 Student Module

### 📅 Attendance
- Mark/view attendance
- Displays total presents, absents, and percentage
- Optimized UI for quick marking
### 📝 Booking System
- Book study rooms or seats
- View current & past bookings
- Cancel/modify bookings
### 👤 Profile
- View student details
- Edit profile information
##🛠️ Admin Module

- Admin dashboard
- Student management
- Attendance overview
- Booking monitoring
### 🏗️ Tech Stack
---
## Frontend (Mobile App)
- React Native (Expo)
- React Navigation (Stack + Tabs)
- AsyncStorage
- Context API / Hooks
- Axios
## Backend
- Node.js + Express.js
- MongoDB (Mongoose ODM)
- JWT Authentication
- Role based access (admin / student)
---
# 📁 Project Structure (Frontend)

root/
- 
- ──navigation/
-    ├── RootNavigator.tsx
-    ├── AuthNavigator.tsx
-    ├── StudentNavigator.tsx
-    └── AdminNavigator.tsx
- 
- ── screens/
-    ├── auth/
-    │   ├── LoginScreen.tsx
-    │   └── RegisterScreen.tsx
-    │
-    ├── student/
-    │   ├── attendence/
-    │   ├── booking/
-     │   └── profile/
-    │
-    └── admin/
-        └── DashboardScreen.tsx
- 
- ── components/
- ── services/
-    └── api.ts (Axios instance)
- 
- ── App.tsx

## 📈 Future Enhancements

- Push notifications
- Payments integration
- Advanced admin dashboard
- Analytics for attendance & booking usage
- Offline support
## 🤝 Contributing

Pull requests are welcome!
For major changes, please open an issue first to discuss what you’d like to modify.
## 📄 License
This project is licensed under the MIT License.



