from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import AuditLog


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def audit_logs(request):
    """Admin: Get audit logs with filtering and pagination."""
    if not request.user.is_admin:
        return Response({'error': 'Admin only'}, status=403)

    qs = AuditLog.objects.all()

    # Filters
    event_type = request.GET.get('event_type')
    if event_type:
        qs = qs.filter(event_type=event_type)

    search = request.GET.get('search')
    if search:
        qs = qs.filter(
            Q(description__icontains=search) |
            Q(team_name__icontains=search) |
            Q(challenge_title__icontains=search) |
            Q(ip_address__icontains=search)
        )

    user_id = request.GET.get('user_id')
    if user_id:
        qs = qs.filter(user_id=user_id)

    # Pagination
    page = int(request.GET.get('page', 1))
    per_page = int(request.GET.get('per_page', 50))
    offset = (page - 1) * per_page
    total = qs.count()

    logs = qs[offset:offset + per_page]

    data = []
    for log in logs:
        data.append({
            'id': log.id,
            'timestamp': log.timestamp.isoformat(),
            'event_type': log.event_type,
            'user': log.user.htp_id if log.user else None,
            'user_name': log.user.name if log.user else None,
            'team_name': log.team_name,
            'challenge_title': log.challenge_title,
            'ip_address': log.ip_address,
            'description': log.description,
            'before_value': log.before_value,
            'after_value': log.after_value,
        })

    return Response({
        'logs': data,
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': (total + per_page - 1) // per_page,
    })
