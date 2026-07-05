"""
Image Similarity Comparison — Direct pixel comparison using Pillow.
No external service needed.

Compares rendered submission PNG against ground truth image
and returns a similarity score (0.0 to 1.0).
"""

from PIL import Image
import numpy as np
from pathlib import Path


class HeatmapAPIError(Exception):
    """Raised when comparison fails."""
    pass


class HeatmapTimeoutError(HeatmapAPIError):
    """Kept for backwards compatibility."""
    pass


class HeatmapComparisonClient:
    """
    Direct pixel-level image comparison.
    Compares two images and returns similarity score.
    """

    def __init__(self, base_url=None):
        # base_url kept for interface compatibility, not used
        pass

    def compare_submission(
        self,
        challenge_name: str,
        user_name: str,
        image_path: str,
        ground_truth_path: str
    ) -> float:
        """
        Compare rendered submission against ground truth using pixel diff.

        Args:
            challenge_name: Name of the challenge (unused, for logging)
            user_name: Name of the user (unused, for logging)
            image_path: Absolute path to rendered submission PNG
            ground_truth_path: Absolute path to ground truth PNG

        Returns:
            float: Similarity score between 0.0 and 1.0
        """
        if not Path(image_path).exists():
            raise HeatmapAPIError(f"Submission image not found: {image_path}")
        if not Path(ground_truth_path).exists():
            raise HeatmapAPIError(f"Ground truth not found: {ground_truth_path}")

        try:
            # Load both images
            submission_img = Image.open(image_path).convert('RGB')
            ground_truth_img = Image.open(ground_truth_path).convert('RGB')

            # Resize submission to match ground truth dimensions
            gt_size = ground_truth_img.size
            if submission_img.size != gt_size:
                submission_img = submission_img.resize(gt_size, Image.LANCZOS)

            # Convert to numpy arrays
            sub_arr = np.array(submission_img, dtype=np.float32)
            gt_arr = np.array(ground_truth_img, dtype=np.float32)

            # Calculate pixel-level difference
            # Normalized absolute difference per channel, averaged
            diff = np.abs(sub_arr - gt_arr) / 255.0
            mean_diff = np.mean(diff)

            # Similarity = 1 - mean_difference
            similarity = 1.0 - mean_diff

            # Clamp to [0, 1]
            similarity = max(0.0, min(1.0, float(similarity)))

            # Generate diff image
            diff_image_path = self._generate_diff_image(
                sub_arr, gt_arr, image_path, ground_truth_path
            )

            return round(similarity, 4), diff_image_path

        except Exception as e:
            raise HeatmapAPIError(f"Image comparison failed: {str(e)}")

    def _generate_diff_image(self, sub_arr, gt_arr, image_path, ground_truth_path):
        """Generate a visual diff image highlighting mismatched pixels."""
        from pathlib import Path
        
        # Calculate per-pixel difference
        diff = np.abs(sub_arr - gt_arr).astype(np.uint8)
        
        # Create highlighted diff: red where different, transparent where same
        threshold = 10  # Pixels with diff > threshold are considered different
        mask = np.any(diff > threshold, axis=2)
        
        # Create diff overlay image (red for differences)
        diff_visual = np.zeros_like(sub_arr, dtype=np.uint8)
        diff_visual[mask] = [255, 0, 0]  # Red for different pixels
        diff_visual[~mask] = (sub_arr[~mask] * 0.3).astype(np.uint8)  # Dim matching pixels
        
        diff_img = Image.fromarray(diff_visual)
        
        # Save diff image
        src_path = Path(image_path)
        diff_path = src_path.parent / f"diff_{src_path.name}"
        diff_img.save(str(diff_path))
        
        return str(diff_path)
