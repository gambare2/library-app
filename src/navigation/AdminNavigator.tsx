import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
  import { Ionicons } from '@expo/vector-icons';
import AdminDashboardScreen from '../screens/admin/DashboardScreen';

const Tab = createBottomTabNavigator();

const adminTabs = [
  { name: 'Dashboard', component: AdminDashboardScreen, icon: 'speedometer-outline' },
  // Add more admin tabs here
];

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const tab = adminTabs.find(t => t.name === route.name);
          return tab ? <Ionicons name={tab.icon as any} size={size} color={color} /> : null;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      {adminTabs.map(tab => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
      ))}
    </Tab.Navigator>
  );
}
