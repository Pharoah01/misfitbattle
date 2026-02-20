from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        max_length=128,
        style={'input_type': 'password'}
    )
    email = serializers.EmailField(required=True)
    
    class Meta:
        model = User
        fields = ['id', 'register_number', 'name', 'email', 'password', 'is_admin', 'created_at']
        read_only_fields = ['id', 'is_admin', 'created_at']
    
    def validate_register_number(self, value):
        if not value.isalnum():
            raise serializers.ValidationError(
                "Register number must be alphanumeric"
            )
        return value
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "A user with this email already exists"
            )
        return value
    
    def create(self, validated_data):
        user = User.objects.create_user(
            register_number=validated_data['register_number'],
            name=validated_data['name'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'register_number', 'name', 'email', 'is_admin', 'created_at']
        read_only_fields = ['id', 'is_admin', 'created_at']
