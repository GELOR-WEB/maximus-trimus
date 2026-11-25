import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import Modal from "./ui/Modal";
import "./MyBookingsModal.css";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000');

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const parseBookingDate = (dateStr) => {
  if (!dateStr) return null;
  const parsed = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (dateStr) => {
  const d = parseBookingDate(dateStr);
  if (!d) return dateStr || "";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
};

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [rawHour, rawMinute] = timeStr.split(":").map(Number);
  if (Number.isNaN(rawHour)) return timeStr;
  const meridiem = rawHour >= 12 ? "PM" : "AM";
  const hour = rawHour % 12 || 12;
  return `${hour}:${String(rawMinute || 0).padStart(2, "0")} ${meridiem}`;
};

const isUpcoming = (booking) => {
  const d = parseBookingDate(booking.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return (
    !!d &&
    d.getTime() >= today.getTime() &&
    (booking.status === "Pending" || booking.status === "Confirmed")
  );
};

const sortByDateTime = (a, b) => {
  const aKey = `${a.date}T${a.time || "00:00"}`;
  const bKey = `${b.date}T${b.time || "00:00"}`;
  return aKey.localeCompare(bKey);
};

/** Shared modal behaviour: Escape to close, focus the dialog, and lock page scroll. */
const useModalBehavior = (isOpen, onClose) => {
  const onCloseRef = useRef(onClose);
  const dialogRef = useRef(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCloseRef.current?.();
    };

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [isOpen]);

  return dialogRef;
};

const StatusBadge = ({ status }) => (
  <span className="mbk-status-badge">{status}</span>
);

const BookingCard = ({ booking, isNext }) => {
  const date = parseBookingDate(booking.date);
  const isHome = booking.serviceType === "Home Service";

  return (
    <article className={`mbk-card status-${String(booking.status).toLowerCase()}`}>
      <div className="mbk-date-block" aria-hidden="true">
        <span className="mbk-date-month">{date ? MONTHS[date.getMonth()] : "—"}</span>
        <span className="mbk-date-day">{date ? date.getDate() : "?"}</span>
        <span className="mbk-date-weekday">{date ? WEEKDAYS[date.getDay()] : ""}</span>
      </div>

      <div className="mbk-card-body">
        <div className="mbk-card-heading">
          <h3>{isHome ? "🏠 Home Service" : "💈 Shop Service"}</h3>
          <StatusBadge status={booking.status} />
        </div>

        <p className="mbk-card-when">
          <span>{formatDate(booking.date)}</span>
          <span className="mbk-separator">•</span>
          <span>{formatTime(booking.time)}</span>
        </p>

        {isHome && booking.location && (
          <p className="mbk-card-location">📍 {booking.location}</p>
        )}

        {booking.status === "Completed" && booking.amountPaid != null && (
          <p className="mbk-card-paid">
            Paid ₱{booking.amountPaid}
            {booking.paymentMethod
              ? ` · ${booking.paymentMethod === "e-money" ? "E-money" : "Cash"}`
              : ""}
          </p>
        )}
      </div>

      {isNext && <span className="mbk-next-tag">Next up</span>}
    </article>
  );
};

const SkeletonCard = () => (
  <div className="mbk-card mbk-card--skeleton" aria-hidden="true">
    <div className="mbk-skeleton-block mbk-skeleton-date" />
    <div className="mbk-skeleton-lines">
      <span className="mbk-skeleton-block mbk-skeleton-line mbk-skeleton-line--wide" />
      <span className="mbk-skeleton-block mbk-skeleton-line" />
    </div>
  </div>
);

