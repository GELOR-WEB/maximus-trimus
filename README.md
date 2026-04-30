## 💈 MERN Barbershop Booking App: Maximus Trimus

This is a commercial-grade, full-stack scheduling system built using the **MERN** stack (MongoDB, Express, React, Node.js).

The application allows clients to book appointments via an elegant modal and provides a private administrative dashboard for the barber to manage their availability and bookings.

### ⚙️ Technology Stack

| Component     | Technology                   | Role                                                            |
| :------------ | :--------------------------- | :-------------------------------------------------------------- |
| **Frontend**  | **React** (Vite), **Axios**  | Client-side UI, handles routing, and communicates with the API. |
| **Backend**   | **Node.js** + **Express**    | RESTful API server, validation, and business logic.             |
| **Database**  | **MongoDB** (Mongoose)       | Data persistence for bookings and barber status.                |
| **Dev Tools** | **Nodemon**, **Concurrenty** | Live server restarts and simultaneous app startup.              |

---

### 🚀 Core Features

- **Client Booking Modal:** Clients book appointments via a state-based modal on the homepage.
- **Styled Frontend:** Custom, dark-themed UI matching the Maximus Trimus brand.
- **Admin Dashboard:** Accessible via direct URL (`/admin/dashboard`). Displays all appointments in a table.
- **Interactive Management:** Admin can **Confirm**, **Cancel**, and **Reschedule** bookings.
- **Barber Availability Toggle:** Live "In / Out" status managed by the admin and displayed on the client homepage.

---

### 📂 Project Structure

The application is split into two isolated subdirectories:

| Folder          | Description                                                                      | Default Port |
| :-------------- | :------------------------------------------------------------------------------- | :----------- |
| **`frontend/`** | The entire React/Vite client application code.                                   | `5173`       |
| **`server/`**   | The entire Node.js/Express API, controllers, models, and database configuration. | `3000`       |

---

### 🎬 Getting Started

Follow these steps from the project root directory (`MAXIMUS-TRIMUS/`).

#### 1. Installation

Install dependencies for the root, server, and frontend:

```bash
# 1. Install global tools (like concurrently) in the root
npm install

# 2. Install server dependencies
npm install --prefix server

# 3. Install frontend dependencies
npm install --prefix frontend
```
