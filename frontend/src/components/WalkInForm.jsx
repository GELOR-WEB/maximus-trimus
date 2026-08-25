import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./WalkInForm.css";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000');

const WalkInForm = ({ onSuccess }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = useRef(null);
  const dropdownRef = useRef(null);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setSelectedUser(null);
    setMessage(null);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (value.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await axios.get(
          `${API_URL}/api/bookings/search-users?q=${encodeURIComponent(value.trim())}`,
          getAuthHeaders()
        );
        setSearchResults(res.data);
        setShowDropdown(res.data.length > 0);
      } catch (err) {
        console.error("Search failed:", err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setSearchQuery(user.fullName || user.email);
    setShowDropdown(false);
    setSearchResults([]);
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      setMessage({ type: "error", text: "Please select a client first." });
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setMessage({ type: "error", text: "Please enter a valid payment amount." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await axios.post(
        `${API_URL}/api/bookings/walk-in`,
        {
          userId: selectedUser._id,
          amountPaid: Number(amount),
          paymentMethod
        },
        getAuthHeaders()
      );

      setMessage({ type: "success", text: res.data.message });
      // Reset form
      setSelectedUser(null);
      setSearchQuery("");
      setAmount("");
      setPaymentMethod("cash");

      if (onSuccess) onSuccess();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to record walk-in."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="walkin-panel">
      <h3>
        <span className="walkin-icon">🚶</span>
        Walk-In Haircut
      </h3>
      <p className="walkin-subtitle">
        Record a haircut for a registered client who walked in without a booking.
      </p>

      {/* Success / Error Message */}
      {message && (
        <div className={`walkin-message walkin-message--${message.type}`}>
          {message.type === "success" ? "✅" : "⚠️"} {message.text}
        </div>
      )}

      <div className="walkin-form">
        {/* User Search */}
        <div className="walkin-field" ref={dropdownRef}>
          <label>Client</label>
          <div className="walkin-search-wrapper">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              className={`walkin-search-input ${selectedUser ? "walkin-search-input--selected" : ""}`}
            />
            {searching && <span className="walkin-search-spinner">⟳</span>}
            {selectedUser && (
              <button
                className="walkin-clear-btn"
                onClick={() => {
                  setSelectedUser(null);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                title="Clear selection"
              >
                ✕
              </button>
            )}

            {/* Dropdown Results */}
            {showDropdown && (
              <div className="walkin-dropdown">
                {searchResults.map((user) => (
                  <div
                    key={user._id}
                    className="walkin-dropdown-item"
                    onClick={() => selectUser(user)}
                  >
                    <span className="walkin-user-name">{user.fullName || "—"}</span>
                    <span className="walkin-user-details">
                      {user.email && <span>{user.email}</span>}
                      {user.phone && <span> · {user.phone}</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Payment Row */}
        <div className="walkin-payment-row">
          <div className="walkin-field walkin-field--amount">
            <label>Amount (₱)</label>
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="10"
              className="walkin-amount-input"
            />
          </div>

          <div className="walkin-field walkin-field--method">
            <label>Payment</label>
            <div className="walkin-method-toggle">
              <button
                className={`walkin-method-btn ${paymentMethod === "cash" ? "active" : ""}`}
                onClick={() => setPaymentMethod("cash")}
              >
                💵 Cash
              </button>
              <button
                className={`walkin-method-btn ${paymentMethod === "e-money" ? "active" : ""}`}
                onClick={() => setPaymentMethod("e-money")}
              >
                📱 E-Money
              </button>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          className="walkin-submit-btn"
          onClick={handleSubmit}
          disabled={loading || !selectedUser}
        >
          {loading ? "Recording..." : "✂️ Record Walk-In"}
        </button>
      </div>
    </div>
  );
};

export default WalkInForm;
