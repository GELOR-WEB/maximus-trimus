import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000');
import { useNavigate } from "react-router-dom"; // For redirecting if not logged in
import BookingsTable from "../components/bookingsTable";
import DashboardStats from "../components/DashboardStats";
import DaysOffCalendar from "../components/DaysOffCalendar";
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
    greetingMessage: 'how do you want your hair done?',
    autoSchedule: true
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
        const role = res.data.role;
        const isAdmin = Array.isArray(role) ? role.includes('admin') : role === 'admin';
        if (!isAdmin) {
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

    // Poll for new bookings & settings every 15 seconds
    const pollInterval = setInterval(() => {
      fetchAllData();
    }, 15 * 1000);

    return () => clearInterval(pollInterval);
  }, []);

  // 5. Handlers
  const handleBookingAction = () => {
    fetchAllData(); // Refresh everything after a booking change
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/admin/login");
  };

  // Helper: format hour as 12-hour string
  const formatHour = (h) => {
    const hr = h % 12 || 12;
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${hr} ${ampm}`;
  };

  // Handler for Toggling "Barber is In/Out" (manual override disables auto-schedule)
  const toggleStatus = async () => {
    try {
      const newStatus = !settings.isShopOpen;
      // Optimistic update — also disable auto-schedule on manual toggle
      setSettings({ ...settings, isShopOpen: newStatus, autoSchedule: false });

      // Send to backend
      await axios.put(`${API_URL}/api/settings`, {
        isShopOpen: newStatus,
        autoSchedule: false
      }, getAuthHeaders());
    } catch (err) {
      alert("Failed to update status");
      // Revert on error
      setSettings({ ...settings, isShopOpen: !settings.isShopOpen });
    }
  };

  // Handler for toggling Auto-Schedule on/off
  const toggleAutoSchedule = async () => {
    try {
      const newAutoSchedule = !settings.autoSchedule;
      setSettings({ ...settings, autoSchedule: newAutoSchedule });

      const res = await axios.put(`${API_URL}/api/settings`, {
        autoSchedule: newAutoSchedule
      }, getAuthHeaders());

      // Update with server-computed status
      if (res.data) {
        setSettings(res.data);
      }
    } catch (err) {
      alert("Failed to update auto-schedule");
      setSettings({ ...settings, autoSchedule: !settings.autoSchedule });
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

            {/* Auto-Schedule Toggle */}
            <div className="auto-schedule-control">
              <button
                onClick={toggleAutoSchedule}
                className={`btn-auto-schedule ${settings.autoSchedule ? 'btn-auto-schedule--active' : ''}`}
                title={settings.autoSchedule
                  ? `Auto: Opens ${formatHour(settings.startHour)}, Closes ${formatHour(settings.endHour)}`
                  : 'Auto-schedule is off — click to enable'
                }
              >
                <span className="auto-schedule-icon">⏰</span>
                {settings.autoSchedule ? 'Auto' : 'Manual'}
                <span className={`auto-schedule-dot ${settings.autoSchedule ? 'auto-schedule-dot--on' : 'auto-schedule-dot--off'}`} />
              </button>
              {settings.autoSchedule && (
                <span className="auto-schedule-info">
                  {formatHour(settings.startHour)} – {formatHour(settings.endHour)}
                </span>
              )}
            </div>
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

      {/* DAYS OFF CALENDAR */}
      <DaysOffCalendar />

      {/* 📊 STATS SECTION */}
      <DashboardStats />

      {error && <div className="error-message">{error}</div>}

      {/* 1. ACTIVE BOOKINGS (Pending & Confirmed) */}
      <div className="bookings-section">
        <h3 className="section-title">Active Requests ({bookings.filter(b => b.status === 'Pending' || b.status === 'Confirmed').length})</h3>
        <BookingsTable
          bookings={bookings.filter(b => b.status === 'Pending' || b.status === 'Confirmed')}
          onActionSuccess={handleBookingAction}
        />
      </div>

      {/* 2. COMPLETED BOOKINGS (Finished) */}
      <div className="bookings-section" style={{ marginTop: '40px' }}>
        <h3 className="section-title" style={{ color: '#4caf50' }}>Completed Haircuts</h3>
        <BookingsTable
          bookings={bookings.filter(b => b.status === 'Completed')}
          onActionSuccess={handleBookingAction}
          showFilters={true}
          hideActions={true}
        />
      </div>

      {/* 3. CANCELLED BOOKINGS */}
      <div className="bookings-section" style={{ marginTop: '40px' }}>
        <h3 className="section-title" style={{ color: '#f44336' }}>Cancelled Haircuts ({bookings.filter(b => b.status === 'Cancelled').length})</h3>
        <BookingsTable
          bookings={bookings.filter(b => b.status === 'Cancelled')}
          onActionSuccess={handleBookingAction}
          hideActions={true}
          hidePayment={true}
        />
      </div>

    </div>
  );
};

export default Admin;