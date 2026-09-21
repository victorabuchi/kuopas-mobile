import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { fs } from '../lib/feature-styles';

// The "verify first" card the web shows on Roommates and Marketplace.
export default function VerifyGate({ message, action }: { message: string; action: string }) {
  return (
    <View style={fs.card}>
      <Text style={fs.lede}>{message}</Text>
      <Pressable style={fs.primarySmall} onPress={() => router.push('/lease?tab=verify')}>
        <Text style={fs.primaryText}>{action}</Text>
      </Pressable>
    </View>
  );
}
