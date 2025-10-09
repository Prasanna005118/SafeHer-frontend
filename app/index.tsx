// app/index.tsx
// SAFE DEV ENTRY POINT — no background service, minimal startup

import { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { authService } from '@/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Shield } from 'lucide-react-native';

export default function Index() {
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 Initializing SafeHer app...');
      
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (hasLaunched === null) {
        console.log('First launch → showing onboarding');
        await AsyncStorage.setItem('hasLaunched', 'true');
        router.replace('/auth/onboarding');
        return;
      }

      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated) {
        console.log('Authenticated → navigating to tabs');
        router.replace('/(tabs)');
      } else {
        console.log('Not authenticated → navigating to login');
        router.replace('/auth/login');
      }
    } catch (error) {
      console.error('❌ App initialization error:', error);
      router.replace('/auth/login');
    }
  };

  return (
    <View style={styles.container}>
      <Shield size={64} color="#DC2626" />
      <ActivityIndicator size="large" color="#DC2626" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loader: {
    marginTop: 20,
  },
});
