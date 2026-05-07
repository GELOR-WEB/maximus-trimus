import React, { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const BookingsTable = ({ bookings, onActionSuccess }) => {
  // State to track which row is being edited (for rescheduling)
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ date: "", time: "" });

  // State for the "Finished" payment prompt
  const [finishingId, setFinishingId] = useState(null);
  const [paymentData, setPaymentData] = useState({ amount: "", method: "cash" });

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
    setFinishingId(null); // Close finish form if open
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

  // 5. FINISH Booking (Mark as Completed with payment)
  const startFinish = (booking) => {
    setFinishingId(booking._id);
    setPaymentData({ amount: "", method: "cash" });
    setEditingId(null); // Close reschedule if open
  };

  const saveFinish = async (id) => {
    if (!paymentData.amount || Number(paymentData.amount) <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }
    try {
      await axios.put(`${API_URL}/api/bookings/${id}`, {
        status: "Completed",
        amountPaid: Number(paymentData.amount),
        paymentMethod: paymentData.method,
      }, getAuthHeaders());
      setFinishingId(null);
      onActionSuccess();
    } catch (err) {
      alert("Error completing booking");
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
            <th>Payment</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking, index) => (
            <React.Fragment key={booking._id}>
              <tr>
                <td>{index + 1}</td>
                <td>{booking.clientName}</td>
                <td>{booking.contact}</td>
                <td>{booking.serviceType}</td>

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

                {/* Payment info column */}
                <td>
                  {booking.status === 'Completed' && booking.amountPaid ? (
                    <span style={{ fontSize: '0.85rem' }}>
                      ₱{booking.amountPaid.toLocaleString()}
                      <br />
                      <span style={{ color: '#888', textTransform: 'capitalize' }}>
                        {booking.paymentMethod || '—'}
                      </span>
                    </span>
                  ) : '—'}
                </td>

                <td>
                  {editingId === booking._id ? (
                    // Show SAVE button if editing
                    <>
                      <button
                        className="btn-confirm"
                        onClick={() => saveReschedule(booking._id)}
                      >
                        Save
                      </button>
                      <button
                        className="btn-cancel"
                        onClick={() => setEditingId(null)}
                        style={{ marginLeft: '4px' }}
                      >
                        ✕
                      </button>
                    </>
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

                      {(booking.status === "Pending" || booking.status === "Confirmed") && (
                        <button
                          className="btn-finished"
                          onClick={() => startFinish(booking)}
                        >
                          Finished
                        </button>
                      )}

                      {booking.status !== "Cancelled" && booking.status !== "Completed" && (
                        <button
                          className="btn-move"
                          onClick={() => startEdit(booking)}
                        >
                          Reschedule
                        </button>
                      )}

                      {booking.status !== "Cancelled" && booking.status !== "Completed" && (
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

              {/* Inline Payment Form (appears below the row) */}
              {finishingId === booking._id && (
                <tr className="payment-form-row">
                  <td colSpan="8">
                    <div className="payment-form">
                      <span className="payment-label">💰 How much did <strong>{booking.clientName}</strong> pay?</span>
                      <div className="payment-inputs">
                        <input
                          type="number"
                          placeholder="Amount (₱)"
                          value={paymentData.amount}
                          onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                          min="0"
                          step="10"
                          className="payment-amount-input"
                        />
                        <div className="payment-method-toggle">
                          <button
                            className={`method-btn ${paymentData.method === 'cash' ? 'active' : ''}`}
                            onClick={() => setPaymentData({ ...paymentData, method: 'cash' })}
                          >
                            💵 Cash
                          </button>
                          <button
                            className={`method-btn ${paymentData.method === 'e-money' ? 'active' : ''}`}
                            onClick={() => setPaymentData({ ...paymentData, method: 'e-money' })}
                          >
                            📱 E-Money
                          </button>
                        </div>
                        <button className="btn-confirm" onClick={() => saveFinish(booking._id)}>
                          Complete ✓
                        </button>
                        <button className="btn-cancel" onClick={() => setFinishingId(null)}>
                          ✕
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BookingsTable;