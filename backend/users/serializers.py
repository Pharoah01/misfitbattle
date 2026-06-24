from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserRegistrationSerializer(serializers.Serializer):
    """
    Registration serializer — only requires HTPID and password.
    Name, email, and college are fetched from the HTP API automatically.
    """
    htp_id = serializers.CharField(
        max_length=50,
        help_text="Hack The Planet ID (e.g., HTP-2026-X7K2)"
    )
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        max_length=128,
        style={'input_type': 'password'}
    )
    
    def validate_htp_id(self, value):
        value = value.strip().upper()
        if not value:
            raise serializers.ValidationError("HTPID is required")
        if User.objects.filter(register_number=value).exists():
            raise serializers.ValidationError(
                "An account with this HTPID already exists. Please sign in instead."
            )
        return value


class UserSerializer(serializers.ModelSerializer):
    htp_id = serializers.CharField(source='register_number', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'htp_id', 'register_number', 'name', 'email', 'college_name', 
                  'department', 'profile_completed', 'is_admin', 'created_at']
        read_only_fields = ['id', 'is_admin', 'created_at', 'profile_completed']


class LoginSerializer(serializers.Serializer):
    """Serializer for login endpoint — uses HTPID instead of register number."""
    htp_id = serializers.CharField(
        required=True,
        help_text="Hack The Planet ID (e.g., HTP-2026-X7K2)"
    )
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
