"""
Hack The Planet (HTP) External API Service

Validates HTPID against the HTP platform and fetches participant details.
API: https://hacktheplanet.in.net/api/v1/external
"""

import logging
import requests
from django.conf import settings
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)

HTP_API_BASE_URL = "https://hacktheplanet.in.net/api/v1/external"
HTP_VERIFY_ENDPOINT = f"{HTP_API_BASE_URL}/verify"


@dataclass
class HTPParticipant:
    """Data class for HTP participant details."""
    htp_id: str
    name: str
    email: str
    phone: str
    college: str
    department: str
    year_of_study: str
    user_type: str
    city: str
    is_active: bool


class HTPServiceError(Exception):
    """Base exception for HTP service errors."""
    pass


class HTPParticipantNotFound(HTPServiceError):
    """Raised when HTPID is not found or participant is inactive."""
    pass


class HTPAuthenticationError(HTPServiceError):
    """Raised when HTP API key is invalid."""
    pass


class HTPServiceUnavailable(HTPServiceError):
    """Raised when HTP API is unreachable."""
    pass


def get_api_key() -> str:
    """Get the HTP external API key from settings."""
    api_key = getattr(settings, 'HTP_EXTERNAL_API_KEY', None) or ''
    if not api_key:
        raise HTPServiceError("HTP_EXTERNAL_API_KEY is not configured")
    return api_key


def verify_htpid(htpid: str) -> HTPParticipant:
    """
    Verify an HTPID against the Hack The Planet API.
    
    Args:
        htpid: The HTP participant ID (e.g., "HTP-2026-X7K2")
        
    Returns:
        HTPParticipant dataclass with participant details
        
    Raises:
        HTPParticipantNotFound: If participant doesn't exist or is inactive
        HTPAuthenticationError: If API key is invalid
        HTPServiceUnavailable: If HTP API is unreachable
        HTPServiceError: For other unexpected errors
    """
    api_key = get_api_key()
    
    url = f"{HTP_VERIFY_ENDPOINT}/{htpid}"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
    except requests.ConnectionError:
        logger.error(f"HTP API unreachable when verifying {htpid}")
        raise HTPServiceUnavailable("Hack The Planet service is currently unavailable")
    except requests.Timeout:
        logger.error(f"HTP API timeout when verifying {htpid}")
        raise HTPServiceUnavailable("Hack The Planet service timed out")
    except requests.RequestException as e:
        logger.error(f"HTP API request failed for {htpid}: {e}")
        raise HTPServiceError(f"Failed to contact HTP service: {e}")
    
    if response.status_code == 401:
        logger.critical("HTP API key is invalid — check EXTERNAL_API_KEY")
        raise HTPAuthenticationError("HTP service authentication failed")
    
    if response.status_code == 404:
        logger.info(f"HTPID not found or inactive: {htpid}")
        raise HTPParticipantNotFound(
            "Participant not found. Please ensure your HTPID is correct and your HTP profile is complete."
        )
    
    if response.status_code != 200:
        logger.error(f"HTP API unexpected status {response.status_code} for {htpid}")
        raise HTPServiceError(f"HTP service returned unexpected status: {response.status_code}")
    
    try:
        data = response.json()
    except ValueError:
        raise HTPServiceError("Invalid response from HTP service")
    
    if not data.get("success"):
        raise HTPParticipantNotFound("Participant verification failed")
    
    participant_data = data.get("data", {})
    
    return HTPParticipant(
        htp_id=participant_data.get("htpId", htpid),
        name=participant_data.get("name", ""),
        email=participant_data.get("email", ""),
        phone=participant_data.get("phone", ""),
        college=participant_data.get("college", ""),
        department=participant_data.get("department", ""),
        year_of_study=participant_data.get("yearOfStudy", ""),
        user_type=participant_data.get("userType", ""),
        city=participant_data.get("city", ""),
        is_active=participant_data.get("isActive", False),
    )
