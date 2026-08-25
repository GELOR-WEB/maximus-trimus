import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000');
import { useAuth } from "../contexts/AuthContext";
import "./BookingForm.css"; // We will create a specific CSS file for this

const BookingForm = ({ initialDate, initialTime }) => {
  const { isAuthenticated, user } = useAuth();

  const [formData, setFormData] = useState({
    clientName: "",
    contact: "",
    serviceType: "Shop Service", // Default
    location: "",
    date: initialDate || "",
    time: initialTime || "",
  });

  // Auto-fill form when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        clientName: user.fullName || "",
        contact: user.email || user.phone || ""
      }));
    }
  }, [isAuthenticated, user]);

  const [bookedTimes, setBookedTimes] = useState([]);

  // Result modal state: { show, success, message }
  const [resultModal, setResultModal] = useState({ show: false, success: false, message: "" });

  // Settings State
  const [settings, setSettings] = useState({ startHour: 7, endHour: 22 });

  // Helper: Get today's date in YYYY-MM-DD format for min date attribute
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper: Get minimum time based on selected date
  const getMinTime = () => {
    if (!formData.date) return `${settings.startHour.toString().padStart(2, '0')}:00`;

    const selectedDate = new Date(formData.date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If selected date is today, minimum time is current hour + 1
    if (selectedDate.getTime() === today.getTime()) {
      const currentHour = new Date().getHours();
      const minHour = currentHour + 1;
      return `${minHour.toString().padStart(2, '0')}:00`;
    }

    // Future dates can use any time within business hours
    return `${settings.startHour.toString().padStart(2, '0')}:00`;
  };

  // Helper: Format date for display
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Helper: Format time for display
  const formatDisplayTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  // 1. Fetch Global Settings on Load
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/settings`);
        setSettings(res.data);
      } catch (err) {
        console.error("Error fetching settings", err);
      }
    };
    fetchSettings();
  }, []);

  // 2. When Date Changes, Fetch Availability
  useEffect(() => {
    if (!formData.date) return;

    const checkAvailability = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/bookings/check-date?date=${formData.date}`);
        setBookedTimes(res.data); // Array of times strings like ["10:30", "14:00"]
      } catch (err) {
        console.error(err);
      }
    };
    checkAvailability();
  }, [formData.date]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent booking a time that has already passed today
    const selectedDate = new Date(formData.date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate.getTime() === today.getTime()) {
      const now = new Date();
      const [selH, selM] = formData.time.split(':').map(Number);
      const selectedMinutes = selH * 60 + selM;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      if (selectedMinutes <= currentMinutes) {
        setResultModal({
          show: true,
          success: false,
          message: "This time has already passed. Please select a later time."
        });
        return;
      }
    }

    try {
      await axios.post(`${API_URL}/api/bookings`, formData);

      // Show success result modal
      setResultModal({
        show: true,
        success: true,
        message: "Your booking has been submitted and is awaiting confirmation. See you then!"
      });

      // Reset only date/time/service fields, keep user info if logged in
      setFormData({
        clientName: isAuthenticated ? user.fullName : "",
        contact: isAuthenticated ? (user.email || user.phone) : "",
        serviceType: "Shop Service",
        location: "",
        date: "",
        time: "",
      });
    } catch (error) {
      console.error(error);
      setResultModal({
        show: true,
        success: false,
        message: error.response?.data?.message || "Booking failed. Please try again."
      });
    }
  };

  // Helper: Check if a time matches the 1-hour gap rule visually
  const isTimeBlocked = (timeVal) => {
    if (!timeVal) return false;
    const [h, m] = timeVal.split(':').map(Number);
    const mins = h * 60 + m;

    return bookedTimes.some(bTime => {
      const [bh, bm] = bTime.split(':').map(Number);
      const bMins = bh * 60 + bm;
      return Math.abs(mins - bMins) < 60;
    });
  };

  return (
    <div className="booking-form-wrapper">

      {!isAuthenticated && (
        <div className="info-message">
          💡 <strong>Tip:</strong> <a href="/login" style={{ color: '#d4af37' }}>Login</a> or <a href="/register" style={{ color: '#d4af37' }}>create an account</a> to save your info for faster bookings!
        </div>
      )}

      <form onSubmit={handleSubmit} className="booking-form">
        <label>Your Name (Nickname ok):</label>
        <input
          type="text"
          name="clientName"
          value={formData.clientName}
          onChange={handleChange}
          readOnly={isAuthenticated}
          style={isAuthenticated ? { backgroundColor: 'rgba(212, 175, 55, 0.1)', cursor: 'not-allowed' } : {}}
          required
        />
        {isAuthenticated && <small style={{ color: '#d4af37', fontSize: '0.85rem' }}>✓ Auto-filled from your profile</small>}

        <label>Email or Phone:</label>
        <input
          type="text"
          name="contact"
          value={formData.contact}
          onChange={handleChange}
          readOnly={isAuthenticated}
          style={isAuthenticated ? { backgroundColor: 'rgba(212, 175, 55, 0.1)', cursor: 'not-allowed' } : {}}
          placeholder="For history tracking"
          required
        />
        {isAuthenticated && <small style={{ color: '#d4af37', fontSize: '0.85rem' }}>✓ Auto-filled from your profile</small>}

        <label>Service Type:</label>
        <select
          name="serviceType"
          value={formData.serviceType}
          onChange={handleChange}
          className="dark-select"
        >
          <option value="Shop Service">Shop Service (Walk-in)</option>
          <option value="Home Service">Home Service</option>
        </select>

        {/* CONDITIONAL LOCATION INPUT */}
        {formData.serviceType === "Home Service" && (
          <div className="fade-in-input">
            <label>Home Address / Landmark:</label>
            <textarea
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Where should I go?"
              required
            />
          </div>
        )}

        <label>Date:</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          min={getTodayDate()}
          required
        />

        <label>Time:</label>
        <input
          type="time"
          name="time"
          value={formData.time}
          onChange={handleChange}
          required
          min={getMinTime()}
          max={`${settings.endHour.toString().padStart(2, '0')}:00`}
          className={isTimeBlocked(formData.time) ? "input-warning" : ""}
        />
        {isTimeBlocked(formData.time) && (
          <small className="warning-text">⚠️ This time is too close to another booking.</small>
        )}

        <button type="submit" className="submit-button">Book Now</button>
      </form>

      {/* RESULT MODAL — shows after booking attempt */}
      {resultModal.show && (
        <div className="result-overlay" onClick={() => setResultModal({ ...resultModal, show: false })}>
          <div className="result-modal" onClick={(e) => e.stopPropagation()}>

            {/* Icon */}
            <div className={`result-icon-circle ${resultModal.success ? "result-icon-circle--success" : "result-icon-circle--error"}`}>
              {resultModal.success ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </div>

            {/* Title */}
            <h3 className={`result-title ${resultModal.success ? "result-title--success" : "result-title--error"}`}>
              {resultModal.success ? "Booking Submitted!" : "Booking Failed"}
            </h3>

            {/* Message */}
            <p className="result-message">{resultModal.message}</p>

            {/* Dismiss */}
            <button
              className={`result-dismiss-btn ${resultModal.success ? "result-dismiss-btn--success" : "result-dismiss-btn--error"}`}
              onClick={() => setResultModal({ ...resultModal, show: false })}
            >
              {resultModal.success ? "Got It ✓" : "Try Again"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingForm;
