"""
Django settings for backend project.
"""

from pathlib import Path
import os
from datetime import timedelta
from dotenv import load_dotenv
import dj_database_url
BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv()

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-bwl@=(!=e5)5oe1yf12o#=c3c@7ur8%htv&r8tptz&13u8h=sf')

DEBUG = os.getenv('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,192.168.137.171,testserver,*').split(',')


INSTALLED_APPS = [
    'jazzmin',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'django_filters',
    'corsheaders',
    'security',  # API security middleware
    'users',
    'challenges',
    'submissions',
    'teams',
]

MIDDLEWARE = [
    'backend.admin_access_middleware.AdminAccessMiddleware',  # Admin access fix - must be first
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'backend.bot_protection_middleware.BotProtectionMiddleware',  # Bot protection
    'security.middleware.APISecurityMiddleware',  # API security protection
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'backend.csrf_middleware.DisableCSRFMiddleware',  # Custom CSRF middleware for API endpoints
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'users.session_middleware.IPTrackingMiddleware',  # IP tracking
    'users.session_middleware.SessionSecurityMiddleware',  # Session validation
    'users.middleware.ProfileCompletionMiddleware',  # Profile completion enforcement
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'



USE_POSTGRES = os.getenv('USE_POSTGRES', 'False') == 'True'

if USE_POSTGRES:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME', 'cssbattle'),
            'USER': os.getenv('DB_USER', 'postgres'),
            'PASSWORD': os.getenv('DB_PASSWORD', 'postgres'),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '5432'),
            'CONN_MAX_AGE': 600,
            'OPTIONS': {
                'connect_timeout': 10,
            }
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }



AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]



LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Asia/Kolkata'

USE_I18N = True

USE_TZ = True



STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

AUTH_USER_MODEL = 'users.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ] + (['rest_framework.authentication.SessionAuthentication'] if DEBUG else []),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',  # Allow read for all, write for authenticated
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ] + (['rest_framework.renderers.BrowsableAPIRenderer'] if DEBUG else []),  # Browsable API only in development
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',  # Anonymous users: 100 requests per hour
        'user': '1000/hour',  # Authenticated users: 1000 requests per hour
        'submissions': '80/hour',  # Submissions: 30 per hour per user
        'auth': '20/hour',  # Auth endpoints: 10 per hour per IP
        'login': '4/minute',  # Login endpoint: 4 attempts per minute per IP
    }
}

CORS_ALLOWED_ORIGINS = [
    os.getenv('FRONTEND_URL', 'http://localhost:5173'),
]

if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOW_ALL_ORIGINS = False

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    os.getenv('FRONTEND_URL', 'http://localhost:5173'),
    'https://api.binarymisfits.info', 
    'https://binarymisfits.info',
]

CSRF_COOKIE_HTTPONLY = False
CSRF_USE_SESSIONS = False
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = False if DEBUG else True

if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}


# =============================================================================
# HACK THE PLANET (HTP) INTEGRATION
# =============================================================================
# API key for verifying HTPIDs against the HTP platform.
# Generate with: openssl rand -hex 32
# Set in .env as EXTERNAL_API_KEY=<value>
HTP_EXTERNAL_API_KEY = os.getenv('EXTERNAL_API_KEY', '')

HEATMAP_API_URL = os.getenv('HEATMAP_API_URL', 'http://localhost:5000')
HEATMAP_API_TIMEOUT = 30  # seconds

RENDERING_TIMEOUT = 10  # seconds
MAX_RENDERED_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB

USE_CELERY = os.getenv('USE_CELERY', 'False' if DEBUG else 'True') == 'True'
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TIMEZONE = 'UTC'
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes

SESSION_TIMEOUT_MINUTES = int(os.getenv('SESSION_TIMEOUT_MINUTES', '30'))
ENABLE_SUSPICIOUS_LOGIN_DETECTION = os.getenv('ENABLE_SUSPICIOUS_LOGIN_DETECTION', 'True') == 'True'
ENABLE_IP_MONITORING = os.getenv('ENABLE_IP_MONITORING', 'True') == 'True'

PRIVACY_NOTICE = """
We log IP addresses for security and contest integrity purposes.
This helps us detect suspicious activities and ensure fair competition.
"""

GEOIP_PATH = BASE_DIR / "geoip2"

SECURITY_ADMIN_EMAIL = os.getenv(
    "SECURITY_ADMIN_EMAIL",
    "elavarasanjaswanth@gmail.com"
)

SECURITY_FROM_EMAIL = os.getenv(
    "SECURITY_FROM_EMAIL",
    "team.binarymisfits@gmail.com"
)

SITE_URL = os.getenv(
    "SITE_URL",
    "https://api.binarymisfits.info"
)

SECURITY_ALERT_THRESHOLD = int(
    os.getenv("SECURITY_ALERT_THRESHOLD", "3")
)

SECURITY_AUTO_BLOCK_THRESHOLD = int(
    os.getenv("SECURITY_AUTO_BLOCK_THRESHOLD", "5")
)

SECURITY_BLOCK_DURATION_HOURS = int(
    os.getenv("SECURITY_BLOCK_DURATION_HOURS", "24")
)

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"

EMAIL_HOST = os.getenv(
    "EMAIL_HOST",
    "smtp.gmail.com"
)

EMAIL_PORT = int(
    os.getenv("EMAIL_PORT", "587")
)

EMAIL_USE_TLS = os.getenv(
    "EMAIL_USE_TLS",
    "True"
) == "True"

EMAIL_HOST_USER = os.getenv(
    "EMAIL_HOST_USER",
    "team.binarymisfits@gmail.com"
)

EMAIL_HOST_PASSWORD = os.getenv(
    "EMAIL_HOST_PASSWORD",
    ""
)

DEFAULT_FROM_EMAIL = os.getenv(
    "DEFAULT_FROM_EMAIL",
    "team.binarymisfits@gmail.com"
)

WHATSAPP_ALERTS_ENABLED = os.getenv('WHATSAPP_ALERTS_ENABLED', 'False') == 'True'
WHATSAPP_API_PROVIDER = os.getenv('WHATSAPP_API_PROVIDER', 'twilio')
WHATSAPP_ADMIN_NUMBERS = [
    num.strip() for num in os.getenv('WHATSAPP_ADMIN_NUMBERS', '').split(',') 
    if num.strip()
]
WHATSAPP_ALERT_THRESHOLD = int(os.getenv('WHATSAPP_ALERT_THRESHOLD', '3'))

TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')
TWILIO_WHATSAPP_NUMBER = os.getenv('TWILIO_WHATSAPP_NUMBER', '')

WHATSAPP_ACCESS_TOKEN = os.getenv('WHATSAPP_ACCESS_TOKEN', '')
WHATSAPP_PHONE_NUMBER_ID = os.getenv('WHATSAPP_PHONE_NUMBER_ID', '')

ULTRAMSG_TOKEN = os.getenv('ULTRAMSG_TOKEN', '')
ULTRAMSG_INSTANCE_ID = os.getenv('ULTRAMSG_INSTANCE_ID', '')