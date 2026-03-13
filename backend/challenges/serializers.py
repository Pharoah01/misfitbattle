from rest_framework import serializers
from .models import Challenge


class ChallengeSerializer(serializers.ModelSerializer):
    palette = serializers.SerializerMethodField()
    
    class Meta:
        model = Challenge
        fields = ['id', 'title', 'slug', 'description', 'html_boilerplate', 'css_boilerplate', 
                  'palette', 'preview_image', 'points', 'difficulty', 'created_at']
        read_only_fields = ['id', 'created_at', 'palette']
    
    def get_palette(self, obj):
        if obj.palette:
            return [color.strip() for color in obj.palette.split(',') if color.strip()]
        return []
