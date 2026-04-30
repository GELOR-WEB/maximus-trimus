import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
import { useAuth } from "../contexts/AuthContext";
import "./BookingForm.css"; // We will create a specific CSS file for this

const BookingForm = () => {
  const { isAuthenticated, user } = useAuth();

  const [formData, setFormData] = useState({
    clientName: "",
    contact: "",
    serviceType: "Shop Service", // Default
    location: "",
    date: "",
    time: "",
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

  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [bookedTimes, setBookedTimes] = useState([]);

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
    setMessage("Processing...");
    setIsError(false);

    try {
      // Token will be automatically included by axios interceptor if user is logged in
      await axios.post(`${API_URL}/api/bookings`, formData);
      setMessage("Booking Confirmed! See you then.");
      setIsError(false);
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
      setIsError(true);
      setMessage(error.response?.data?.message || "Booking failed.");
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
      {message && (
        <div className={`form-message ${isError ? "error" : "success"}`}>
          {message}
        </div>
      )}

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
    </div>
  );
};

export default BookingForm;
