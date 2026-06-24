from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """Custom user manager for User model with htp_id as username."""
    
    def create_user(self, htp_id, name, email=None, password=None, **extra_fields):
        if not htp_id:
            raise ValueError('The HTPID field must be set')
        if not name:
            raise ValueError('The Name field must be set')
        
        if email:
            email = self.normalize_email(email)
        else:
            email = f"{htp_id}@local.user"
        
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        extra_fields.setdefault('is_admin', False)
        
        user = self.model(htp_id=htp_id, name=name, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, htp_id, name, email=None, password=None, **extra_fields):
        if not email:
            email = f"{htp_id}@admin.local"
        
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_admin', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(htp_id, name, email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom user model for competition participants.
    Uses htp_id (Hack The Planet ID) as the unique identifier.
    
    Access Levels:
    - Regular users: Can access API endpoints only (is_staff=False, is_superuser=False)
    - Superusers: Can access Django admin panel (is_staff=True, is_superuser=True)
    """
    username = None
    htp_id = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="HTPID from Hack The Planet (e.g., HTP-2026-X7K2)"
    )
    email = models.EmailField(
        blank=True,
        null=True,
        help_text="User's email address (fetched from HTP)"
    )
    name = models.CharField(max_length=255)
    college_name = models.CharField(
        max_length=255,
        blank=True,
        help_text="User's college or institution (fetched from HTP)"
    )
    department = models.CharField(
        max_length=255,
        blank=True,
        help_text="User's department (fetched from HTP)"
    )
    profile_completed = models.BooleanField(
        default=False,
        help_text="Whether user has completed profile information"
    )
    is_admin = models.BooleanField(
        default=False,
        help_text="Designates whether the user can manage challenges via API (not Django admin)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'htp_id'
    REQUIRED_FIELDS = ['name']
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        db_table = 'users'
        indexes = [
            models.Index(fields=['htp_id']),
            models.Index(fields=['email']),
        ]
    
    def __str__(self):
        return f"{self.htp_id} - {self.name}"
    
    def has_admin_access(self):
        """Check if user has admin access to Django admin panel."""
        return self.is_superuser and self.is_staff
