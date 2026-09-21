import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors } from '../lib/theme';

export default function PillTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { value: T; label: string }[];
  active: T;
  onChange: (value: T) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {tabs.map((tab) => (
        <Pressable
          key={tab.value}
          onPress={() => onChange(tab.value)}
          style={[styles.tab, active === tab.value && styles.tabActive]}
        >
          <Text style={active === tab.value ? styles.textActive : styles.text}>{tab.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: { gap: 8, paddingHorizontal: 16, paddingVertical: 4 },
  tab: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.chip },
  tabActive: { backgroundColor: colors.accent },
  text: { color: colors.muted, fontSize: 13 },
  textActive: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
