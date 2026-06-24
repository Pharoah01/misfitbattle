from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """Custom user manager for User model with register_number (HTPID) as username."""
    
    def create_user(self, register_number, name, email=None, password=None, **extra_fields):
        """
        Create a user. register_number stores the HTPID (e.g., HTP-2026-X7K2).
        """
        if not register_number:
            raise ValueError('The HTPID field must be set')
        if not name:
            raise ValueError('The Name field must be set')
        
        if email:
            email = self.normalize_email(email)
        else:
            email = f"{register_number}@local.user"
        
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        extra_fields.setdefault('is_admin', False)
        
        user = self.model(register_number=register_number, name=name, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, register_number, name, email=None, password=None, **extra_fields):
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
    Uses register_number field to store HTPID (Hack The Planet ID) as the unique identifier.
    
    The register_number field is repurposed to store HTPID (e.g., HTP-2026-X7K2).
    User details (name, email, college, department) are fetched from HTP API on registration.
    
    Access Levels:
    - Regular users: Can access API endpoints only (is_staff=False, is_superuser=False)
    - Superusers: Can access Django admin panel (is_staff=True, is_superuser=True)
    """
    username = None
    register_number = models.CharField(
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
    
    USERNAME_FIELD = 'register_number'
    REQUIRED_FIELDS = ['name']
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        db_table = 'users'
        indexes = [
            models.Index(fields=['register_number']),
            models.Index(fields=['email']),
        ]
    
    def __str__(self):
        return f"{self.register_number} - {self.name}"
    
    @property
    def htpid(self):
        """Alias for register_number — this stores the HTPID."""
        return self.register_number
    
    def has_admin_access(self):
        """Check if user has admin access to Django admin panel."""
        return self.is_superuser and self.is_staff

