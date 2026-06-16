import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './DaysOffCalendar.css';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000');
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DaysOffCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [daysOff, setDaysOff] = useState([]);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [note, setNote] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getAuthHeaders = useCallback(() => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  }), []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch both days off and availability (to show dots for days that have bookings)
      const [daysOffRes, availRes] = await Promise.all([
        axios.get(`${API_URL}/api/daysoff?month=${monthStr}`),
        axios.get(`${API_URL}/api/bookings/availability?month=${monthStr}`)
      ]);
      setDaysOff(daysOffRes.data);
      setAvailability(availRes.data.availability || {});
    } catch (err) {
      console.error('Failed to fetch calendar data:', err);
    } finally {
      setLoading(false);
    }
  }, [monthStr, getAuthHeaders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Navigation
  const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Build calendar grid
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getDateStr = (day) => `${monthStr}-${String(day).padStart(2, '0')}`;

  const isPast = (day) => {
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  const getDayOff = (dateStr) => daysOff.find(d => d.date === dateStr);

  const handleDayClick = (day) => {
    if (!day || isPast(day)) return;
    const dateStr = getDateStr(day);
    const existing = getDayOff(dateStr);
    
    if (existing) {
      // If it's already a day off, confirm removal
      if (window.confirm(`Remove day off for ${dateStr}?`)) {
        removeDayOff(existing._id);
      }
    } else {
      // If it's a normal day, open modal to add it as a day off
      setSelectedDay(dateStr);
      setNote('');
      setModalOpen(true);
    }
  };

  const addDayOff = async () => {
    if (!selectedDay) return;
    try {
      await axios.post(`${API_URL}/api/daysoff`, {
        date: selectedDay,
        note: note.trim()
      }, getAuthHeaders());
      setModalOpen(false);
      fetchData(); // Refresh data
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add day off');
    }
  };

  const removeDayOff = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/daysoff/${id}`, getAuthHeaders());
      fetchData(); // Refresh data
    } catch (err) {
      alert('Failed to remove day off');
    }
  };

  // Upcoming days off (filter out past ones and sort)
  const upcomingDaysOff = daysOff.filter(d => {
    const dateObj = new Date(d.date + 'T00:00:00');
    return dateObj >= today;
  }).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="daysoff-panel">
      <h3 className="section-title">📅 Days Off Calendar</h3>
      <p className="daysoff-subtitle">
        Click a future date to mark it as a day off. Clients will not be able to book on these dates.
      </p>

      <div className="daysoff-calendar">
        {/* Header */}
        <div className="daysoff-header">
          <span className="daysoff-month-label">
            {new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <div className="daysoff-nav">
            <button onClick={goToPrevMonth}>‹</button>
            <button onClick={goToNextMonth}>›</button>
          </div>
        </div>

        {/* Day Names */}
        <div className="daysoff-day-names">
          {DAY_NAMES.map(d => <span key={d} className="daysoff-day-name">{d}</span>)}
        </div>

        {/* Grid */}
        <div className="daysoff-grid" style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="daysoff-cell daysoff-cell--empty" />;
            }

            const dateStr = getDateStr(day);
            const past = isPast(day);
            const isToday = dateStr === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const dayOff = getDayOff(dateStr);
            const hasBookings = availability[dateStr] && availability[dateStr].bookedTimes?.length > 0;

            const cellClasses = [
              'daysoff-cell',
              past && 'daysoff-cell--past',
              isToday && 'daysoff-cell--today',
              dayOff && 'daysoff-cell--dayoff'
            ].filter(Boolean).join(' ');

            return (
              <button
                key={day}
                className={cellClasses}
                onClick={() => handleDayClick(day)}
                disabled={past}
                title={dayOff ? `Day Off: ${dayOff.note || 'No reason'}` : past ? 'Past Date' : hasBookings ? 'Has Bookings' : 'Available'}
              >
                <span>{day}</span>
                {dayOff && dayOff.note && <span className="daysoff-cell-note">{dayOff.note}</span>}
                {!dayOff && hasBookings && !past && (
                  <span className="daysoff-cell-bookings">
                    <span className="daysoff-cell-bookings-dot"></span>
                    {availability[dateStr].bookedTimes.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Upcoming List */}
      <div className="daysoff-upcoming">
        <h4>Upcoming Days Off for {new Date(year, month).toLocaleString('default', { month: 'long' })}</h4>
        {upcomingDaysOff.length === 0 ? (
          <p className="daysoff-upcoming-empty">No days off scheduled this month.</p>
        ) : (
          <div className="daysoff-upcoming-list">
            {upcomingDaysOff.map(d => {
              const dObj = new Date(d.date + 'T00:00:00');
              const dateDisplay = dObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              return (
                <div key={d._id} className="daysoff-upcoming-item">
                  <div className="daysoff-upcoming-info">
                    <span className="daysoff-upcoming-date">{dateDisplay}</span>
                    {d.note && <span className="daysoff-upcoming-note">{d.note}</span>}
                  </div>
                  <button className="daysoff-remove-btn" onClick={() => removeDayOff(d._id)}>Remove</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Day Off Modal */}
      {modalOpen && (
        <div className="daysoff-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="daysoff-modal" onClick={e => e.stopPropagation()}>
            <h4>Mark {selectedDay} as Day Off</h4>
            <p>Clients will not be able to book on this date.</p>
            <input
              type="text"
              placeholder="Reason / Note (e.g. Holiday, Personal)"
              value={note}
              onChange={e => setNote(e.target.value)}
              autoFocus
              maxLength={30}
              onKeyDown={e => { if (e.key === 'Enter') addDayOff(); }}
            />
            <div className="daysoff-modal-actions">
              <button className="daysoff-modal-cancel" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="daysoff-modal-confirm" onClick={addDayOff}>Confirm Day Off</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DaysOffCalendar;
