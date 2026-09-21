import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { Locale } from '../lib/i18n';
import { colors } from '../lib/theme';

const LANGUAGES: { code: Locale; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'fi', name: 'Suomi' },
];
const DROPDOWN_WIDTH = 160;

function Chevron() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m6 9 6 6 6-6" />
    </Svg>
  );
}

function Check() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m5 13 4 4L19 7" />
    </Svg>
  );
}

// Same look and placement as Rannikon's LanguageSelector: the current language's
// name with a chevron, opening a small dropdown anchored under the button.
export default function LanguageSelector({ locale, onChange }: { locale: Locale; onChange: (locale: Locale) => void }) {
  const [visible, setVisible] = useState(false);
  const [anchor, setAnchor] = useState<{ x: number; y: number; width: number } | null>(null);
  const buttonRef = useRef<View>(null);

  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0]!;

  function open() {
    buttonRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y: y + height, width });
      setVisible(true);
    });
  }

  return (
    <>
      <Pressable ref={buttonRef} style={({ pressed }) => [styles.button, pressed && styles.pressed]} onPress={open} hitSlop={8}>
        <Text style={styles.buttonText}>{current.name}</Text>
        <Chevron />
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          {anchor && (
            <View style={[styles.dropdown, { top: anchor.y + 4, left: Math.max(12, anchor.x + anchor.width - DROPDOWN_WIDTH) }]}>
              {LANGUAGES.map((l) => (
                <Pressable
                  key={l.code}
                  style={({ pressed }) => [styles.option, l.code === locale && styles.optionActive, pressed && styles.pressed]}
                  onPress={() => {
                    onChange(l.code);
                    setVisible(false);
                  }}
                >
                  <Text style={[styles.optionText, l.code === locale && styles.optionTextActive]}>{l.name}</Text>
                  {l.code === locale && <Check />}
                </Pressable>
              ))}
            </View>
          )}
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 36, paddingHorizontal: 6, marginRight: 4 },
  pressed: { opacity: 0.6 },
  buttonText: { fontSize: 14, fontWeight: '500', color: colors.accent },
  overlay: { flex: 1 },
  dropdown: {
    position: 'absolute',
    width: DROPDOWN_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e7e7e7',
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 14 },
  optionActive: { backgroundColor: '#f6f8fa' },
  optionText: { fontSize: 15, fontWeight: '500', color: colors.text },
  optionTextActive: { fontWeight: '700', color: colors.accent },
});
