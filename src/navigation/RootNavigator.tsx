// RootNavigator.tsx (replace your current file)
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AuthNavigator from './AuthNavigator';
import StudentNavigator from './StudentTabs';
import AdminNavigator from './AdminNavigator';

import { navigationRef } from './RootNavigation';

export default function RootNavigator() {
  const [userType, setUserType] = useState<'student' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const storedUserType = await AsyncStorage.getItem('userType');
      setUserType(storedUserType as any);
      setLoading(false);
    };
    checkUser();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {userType === 'student' && <StudentNavigator />}
      {userType === 'admin' && <AdminNavigator />}
      {!userType && <AuthNavigator />}
    </NavigationContainer>
  );
}
