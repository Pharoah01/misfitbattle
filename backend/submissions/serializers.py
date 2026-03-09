from rest_framework import serializers
from .models import Submission
from .sanitizer import sanitize_submission


class SubmissionSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_register_number = serializers.CharField(source='user.register_number', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    challenge_title = serializers.CharField(source='challenge.title', read_only=True)
    rendered_image = serializers.ImageField(read_only=True)
    
    class Meta:
        model = Submission
        fields = [
            'id', 'user', 'user_name', 'user_register_number', 'user_email',
            'challenge', 'challenge_title', 'html_code', 'css_code',
            'code_length', 'rendered_image', 'similarity_score', 
            'status', 'error_message', 'submitted_at'
        ]
        read_only_fields = [
            'id', 'user', 'code_length', 'rendered_image', 
            'similarity_score', 'status', 'error_message', 'submitted_at'
        ]


class SubmissionCreateSerializer(serializers.ModelSerializer):
    html_code = serializers.CharField(max_length=10000)
    css_code = serializers.CharField(max_length=10000)
    
    class Meta:
        model = Submission
        fields = ['id', 'challenge', 'html_code', 'css_code', 'code_length', 'submitted_at']
        read_only_fields = ['id', 'code_length', 'submitted_at']
    
    def validate(self, data):
        total_length = len(data['html_code']) + len(data['css_code'])
        if total_length > 10000:
            raise serializers.ValidationError(
                "Total code length exceeds 10000 characters"
            )
        return data
    
    def create(self, validated_data):
        # Sanitize before saving
        html_code, css_code = sanitize_submission(
            validated_data['html_code'],
            validated_data['css_code']
        )
        
        validated_data['html_code'] = html_code
        validated_data['css_code'] = css_code
        validated_data['user'] = self.context['request'].user
        
        return super().create(validated_data)
