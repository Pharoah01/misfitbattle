import uuid
import string
import random
from django.db import models
from django.conf import settings


def generate_invite_code():
    """Generate a 6-character uppercase alphanumeric invite code."""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=6))


class Team(models.Model):
    """
    Team of 2 for the competition.
    One user creates the team, another joins via invite code.
    """
    name = models.CharField(max_length=100)
    invite_code = models.CharField(
        max_length=6,
        unique=True,
        default=generate_invite_code,
        help_text="6-character code to join this team"
    )
    leader = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='led_teams',
        help_text="User who created the team"
    )
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='joined_teams',
        help_text="Second team member who joined via invite code"
    )
    is_full = models.BooleanField(
        default=False,
        help_text="True when both members have joined"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'teams'
        verbose_name = 'Team'
        verbose_name_plural = 'Teams'
        ordering = ['-created_at']

    def __str__(self):
        leader_name = self.leader.htp_id
        member_name = self.member.htp_id if self.member else 'Waiting...'
        return f"{self.name} ({leader_name} + {member_name})"

    def add_member(self, user):
        """Add second member to the team."""
        self.member = user
        self.is_full = True
        self.save(update_fields=['member', 'is_full'])

    def remove_member(self):
        """Remove the second member."""
        self.member = None
        self.is_full = False
        self.save(update_fields=['member', 'is_full'])

    @property
    def members(self):
        """Return list of team members."""
        result = [self.leader]
        if self.member:
            result.append(self.member)
        return result


class ChallengeClaim(models.Model):
    """Track which team member claimed/is working on a challenge."""
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='claims')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    challenge = models.ForeignKey('challenges.Challenge', on_delete=models.CASCADE)
    claimed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'challenge_claims'
        unique_together = ['team', 'challenge']

    def __str__(self):
        return f"{self.user.htp_id} claimed {self.challenge.title}"


class TeamActivity(models.Model):
    """Timeline of team events."""
    ACTIVITY_TYPES = [
        ('join', 'Member Joined'),
        ('submit', 'Challenge Submitted'),
        ('scored', 'Challenge Scored'),
        ('claim', 'Challenge Claimed'),
        ('release', 'Challenge Released'),
    ]
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='activities')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    description = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'team_activities'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.team.name}: {self.description}"
