import React, { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000');

const BookingsTable = ({ bookings, onActionSuccess, showFilters = false, hideActions = false, hidePayment = false }) => {
  // State to track which row is being edited (for rescheduling)
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ date: "", time: "" });

  // State for the "Finished" payment prompt
  const [finishingId, setFinishingId] = useState(null);
  const [paymentData, setPaymentData] = useState({ amount: "", method: "cash" });

  // Filters and Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [sortPayment, setSortPayment] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

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

  // --- FILTER & SORT LOGIC ---
  let displayedBookings = [...bookings];

  if (showFilters) {
    if (searchQuery) {
      displayedBookings = displayedBookings.filter(b => 
        (b.clientName || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortPayment === "highest") {
      displayedBookings.sort((a, b) => (b.amountPaid || 0) - (a.amountPaid || 0));
    } else if (sortPayment === "lowest") {
      displayedBookings.sort((a, b) => (a.amountPaid || 0) - (b.amountPaid || 0));
    }
  }

  const totalPages = showFilters ? Math.ceil(displayedBookings.length / ITEMS_PER_PAGE) : 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  if (showFilters) {
    displayedBookings = displayedBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
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
      {showFilters && (
        <div className="table-filters" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <input 
            type="text" 
            placeholder="Search by client name..." 
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#222', color: '#fff', flex: 1, outline: 'none' }}
          />
          <select 
            value={sortPayment} 
            onChange={e => { setSortPayment(e.target.value); setCurrentPage(1); }}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#222', color: '#fff', outline: 'none' }}
          >
            <option value="">Sort by Payment</option>
            <option value="highest">Highest Payment</option>
            <option value="lowest">Lowest Payment</option>
          </select>
        </div>
      )}
      
      {displayedBookings.length === 0 ? (
        <p className="no-bookings" style={{ padding: '20px', textAlign: 'center' }}>No results match your search.</p>
      ) : (
        <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Client Name</th>
            <th>Contact</th>
            <th>Service</th>
            <th>Date & Time</th>
            <th>Status</th>
            {!hidePayment && <th>Payment</th>}
            {!hideActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {displayedBookings.map((booking, index) => (
            <React.Fragment key={booking._id}>
              <tr>
                <td>{showFilters ? startIndex + index + 1 : index + 1}</td>
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
                {!hidePayment && (
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
                )}

                {!hideActions && (
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
                )}
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
      )}
      
      {showFilters && totalPages > 1 && (
        <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn-toggle"
            style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
          >
            Previous
          </button>
          <span style={{ display: 'flex', alignItems: 'center', color: '#ccc' }}>Page {currentPage} of {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn-toggle"
            style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingsTable;