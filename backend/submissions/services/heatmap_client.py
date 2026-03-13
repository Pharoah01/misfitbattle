"""
Heatmap Comparison API Client
Communicates with external heatmap comparison service for similarity scoring.
"""
import requests
from django.conf import settings


class HeatmapAPIError(Exception):
    """Raised when heatmap API request fails."""
    pass


class HeatmapTimeoutError(Exception):
    """Raised when heatmap API request times out."""
    pass


class HeatmapComparisonClient:
    """
    Client for external heatmap comparison API.
    
    Sends rendered submission images to external service for comparison
    against ground truth images and receives similarity scores.
    """
    
    def __init__(self, base_url=None):
        """
        Initialize heatmap comparison client.
        
        Args:
            base_url: Base URL of the heatmap comparison API.
                     Defaults to settings.HEATMAP_API_URL
        """
        self.base_url = base_url or getattr(
            settings,
            'HEATMAP_API_URL',
            'http://localhost:5000'
        )
        self.timeout = getattr(settings, 'HEATMAP_API_TIMEOUT', 30)
    
    def compare_submission(
        self,
        challenge_name: str,
        user_name: str,
        image_path: str,
        ground_truth_path: str
    ) -> float:
        """
        Compare rendered submission against ground truth.
        
        Args:
            challenge_name: Name of the challenge
            user_name: Name of the user
            image_path: Path to rendered submission image
            ground_truth_path: Path to ground truth image
        
        Returns:
            float: Similarity score between 0.0 and 1.0
        
        Raises:
            HeatmapAPIError: If API request fails
            HeatmapTimeoutError: If request times out
        """
        endpoint = f"{self.base_url}/compare"
        
        payload = {
            'challenge_name': challenge_name,
            'user_name': user_name,
            'image_path': image_path,
            'ground_truth': ground_truth_path
        }
        
        try:
            response = requests.post(
                endpoint,
                json=payload,
                timeout=self.timeout
            )
            
            response.raise_for_status()
            
            data = response.json()
            similarity_score = data.get('similarity_score')
            
            if similarity_score is None:
                raise HeatmapAPIError("Response missing similarity_score field")
            
            if not (0.0 <= similarity_score <= 1.0):
                raise HeatmapAPIError(
                    f"Invalid similarity score: {similarity_score} (must be between 0.0 and 1.0)"
                )
            
            return float(similarity_score)
        
        except requests.Timeout:
            raise HeatmapTimeoutError(
                f"Heatmap API request timed out after {self.timeout} seconds"
            )
        except requests.RequestException as e:
            raise HeatmapAPIError(f"Heatmap API request failed: {str(e)}")
