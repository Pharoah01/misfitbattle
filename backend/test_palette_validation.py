#!/usr/bin/env python
"""
Test script for palette validation
Run with: python test_palette_validation.py
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.core.exceptions import ValidationError
from challenges.models import validate_palette

def test_palette_validation():
    """Test palette validation with various inputs"""
    
    print("Testing Palette Validation\n" + "="*50)
    
    # Valid palettes
    valid_palettes = [
        "#FF5733",
        "#FF5733,#33FF57",
        "#FF5733,#33FF57,#3357FF",
        "#FF5733, #33FF57, #3357FF",  # with spaces
        "#000000,#FFFFFF",
        "#123456,#ABCDEF,#fedcba",  # mixed case
    ]
    
    print("\n✅ Testing VALID palettes:")
    for palette in valid_palettes:
        try:
            validate_palette(palette)
            print(f"  ✓ '{palette}' - PASSED")
        except ValidationError as e:
            print(f"  ✗ '{palette}' - FAILED: {e}")
    
    # Invalid palettes
    invalid_palettes = [
        "FF5733",  # missing #
        "#FF57",  # too short
        "#FF57333",  # too long
        "#GGGGGG",  # invalid hex
        "rgb(255,87,51)",  # wrong format
        "#FF5733,INVALID",  # mixed valid/invalid
        "#FF5733,#GG5733",  # invalid hex in second color
        "##FF5733",  # double hash
        "#FF5733,,#33FF57",  # empty color
    ]
    
    print("\n❌ Testing INVALID palettes:")
    for palette in invalid_palettes:
        try:
            validate_palette(palette)
            print(f"  ✗ '{palette}' - SHOULD HAVE FAILED!")
        except ValidationError as e:
            print(f"  ✓ '{palette}' - Correctly rejected: {str(e)[:50]}...")
    
    # Edge cases
    print("\n🔍 Testing EDGE cases:")
    
    # Empty string (should pass - field is optional)
    try:
        validate_palette("")
        print("  ✓ Empty string - PASSED (field is optional)")
    except ValidationError as e:
        print(f"  ✗ Empty string - FAILED: {e}")
    
    # None (should pass - field is optional)
    try:
        validate_palette(None)
        print("  ✓ None - PASSED (field is optional)")
    except ValidationError as e:
        print(f"  ✗ None - FAILED: {e}")
    
    print("\n" + "="*50)
    print("Palette validation tests completed!")

if __name__ == "__main__":
    test_palette_validation()
