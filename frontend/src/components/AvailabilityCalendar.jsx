import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './AvailabilityCalendar.css';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000');

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const AvailabilityCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState(null);
  const [startHour, setStartHour] = useState(7);
  const [endHour, setEndHour] = useState(22);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/bookings/availability?month=${monthStr}`);
      setAvailability(res.data.availability);
      setStartHour(res.data.startHour);
      setEndHour(res.data.endHour);
    } catch (err) {
      console.error('Failed to fetch availability:', err);
    } finally {
      setLoading(false);
    }
  }, [monthStr]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Navigation
  const goToPrevMonth = () => {
    const prev = new Date(year, month - 1, 1);
    // Don't go before current month
    const nowMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    if (prev >= nowMonth) {
      setCurrentDate(prev);
      setSelectedDate(null);
    }
  };

  const goToNextMonth = () => {
    // Allow up to 3 months ahead
    const maxDate = new Date(today.getFullYear(), today.getMonth() + 3, 1);
    const next = new Date(year, month + 1, 1);
    if (next <= maxDate) {
      setCurrentDate(next);
      setSelectedDate(null);
    }
  };

  // Build calendar grid
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const cells = [];
  // Empty cells for days before first day
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(null);
  }
  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  const getDateStr = (day) => `${monthStr}-${String(day).padStart(2, '0')}`;

  const getDayStatus = (day) => {
    if (!availability) return null;
    const dateStr = getDateStr(day);
    return availability[dateStr] || null;
  };

  const isPast = (day) => {
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  const handleDayClick = (day) => {
    if (!day || isPast(day)) return;
    const dateStr = getDateStr(day);
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
  };

  // Helper: check if a given hour is within any blocked time range
  const getBlockedNote = (dayData, hour) => {
    if (!dayData.blockedTimes || dayData.blockedTimes.length === 0) return null;
    for (const bt of dayData.blockedTimes) {
      const [startH] = bt.start.split(':').map(Number);
      const [endH] = bt.end.split(':').map(Number);
      if (hour >= startH && hour < endH) {
        return bt.note || 'Unavailable';
      }
    }
    return null;
  };

  // Get slots for the selected date
  const getSlots = () => {
    if (!selectedDate || !availability) return [];
    const dayData = availability[selectedDate];
    if (!dayData || dayData.isDayOff) return [];

    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      const timeStr = `${String(hour).padStart(2, '0')}:00`;
      const slotMinutes = hour * 60;

      // Check if this slot is booked by a customer
      const isBooked = (dayData.bookedTimes || []).some(bTime => {
        const [bH, bM] = bTime.split(':').map(Number);
        const bMinutes = bH * 60 + bM;
        return Math.abs(slotMinutes - bMinutes) < 60;
      });

      // Check if this slot is blocked by admin (partial day off)
      const blockedNote = getBlockedNote(dayData, hour);

      slots.push({
        time: timeStr,
        label: formatTime(hour),
        isBooked,
        blockedNote // null if not blocked, string with reason if blocked
      });
    }
    return slots;
  };

  const formatTime = (hour) => {
    const h = hour % 12 || 12;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${h}:00 ${ampm}`;
  };

  const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });

  // Format selected date for display
  const formatSelectedDate = () => {
    if (!selectedDate) return '';
    const d = new Date(selectedDate + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Count total blocked slots for the summary (bookings + admin blocks)
  const getBlockedSummary = (dayData) => {
    const bookingCount = (dayData.bookedTimes || []).length;
    const blockedRanges = dayData.blockedTimes || [];
    return { bookingCount, blockedRanges };
  };

  return (
    <div className="mini-calendar-wrapper">
      <div className="mini-calendar">
        {/* Header */}
        <div className="mini-cal-header">
          <span className="mini-cal-title">{monthName}</span>
          <div className="mini-cal-nav">
            <button onClick={goToPrevMonth} aria-label="Previous month">‹</button>
            <button onClick={goToNextMonth} aria-label="Next month">›</button>
          </div>
        </div>

        {/* Day names */}
        <div className="mini-cal-days">
          {DAY_NAMES.map(d => (
            <span key={d} className="mini-cal-day-name">{d}</span>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="mini-cal-loading">
            <div className="mini-cal-shimmer" style={{ width: '100%' }}></div>
            <div className="mini-cal-shimmer" style={{ width: '80%' }}></div>
            <div className="mini-cal-shimmer" style={{ width: '60%' }}></div>
          </div>
        ) : (
          <div className="mini-cal-grid">
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="mini-cal-cell mini-cal-cell--empty" />;
              }

              const dateStr = getDateStr(day);
              const status = getDayStatus(day);
              const past = isPast(day);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;

              let dotClass = '';
              if (status && !past) {
                if (status.isDayOff) {
                  dotClass = 'mini-cal-dot--dayoff';
                } else if (status.availableSlots === 0) {
                  dotClass = 'mini-cal-dot--full';
                } else if (status.blockedSlots > 0) {
                  dotClass = 'mini-cal-dot--partial';
                } else {
                  dotClass = 'mini-cal-dot--available';
                }
              }

              const cellClasses = [
                'mini-cal-cell',
                past && 'mini-cal-cell--past',
                isToday && 'mini-cal-cell--today',
                isSelected && 'mini-cal-cell--selected',
                status?.isDayOff && !past && 'mini-cal-cell--dayoff'
              ].filter(Boolean).join(' ');

              return (
                <button
                  key={day}
                  className={cellClasses}
                  onClick={() => handleDayClick(day)}
                  disabled={past}
                  aria-label={`${dateStr}${status?.isDayOff ? ' - Day Off' : ''}`}
                >
                  <span className="mini-cal-cell-num">{day}</span>
                  {dotClass && !past && (
                    <span className={`mini-cal-dot ${dotClass}`} />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Slot Details Panel */}
        {selectedDate && availability && availability[selectedDate] && (
          <div className="mini-cal-details">
            <div className="mini-cal-details-header">
              <span className="mini-cal-details-date">{formatSelectedDate()}</span>
              <button
                className="mini-cal-details-close"
                onClick={() => setSelectedDate(null)}
                aria-label="Close details"
              >
                ×
              </button>
            </div>

            {availability[selectedDate].isDayOff ? (
              <div className="mini-cal-dayoff-badge">
                🚫 Day Off{availability[selectedDate].dayOffNote ? ` — ${availability[selectedDate].dayOffNote}` : ''}
              </div>
            ) : (
              <>
                {(() => {
                  const { bookingCount, blockedRanges } = getBlockedSummary(availability[selectedDate]);
                  const hasAny = bookingCount > 0 || blockedRanges.length > 0;
                  
                  if (!hasAny) {
                    return (
                      <div className="mini-cal-bookings-summary-free" style={{ fontSize: '0.85rem', color: '#4caf50', marginBottom: '10px' }}>
                        ✨ No bookings yet! Wide open.
                      </div>
                    );
                  }
                  
                  return (
                    <div style={{ marginBottom: '10px' }}>
                      {bookingCount > 0 && (
                        <div className="mini-cal-bookings-summary" style={{ fontSize: '0.85rem', color: '#ffcc00', marginBottom: '4px' }}>
                          📋 {bookingCount} booked slot{bookingCount > 1 ? 's' : ''}
                        </div>
                      )}
                      {blockedRanges.length > 0 && blockedRanges.map((br, idx) => (
                        <div key={idx} className="mini-cal-blocked-summary" style={{ fontSize: '0.85rem', color: '#ff9090', marginBottom: '4px' }}>
                          🚧 {br.start} – {br.end}: {br.note}
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <div className="mini-cal-slots">
                  {getSlots().map(slot => {
                    let slotClass = 'mini-cal-slot mini-cal-slot--available';
                    let slotLabel = slot.label;
                    
                    if (slot.blockedNote) {
                      slotClass = 'mini-cal-slot mini-cal-slot--blocked';
                      slotLabel = `${slot.label}`;
                    } else if (slot.isBooked) {
                      slotClass = 'mini-cal-slot mini-cal-slot--booked';
                    }
                    
                    return (
                      <div key={slot.time} className={slotClass}>
                        {slotLabel}
                        {slot.blockedNote && (
                          <span className="mini-cal-slot-reason">{slot.blockedNote}</span>
                        )}
                        {slot.isBooked && !slot.blockedNote && (
                          <span style={{ fontSize: '0.75rem', marginLeft: '5px', opacity: 0.8 }}>(Booked)</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="mini-cal-legend">
          <span className="mini-cal-legend-item">
            <span className="mini-cal-legend-dot mini-cal-legend-dot--available" />
            Open
          </span>
          <span className="mini-cal-legend-item">
            <span className="mini-cal-legend-dot mini-cal-legend-dot--partial" />
            Partial
          </span>
          <span className="mini-cal-legend-item">
            <span className="mini-cal-legend-dot mini-cal-legend-dot--full" />
            Full
          </span>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;

