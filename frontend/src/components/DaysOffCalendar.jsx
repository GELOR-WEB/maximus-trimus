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
  
  // Multi-select state
  const [selectedDates, setSelectedDates] = useState([]);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [note, setNote] = useState('');
  const [isFullDay, setIsFullDay] = useState(true);
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('14:00');
  const [submitting, setSubmitting] = useState(false);

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

  // Clear selection when changing months
  useEffect(() => {
    setSelectedDates([]);
  }, [monthStr]);

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
      // Toggle selection for multi-date mode
      setSelectedDates(prev => {
        if (prev.includes(dateStr)) {
          return prev.filter(d => d !== dateStr);
        } else {
          return [...prev, dateStr].sort();
        }
      });
    }
  };

  const openModal = () => {
    if (selectedDates.length === 0) return;
    setNote('');
    setIsFullDay(true);
    setStartTime('12:00');
    setEndTime('14:00');
    setModalOpen(true);
  };

  const addDaysOff = async () => {
    if (selectedDates.length === 0) return;
    setSubmitting(true);
    try {
      if (selectedDates.length === 1) {
        // Single date: use the original endpoint
        await axios.post(`${API_URL}/api/daysoff`, {
          date: selectedDates[0],
          note: note.trim(),
          isFullDay,
          startTime: isFullDay ? undefined : startTime,
          endTime: isFullDay ? undefined : endTime
        }, getAuthHeaders());
      } else {
        // Multiple dates: use batch endpoint
        await axios.post(`${API_URL}/api/daysoff/batch`, {
          dates: selectedDates,
          note: note.trim(),
          isFullDay,
          startTime: isFullDay ? undefined : startTime,
          endTime: isFullDay ? undefined : endTime
        }, getAuthHeaders());
      }
      setModalOpen(false);
      setSelectedDates([]);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add day(s) off');
    } finally {
      setSubmitting(false);
    }
  };

  const removeDayOff = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/daysoff/${id}`, getAuthHeaders());
      fetchData();
    } catch (err) {
      alert('Failed to remove day off');
    }
  };

  // Upcoming days off (filter out past ones and sort)
  const upcomingDaysOff = daysOff.filter(d => {
    const dateObj = new Date(d.date + 'T00:00:00');
    return dateObj >= today;
  }).sort((a, b) => a.date.localeCompare(b.date));

  // Format selected dates for display in modal
  const formatDateShort = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="daysoff-panel">
      <h3 className="section-title">📅 Days Off Calendar</h3>
      <p className="daysoff-subtitle">
        Click future dates to select them, then mark them all as day off at once. Click an existing day off to remove it.
      </p>

      {/* Selection action bar */}
      {selectedDates.length > 0 && (
        <div className="daysoff-selection-bar">
          <span className="daysoff-selection-count">
            {selectedDates.length} date{selectedDates.length > 1 ? 's' : ''} selected
          </span>
          <div className="daysoff-selection-actions">
            <button className="daysoff-selection-clear" onClick={() => setSelectedDates([])}>
              Clear
            </button>
            <button className="daysoff-selection-confirm" onClick={openModal}>
              Mark as Day Off
            </button>
          </div>
        </div>
      )}

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
            const isSelected = selectedDates.includes(dateStr);
            const hasBookings = availability[dateStr] && availability[dateStr].bookedTimes?.length > 0;

            const cellClasses = [
              'daysoff-cell',
              past && 'daysoff-cell--past',
              isToday && 'daysoff-cell--today',
              dayOff && 'daysoff-cell--dayoff',
              isSelected && 'daysoff-cell--selected'
            ].filter(Boolean).join(' ');

            return (
              <button
                key={day}
                className={cellClasses}
                onClick={() => handleDayClick(day)}
                disabled={past}
                title={dayOff ? `Day Off: ${dayOff.note || 'No reason'}${!dayOff.isFullDay ? ` (${dayOff.startTime}–${dayOff.endTime})` : ''}` : isSelected ? 'Selected — click to deselect' : past ? 'Past Date' : hasBookings ? 'Has Bookings — click to select' : 'Available — click to select'}
              >
                <span>{day}</span>
                {dayOff && dayOff.note && <span className="daysoff-cell-note">{dayOff.note}</span>}
                {dayOff && !dayOff.isFullDay && (
                  <span className="daysoff-cell-partial">◑</span>
                )}
                {!dayOff && hasBookings && !past && !isSelected && (
                  <span className="daysoff-cell-bookings">
                    <span className="daysoff-cell-bookings-dot"></span>
                    {availability[dateStr].bookedTimes.length}
                  </span>
                )}
                {isSelected && <span className="daysoff-cell-check">✓</span>}
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
                    <span className="daysoff-upcoming-type">{d.isFullDay ? 'Full Day' : `${d.startTime} – ${d.endTime}`}</span>
                    {d.note && <span className="daysoff-upcoming-note">{d.note}</span>}
                  </div>
                  <button className="daysoff-remove-btn" onClick={() => removeDayOff(d._id)}>Remove</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Day(s) Off Modal */}
      {modalOpen && (
        <div className="daysoff-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="daysoff-modal" onClick={e => e.stopPropagation()}>
            <h4>Mark {selectedDates.length === 1 ? '1 Date' : `${selectedDates.length} Dates`} as Day Off</h4>
            
            {/* Show selected dates */}
            <div className="daysoff-modal-dates">
              {selectedDates.map(d => (
                <span key={d} className="daysoff-modal-date-chip">
                  {formatDateShort(d)}
                  <button onClick={() => {
                    const newDates = selectedDates.filter(sd => sd !== d);
                    if (newDates.length === 0) {
                      setModalOpen(false);
                      setSelectedDates([]);
                    } else {
                      setSelectedDates(newDates);
                    }
                  }}>×</button>
                </span>
              ))}
            </div>

            <p>Clients will not be able to book on these date(s)/time(s).</p>
            
            <div className="daysoff-modal-type-toggle">
              <label>
                <input 
                  type="radio" 
                  checked={isFullDay} 
                  onChange={() => setIsFullDay(true)} 
                />
                Full Day
              </label>
              <label>
                <input 
                  type="radio" 
                  checked={!isFullDay} 
                  onChange={() => setIsFullDay(false)} 
                />
                Partial Hours
              </label>
            </div>

            {!isFullDay && (
              <div className="daysoff-modal-times">
                <input 
                  type="time" 
                  value={startTime} 
                  onChange={e => setStartTime(e.target.value)} 
                />
                <span> to </span>
                <input 
                  type="time" 
                  value={endTime} 
                  onChange={e => setEndTime(e.target.value)} 
                />
              </div>
            )}

            <input
              type="text"
              placeholder="Reason / Note (e.g. At work, Holiday, Personal)"
              value={note}
              onChange={e => setNote(e.target.value)}
              autoFocus
              maxLength={30}
              onKeyDown={e => { if (e.key === 'Enter' && !submitting) addDaysOff(); }}
            />
            <div className="daysoff-modal-actions">
              <button className="daysoff-modal-cancel" onClick={() => setModalOpen(false)}>Cancel</button>
              <button 
                className="daysoff-modal-confirm" 
                onClick={addDaysOff}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : `Confirm ${selectedDates.length} Day${selectedDates.length > 1 ? 's' : ''} Off`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DaysOffCalendar;

