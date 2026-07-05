from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Notification


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_notifications(request):
    """Get user's notifications (latest 30)."""
    notifications = Notification.objects.filter(user=request.user)[:30]
    unread = Notification.objects.filter(user=request.user, is_read=False).count()

    data = [{
        'id': n.id,
        'type': n.notification_type,
        'title': n.title,
        'message': n.message,
        'link': n.link,
        'is_read': n.is_read,
        'created_at': n.created_at.isoformat(),
    } for n in notifications]

    return Response({'notifications': data, 'unread_count': unread})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_read(request):
    """Mark notification(s) as read."""
    notification_id = request.data.get('id')
    if notification_id:
        Notification.objects.filter(id=notification_id, user=request.user).update(is_read=True)
    else:
        # Mark all
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({'ok': True})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_notification(request):
    """Delete a notification."""
    notification_id = request.data.get('id')
    if notification_id:
        Notification.objects.filter(id=notification_id, user=request.user).delete()
    return Response({'ok': True})
