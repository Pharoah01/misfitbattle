from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """Custom user manager for User model with register_number as username."""
    
    def create_user(self, register_number, name, email=None, password=None, **extra_fields):
        if not register_number:
            raise ValueError('The Register Number field must be set')
        if not name:
            raise ValueError('The Name field must be set')
        
        # Email is optional, generate default if not provided
        if email:
            email = self.normalize_email(email)
        else:
            email = f"{register_number}@local.user"
        
        # Regular users should not have staff or superuser access
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        extra_fields.setdefault('is_admin', False)
        
        user = self.model(register_number=register_number, name=name, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, register_number, name, email=None, password=None, **extra_fields):
        # Auto-generate email for superuser if not provided
        if not email:
            email = f"{register_number}@admin.local"
        
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_admin', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(register_number, name, email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom user model for competition participants.
    Uses register_number as username field.
    
    Access Levels:
    - Regular users: Can access API endpoints only (is_staff=False, is_superuser=False)
    - Superusers: Can access Django admin panel (is_staff=True, is_superuser=True)
    """
    username = None
    register_number = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Unique identifier (e.g., student ID)"
    )
    email = models.EmailField(
        blank=True,
        null=True,
        help_text="User's email address (optional for superusers)"
    )
    name = models.CharField(max_length=255)
    is_admin = models.BooleanField(
        default=False,
        help_text="Designates whether the user can manage challenges via API (not Django admin)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'register_number'
    REQUIRED_FIELDS = ['name']
    
    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['register_number']),
            models.Index(fields=['email']),
        ]
    
    def __str__(self):
        return f"{self.register_number} - {self.name}"
    
    def has_admin_access(self):
        """Check if user has admin access to Django admin panel."""
        return self.is_superuser and self.is_staff

