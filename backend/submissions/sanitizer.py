import bleach
import re

ALLOWED_TAGS = [
    'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th',
    'section', 'article', 'header', 'footer', 'nav', 'main'
]

ALLOWED_ATTRIBUTES = {
    '*': ['class', 'id', 'style'],
    'a': ['href', 'title'],
    'img': ['src', 'alt', 'width', 'height']
}


def sanitize_html(html_code):
    """
    Remove malicious code from HTML while preserving structure.
    
    Removes:
    - <script> tags
    - Event handlers (onclick, onload, etc.)
    - javascript: URLs
    - Dangerous attributes
    """
    cleaned = bleach.clean(
        html_code,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        strip=True
    )
    
    # Additional filtering for event handlers
    cleaned = remove_event_handlers(cleaned)
    
    return cleaned


def remove_event_handlers(html_code):
    """
    Remove all on* event handler attributes.
    """
    # Remove on* attributes
    pattern = r'\s+on\w+\s*=\s*["\'][^"\']*["\']'
    cleaned = re.sub(pattern, '', html_code, flags=re.IGNORECASE)
    return cleaned


def sanitize_css(css_code):
    """
    Basic CSS sanitization to remove javascript: URLs.
    """
    # Remove javascript: URLs from CSS
    cleaned = re.sub(
        r'javascript\s*:',
        '',
        css_code,
        flags=re.IGNORECASE
    )
    return cleaned


def sanitize_submission(html_code, css_code):
    """
    Sanitize both HTML and CSS code.
    
    Returns:
        tuple: (sanitized_html, sanitized_css)
    """
    return (
        sanitize_html(html_code),
        sanitize_css(css_code)
    )
