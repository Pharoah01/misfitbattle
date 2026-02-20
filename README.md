# ⚔️ Misfits-Battle

> Testing Platform built by **Binary Misfits**

Misfits-Battle is a full-stack web application designed to host **CSSBattle-style coding competitions** for college events and hackathons, supporting **1000+ concurrent participants** with secure submissions and real-time leaderboard.

---

## 🚀 Overview

Misfits-Battle allows participants to:

* Solve CSS/HTML challenges
* Submit solutions securely
* Compete with others
* Track rankings on leaderboard

Built for scalability, performance, and event reliability.

---

## 🏗️ Architecture

### Backend

* Django 4.2.7
* Django REST Framework
* PostgreSQL (Production)
* SQLite (Development)
* JWT Authentication
* REST API

### Frontend (In Progress)

* React (Vite)
* Tailwind CSS
* Axios
* Monaco Editor

---

## ✨ Core Features

### 🔐 Authentication

Endpoints:

```
POST /api/auth/register/
POST /api/auth/login/
POST /api/auth/logout/
GET  /api/auth/me/
POST /api/auth/token/refresh/
```

Features:

* Register Number login
* JWT authentication
* Secure password hashing
* Admin role support

---

### 🧩 Challenges

Endpoints:

```
GET    /api/challenges/
GET    /api/challenges/{id}/
POST   /api/challenges/
PUT    /api/challenges/{id}/
DELETE /api/challenges/{id}/
```

Features:

* HTML/CSS challenges
* Boilerplate support
* Points system
* Admin control

---

### 📤 Submissions

Endpoints:

```
POST /api/submissions/
GET  /api/submissions/
GET  /api/submissions/{id}/
```

Features:

* Code sanitization
* XSS protection
* Code length tracking

---

### 🏆 Leaderboard

Endpoint:

```
GET /api/leaderboard/
```

Displays:

* Rank
* Register Number
* Name
* Total Points
* Solved Count

---

### 🛠 Admin Panel

Access:

```
/admin/
```

Admin can:

* Create challenges
* Manage users
* Monitor submissions

---

## 🔒 Security

* JWT Authentication
* Sanitized submissions
* Script injection protection
* HTTPS ready
* Secure cookies

---

## ⚡ Performance

Designed to support:

* 1000+ concurrent users
* High-traffic events
* Fast leaderboard queries

Production ready with:

* Gunicorn
* PostgreSQL
* Horizontal scaling

---

## 📁 Project Structure

```
Misfits-Battle/

backend/
users/
challenges/
submissions/
leaderboard/

frontend/ (coming soon)
```

---

## ⚙️ Backend Setup

```bash
cd backend

pip install -r requirements.txt

cp .env.example .env

python manage.py migrate

python manage.py createsuperuser

python manage.py runserver
```

Server runs:

```
http://localhost:8000
```

---

## 🧪 Example API Usage

Register:

```bash
POST /api/auth/register/
```

Login:

```bash
POST /api/auth/login/
```

Submit:

```bash
POST /api/submissions/
```

Leaderboard:

```bash
GET /api/leaderboard/
```

---

## 🎨 Frontend (Next Phase)

Planned pages:

* Login
* Register
* Dashboard
* Challenge Editor
* Leaderboard

Features:

* Live preview
* Monaco editor
* Responsive UI

---

## 📈 Scalability

Perfect for:

* College events
* Hackathons
* Coding competitions

---

## 👥 Team

Built by:

# Binary Misfits

Creators of Misfits-Battle ⚔️

---

## 📊 Status

Backend: ✅ Complete
Frontend: ⏳ In Progress

---

## 📄 License

MIT License

---

## ⭐ Misfits-Battle

TESTING WEBSITE!!
