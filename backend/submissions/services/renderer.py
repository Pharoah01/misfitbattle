"""
HTML/CSS Rendering Service
Renders user submissions to PNG images using Playwright.
"""
import os
import re
import asyncio
from pathlib import Path
from django.conf import settings
from playwright.async_api import async_playwright
import bleach


class RenderTimeoutError(Exception):
    """Raised when rendering exceeds timeout limit."""
    pass


class RenderSizeError(Exception):
    """Raised when rendered image exceeds size limit."""
    pass


class RenderError(Exception):
    """Raised for general rendering failures."""
    pass


class HTMLRenderer:
    """
    Renders HTML/CSS submissions to PNG images using Playwright.
    
    Features:
    - Sandboxed browser context with JavaScript disabled
    - 10-second timeout for rendering
    - 5MB maximum image size
    - HTML sanitization before rendering
    """
    
    def __init__(self):
        self.timeout_ms = 10000  # 10 seconds
        self.max_image_size_bytes = 5 * 1024 * 1024  # 5MB
        self.viewport_width = 400
        self.viewport_height = 300
    
    async def render_submission(
        self,
        html_code: str,
        css_code: str,
        challenge_name: str,
        user_email: str
    ) -> str:
        """
        Renders HTML/CSS to PNG image.
        
        Args:
            html_code: User's HTML code
            css_code: User's CSS code
            challenge_name: Name of the challenge
            user_email: Email of the user
        
        Returns:
            str: File path to saved image (relative to MEDIA_ROOT)
        
        Raises:
            RenderTimeoutError: If rendering exceeds timeout
            RenderSizeError: If image exceeds size limit
            RenderError: For other rendering failures
        """
        try:
            filename = self._generate_filename(challenge_name, user_email)
            
            output_dir = Path(settings.MEDIA_ROOT) / 'submission_renders'
            output_dir.mkdir(parents=True, exist_ok=True)
            
            output_path = output_dir / filename
            
            html_document = self._sanitize_html(html_code, css_code)
            
            async with async_playwright() as p:
                browser = await p.chromium.launch(
                    executable_path='/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome'
                )
                
                try:
                    context = await browser.new_context(
                        viewport={'width': self.viewport_width, 'height': self.viewport_height},
                        java_script_enabled=False,  # Disable JavaScript for security
                    )
                    
                    page = await context.new_page()
                    
                    await asyncio.wait_for(
                        page.set_content(html_document),
                        timeout=self.timeout_ms / 1000
                    )
                    
                    await asyncio.wait_for(
                        page.screenshot(path=str(output_path), full_page=False),
                        timeout=self.timeout_ms / 1000
                    )
                    
                    await context.close()
                
                finally:
                    await browser.close()
            
            image_size = output_path.stat().st_size
            if image_size > self.max_image_size_bytes:
                output_path.unlink()  # Delete oversized image
                raise RenderSizeError(
                    f"Rendered image exceeds size limit ({image_size} > {self.max_image_size_bytes} bytes)"
                )
            
            return f'submission_renders/{filename}'
        
        except asyncio.TimeoutError:
            raise RenderTimeoutError("Rendering timeout exceeded")
        except (RenderTimeoutError, RenderSizeError):
            raise
        except Exception as e:
            raise RenderError(f"Rendering failed: {str(e)}")
    
    def _sanitize_html(self, html: str, css: str) -> str:
        """
        Sanitize and combine HTML/CSS into single document.
        
        Args:
            html: User's HTML code
            css: User's CSS code
        
        Returns:
            str: Complete HTML document with sanitized content
        """
        allowed_tags = [
            'div', 'span', 'p', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody',
            'section', 'article', 'header', 'footer', 'nav', 'aside',
            'strong', 'em', 'b', 'i', 'u', 'br', 'hr'
        ]
        
        allowed_attributes = {
            '*': ['class', 'id', 'style'],
            'a': ['href', 'title'],
            'img': ['src', 'alt', 'width', 'height'],
        }
        
        sanitized_html = bleach.clean(
            html,
            tags=allowed_tags,
            attributes=allowed_attributes,
            strip=True
        )
        
        sanitized_css = re.sub(r'@import\s+', '', css)
        sanitized_css = re.sub(r'url\s*\(\s*["\']?javascript:', 'url(', sanitized_css)
        
        html_document = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            width: {self.viewport_width}px;
            height: {self.viewport_height}px;
            overflow: hidden;
        }}
        {sanitized_css}
    </style>
</head>
<body>
    {sanitized_html}
</body>
</html>
"""
        return html_document
    
    def _generate_filename(self, challenge_name: str, user_email: str) -> str:
        """
        Generate sanitized filename from challenge name and user email.
        
        Format: {challenge-name}-{user-email}.png
        - Convert to lowercase
        - Replace spaces with hyphens
        - Remove special characters
        
        Args:
            challenge_name: Name of the challenge
            user_email: Email of the user
        
        Returns:
            str: Sanitized filename
        """
        challenge_slug = challenge_name.lower()
        email_slug = user_email.lower()
        
        challenge_slug = challenge_slug.replace(' ', '-')
        
        challenge_slug = re.sub(r'[^a-z0-9-]', '', challenge_slug)
        
        email_slug = email_slug.replace('@', '-at-').replace('.', '-')
        email_slug = re.sub(r'[^a-z0-9-]', '', email_slug)
        
        challenge_slug = re.sub(r'-+', '-', challenge_slug)
        email_slug = re.sub(r'-+', '-', email_slug)
        
        challenge_slug = challenge_slug.strip('-')
        email_slug = email_slug.strip('-')
        
        return f"{challenge_slug}-{email_slug}.png"
