import BookingScreen from '../components/BookingScreen';
import * as api from '../lib/api-client';
import { MAX_DAYS_IN_ADVANCE, MAX_HOURS_PER_WEEK, SLOT_LENGTH_HOURS, SLOT_START_HOURS } from '../lib/sauna';
import { useDictionary } from '../lib/use-dictionary';

async function load(slotId: string | null, week: string) {
  const o = await api.getSauna(slotId, week);
  return { buildingName: o.buildingName, resources: o.slots, activeId: o.activeSlotId, bookings: o.bookings };
}

// Mirrors kuopas/web/src/app/(app)/sauna/page.tsx
export default function SaunaScreen() {
  const { dict } = useDictionary();
  const t = dict.sauna;

  return (
    <BookingScreen
      title={t.title}
      todayLabel={t.today}
      noneSetUp={t.noneSetUp}
      rules={t.rules(SLOT_LENGTH_HOURS, MAX_HOURS_PER_WEEK, MAX_DAYS_IN_ADVANCE)}
      hours={SLOT_START_HOURS}
      timeLabel={(hour) => `${String(hour).padStart(2, '0')}-${String(hour + SLOT_LENGTH_HOURS).padStart(2, '0')}`}
      maxDaysInAdvance={MAX_DAYS_IN_ADVANCE}
      youLabel={t.you}
      bookedLabel={t.booked}
      load={load}
      book={api.bookSaunaSlot}
      cancel={api.cancelSaunaBooking}
      group={{ hoursLength: SLOT_LENGTH_HOURS }}
    />
  );
}
