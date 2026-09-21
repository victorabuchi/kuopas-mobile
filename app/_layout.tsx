import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../lib/auth-context';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="chat/[groupId]" options={{ headerShown: true }} />
        <Stack.Screen name="communities/[communityId]" options={{ headerShown: true }} />
        <Stack.Screen name="messages/[conversationId]" options={{ headerShown: true }} />
        <Stack.Screen name="complaints/[complaintId]" options={{ headerShown: true }} />
        <Stack.Screen name="calls" options={{ headerShown: true }} />
        <Stack.Screen name="booking" options={{ headerShown: true }} />
        <Stack.Screen name="booking/space/[spaceId]" options={{ headerShown: true }} />
        <Stack.Screen name="household" options={{ headerShown: true }} />
        <Stack.Screen name="roommates" options={{ headerShown: true }} />
        <Stack.Screen name="marketplace" options={{ headerShown: true }} />
        <Stack.Screen name="lease" options={{ headerShown: true }} />
        <Stack.Screen name="wellbeing" options={{ headerShown: true }} />
        <Stack.Screen name="laundry" options={{ headerShown: true }} />
        <Stack.Screen name="sauna" options={{ headerShown: true }} />
        <Stack.Screen name="parking" options={{ headerShown: true }} />
        <Stack.Screen name="settings" options={{ headerShown: true }} />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
