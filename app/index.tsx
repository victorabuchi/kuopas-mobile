import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '../lib/auth-context';

export default function Index() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) return <View style={{ flex: 1 }} />;

  return <Redirect href={isLoggedIn ? '/(tabs)/home' : '/login'} />;
}
