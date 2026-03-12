# Misfits-Battle

**A project from HACKBETA Misfits** built with modern web technologies

![PostgreSQL](https://img.shields.io/badge/postgresql-6B2DFF?style=for-the-badge&logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Django](https://img.shields.io/badge/Django-4.2-092E20?style=for-the-badge&logo=django&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

## Features

### Authentication
- Secure user registration and login system
- JWT-based authentication with refresh tokens
- Session management with automatic cleanup
- Protected routes and role-based access control

### Submission System
- Real-time code submission and processing
- Auto-save functionality for work-in-progress
- Single submission limit per challenge
- Submission history and management
- Code rendering and visualization

### Challenge System
- Dynamic challenge loading with difficulty levels
- Color-coded difficulty badges (Easy, Medium, Hard)
- Challenge filtering and search functionality
- Interactive code editor with Monaco integration
- Real-time preview system

### Security
- Advanced API endpoint obfuscation
- SQL injection and path traversal protection
- Rate limiting and attack detection
- Automated security alert system with email notifications
- IP-based blocking and monitoring
- CSRF protection and secure headers
## Technology Stack

### Frontend
- **React 18** with TypeScript for type-safe development
- **Tailwind CSS** for modern, responsive styling
- **React Query** for efficient data fetching and caching
- **React Router** for client-side routing
- **Monaco Editor** for advanced code editing experience
- **Vite** for fast development and optimized builds

### Backend
- **Django 4.2** with Django REST Framework
- **PostgreSQL** for robust data storage
- **Celery** for background task processing
- **Gunicorn** for production WSGI server
- **Nginx** for reverse proxy and static file serving
- **JWT Authentication** for secure API access

## Deployment

### Frontend
- **Netlify** for seamless frontend deployment
- Automatic builds from Git repository
- Custom domain support with SSL certificates
- CDN distribution for optimal performance

### Backend
- **AWS EC2** for scalable backend hosting
- Production-ready configuration with Gunicorn
- SSL certificates for secure HTTPS communication
- Automated deployment scripts and monitoring

## Project Structure

```
misfits-battle/
├── frontend/                    # React TypeScript Frontend
│   ├── src/
│   │   ├── api/                # API client and service functions
│   │   ├── components/         # Reusable React components
│   │   │   ├── auth/          # Authentication components
│   │   │   ├── editor/        # Code editor components
│   │   │   └── security/      # Security-related components
│   │   ├── config/            # Configuration files
│   │   ├── contexts/          # React context providers
│   │   ├── hooks/             # Custom React hooks
│   │   ├── pages/             # Page components
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Utility functions
│   ├── public/                # Static assets
│   └── package.json           # Frontend dependencies
│
├── backend/                     # Django REST API Backend
│   ├── backend/               # Django project settings
│   │   ├── settings.py        # Main configuration
│   │   ├── urls.py           # URL routing
│   │   └── wsgi.py           # WSGI configuration
│   ├── users/                 # User management app
│   │   ├── models.py         # User and session models
│   │   ├── views.py          # Authentication views
│   │   ├── serializers.py    # API serializers
│   │   └── middleware.py     # Session middleware
│   ├── challenges/            # Challenge management app
│   │   ├── models.py         # Challenge models
│   │   ├── views.py          # Challenge API views
│   │   └── admin.py          # Django admin interface
│   ├── submissions/           # Submission processing app
│   │   ├── models.py         # Submission models
│   │   ├── views.py          # Submission API views
│   │   ├── services/         # Background services
│   │   └── tasks.py          # Celery tasks
│   ├── security/              # Security middleware app
│   │   ├── models.py         # Security event models
│   │   ├── middleware.py     # Attack detection
│   │   ├── services.py       # Email alert services
│   │   └── admin.py          # Security admin interface
│   └── requirements.txt       # Backend dependencies
│
└── deployment/                  # Deployment configurations
    ├── netlify.toml            # Netlify deployment config
    ├── gunicorn.conf.py        # Gunicorn server config
    └── nginx.conf              # Nginx reverse proxy config
```

## System Architecture

### High-Level Architecture
```
┌─────────────────┐    HTTPS    ┌──────────────────┐
│   React SPA     │◄──────────►│   Django API     │
│   (Netlify)     │             │   (AWS EC2)      │
└─────────────────┘             └──────────────────┘
         │                               │
         │                               │
         ▼                               ▼
┌─────────────────┐             ┌──────────────────┐
│   CDN/Static    │             │   PostgreSQL     │
│   Assets        │             │   Database       │
└─────────────────┘             └──────────────────┘
                                         │
                                         ▼
                                ┌──────────────────┐
                                │   Celery Tasks   │
                                │   (Background)   │
                                └──────────────────┘
```

### Security Architecture
```
┌─────────────────┐
│   User Request  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  Rate Limiting  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Attack Detection│
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Endpoint Obfus. │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  JWT Auth       │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  API Response   │
└─────────────────┘
```

### Data Flow Architecture

1. **Authentication Flow**
   - User registration/login → JWT token generation → Session management
   - Token refresh mechanism → Automatic session cleanup

2. **Challenge Flow**
   - Challenge loading → Difficulty filtering → Code editor initialization
   - Real-time preview → Auto-save functionality

3. **Submission Flow**
   - Code submission → Background processing → Image rendering
   - Similarity scoring → Result notification

4. **Security Flow**
   - Request monitoring → Attack detection → Email alerts
   - IP blocking → Admin notification → Security logging

## Contributing

We welcome contributions to improve Misfits-Battle. Please follow our coding standards and submit pull requests for review.

## License

This project is licensed under the MIT License.

## Team

**Binary Misfits** - HACKBETA Team

## Support

For support and inquiries, contact: **team.binarymisfits@gmail.com**

## Acknowledgments

**Made with 💜 by Binary Misfits**