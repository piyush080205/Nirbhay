import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import { registerBackgroundTask } from '../services/BackgroundMotionService';
import { useTripStore } from '../store/tripStore';

// Register background task at global scope (required by expo-task-manager)
registerBackgroundTask();

export default function RootLayout() {
  const { isInviteVerified, loadInviteStatus } = useTripStore();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const init = async () => {
      await loadInviteStatus();
      setLoading(false);
    };
    init();
  }, []);

  // Redirect based on invite status
  useEffect(() => {
    if (loading) return;

    const currentRoute = segments[0];

    if (!isInviteVerified && currentRoute !== 'invite') {
      router.replace('/invite');
    } else if (isInviteVerified && currentRoute === 'invite') {
      router.replace('/');
    }
  }, [isInviteVerified, loading, segments]);

  if (loading) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f0f' }}>
          <ActivityIndicator size="large" color="#ff4757" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0f0f0f' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="invite" />
        <Stack.Screen name="index" />
        <Stack.Screen name="debug" />
        <Stack.Screen name="routes" />
        <Stack.Screen name="chat-safety" />
      </Stack>
    </SafeAreaProvider>
  );
}