const MyBookingsModal = ({ isOpen, onClose, user, onBookNew, onManage }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const dialogRef = useModalBehavior(isOpen, onClose);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/bookings/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(
        err.response?.data?.message || "We couldn't load your bookings. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchBookings();
  }, [isOpen, fetchBookings]);

  if (!isOpen) return null;

  const upcoming = bookings.filter(isUpcoming).sort(sortByDateTime);
  const history = bookings
    .filter((booking) => !isUpcoming(booking))
    .sort((a, b) => sortByDateTime(b, a));

  const firstName = user?.fullName ? user.fullName.split(" ")[0] : "there";

  return (
    <div className="booking-modal-backdrop mbk-backdrop" onClick={onClose}>
      <div
        className="booking-modal-container my-bookings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="my-bookings-title"
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose} aria-label="Close my bookings">
          ×
        </button>

        <div className="mbk-scroll">
          <header className="mbk-header">
            <span className="mbk-eyebrow">Your appointments</span>
            <h2 id="my-bookings-title">My Bookings</h2>
            <p className="mbk-greeting">
              {upcoming.length > 0
                ? `Hello, ${firstName}. You have ${upcoming.length} upcoming ${upcoming.length === 1 ? "appointment" : "appointments"}.`
                : `Hello, ${firstName}. You have no upcoming appointments.`}
            </p>
          </header>

          {loading ? (
            <div className="mbk-list" aria-busy="true" aria-label="Loading bookings">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : error ? (
            <div className="mbk-error">
              <span className="mbk-error-icon">⚠️</span>
              <p>{error}</p>
              <button type="button" className="mbk-btn mbk-btn--secondary" onClick={fetchBookings}>
                Try Again
              </button>
            </div>
          ) : bookings.length === 0 ? (
            <div className="mbk-empty">
              <span className="mbk-empty-icon" aria-hidden="true">💈</span>
              <h3>No bookings yet</h3>
              <p>
                Ready for a fresh cut? Book your first appointment and it will show up right here.
              </p>
              <button type="button" className="mbk-btn mbk-btn--primary" onClick={onBookNew}>
                Book a Haircut
              </button>
            </div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <section className="mbk-section" aria-labelledby="mbk-upcoming-heading">
                  <h3 className="mbk-section-title" id="mbk-upcoming-heading">
                    Upcoming
                  </h3>
                  <div className="mbk-list">
                    {upcoming.map((booking, index) => (
                      <BookingCard key={booking._id} booking={booking} isNext={index === 0} />
                    ))}
                  </div>
                </section>
              )}

              {upcoming.length === 0 && (
                <p className="mbk-none-upcoming">
                  Nothing on the calendar right now — book a cut and own the chair.
                </p>
              )}

              {history.length > 0 && (
                <section className="mbk-section" aria-labelledby="mbk-history-heading">
                  <h3 className="mbk-section-title" id="mbk-history-heading">
                    Past &amp; Cancelled
                  </h3>
                  <div className="mbk-list mbk-list--history">
                    {history.map((booking) => (
                      <BookingCard key={booking._id} booking={booking} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        <footer className="mbk-footer">
          <button type="button" className="mbk-btn mbk-btn--ghost" onClick={onManage}>
            Manage in Profile
          </button>
          <button type="button" className="mbk-btn mbk-btn--primary" onClick={onBookNew}>
            + Book a New Cut
          </button>
        </footer>
      </div>
    </div>
  );
};

export const BookingsAuthPrompt = ({ isOpen, onClose, onRegister, onLogin }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    size="sm"
    hideHeader
    ariaLabel="Keep track of every cut"
  >
    <div className="ui-confirm">
      <span className="ui-confirm__icon ui-confirm__icon--gold" aria-hidden="true">
        ✂
      </span>
      <h2 className="ui-confirm__title">Keep track of every cut</h2>
      <p className="ui-confirm__text">
        Create a free account to see upcoming bookings, reschedule visits, and manage your
        appointments in one place.
      </p>
      <div className="ui-choice">
        <button type="button" className="ui-btn ui-btn--primary" onClick={onRegister}>
          Create an account
        </button>
        <button type="button" className="ui-btn ui-btn--outline" onClick={onLogin}>
          I already have an account
        </button>
        <button type="button" className="ui-btn ui-btn--ghost" onClick={onClose}>
          Maybe later
        </button>
      </div>
    </div>
  </Modal>
);

export default MyBookingsModal;
