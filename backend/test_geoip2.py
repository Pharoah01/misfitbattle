#!/usr/bin/env python
"""
Test script to verify GeoIP2 configuration
"""
import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings
from django.contrib.gis.geoip2 import GeoIP2

def test_geoip2():
    """Test GeoIP2 configuration"""
    print("=" * 60)
    print("GeoIP2 Configuration Test")
    print("=" * 60)
    
    # Check GEOIP_PATH setting
    print(f"\n1. GEOIP_PATH setting: {settings.GEOIP_PATH}")
    print(f"   Path exists: {settings.GEOIP_PATH.exists()}")
    
    # List files in GEOIP_PATH
    if settings.GEOIP_PATH.exists():
        print(f"\n2. Files in GEOIP_PATH:")
        for file in settings.GEOIP_PATH.iterdir():
            print(f"   - {file.name}")
    
    # Try to initialize GeoIP2
    print(f"\n3. Initializing GeoIP2...")
    try:
        g = GeoIP2()
        print("   ✓ GeoIP2 initialized successfully")
        
        # Test with a known IP address
        test_ip = "8.8.8.8"  # Google DNS
        print(f"\n4. Testing with IP: {test_ip}")
        
        try:
            country = g.country(test_ip)
            print(f"   Country data: {country}")
            
            city = g.city(test_ip)
            print(f"   City data: {city}")
            
            print("\n" + "=" * 60)
            print("✓ GeoIP2 is working correctly!")
            print("=" * 60)
            return True
            
        except Exception as e:
            print(f"   ✗ Error looking up IP: {e}")
            return False
            
    except Exception as e:
        print(f"   ✗ Error initializing GeoIP2: {e}")
        print(f"\n   Possible issues:")
        print(f"   - Missing GeoLite2-City.mmdb file (only Country database found)")
        print(f"   - Database file is corrupted")
        print(f"   - Incorrect GEOIP_PATH configuration")
        return False

if __name__ == '__main__':
    success = test_geoip2()
    sys.exit(0 if success else 1)
