import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000');
import { useAuth } from "../contexts/AuthContext";
import { PiScissorsThin } from "react-icons/pi";
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

  const closeResult = () => setResultModal({ ...resultModal, show: false });

  return (
    <div className="booking-form-wrapper">

      {!isAuthenticated && (
        <div className="info-message">
          <span className="info-message__label">Booking as a guest</span>
          <a href="/login">Sign in</a> or <a href="/register">create an account</a> and your details
          fill themselves in next time.
        </div>
      )}

      <form onSubmit={handleSubmit} className="booking-form">
        <div className="booking-form__row">
          <div className="ui-field">
            <div className="ui-field__top">
              <label className="ui-field__label" htmlFor="bf-client-name">
                Your name<span className="req" aria-hidden="true">*</span>
              </label>
              {isAuthenticated && <span className="ui-field__aside">From profile</span>}
            </div>
            <input
              id="bf-client-name"
              className="ui-input"
              type="text"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              readOnly={isAuthenticated}
              placeholder="Nickname is fine"
              autoComplete="name"
              required
            />
          </div>

          <div className="ui-field">
            <div className="ui-field__top">
              <label className="ui-field__label" htmlFor="bf-contact">
                Email or phone<span className="req" aria-hidden="true">*</span>
              </label>
              {isAuthenticated && <span className="ui-field__aside">From profile</span>}
            </div>
            <input
              id="bf-contact"
              className="ui-input"
              type="text"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              readOnly={isAuthenticated}
              placeholder="For your history"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <fieldset className="ui-field booking-service">
          <legend className="ui-field__label">Service type</legend>
          <div className="ui-choice-cards">
            <label className={`ui-choice-card ${formData.serviceType === "Shop Service" ? "is-selected" : ""}`}>
              <input
                type="radio"
                name="serviceType"
                value="Shop Service"
                checked={formData.serviceType === "Shop Service"}
                onChange={handleChange}
              />
              <span className="ui-choice-card__mark" aria-hidden="true">
                <PiScissorsThin />
              </span>
              <span className="ui-choice-card__body">
                <strong>Shop service</strong>
                <span>Come to the chair.</span>
              </span>
            </label>

            <label className={`ui-choice-card ${formData.serviceType === "Home Service" ? "is-selected" : ""}`}>
              <input
                type="radio"
                name="serviceType"
                value="Home Service"
                checked={formData.serviceType === "Home Service"}
                onChange={handleChange}
              />
              <span className="ui-choice-card__mark" aria-hidden="true">⌂</span>
              <span className="ui-choice-card__body">
                <strong>Home service</strong>
                <span>I come to you.</span>
              </span>
            </label>
          </div>
        </fieldset>

        {/* CONDITIONAL LOCATION INPUT */}
        {formData.serviceType === "Home Service" && (
          <div className="ui-field fade-in-input">
            <label className="ui-field__label" htmlFor="bf-location">
              Home address or landmark<span className="req" aria-hidden="true">*</span>
            </label>
            <textarea
              id="bf-location"
              className="ui-textarea"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Where should I go?"
              required
            />
          </div>
        )}

        <div className="booking-form__row">
          <div className="ui-field">
            <label className="ui-field__label" htmlFor="bf-date">
              Date<span className="req" aria-hidden="true">*</span>
            </label>
            <input
              id="bf-date"
              className="ui-input"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              min={getTodayDate()}
              required
            />
          </div>

          <div className="ui-field">
            <label className="ui-field__label" htmlFor="bf-time">
              Time<span className="req" aria-hidden="true">*</span>
            </label>
            <input
              id="bf-time"
              className={`ui-input ${isTimeBlocked(formData.time) ? "input-warning" : ""}`}
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
              min={getMinTime()}
              max={`${settings.endHour.toString().padStart(2, '0')}:00`}
            />
            {isTimeBlocked(formData.time) && (
              <p className="ui-field__error">That time is too close to another booking — pick a later slot.</p>
            )}
          </div>
        </div>

        <button type="submit" className="ui-btn ui-btn--primary ui-btn--block auth-submit">
          Reserve this slot
        </button>
      </form>

      {/* RESULT MODAL — shows after booking attempt */}
      {resultModal.show && (
        <div
          className="result-overlay"
          onClick={closeResult}
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-result-title"
        >
          <div className="result-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`result-icon-circle ${resultModal.success ? "result-icon-circle--success" : "result-icon-circle--error"}`}>
              {resultModal.success ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </div>

            <h3
              className={`result-title ${resultModal.success ? "result-title--success" : "result-title--error"}`}
              id="booking-result-title"
            >
              {resultModal.success ? "You're on the books" : "That didn't go through"}
            </h3>

            <p className="result-message">{resultModal.message}</p>

            <button
              type="button"
              className={`ui-btn ui-btn--block ${resultModal.success ? "ui-btn--primary" : "ui-btn--outline"}`}
              onClick={closeResult}
            >
              {resultModal.success ? "Got it" : "Try again"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingForm;
