import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerBackgroundTask } from '../services/BackgroundMotionService';

// Register background task at global scope (required by expo-task-manager)
registerBackgroundTask();

export default function RootLayout() {
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
        <Stack.Screen name="index" />
        <Stack.Screen name="debug" />
        <Stack.Screen name="routes" />
        <Stack.Screen name="chat-safety" />
      </Stack>
    </SafeAreaProvider>
  );
}
