import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { colors } from '../lib/theme';
import TabIcon, { type TabIconName } from './TabIcons';

const ICONS: Record<string, TabIconName> = {
  home: 'updates',
  chats: 'chats',
  communities: 'communities',
  messages: 'messages',
  more: 'more',
};

const INK = '#1c1c1e';
const PILL = '#eceef1';

// A floating rounded bar in the style of WhatsApp's and Telegram's iOS tab bars:
// the selected tab sits in a soft pill with a solid icon and a coloured label.
export default function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]!;
          const label = typeof options.title === 'string' ? options.title : route.name;
          const focused = state.index === index;
          const tone = focused ? colors.accent : INK;

          function onPress() {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              Haptics.selectionAsync().catch(() => {});
              navigation.navigate(route.name, route.params);
            }
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: focused }}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={styles.slot}
            >
              <View style={[styles.item, focused && styles.itemActive]}>
                <TabIcon name={ICONS[route.name] ?? 'more'} active={focused} color={tone} background={focused ? PILL : '#fff'} />
                <Text style={[styles.label, { color: tone }, focused && styles.labelActive]} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 12, paddingTop: 6, backgroundColor: colors.bg },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 34,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d6d9de',
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 8,
  },
  slot: { flex: 1 },
  item: { alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 7, borderRadius: 28 },
  itemActive: { backgroundColor: PILL },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.1 },
  labelActive: { fontWeight: '700' },
});
