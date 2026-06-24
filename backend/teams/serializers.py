from rest_framework import serializers
from .models import Team


class TeamSerializer(serializers.ModelSerializer):
    leader_name = serializers.CharField(source='leader.name', read_only=True)
    leader_htp_id = serializers.CharField(source='leader.htp_id', read_only=True)
    member_name = serializers.CharField(source='member.name', read_only=True, default=None)
    member_htp_id = serializers.CharField(source='member.htp_id', read_only=True, default=None)

    class Meta:
        model = Team
        fields = [
            'id', 'name', 'invite_code', 'is_full',
            'leader_name', 'leader_htp_id',
            'member_name', 'member_htp_id',
            'created_at'
        ]
        read_only_fields = ['id', 'invite_code', 'is_full', 'created_at']


class CreateTeamSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)

    def validate_name(self, value):
        value = value.strip()
        if len(value) < 3:
            raise serializers.ValidationError("Team name must be at least 3 characters")
        if Team.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError("A team with this name already exists")
        return value


class JoinTeamSerializer(serializers.Serializer):
    invite_code = serializers.CharField(max_length=6)

    def validate_invite_code(self, value):
        return value.strip().upper()
