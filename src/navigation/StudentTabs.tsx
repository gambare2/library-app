import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AttendenceScreen from '../screens/student/attendence/AttendenceScreen';
import StudentProfileScreen from '../screens/student/profile/ProfileScreen';
import BookingScreen from  "../screens/student/booking/BookingScreen"

const Tab = createBottomTabNavigator();

const studentTabs = [
  { name: 'Attendence', component: AttendenceScreen, icon: 'home-outline' },
  { name: 'Booking', component: BookingScreen, icon: 'book-outline' },
  { name: 'Profile', component: StudentProfileScreen, icon: 'person-outline' },
];

export default function StudentNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const tab = studentTabs.find(t => t.name === route.name);
          return tab ? <Ionicons name={tab.icon as any} size={size} color={color} /> : null;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      {studentTabs.map(tab => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
      ))}
    </Tab.Navigator>
  );
}
