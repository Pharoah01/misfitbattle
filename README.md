# Misfits-Battle 🎨

A CSSBattle-style coding competition platform built for college events and hackathons. Test your HTML/CSS skills, solve visual challenges, and compete with others!

![Postgress](https://img.shields.io/badge/postgresql-6B2DFF?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Django](https://img.shields.io/badge/Django-4.2-092E20?style=for-the-badge&logo=django)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)

---

## 🚀 Quick Start

<!-- ### For Deployment
👉 **[Start Here: Deployment Quick Start](docs/deployment/DEPLOYMENT_QUICK_START.md)** -->

### For Development
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

---

## ✨ Features

### 🎨 User Experience
- **Purple Cyber-Tech Theme** - Modern, energetic design for coding competitions
- **CSSBattle-Style Interface** - Full viewport coding environment
- **Live Preview** - Real-time code rendering with 300ms debounce
- **Monaco Editor** - Professional code editor with syntax highlighting
- **16:9 Canvas** - Proper aspect ratio for challenge comparison
- **Scale to Fit** - Dynamic canvas scaling for large monitors
- **Auto-Save** - Code automatically saved to localStorage

### 🔐 Authentication & Profiles
- **Token-Based Auth** - Secure DRF token authentication
- **Profile Completion** - Required profile setup for new users
- **College Selection** - Dropdown with Chennai colleges
- **Profile Management** - View and edit user profiles

### 🎯 Challenge System
- **Slug-Based Routing** - Clean URLs (`/play/the-center-square`)
- **Challenge Cards** - Visual preview with points and palette
- **Color Palette** - Click-to-copy hex colors
- **Target Image** - Side-by-side comparison with output
- **Search & Filter** - Find challenges by name or difficulty

### 🚀 Submission System
- **Single Submission** - One submission per user per challenge
- **Async Processing** - Celery-powered background processing
- **HTML/CSS Rendering** - Playwright-based rendering engine
- **Heatmap Comparison** - Visual similarity scoring (optional)
- **Error Handling** - Graceful error messages and status updates

### 🛡️ Security
- **DOMPurify Sanitization** - XSS protection for user code
- **Sandboxed Iframe** - Isolated code execution
- **CORS Protection** - Restricted API access
- **HTTPS Everywhere** - SSL/TLS encryption
- **Security Headers** - CSP, X-Frame-Options, etc.

---

## 🛠️ Technology Stack

### Frontend
- **React 18** + **TypeScript** - Modern UI framework
- **Vite** - Lightning-fast build tool
- **TailwindCSS** - Utility-first styling
- **React Query** - Server state management
- **Monaco Editor** - VS Code-powered editor
- **React Router** - Client-side routing
- **Axios** - HTTP client with interceptors

### Backend
- **Django 4.2** - Python web framework
- **Django REST Framework** - API framework
- **PostgreSQL** / **SQLite** - Database
- **Redis** - Task queue and caching
- **Celery** - Async task processing
- **Gunicorn** - WSGI HTTP server
- **Nginx** - Reverse proxy
- **Playwright** - Browser automation for rendering

### Deployment
- **Frontend**: Netlify (CDN, HTTPS, Auto-deploy)
- **Backend**: AWS EC2 (Ubuntu 22.04)
- **SSL**: Let's Encrypt (Free certificates)
<!-- - **Cost**: $0-17/month total -->

---

## 📁 Project Structure

```
misfits-battle/
├── backend/                 # Django backend
│   ├── backend/            # Project settings
│   ├── challenges/         # Challenge management
│   ├── submissions/        # Submission processing
│   ├── users/              # User authentication
│   └── requirements.txt    # Python dependencies
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page components
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   ├── package.json       # Node dependencies
│   └── vite.config.ts     # Vite configuration
│
├── docs/                   # Documentation
│   ├── deployment/        # Deployment guides
│   ├── development/       # Dev specifications
│   ├── project-status/    # Project status
│   └── archive/           # Historical docs
│
├── netlify.toml           # Netlify configuration
└── README.md              # This file
```

---

## 🎯 Getting Started

### Prerequisites
- **Backend**: Python 3.11+, PostgreSQL (optional), Redis
- **Frontend**: Node.js 18+, npm 9+
- **Deployment**: AWS account, Netlify account

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/misfits-battle.git
   cd misfits-battle
   ```

2. **Setup Backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   
   # Configure .env file
   cp .env.example .env
   # Edit .env with your settings
   
   # Run migrations
   python manage.py migrate
   
   # Create superuser
   python manage.py createsuperuser
   
   # Start server
   python manage.py runserver
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   
   # Configure environment
   cp .env.example .env.development
   # Edit .env.development with backend URL
   
   # Start dev server
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000/api/
   - Admin Panel: http://localhost:8000/admin/

<!-- ### Production Deployment

Follow the comprehensive deployment guides:

1. **[Deployment Quick Start](docs/deployment/DEPLOYMENT_QUICK_START.md)** - Overview
2. **[AWS EC2 Deployment](docs/deployment/AWS_EC2_DEPLOYMENT.md)** - Backend setup
3. **[Netlify Deployment](frontend/NETLIFY_DEPLOYMENT.md)** - Frontend setup
4. **[Deployment Checklist](docs/deployment/DEPLOYMENT_CHECKLIST.md)** - Verification -->

---

## 🧪 Testing

```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests (if configured)
cd frontend
npm run test
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## � License

This project is built for educational purposes and college events.

---

## 👥 Team

**Binary Misfits**
- Built for css coding competitions
- Inspired by CSSBattle
- Designed for student developers

---

<!-- ## 🆘 Support

- **Documentation**: Check the [`docs/`](docs/) folder
- **Deployment Issues**: See [troubleshooting guides](docs/deployment/DEPLOYMENT_QUICK_START.md#troubleshooting)
- **Development Questions**: Review [development docs](docs/development/)

--- -->

## 🎉 Acknowledgments

- Inspired by [CSSBattle](https://cssbattle.dev/)
- Built with modern web technologies
- Designed for the developer community

---

**Made with 💜 by Binary Misfits**

<!-- *For college events, hackathons, and coding competitions* -->
