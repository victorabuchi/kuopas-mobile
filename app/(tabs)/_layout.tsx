import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { useDictionary } from '../../lib/use-dictionary';

export default function TabsLayout() {
  const { isLoggedIn, isLoading } = useAuth();
  const { dict } = useDictionary();

  if (isLoading) return null;
  if (!isLoggedIn) return <Redirect href="/login" />;

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="feed" options={{ title: dict.nav.feed }} />
      <Tabs.Screen name="chats" options={{ title: dict.nav.chats }} />
    </Tabs>
  );
}
