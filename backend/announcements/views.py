from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import Announcement, AnnouncementRead


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_announcements(request):
    """Get all active, non-expired announcements with read status."""
    announcements = Announcement.objects.filter(is_active=True)
    # Filter expired
    active = [a for a in announcements if not a.is_expired]

    read_ids = set(
        AnnouncementRead.objects.filter(user=request.user)
        .values_list('announcement_id', flat=True)
    )

    data = []
    for a in active:
        data.append({
            'id': a.id,
            'title': a.title,
            'message': a.message,
            'type': a.announcement_type,
            'is_pinned': a.is_pinned,
            'is_read': a.id in read_ids,
            'created_by': a.created_by.name if a.created_by else 'System',
            'created_at': a.created_at.isoformat(),
            'expires_at': a.expires_at.isoformat() if a.expires_at else None,
        })

    unread_count = len([d for d in data if not d['is_read']])
    pinned = next((d for d in data if d['is_pinned']), None)

    return Response({
        'announcements': data,
        'unread_count': unread_count,
        'pinned': pinned,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_read(request):
    """Mark an announcement as read."""
    announcement_id = request.data.get('announcement_id')
    if not announcement_id:
        return Response({'error': 'announcement_id required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        announcement = Announcement.objects.get(id=announcement_id, is_active=True)
    except Announcement.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    AnnouncementRead.objects.get_or_create(user=request.user, announcement=announcement)
    return Response({'message': 'Marked as read'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_read(request):
    """Mark all announcements as read."""
    active_ids = Announcement.objects.filter(is_active=True).values_list('id', flat=True)
    existing = set(AnnouncementRead.objects.filter(user=request.user).values_list('announcement_id', flat=True))
    new_reads = [AnnouncementRead(user=request.user, announcement_id=aid) for aid in active_ids if aid not in existing]
    AnnouncementRead.objects.bulk_create(new_reads, ignore_conflicts=True)
    return Response({'message': 'All marked as read'})


# --- Admin Endpoints ---

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_announcement(request):
    """Admin: Create announcement."""
    if not request.user.is_admin:
        return Response({'error': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)

    title = request.data.get('title', '').strip()
    message = request.data.get('message', '').strip()
    ann_type = request.data.get('type', 'info')
    is_pinned = request.data.get('is_pinned', False)
    expires_minutes = request.data.get('expires_minutes')

    if not title or not message:
        return Response({'error': 'Title and message required'}, status=status.HTTP_400_BAD_REQUEST)

    expires_at = None
    if expires_minutes:
        expires_at = timezone.now() + timezone.timedelta(minutes=int(expires_minutes))

    announcement = Announcement.objects.create(
        title=title,
        message=message,
        announcement_type=ann_type,
        is_pinned=is_pinned,
        created_by=request.user,
        expires_at=expires_at,
    )

    return Response({
        'message': 'Announcement created',
        'id': announcement.id,
        'title': announcement.title,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_announcement(request, announcement_id):
    """Admin: Delete (deactivate) announcement."""
    if not request.user.is_admin:
        return Response({'error': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)

    try:
        ann = Announcement.objects.get(id=announcement_id)
        ann.is_active = False
        ann.save(update_fields=['is_active'])
        return Response({'message': 'Announcement deleted'})
    except Announcement.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pin_announcement(request, announcement_id):
    """Admin: Pin/Unpin announcement."""
    if not request.user.is_admin:
        return Response({'error': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)

    try:
        ann = Announcement.objects.get(id=announcement_id, is_active=True)
        ann.is_pinned = not ann.is_pinned
        ann.save()
        return Response({'message': f'{"Pinned" if ann.is_pinned else "Unpinned"}', 'is_pinned': ann.is_pinned})
    except Announcement.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
