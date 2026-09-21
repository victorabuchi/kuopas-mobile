import { Pressable, StyleSheet, Text, View } from 'react-native';
import { addDays, slotDate } from '../lib/booking-grid';
import { colors } from '../lib/theme';
import type { BookingEntry } from '../lib/types';

// The week grid shared by laundry (hourly slots) and sauna (2-hour turns).
export default function BookingGrid({
  weekStart,
  hours,
  timeLabel,
  dayLabels,
  bookings,
  maxDaysInAdvance,
  youLabel,
  bookedLabel,
  onBook,
  onCancel,
}: {
  weekStart: Date;
  hours: number[];
  timeLabel: (hour: number) => string;
  dayLabels: string[];
  bookings: BookingEntry[];
  maxDaysInAdvance: number;
  youLabel: string;
  bookedLabel: string;
  onBook: (startsAtIso: string) => void;
  onCancel: (bookingId: string) => void;
}) {
  const bookingByStart = new Map(bookings.map((b) => [new Date(b.startsAt).toISOString(), b]));
  const now = new Date();
  const maxAdvance = addDays(now, maxDaysInAdvance);

  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <View style={styles.timeCol} />
        {dayLabels.map((label, i) => (
          <View key={label} style={styles.dayHead}>
            <Text style={styles.dayLabel}>{label}</Text>
            <Text style={styles.dayDate}>{addDays(weekStart, i).getDate()}</Text>
          </View>
        ))}
      </View>

      {hours.map((hour) => (
        <View key={hour} style={styles.row}>
          <View style={styles.timeCol}>
            <Text style={styles.timeText}>{timeLabel(hour)}</Text>
          </View>
          {dayLabels.map((_, dayOffset) => {
            const date = slotDate(weekStart, dayOffset, hour);
            const iso = date.toISOString();
            const booking = bookingByStart.get(iso);
            const isPast = date.getTime() < now.getTime();
            const beyondAdvance = date.getTime() > maxAdvance.getTime();

            if (booking) {
              return booking.mine ? (
                <Pressable
                  key={dayOffset}
                  style={[styles.cell, styles.cellMine]}
                  onPress={() => onCancel(booking.id)}
                >
                  <Text style={styles.cellMineText}>{youLabel}</Text>
                </Pressable>
              ) : (
                <View key={dayOffset} style={[styles.cell, styles.cellBooked]}>
                  <Text style={styles.cellBookedText} numberOfLines={1}>
                    {bookedLabel}
                  </Text>
                </View>
              );
            }

            if (isPast || beyondAdvance) {
              return <View key={dayOffset} style={[styles.cell, styles.cellDisabled]} />;
            }

            return (
              <Pressable
                key={dayOffset}
                style={[styles.cell, styles.cellFree]}
                onPress={() => onBook(iso)}
                accessibilityLabel={`Book ${iso}`}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { backgroundColor: colors.card, borderRadius: 12, padding: 6, gap: 3 },
  row: { flexDirection: 'row', gap: 3, alignItems: 'stretch' },
  timeCol: { width: 44, justifyContent: 'center' },
  timeText: { fontSize: 10, color: colors.faint },
  dayHead: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  dayLabel: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  dayDate: { fontSize: 10, color: colors.faint },
  cell: { flex: 1, height: 30, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  cellFree: { backgroundColor: colors.accentSoft },
  cellMine: { backgroundColor: colors.accent },
  cellMineText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  cellBooked: { backgroundColor: colors.chip },
  cellBookedText: { color: colors.faint, fontSize: 8 },
  cellDisabled: { backgroundColor: colors.bg },
});
