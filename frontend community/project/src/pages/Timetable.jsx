import { useState } from 'react';
import { Badge } from '../components/ui.jsx';
import { TIMETABLE_DAYS, TIMETABLE_SCHEDULE } from '../data/timetable.js';

export default function Timetable() {
  const [selectedDay, setSelectedDay] = useState('Monday');

  const currentSchedule = TIMETABLE_SCHEDULE[selectedDay] || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">Class Schedule & Timetable</h2>
          <p className="text-xs text-muted">Weekly timetable breakdown for Section VI-A.</p>
        </div>

        {/* Day Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {TIMETABLE_DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`btn-touch px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDay === day 
                  ? 'bg-blue text-white shadow-xs' 
                  : 'bg-slate-100/80 text-muted hover:bg-slate-200 hover:text-ink'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <article className="card divide-y divide-line">
        <div className="pb-3 flex justify-between items-center">
          <span className="eyebrow">{selectedDay} Schedule</span>
          <Badge status="default">{currentSchedule.length} Periods Scheduled</Badge>
        </div>

        {currentSchedule.map((slot) => (
          <div key={slot.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-4">
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 font-mono text-xs font-bold text-slate-700 whitespace-nowrap">
                {slot.time}
              </span>
              <div>
                <strong className="block text-sm font-bold text-ink">{slot.subject}</strong>
                <span className="text-xs text-muted">{slot.room} · Instructor: {slot.teacher}</span>
              </div>
            </div>

            <div>
              <Badge status={slot.status === 'completed' ? 'present' : slot.status === 'active' ? 'pending' : 'default'}>
                {slot.status === 'active' ? '⚡ Live Class Now' : slot.status === 'completed' ? 'Completed' : 'Upcoming'}
              </Badge>
            </div>
          </div>
        ))}
      </article>
    </div>
  );
}

