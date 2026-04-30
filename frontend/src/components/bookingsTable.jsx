import React, { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const BookingsTable = ({ bookings, onActionSuccess }) => {
  // State to track which row is being edited (for rescheduling)
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ date: "", time: "" });

  // Helper: Get auth headers for admin API requests
  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  if (!Array.isArray(bookings)) {
    console.error("BookingsTable received non-array bookings:", bookings);
    return <div className="error-message">Error: Invalid bookings data</div>;
  }

  if (bookings.length === 0) {
    return <p className="no-bookings">No current bookings found.</p>;
  }

  // Helper: Format Date
  const formatDateTime = (date, time) => {
    const d = new Date(date);
    return `${d.toLocaleDateString()} @ ${time}`;
  };

  // --- ACTIONS ---

  // 1. CONFIRM Booking
  const handleConfirm = async (id) => {
    try {
      await axios.put(`${API_URL}/api/bookings/${id}`, {
        status: "Confirmed",
      }, getAuthHeaders());
      onActionSuccess(); // Refresh the table
    } catch (err) {
      alert("Error confirming booking");
    }
  };

  // 2. CANCEL Booking
  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await axios.put(`${API_URL}/api/bookings/${id}`, {
        status: "Cancelled",
      }, getAuthHeaders());
      onActionSuccess();
    } catch (err) {
      alert("Error cancelling booking");
    }
  };

  // 3. START RESCHEDULE (Opens inputs)
  const startEdit = (booking) => {
    setEditingId(booking._id);
    setEditFormData({ date: booking.date, time: booking.time });
  };

  // 4. SAVE RESCHEDULE
  const saveReschedule = async (id) => {
    try {
      await axios.put(`${API_URL}/api/bookings/${id}`, {
        date: editFormData.date,
        time: editFormData.time,
        status: "Confirmed", // Auto-confirm if rescheduled
      }, getAuthHeaders());
      setEditingId(null);
      onActionSuccess();
    } catch (err) {
      alert("Error rescheduling booking");
    }
  };

  return (
    <div className="bookings-table-container">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Client Name</th>
            <th>Contact</th>
            <th>Service</th>
            <th>Date & Time</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking, index) => (
            <tr key={booking._id}>
              <td>{index + 1}</td>
              <td>{booking.clientName}</td>
              <td>{booking.contact}</td>
              <td>{booking.service}</td>

              {/* RESCHEDULE LOGIC: Show Inputs if editing, otherwise show Text */}
              <td>
                {editingId === booking._id ? (
                  <div className="edit-inputs">
                    <input
                      type="date"
                      value={editFormData.date}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, date: e.target.value })
                      }
                    />
                    <input
                      type="time"
                      value={editFormData.time}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, time: e.target.value })
                      }
                    />
                  </div>
                ) : (
                  formatDateTime(booking.date, booking.time)
                )}
              </td>

              <td className={`status-${booking.status.toLowerCase()}`}>
                {booking.status}
              </td>

              <td>
                {editingId === booking._id ? (
                  // Show SAVE button if editing
                  <button
                    className="btn-confirm"
                    onClick={() => saveReschedule(booking._id)}
                  >
                    Save
                  </button>
                ) : (
                  // Show Standard Buttons
                  <>
                    {booking.status === "Pending" && (
                      <button
                        className="btn-confirm"
                        onClick={() => handleConfirm(booking._id)}
                      >
                        Confirm
                      </button>
                    )}

                    {booking.status !== "Cancelled" && (
                      <button
                        className="btn-move"
                        onClick={() => startEdit(booking)}
                      >
                        Reschedule
                      </button>
                    )}

                    {booking.status !== "Cancelled" && (
                      <button
                        className="btn-cancel"
                        onClick={() => handleCancel(booking._id)}
                      >
                        Cancel
                      </button>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BookingsTable;