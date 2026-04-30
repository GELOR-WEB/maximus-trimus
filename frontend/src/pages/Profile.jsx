import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

import "./Profile.css";

const Profile = () => {
    const { user, updateProfile, logout } = useAuth();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: ""
    });
    const [message, setMessage] = useState({ text: "", type: "" });


    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || "",
                email: user.email || "",
                phone: user.phone || ""
            });

            // Fetch My Bookings
            const fetchMyBookings = async () => {
                try {
                    const token = localStorage.getItem("token");
                    const res = await axios.get(`${API_URL}/api/bookings/my-bookings`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setBookings(res.data);
                } catch (err) {
                    console.error("Failed to fetch bookings:", err);
                }
            };
            fetchMyBookings();
        }
    }, [user]);



    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: "", type: "" });

        const result = await updateProfile(
            formData.fullName,
            formData.email,
            formData.phone
        );

        if (result.success) {
            setMessage({ text: "Profile updated successfully!", type: "success" });
            setIsEditing(false);
        } else {
            setMessage({ text: result.message, type: "error" });
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/");
    };



    return (
        <div className="profile-container">
            <div className="profile-wrapper">
                <div className="profile-header">
                    <h1>My Profile</h1>
                    <button onClick={handleLogout} className="btn-logout">
                        Logout
                    </button>
                </div>

                <div className="profile-content">
                    {/* Profile Information Section */}
                    <div className="profile-card">
                        <div className="card-header">
                            <h2>Personal Information</h2>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="btn-edit"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        {message.text && (
                            <div className={`profile-message ${message.type}`}>
                                {message.text}
                            </div>
                        )}

                        {isEditing ? (
                            <form onSubmit={handleSubmit} className="profile-form">
                                <div className="form-group">
                                    <label htmlFor="fullName">Full Name</label>
                                    <input
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="phone">Phone</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="btn-save">
                                        Save Changes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setFormData({
                                                fullName: user.fullName || "",
                                                email: user.email || "",
                                                phone: user.phone || ""
                                            });
                                            setMessage({ text: "", type: "" });
                                        }}
                                        className="btn-cancel"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="profile-info">
                                <div className="info-item">
                                    <span className="info-label">Name:</span>
                                    <span className="info-value">{user?.fullName}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Email:</span>
                                    <span className="info-value">{user?.email}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Phone:</span>
                                    <span className="info-value">{user?.phone || "Not provided"}</span>
                                </div>
                            </div>
                        )}
                    </div>


                </div>

                <div className="profile-bookings-section">
                    <h2>My Bookings</h2>
                    {bookings.length === 0 ? (
                        <p className="no-bookings">You haven't made any bookings yet.</p>
                    ) : (
                        <div className="bookings-list">
                            {bookings.map((booking) => (
                                <div key={booking._id} className={`booking-card status-${booking.status.toLowerCase()}`}>
                                    <div className="booking-info">
                                        <div className="booking-date">
                                            <span className="date">{new Date(booking.date).toLocaleDateString()}</span>
                                            <span className="time">{booking.time}</span>
                                        </div>
                                        <div className="booking-service">
                                            <span className="service-name">{booking.serviceType}</span>
                                            {booking.location && <span className="location">📍 {booking.location}</span>}
                                        </div>
                                    </div>
                                    <div className="booking-status">
                                        <span className="status-badge">{booking.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="profile-actions-footer">
                    <button onClick={() => navigate("/")} className="btn-back-home">
                        ← Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
