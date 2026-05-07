import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./mainPage.css";
import { BsStars } from "react-icons/bs";
import { PiScissorsThin } from "react-icons/pi";
import BookingForm from "../components/bookingForm";

const MainPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Extract First Name for Greeting
  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Guest';

  // 1. NEW STATE: State to store the URL of the image to display in the modal
  const [selectedImage, setSelectedImage] = useState(null);

  const [isFlipped, setIsFlipped] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("menu-open");
    }
  }, [isMenuOpen]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFlipped((prev) => !prev);
    }, 3000); // flips every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);

  // Function to handle the click and set the selected image
  const handleImageClick = (e, imageUrl) => {
    // Prevents the click from bubbling up and causing issues
    e.stopPropagation();
    setSelectedImage(imageUrl);
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    });

    document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);


  // Function to close the modal
  const closeModal = () => {
    setSelectedImage(null);
  };

  // Define click handler for book now button
  const handleBookNowClick = () => {
    if (!isAuthenticated) {
      setIsAuthPromptOpen(true);
    } else {
      setIsBookingModalOpen(true);
    }
  };

  // Function to close the booking modal
  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
  };
  const [isShopOpen, setIsShopOpen] = useState(true);
  const [greetingMessage, setGreetingMessage] = useState('how do you want your hair done?');

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState({ text: '', type: '' });

  // Fetch reviews
  useEffect(() => {
    axios.get(`${API_URL}/api/reviews`)
      .then(res => {
        if (Array.isArray(res.data)) setReviews(res.data);
      })
      .catch(() => { });
  }, []);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (reviewRating === 0) {
      setReviewMessage({ text: 'Please select a star rating.', type: 'error' });
      return;
    }
    if (!reviewComment.trim()) {
      setReviewMessage({ text: 'Please write a comment.', type: 'error' });
      return;
    }
    setReviewSubmitting(true);
    setReviewMessage({ text: '', type: '' });
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/reviews`, {
        rating: reviewRating,
        comment: reviewComment.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(prev => [res.data, ...prev]);
      setReviewMessage({ text: 'Thank you for your review!', type: 'success' });
      setReviewRating(0);
      setReviewComment('');
      setTimeout(() => {
        setIsReviewModalOpen(false);
        setReviewMessage({ text: '', type: '' });
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit review.';
      setReviewMessage({ text: msg, type: 'error' });
    } finally {
      setReviewSubmitting(false);
    }
  };

  useEffect(() => {
    axios.get(`${API_URL}/api/settings`)
      .then(res => {
        setIsShopOpen(res.data.isShopOpen);
        if (res.data.greetingMessage !== undefined) {
          setGreetingMessage(res.data.greetingMessage);
        }
      })
      .catch(err => console.log(err));
  }, []);

  // Silently poll for settings updates every 30 seconds (no page reload)
  useEffect(() => {
    const pollSettings = setInterval(() => {
      axios.get(`${API_URL}/api/settings`)
        .then(res => {
          setIsShopOpen(res.data.isShopOpen);
          if (res.data.greetingMessage !== undefined) {
            setGreetingMessage(res.data.greetingMessage);
          }
        })
        .catch(() => { }); // Silently ignore errors during polling
    }, 30 * 1000); // every 30 seconds

    return () => clearInterval(pollSettings);
  }, []);

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const controlNavbar = () => {
    if (typeof window !== "undefined") {
      if (window.scrollY > 100) {
        if (window.scrollY < lastScrollY) {
          setIsVisible(true);
        } else if (window.scrollY > lastScrollY) {
          setIsVisible(false);
        }
      } else {
        setIsVisible(true);
      }
      setLastScrollY(window.scrollY);
    }
  };
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", controlNavbar);
      return () => {
        window.removeEventListener("scroll", controlNavbar);
      };
    }
  }, [lastScrollY]);
  useEffect(() => {
    const container = document.querySelector(".scroll-container");

    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY > window.innerHeight / 2) {
        container.classList.add("scrolled");
      } else {
        container.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const scrollToSection = (e, id) => {
    e.preventDefault(); // prevent default anchor jump
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" }); // smooth scroll
    }
  };

  // Drag-to-scroll for carousels (gallery + reviews)
  useEffect(() => {
    const setupDragScroll = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;

      let isDown = false;
      let startX;
      let scrollLeft;
      let resumeTimer;

      const onMouseDown = (e) => {
        isDown = true;
        el.classList.add('is-dragging');
        startX = e.pageX - el.offsetLeft;
        scrollLeft = el.scrollLeft;
        clearTimeout(resumeTimer);
      };

      const onMouseLeave = () => {
        if (!isDown) return;
        isDown = false;
        resumeTimer = setTimeout(() => el.classList.remove('is-dragging'), 3000);
      };

      const onMouseUp = () => {
        isDown = false;
        resumeTimer = setTimeout(() => el.classList.remove('is-dragging'), 3000);
      };

      const onMouseMove = (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - el.offsetLeft;
        const walk = (x - startX) * 2;
        el.scrollLeft = scrollLeft - walk;
      };

      el.addEventListener('mousedown', onMouseDown);
      el.addEventListener('mouseleave', onMouseLeave);
      el.addEventListener('mouseup', onMouseUp);
      el.addEventListener('mousemove', onMouseMove);

      return () => {
        el.removeEventListener('mousedown', onMouseDown);
        el.removeEventListener('mouseleave', onMouseLeave);
        el.removeEventListener('mouseup', onMouseUp);
        el.removeEventListener('mousemove', onMouseMove);
        clearTimeout(resumeTimer);
      };
    };

    const timer = setTimeout(() => {
      const c1 = setupDragScroll('.carousel');
      const c2 = setupDragScroll('.reviews-carousel');
      window.__carouselCleanup = () => { c1?.(); c2?.(); };
    }, 500);

    return () => {
      clearTimeout(timer);
      window.__carouselCleanup?.();
    };
  }, []);

  return (
    <>
      {/* 0. AUTH PROMPT MODAL */}
      {isAuthPromptOpen && (
        <div className="booking-modal-backdrop" onClick={() => setIsAuthPromptOpen(false)}>
          <div className="booking-modal-container auth-prompt-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setIsAuthPromptOpen(false)}>×</button>
            <div className="booking-content">
              <h2>Do you have an account?</h2>
              <div className="auth-prompt-buttons">
                <button
                  className="btn-prompt login"
                  onClick={() => navigate("/login")}
                >
                  Yes
                </button>
                <button
                  className="btn-prompt register"
                  onClick={() => navigate("/register")}
                >
                  No
                </button>
                <button
                  className="btn-prompt guest"
                  onClick={() => {
                    setIsAuthPromptOpen(false);
                    setIsBookingModalOpen(true);
                  }}
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. BOOKING MODAL RENDERING LOGIC */}
      {isBookingModalOpen && (
        // Render the modal backdrop and container
        <div className="booking-modal-backdrop" onClick={closeBookingModal}>
          <div
            className="booking-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close-btn" onClick={closeBookingModal}>
              ×
            </button>

            {/* The content of the modal: Title, description, and Form */}
            <div className="booking-content">
              <h2>Book Your Next Haircut</h2>
              <p>
                Fill out the details below to secure your spot with the barber.
              </p>
              {/* 👈 Render the BookingForm here */}
              <BookingForm />
            </div>
          </div>
        </div>
      )}
      {/* 2. RENDER THE MODAL AT THE TOP LEVEL */}
      {selectedImage && (
        <ImageModal imageUrl={selectedImage} onClose={closeModal} />
      )}
      <div className="main-container">
        <div className="opaque-content-wrapper">
          <div
            className={`navbar ${isVisible ? "navbar--visible" : "navbar--hidden"
              }`}
          >
            <div
              className="logo"
              onClick={() => navigate(isAuthenticated ? "/profile" : "/")}
              style={{ cursor: "pointer" }}
              title={isAuthenticated ? `Go to Profile (${user?.fullName})` : "Home"}
            >
              <img src="/images/weblogo.png" alt="Maximus Trimus Logo" />
            </div>
            <ul className={`nav-links ${isMenuOpen ? "nav-links--open" : ""}`}>
              <li>
                <a href="#home" onClick={(e) => { scrollToSection(e, "home"); closeMenu(); }}>
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  onClick={(e) => { scrollToSection(e, "contact"); closeMenu(); }}
                >
                  Contact
                </a>
              </li>
              <li>
                <a
                  href="#gallery"
                  onClick={(e) => { scrollToSection(e, "gallery"); closeMenu(); }}
                >
                  Gallery
                </a>
              </li>
              <li>
                <a
                  href="#the-barber"
                  onClick={(e) => { scrollToSection(e, "the-barber"); closeMenu(); }}
                >
                  The Barber
                </a>
              </li>
              <li>
                <a
                  href="#reviews"
                  onClick={(e) => { scrollToSection(e, "reviews"); closeMenu(); }}
                >
                  Reviews
                </a>
              </li>
            </ul>

            <button
              className={`hamburger ${isMenuOpen ? "is-active" : ""}`}
              onClick={toggleMenu}
              aria-label="Toggle navigation"
            >
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
            </button>

            {/* Personalized Greeting - Top Right */}
            {isAuthenticated && (
              <div className="nav-greeting">
                Hello, <span>{firstName}</span> {greetingMessage}
              </div>
            )}
          </div>
          <div className="scroll-container">
            <section
              id="home"
              className="home-section"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('/images/mainBackground.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                height: "100vh",
                width: "100%",
              }}
            >
              {isAuthenticated && (
                <div className="mobile-home-greeting">
                  Hello, <span>{firstName}</span> {greetingMessage}
                </div>
              )}
              <div className="flip-container">
                <div className={`flipper ${isFlipped ? "flipped" : ""}`}>
                  <div className="front">
                    <h1>
                      MAXIMUS <br /> TRIMUS
                    </h1>
                    <p>Veni, Vedi, Praecidi.</p>
                    <p>Est. 2021</p>
                  </div>
                  <div className="back">
                    <img
                      src="/images/mainlogo.png"
                      alt="Maximus Trimus Logo"
                      className="logo-flip"
                    />
                  </div>
                </div>
              </div>
              <button className="book-now-btn" onClick={handleBookNowClick}>
                BOOK A CUT
              </button>
            </section>

            <section
              id="contact"
              className="contact-section"
              style={{
                backgroundImage: "url('/images/contactbg.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                height: "100vh",
                width: "100%",
              }}
            >
              <div className="box1"></div>
              <div className="box2"></div>
              <div className="contact-content">
                <div className="contact-content-text">
                  <h2>Welcome to MAXIMUS TRIMUS</h2>
                  <h3>
                    Established in 2021, Maximus Trimus is a thriving local shop
                    that started in a garage to fulfill a passion for the
                    craftsmanship of haircutting.
                  </h3>
                  <div className="contact-details-grid">
                    <div className="location-info">
                      <h3>Location:</h3>
                      <div className="map">
                        <iframe
                          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3851.390138742389!2d120.59134717596842!3d15.136904063719903!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3396f2464b079d17%3A0xe6a79e3010af94a4!2sPacimar%20Estate%2C%20Kenneth%20St%2C%20Angeles%2C%20Pampanga!5e0!3m2!1sen!2sph!4v1762132780562!5m2!1sen!2sph"
                          style={{ border: 0 }}
                          allowFullScreen=""
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                      </div>
                    </div>

                    <div className="business-details">
                      <p className={`status ${!isShopOpen ? 'status--out' : ''}`}>
                        {isShopOpen ? "🟢 THE BARBER IS IN!" : "🔴 THE BARBER IS OUT"}
                      </p>
                      <p>
                        <strong>Hours of Operation:</strong>
                      </p>
                      <p>Sunday & Saturday<br></br>7:00 am to 10:00 pm</p>
                      <div className="social-links">
                        <a href="tel:09916461936">
                          <img src="/images/phone.png" alt="Phone Number" className="contact-icon" />
                        </a>

                        <a href="mailto:maximustrimus@gmail.com">
                          <img src="/images/email.png" alt="Email Address" className="contact-icon" />
                        </a>

                        <a href="https://www.facebook.com/profile.php?id=100092689252380" target="_blank" rel="noopener noreferrer">
                          <img src="/images/facebook.png" alt="Facebook Link" className="contact-icon" />
                        </a>

                        <a href="https://www.tiktok.com/@maximus.trimus" target="_blank" rel="noopener noreferrer">
                          <img src="/images/tiktok.png" alt="TikTok Link" className="contact-icon" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
          <section
            id="gallery"
            className="gallery-section"
            style={{
              backgroundColor: "rgba(20, 20, 20, 1)",
              minHeight: "100vh",
              width: "100%",
            }}
          >
            <div className="gallery-content">
              <h1>The Cuts</h1>
              <div className="carousel">
                <div className="group">
                  <div
                    className="card"
                    onClick={(e) => handleImageClick(e, "/images/1.png")}
                  >
                    <img src="/images/1.png" alt="/images/mainlogo.png" />
                  </div>
                  <div
                    className="card"
                    onClick={(e) => handleImageClick(e, "/images/2.jpg")}
                  >
                    <img src="/images/2.jpg" alt="/images/mainlogo.png" />
                  </div>
                  <div
                    className="card"
                    onClick={(e) => handleImageClick(e, "/images/3.png")}
                  >
                    <img src="/images/3.png" alt="/images/mainlogo.png" />
                  </div>
                  <div
                    className="card"
                    onClick={(e) => handleImageClick(e, "/images/4.png")}
                  >
                    <img src="/images/4.png" alt="/images/mainlogo.png" />
                  </div>
                  <div
                    className="card"
                    onClick={(e) => handleImageClick(e, "/images/5.png")}
                  >
                    <img src="/images/5.png" alt="/images/mainlogo.png" />
                  </div>
                  <div
                    className="card"
                    onClick={(e) => handleImageClick(e, "/images/6.jpg")}
                  >
                    <img src="/images/6.jpg" alt="/images/mainlogo.png" />
                  </div>
                  <div
                    className="card"
                    onClick={(e) => handleImageClick(e, "/images/7.jpg")}
                  >
                    <img src="/images/7.jpg" alt="/images/mainlogo.png" />
                  </div>
                  <div
                    className="card"
                    onClick={(e) => handleImageClick(e, "/images/8.jpg")}
                  >
                    <img src="/images/8.jpg" alt="/images/mainlogo.png" />
                  </div>
                </div>
                <div aria-hidden className="group">
                  <div
                    className="card"
                    onClick={(e) => handleImageClick(e, "/images/1.png")}
                  >
                    <img src="/images/1.png" alt="/images/mainlogo.png" />
                  </div>
                  <div
                    className="card"
                    onClick={(e) => handleImageClick(e, "/images/2.jpg")}
                  >
                    <img src="/images/2.jpg" alt="/images/mainlogo.png" />
                  </div>
                  <div
                    className="card"
                    onClick={(e) => handleImageClick(e, "/images/3.png")}
                  >
                    <img src="/images/3.png" alt="/images/mainlogo.png" />
                  </div>
                  <div
                    className="card"
                    onClick={(e) => handleImageClick(e, "/images/4.png")}
                  >
                    <img src="/images/4.png" alt="/images/mainlogo.png" />
                  </div>
                  <div
                    className="card"
                    onClick={(e) => handleImageClick(e, "/images/5.png")}
                  >
                    <img src="/images/5.png" alt="/images/mainlogo.png" />
                  </div>
                  <div
                    className="card"
                    onClick={(e) => handleImageClick(e, "/images/6.jpg")}
                  >
                    <img src="/images/6.jpg" alt="/images/mainlogo.png" />
                  </div>
                  <div
                    className="card"
                    onClick={(e) => handleImageClick(e, "/images/7.jpg")}
                  >
                    <img src="/images/7.jpg" alt="/images/mainlogo.png" />
                  </div>
                  <div
                    className="card"
                    onClick={(e) => handleImageClick(e, "/images/8.jpg")}
                  >
                    <img src="/images/8.jpg" alt="/images/mainlogo.png" />
                  </div>
                </div>
                <div aria-hidden className="group">
                  <div
                    className="card"
                    onClick={(e) => handleImageClick(e, "/images/1.png")}
                  >
                    <img src="/images/1.png" alt="/images/mainlogo.png" />
                  </div>
                  <div
                    className="card"
                    onClick={(e) => handleImageClick(e, "/images/2.jpg")}
                  >
                    <img src="/images/2.jpg" alt="/images/mainlogo.png" />
                  </div>
                  <div
                    className="card"
                    onClick={(e) => handleImageClick(e, "/images/3.png")}
                  >
                    <img src="/images/3.png" alt="/images/mainlogo.png" />
                  </div>
                  <div
                    className="card"
                    onClick={(e) => handleImageClick(e, "/images/4.png")}
                  >
                    <img src="/images/4.png" alt="/images/mainlogo.png" />
                  </div>
                  <div
                    className="card"
                    onClick={(e) => handleImageClick(e, "/images/5.png")}
                  >
                    <img src="/images/5.png" alt="H/images/mainlogo.png" />
                  </div>
                  <div
                    className="card"
                    onClick={(e) => handleImageClick(e, "/images/6.jpg")}
                  >
                    <img src="/images/6.jpg" alt="/images/mainlogo.png" />
                  </div>
                  <div
                    className="card"
                    onClick={(e) => handleImageClick(e, "/images/7.jpg")}
                  >
                    <img src="/images/7.jpg" alt="/images/mainlogo.png" />
                  </div>
                  <div
                    className="card"
                    onClick={(e) => handleImageClick(e, "/images/8.jpg")}
                  >
                    <img src="/images/8.jpg" alt="/images/mainlogo.png" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div >
        <section
          id="the-barber"
          className="barber-section1"
          style={{
            backgroundColor: "rgba(20, 20, 20, 1)",
            height: "100vh",
            width: "100%",
          }}
        >
          <div className="barber-fixed-image-wrapper">
            <img
              src="/images/ako.png"
              alt="Man Behind the Cuts"
              className="barber-image"
            />
          </div>
          <div className="barber-scroll-content">
            <div className="barber-content-slide slide-1">
              <div className="barber-text-overlay">
                <span className="man-text">MAN</span>
                <span className="behind-text">BEHIND</span>
                <span className="the-text">THE</span>
                <span className="cuts-text">CUTS</span>
              </div>
            </div>
            <div className="barber-content-slide slide-2">
              <div className="bio-text-grid">
                <p className="bio-left-col">
                  A solo barber with 5 years of experience, trained under a
                  local legend whose roots trace back to the iconic Oxford
                  Barbers. Now, he brings that legacy into his own space a
                  humble garage transformed into Maximus Trimus, where homey
                  comfort meets Roman grit.
                </p>
                <p className="bio-left-col">
                  Barbering isn’t just about scissors and clippers it’s a
                  privilege and a responsibility. He believes that when you
                  trust me with your hair, you’re trusting me with your
                  confidence. I don’t take that lightly.
                </p>

                <div className="bio-center-col"></div>

                <p className="bio-right-col">
                  Every client who sits in his chair gets more than just a trim
                  he customizes your cut to highlight the best version of you.
                  Whether it’s a clean fade, a sharp style, or just something
                  fresh, He’ll make sure you walk out with a look that exceeds
                  your expectations.
                </p>
                <p className="bio-right-col">
                  Funny thing is, he only picked up the clippers to shave my own
                  goatee. But when his dad asked for a buzzcut, something
                  clicked and the rest is history.
                </p>
                <p className="bio-right-col">
                  Whether you speak English, Filipino, Kapampangan, or even a
                  bit of Japanese you're always welcome here. So sit back,
                  relax, and let Maximus Trimus give you the cut you deserve.
                </p>
              </div>
            </div>
            <div className="barber-content-slide slide-3">
              <div className="stats-grid">
                {/* Left Column 1: Years of Experience */}
                <div className="stat-item left-stat">
                  <BsStars className="stat-icon" />
                  <p className="stat-label">Years of Experience:</p>
                  <p className="stat-value">5 years and counting</p>
                </div>

                {/* Left Column 2: Specialty */}
                <div className="stat-item left-stat">
                  <PiScissorsThin alt="Specialty Icon" className="stat-icon" />
                  <p className="stat-label">Specialty:</p>
                  <p className="stat-value">Modern cuts/Scissor cuts</p>
                </div>

                {/* Center Column: Image Spacer (Must be empty!) */}
                <div className="stat-center-spacer"></div>

                {/* Right Column 1: Hair Type */}
                <div className="stat-item right-stat">
                  <div className="hair-type-icons">
                    <img
                      src="/images/straight.png"
                      alt="Straight Hair Icon"
                      className="stat-icon straight-icon"
                    />
                    <img
                      src="/images/wavy.png"
                      alt="Wavy Hair Icon"
                      className="stat-icon wavy-icon"
                    />
                    <img
                      src="/images/curly.png"
                      alt="Curly Hair Icon"
                      className="stat-icon curly-icon"
                    />
                  </div>
                  <p className="stat-label">Hair Type Accommodatable:</p>
                  <p className="stat-value">Any</p>
                </div>

                {/* Right Column 2: Hairstyles Experienced In */}
                <div className="stat-item right-stat">
                  <div className="hair-style-icons">
                    <img
                      src="/images/hairstyle 4.png"
                      alt="Styles Icon"
                      className="stat-icon"
                    />
                    <img
                      src="/images/hairstyle5.png"
                      alt="Styles Icon"
                      className="stat-icon"
                    />
                    <img
                      src="/images/hairstyle6.png"
                      alt="Styles Icon"
                      className="stat-icon"
                    />
                  </div>
                  <p className="stat-label">
                    Hairstyles / Cuts Experienced In:
                  </p>
                  <p className="stat-value">Any</p>
                </div>

                {/* Add two more empty divs to complete the 3x3 grid shape for spacing */}
                <div className="stat-empty"></div>
                <div className="stat-empty"></div>
              </div>
            </div>
          </div>
        </section>

        {/* ⭐ REVIEWS SECTION */}
        <section id="reviews" className="reviews-section">
          <div className="reviews-content">
            <h2 className="reviews-title">What My Clients Say</h2>
            <p className="reviews-subtitle">Real experiences from real clients</p>

            {reviews.length > 0 ? (
              <div className="reviews-carousel">
                <div className="reviews-track">
                  {[...reviews, ...reviews].map((review, index) => (
                    <div className="review-card" key={`review-${index}`}>
                      <div className="review-card-header">
                        <div className="review-avatar">
                          {review.fullName ? review.fullName.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="review-meta">
                          <span className="review-name">{review.fullName}</span>
                          <span className="review-date">
                            {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <div className="review-stars">
                        {[1, 2, 3, 4, 5].map(star => (
                          <span key={star} className={star <= review.rating ? 'star filled' : 'star'}>★</span>
                        ))}
                      </div>
                      <p className="review-comment">"{review.comment}"</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="reviews-empty">No reviews yet. Be the first to share your experience!</p>
            )}

            {isAuthenticated && (
              <button
                className="btn-leave-review"
                onClick={() => setIsReviewModalOpen(true)}
              >
                ✍ Leave a Review
              </button>
            )}
          </div>
        </section>
      </div >

      {/* REVIEW MODAL */}
      {isReviewModalOpen && (
        <div className="review-modal-backdrop" onClick={() => { setIsReviewModalOpen(false); setReviewMessage({ text: '', type: '' }); }}>
          <div className="review-modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => { setIsReviewModalOpen(false); setReviewMessage({ text: '', type: '' }); }}>
              &times;
            </button>
            <h2>Leave a Review</h2>
            <p className="review-modal-sub">Share your experience at Maximus Trimus</p>

            <form onSubmit={handleSubmitReview} className="review-form">
              <div className="star-rating-input">
                {[1, 2, 3, 4, 5].map(star => (
                  <span
                    key={star}
                    className={`star-select ${star <= (reviewHover || reviewRating) ? 'active' : ''}`}
                    onClick={() => setReviewRating(star)}
                    onMouseEnter={() => setReviewHover(star)}
                    onMouseLeave={() => setReviewHover(0)}
                  >
                    ★
                  </span>
                ))}
              </div>
              <textarea
                className="review-textarea"
                placeholder="Write your review here..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                maxLength={500}
                rows={4}
              />
              <span className="review-char-count">{reviewComment.length}/500</span>

              {reviewMessage.text && (
                <div className={`form-message ${reviewMessage.type}`}>
                  {reviewMessage.text}
                </div>
              )}

              <button
                type="submit"
                className="submit-button"
                disabled={reviewSubmitting}
              >
                {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedImage && (
        <ImageModal imageUrl={selectedImage} onClose={closeModal} />
      )}
    </>
  );
};
const ImageModal = ({ imageUrl, onClose }) => {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          &times;
        </button>
        <img src={imageUrl} alt="Enlarged Haircut" className="modal-image" />
      </div>
    </div>
  );
};
export default MainPage;
