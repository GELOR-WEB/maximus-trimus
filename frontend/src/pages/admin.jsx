import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { useNavigate } from "react-router-dom"; // For redirecting if not logged in
import BookingsTable from "../components/bookingsTable";
import DashboardStats from "../components/DashboardStats";
import "./admin.css";

const Admin = () => {
  // Helper: Get auth headers for admin API requests
  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  // 1. Existing State
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. NEW: Settings State (Status & Hours)
  const [settings, setSettings] = useState({
    isShopOpen: true,
    startHour: 7,
    endHour: 22,
    greetingMessage: 'how do you want your hair done?'
  });

  const navigate = useNavigate();

  // 3. Verify Authentication & Admin Role on Mount
  useEffect(() => {
    const verifyAdmin = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/admin/login");
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.role !== 'admin') {
          localStorage.removeItem("token");
          navigate("/admin/login");
        }
      } catch (err) {
        localStorage.removeItem("token");
        navigate("/admin/login");
      }
    };
    verifyAdmin();
  }, [navigate]);

  // 4. Combined Fetch Function (Bookings + Settings)
  const fetchAllData = async () => {
    try {
      console.log("Admin: fetching data...");
      // Run both requests in parallel for speed
      const [bookingsRes, settingsRes] = await Promise.all([
        axios.get(`${API_URL}/api/bookings`, getAuthHeaders()),
        axios.get(`${API_URL}/api/settings`)
      ]);

      console.log("Admin: data received", bookingsRes.data, settingsRes.data);

      if (Array.isArray(bookingsRes.data)) {
        setBookings(bookingsRes.data);
      } else {
        console.error("Bookings data is not an array:", bookingsRes.data);
        setError("Received invalid bookings data from server.");
        setBookings([]);
      }

      if (settingsRes.data) {
        setSettings(settingsRes.data); // Load the settings from DB
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(`Failed to load dashboard data: ${err.message || err.toString()}`);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // 5. Handlers
  const handleBookingAction = () => {
    fetchAllData(); // Refresh everything after a booking change
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/admin/login");
  };

  // NEW: Handler for Toggling "Barber is In/Out"
  const toggleStatus = async () => {
    try {
      const newStatus = !settings.isShopOpen;
      // Optimistic update (update UI immediately)
      setSettings({ ...settings, isShopOpen: newStatus });

      // Send to backend
      await axios.put(`${API_URL}/api/settings`, {
        isShopOpen: newStatus
      }, getAuthHeaders());
    } catch (err) {
      alert("Failed to update status");
      // Revert on error
      setSettings({ ...settings, isShopOpen: !settings.isShopOpen });
    }
  };

  // NEW: Handler for Saving Hours
  const saveHours = async () => {
    try {
      await axios.put(`${API_URL}/api/settings`, {
        startHour: settings.startHour,
        endHour: settings.endHour
      }, getAuthHeaders());
      alert("Hours of operation updated successfully!");
    } catch (err) {
      alert("Failed to save hours.");
    }
  };

  // NEW: Handler for Saving Greeting Message
  const saveGreeting = async () => {
    try {
      await axios.put(`${API_URL}/api/settings`, {
        greetingMessage: settings.greetingMessage
      }, getAuthHeaders());
      alert("Greeting message updated!");
    } catch (err) {
      alert("Failed to update greeting.");
    }
  };

  if (loading) return <div className="admin-page loading">Loading Command Center...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="header-left">
          <h2>Command Center</h2>

          {/* 🟢 STATUS TOGGLE CONTROLS */}
          <div className="status-control">
            <span className={settings.isShopOpen ? "status-on" : "status-off"}>
              {settings.isShopOpen ? "🟢 BARBER IS IN" : "🔴 BARBER IS OUT"}
            </span>
            <button onClick={toggleStatus} className="btn-toggle">
              {settings.isShopOpen ? "Go Offline" : "Go Online"}
            </button>
          </div>
        </div>

        <button onClick={handleLogout} className="btn-logout">Logout</button>
      </div>

      {/* ⏰ HOURS CONTROL PANEL */}
      <div className="hours-control-panel">
        <h3>Operations Control (24-Hour Format)</h3>
        <div className="hours-inputs">
          <div className="input-group">
            <label>Open Time:</label>
            <input
              type="number"
              min="0" max="23"
              value={settings.startHour}
              onChange={e => setSettings({ ...settings, startHour: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label>Close Time:</label>
            <input
              type="number"
              min="0" max="23"
              value={settings.endHour}
              onChange={e => setSettings({ ...settings, endHour: e.target.value })}
            />
          </div>

          <button onClick={saveHours} className="btn-save-hours">Update Schedule</button>
        </div>
      </div>

      {/* 💬 GREETING MESSAGE CONTROL */}
      <div className="hours-control-panel">
        <h3>Client Greeting Message</h3>
        <p style={{ color: '#aaa', fontSize: '0.85rem', margin: '0 0 10px' }}>This message appears in the navbar for logged-in clients: "Hello, [Name] <em>your message</em>"</p>
        <div className="hours-inputs">
          <div className="input-group" style={{ flex: 1 }}>
            <label>Greeting:</label>
            <input
              type="text"
              value={settings.greetingMessage}
              onChange={e => setSettings({ ...settings, greetingMessage: e.target.value })}
              placeholder="e.g. how do you want your hair done?"
            />
          </div>
          <button onClick={saveGreeting} className="btn-save-hours">Update Greeting</button>
        </div>
      </div>

      {/* 📊 STATS SECTION */}
      <DashboardStats />

      <h3 className="section-title">Recent Booking Requests ({bookings.length})</h3>

      {error && <div className="error-message">{error}</div>}

      <BookingsTable
        bookings={bookings}
        onActionSuccess={handleBookingAction}
      />
    </div>
  );
};

export default Admin;