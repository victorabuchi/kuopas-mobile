import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppTabBar from '../../components/AppTabBar';
import { useAuth } from '../../lib/auth-context';
import { moreLabel, updatesLabel } from '../../lib/labels';
import { colors } from '../../lib/theme';
import { useDictionary } from '../../lib/use-dictionary';

// Tab order and grouping follow the web app's sidebar: Updates, Chats,
// Communities, Messages, then everything else under More.
export default function TabsLayout() {
  const { isLoggedIn, isLoading } = useAuth();
  const { locale, dict } = useDictionary();
  const insets = useSafeAreaInsets();

  if (isLoading) return null;
  if (!isLoggedIn) return <Redirect href="/login" />;

  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { paddingTop: insets.top, backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="home" options={{ title: updatesLabel(locale) }} />
      <Tabs.Screen name="chats" options={{ title: dict.nav.chats }} />
      <Tabs.Screen name="communities" options={{ title: dict.nav.communities }} />
      <Tabs.Screen name="messages" options={{ title: dict.nav.messages }} />
      <Tabs.Screen name="more" options={{ title: moreLabel(locale) }} />
    </Tabs>
  );
}
