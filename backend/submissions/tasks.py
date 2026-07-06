"""
Celery tasks for submission processing.
"""
import asyncio
import logging
from pathlib import Path
from celery import shared_task
from django.conf import settings
from .models import Submission
from .services.renderer import HTMLRenderer, RenderTimeoutError, RenderSizeError, RenderError
from .services.heatmap_client import HeatmapComparisonClient, HeatmapAPIError, HeatmapTimeoutError

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def process_submission_task(self, submission_id: int):
    """
    Background task to render submission and calculate similarity score.
    
    Retry policy:
        - Max 3 attempts with exponential backoff (5s, 15s, 30s)
        - Only retries on transient errors (rendering, I/O, connection)
        - Does NOT retry on validation errors (missing data, permissions)
    
    Updates submission record with:
        - rendered_image path
        - similarity_score
        - status (queued/rendering/scoring/completed/failed)
        - error_message (if failed)
    """
    BACKOFF = [5, 15, 30]

    try:
        submission = Submission.objects.select_related('user', 'challenge').get(id=submission_id)
        
        submission.status = 'rendering'
        submission.save(update_fields=['status'])
        
        logger.info(
            f"Processing submission {submission_id} for user {submission.user.htp_id} "
            f"on challenge {submission.challenge.title}"
        )
        
        renderer = HTMLRenderer()
        
        try:
            image_path = asyncio.run(
                renderer.render_submission(
                    html_code=submission.html_code,
                    css_code=submission.css_code,
                    challenge_name=submission.challenge.title,
                    user_email=submission.user.email
                )
            )
            
            submission.rendered_image = image_path
            submission.save(update_fields=['rendered_image'])
            
            logger.info(f"Rendered submission {submission_id} to {image_path}")
        
        except RenderTimeoutError as e:
            raise Exception(f"Rendering timeout: {str(e)}")
        except RenderSizeError as e:
            raise Exception(f"Rendered image too large: {str(e)}")
        except RenderError as e:
            raise Exception(f"Rendering failed: {str(e)}")
        
        # Use ground_truth_image, fallback to preview_image
        ground_truth = submission.challenge.ground_truth_image or submission.challenge.preview_image
        
        if ground_truth:
            submission.status = 'scoring'
            submission.save(update_fields=['status'])
            
            heatmap_client = HeatmapComparisonClient()
            
            try:
                submission_image_path = str(Path(settings.MEDIA_ROOT) / image_path)
                ground_truth_path = str(Path(settings.MEDIA_ROOT) / ground_truth.name)
                
                result = heatmap_client.compare_submission(
                    challenge_name=submission.challenge.title,
                    user_name=submission.user.name,
                    image_path=submission_image_path,
                    ground_truth_path=ground_truth_path
                )
                
                # Result is (similarity_score, diff_image_path)
                if isinstance(result, tuple):
                    similarity_score, diff_path = result
                else:
                    similarity_score = result
                    diff_path = None
                
                submission.similarity_score = similarity_score
                submission.save(update_fields=['similarity_score'])
                
                logger.info(f"Calculated similarity score {similarity_score} for submission {submission_id}")
            
            except (HeatmapAPIError, HeatmapTimeoutError) as e:
                logger.warning(
                    f"Heatmap comparison failed for submission {submission_id}: {str(e)}. "
                    f"Submission will be marked complete without similarity score."
                )
                submission.similarity_score = None
                submission.save(update_fields=['similarity_score'])
        else:
            logger.info(f"No ground truth or preview image for challenge {submission.challenge.id}, skipping comparison")
            submission.similarity_score = None
            submission.save(update_fields=['similarity_score'])
        
        submission.status = 'completed'
        submission.error_message = None
        submission.save(update_fields=['status', 'error_message'])
        
        logger.info(f"Successfully processed submission {submission_id}")
        
        return {
            'submission_id': submission_id,
            'status': 'completed',
            'similarity_score': float(submission.similarity_score) if submission.similarity_score else None,
            'rendered_image': submission.rendered_image.url if submission.rendered_image else None
        }
    
    except Submission.DoesNotExist:
        logger.error(f"Submission {submission_id} not found")
        # Don't retry — permanent error
        raise
    
    except Exception as e:
        attempt = self.request.retries + 1
        logger.error(f"Error processing submission {submission_id} (attempt {attempt}/3): {str(e)}")
        
        # Determine if this is a retryable error
        non_retryable = ['not found', 'DoesNotExist', 'permission', 'Competition ended', 'COMPETITION']
        is_permanent = any(keyword.lower() in str(e).lower() for keyword in non_retryable)
        
        try:
            submission = Submission.objects.get(id=submission_id)
            
            if is_permanent or attempt >= 3:
                submission.status = 'failed'
                submission.error_message = f"[Attempt {attempt}/3] {str(e)}"
                submission.save(update_fields=['status', 'error_message'])
                logger.error(f"Submission {submission_id} permanently failed after {attempt} attempt(s)")
            else:
                # Mark as retrying
                submission.status = 'queued'
                submission.error_message = f"Retrying (attempt {attempt + 1}/3): {str(e)}"
                submission.save(update_fields=['status', 'error_message'])
        except Submission.DoesNotExist:
            pass
        
        if is_permanent:
            return  # Don't retry permanent errors
        
        # Retry with exponential backoff
        try:
            delay = BACKOFF[min(self.request.retries, len(BACKOFF) - 1)]
            raise self.retry(exc=e, countdown=delay)
        except self.MaxRetriesExceededError:
            logger.error(f"Max retries exceeded for submission {submission_id}")
            try:
                sub = Submission.objects.get(id=submission_id)
                sub.status = 'failed'
                sub.error_message = f"Failed after 3 attempts: {str(e)}"
                sub.save(update_fields=['status', 'error_message'])
            except Submission.DoesNotExist:
                pass
