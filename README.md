# 🎓 Kuppi C0nnect Management System

### 📚 IT Project Management (ITPM) Group Project

---

## 🚀 Overview

The **Kuppi Class Management System** is a full-stack web application developed using the **MERN Stack** following the **MVC architecture**.
It is designed to simplify the management of student classes, registrations, communication, and progress tracking in an efficient and user-friendly way.

This system supports multiple user roles and provides real-time interaction features to enhance the learning experience.

---

## 🎯 Key Features

### 👨‍🎓 Student Features

* 📌 Register for available classes
* 📊 View dashboard with registered class count
* 📚 Track enrolled and completed classes
* 💬 Participate in class-based chat system
* 🔔 Receive notifications for updates

---

### 👨‍🏫 Instructor Features

* 📝 Create and manage classes (Kuppi sessions)
* 📋 View registered students
* 📢 Post updates and announcements
* 💬 Interact with students via chat

---

### 🛠️ Admin Features

* 👥 Manage users (students & instructors)
* 📊 Monitor system activities
* ⚙️ Control and maintain platform data

---

## 🧩 Core Modules

### 📌 1. Kuppi Class Creation

* Instructors can create classes with scheduling and descriptions

### 📌 2. Student Registration System

* Students can register/unregister classes
* Dashboard updates dynamically

### 📌 3. Dashboard & Analytics

* Displays real-time statistics
* Tracks student progress

### 📌 4. Chat System

* Real-time messaging for each class
* Supports interactive discussions

### 📌 5. Notification System

* Alerts for new classes, messages, and updates

---

## 🏗️ System Architecture

* ⚙️ **Frontend**: React.js
* 🔗 **Backend**: Node.js + Express.js
* 🗄️ **Database**: MongoDB
* 🧠 **Architecture Pattern**: MVC
* 🔐 **Authentication**: JWT + Role-Based Access

---

## 📁 Project Structure

```
/project-root
│
├── frontend/        # React Frontend
│   ├── components/
│   ├── pages/
│   └── services/
│
├── backend/         # Node.js Backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── middleware/
│
└── README.md
```

---

## ⚙️ Installation & Setup

### 🔹 1. Clone the Repository

```bash
git clone https://github.com/your-repo-name.git
cd your-repo-name
```

### 🔹 2. Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 🔹 3. Setup Environment Variables

Create a `.env` file inside the backend folder:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

### 🔹 4. Run the Application

```bash
# Run backend
cd backend
npm run dev

# Run frontend
cd frontend
npm start
```

---

## 🔐 Authentication & Security

* JWT-based authentication
* Role-based authorization
* Protected routes for secure operations

---

## 📸 Screenshots

*Add screenshots of your UI here (Dashboard, Chat, Class Page, etc.)*

---

## 👥 Team Members

* 👤 Member 1 – Kuppi Class Creation
* 👤 Member 2 – Student Registration System
* 👤 Member 3 – Dashboard & Analytics
* 👤 Member 4 – Chat & Notification System

---

## 📅 Project Timeline

* 📌 Project Start: March (Week 1)
* 📌 Frontend Completion: Before March 25 (Viva 1)
* 📌 Backend Development & Integration: Late March – Early April
* 📌 Final Project Completion: **April 7, 2026**

---

## 🎓 Academic Purpose

This project was developed as part of the **IT Project Management (ITPM)** module to demonstrate:

* Full-stack development
* Team collaboration
* Version control practices
* Real-world system design

---

## 💡 Future Improvements

* 📱 Improve mobile responsiveness
* 📊 Advanced analytics dashboard
* 🔔 Push notification system
* ☁️ Cloud deployment (AWS / Vercel / Render)

---

## ⭐ Conclusion

The **Kuppi Class Management System** demonstrates a complete full-stack implementation using modern web technologies.
It highlights effective teamwork, clean architecture, and real-world problem-solving through a scalable and interactive platform.

---

> 💬 *“Simplifying learning, one class at a time.”*

---
