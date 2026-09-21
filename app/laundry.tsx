import BookingScreen from '../components/BookingScreen';
import * as api from '../lib/api-client';
import { MAX_DAYS_IN_ADVANCE, MAX_HOURS_PER_WEEK, SLOT_START_HOURS } from '../lib/laundry';
import { useDictionary } from '../lib/use-dictionary';

async function load(machineId: string | null, week: string) {
  const o = await api.getLaundry(machineId, week);
  return { buildingName: o.buildingName, resources: o.machines, activeId: o.activeMachineId, bookings: o.bookings };
}

// Mirrors kuopas/web/src/app/(app)/laundry/page.tsx
export default function LaundryScreen() {
  const { dict } = useDictionary();
  const t = dict.laundry;

  return (
    <BookingScreen
      title={t.title}
      todayLabel={t.today}
      noneSetUp={t.noneSetUp}
      rules={t.rules(MAX_HOURS_PER_WEEK, MAX_DAYS_IN_ADVANCE)}
      hours={SLOT_START_HOURS}
      timeLabel={(hour) => `${String(hour).padStart(2, '0')}:00`}
      maxDaysInAdvance={MAX_DAYS_IN_ADVANCE}
      youLabel={t.you}
      bookedLabel={t.booked}
      load={load}
      book={api.bookLaundrySlot}
      cancel={api.cancelLaundryBooking}
    />
  );
}
