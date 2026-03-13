# 🛡️ Universal Security Testing Suite

This directory contains a comprehensive, user-friendly security testing suite designed for web applications and APIs. The suite has been enhanced with interactive user interfaces, extensive vulnerability coverage, and general-purpose functionality.

## 📋 Overview

The security testing suite includes four main components:

1. **`run_security_tests.py`** - 🎯 **NEW!** Interactive test runner and orchestrator
2. **`universal_security_scanner.py`** - 🔧 **ENHANCED!** Comprehensive vulnerability scanner with user input
3. **`security_feature_validation.py`** - ✅ **IMPROVED!** Interactive security feature validator  
4. **`security_vulnerability_simulation.py`** - 🚀 **UPGRADED!** Enhanced attack simulation with configuration options

## 🚀 Quick Start

### 🎯 Recommended: Use the Interactive Test Runner
```bash
python3 run_security_tests.py
```
The test runner provides a menu-driven interface to select and configure all testing tools.

### 🔧 Run Individual Tools
```bash
# Universal comprehensive scanner (100+ endpoints, 12 test categories)
python3 universal_security_scanner.py

# Validate your implemented security features
python3 security_feature_validation.py

# Simulate specific vulnerability attacks
python3 security_vulnerability_simulation.py
```

### 🌐 Test Different Targets
All tools now support interactive URL input:
```bash
# Tools will prompt for target URL, or use command line
python3 universal_security_scanner.py https://your-domain.com
python3 security_feature_validation.py http://localhost:8000
```

## 🆕 New Features & Enhancements

### ✨ Interactive User Interface
- **Target URL Input**: Enter any URL or use defaults
- **Test Selection**: Choose specific test categories or run all
- **Intensity Levels**: Light, Medium, or Heavy testing modes
- **Verbose Output**: Detailed logging or progress indicators
- **Configuration Summary**: Review settings before testing

### 🎯 Universal Compatibility
- **100+ Common API Endpoints**: Comprehensive endpoint list for general web applications
- **Extensive Payload Database**: 50+ SQL injection, 30+ path traversal, 25+ XSS payloads
- **Multiple Attack Vectors**: GET, POST, headers, file uploads, authentication bypass
- **General Purpose Design**: Works with any web application, not just specific frameworks

### 🔧 Enhanced Test Coverage
- **12 Vulnerability Categories**: Complete security assessment
- **Configurable Intensity**: Adjust test depth based on your needs
- **Smart Response Analysis**: Intelligent detection of security measures
- **Comprehensive Reporting**: Detailed JSON reports with timestamps

## 🔍 Complete Test Coverage

### 🛡️ Universal Security Scanner (universal_security_scanner.py)
**12 comprehensive test categories:**

1. **🔍 SQL Injection Testing**
   - Basic injection (OR, UNION, DROP)
   - Time-based blind injection
   - Boolean-based blind injection
   - Error-based injection
   - NoSQL injection patterns

2. **📁 Path Traversal Testing**
   - Directory traversal (../../../)
   - URL encoding bypass
   - Double encoding
   - Unicode encoding
   - Null byte injection

3. **🚨 XSS (Cross-Site Scripting)**
   - Reflected XSS
   - Event handler XSS
   - JavaScript protocol
   - Filter bypass techniques
   - CSS-based XSS

4. **🔐 Authentication Bypass**
   - JWT manipulation
   - Session hijacking
   - Header injection
   - IP spoofing
   - Authorization bypass

5. **⏱️ Rate Limiting Tests**
   - Rapid request flooding
   - Distributed request patterns
   - API endpoint abuse
   - Login brute force simulation

6. **🤖 Bot Detection Tests**
   - Malicious user agents (sqlmap, nikto, etc.)
   - Automated tool detection
   - Crawler identification
   - Scanner blocking validation

7. **🔍 API Enumeration**
   - Common endpoint discovery
   - Hidden API detection
   - Configuration file exposure
   - Debug endpoint identification

8. **📤 File Upload Security**
   - Malicious file uploads
   - Extension bypass
   - MIME type manipulation
   - Path traversal in filenames

9. **📋 Information Disclosure**
   - Configuration file exposure
   - Backup file detection
   - Debug information leakage
   - Sensitive data exposure

10. **🛡️ CSRF Protection**
    - State-changing operations
    - Token validation
    - Cross-origin requests
    - Method override attacks

11. **📋 Security Headers Check**
    - X-Content-Type-Options
    - X-Frame-Options
    - Content-Security-Policy
    - Strict-Transport-Security

12. **🔒 SSL/TLS Security**
    - HTTPS enforcement
    - HSTS validation
    - Certificate validation
    - Protocol security

### ✅ Security Feature Validation (security_feature_validation.py)
**8 targeted validation categories:**

1. **🤖 Bot Protection Middleware** - Malicious user agent blocking
2. **🛡️ Security Middleware** - SQL injection and path traversal detection
3. **⏱️ Rate Limiting** - Request throttling and abuse prevention
4. **🔐 Session Security** - Authentication and token validation
5. **🛡️ CSRF Protection** - Cross-site request forgery prevention
6. **✅ Input Validation** - XSS and malicious input handling
7. **📋 Security Headers** - HTTP security header validation
8. **🤖 Robots.txt** - Bot crawling configuration

### 🚀 Vulnerability Simulation (security_vulnerability_simulation.py)
**10 attack simulation categories:**

1. **🔍 SQL Injection Attacks** - Database manipulation attempts
2. **📁 Path Traversal Attacks** - File system access attempts
3. **🤖 Automated Tool Detection** - Scanner and bot identification
4. **⏱️ Rate Limiting** - Request flooding simulation
5. **🔐 Authentication Bypass** - Access control circumvention
6. **🚨 XSS Attempts** - Script injection attacks
7. **🔍 API Enumeration** - Endpoint discovery attacks
8. **📤 File Upload Attacks** - Malicious file upload attempts
9. **🛡️ CSRF Protection** - Cross-site request attacks
10. **📋 Information Disclosure** - Sensitive data exposure tests

## 📊 Enhanced Reporting

### 🎯 Security Scoring
- **Comprehensive Metrics**: Pass/fail rates, vulnerability counts, protection levels
- **Category Breakdown**: Detailed results by test category
- **Risk Assessment**: Vulnerability severity and impact analysis
- **Trend Analysis**: Compare results over time

### 📄 Detailed Output Files
- **`security_scan_results_TIMESTAMP.json`** - Universal scanner results
- **`security_validation_results.json`** - Feature validation results  
- **`security_test_results.json`** - Vulnerability simulation results

### 🎨 Color-Coded Output
- **🟢 Green**: Tests passed, security measures working
- **🔴 Red**: Vulnerabilities detected, immediate attention needed
- **🟡 Yellow**: Warnings, potential issues to investigate
- **🔵 Blue**: Informational, system responses logged

## ⚙️ Configuration Options

### 🎚️ Intensity Levels
- **Light**: Basic payloads, slower execution, fewer endpoints
- **Medium**: Standard payloads, balanced execution (default)
- **Heavy**: Comprehensive payloads, faster execution, all endpoints

### 🔧 Customization Options
- **Target URL**: Any web application or API
- **Test Selection**: Choose specific categories or run all
- **Timeout Settings**: Adjust for slow or fast applications
- **Delay Configuration**: Control request rate and timing
- **Verbose Logging**: Detailed output or progress indicators

## 🛡️ Security & Ethics

### ⚠️ CRITICAL DISCLAIMER
- **Authorized Use Only**: Only test systems you own or have explicit written permission to test
- **Legal Compliance**: Unauthorized testing may be illegal in your jurisdiction
- **Responsible Disclosure**: Report vulnerabilities through proper channels
- **No Malicious Intent**: These tools are for defensive security testing only

### ✅ Authorized Use Cases
- ✅ Testing your own applications
- ✅ Authorized penetration testing
- ✅ Security validation during development
- ✅ Compliance and audit requirements
- ✅ Educational purposes on test systems

### ❌ Prohibited Use Cases
- ❌ Testing systems you don't own
- ❌ Testing without explicit permission
- ❌ Malicious attacks or exploitation
- ❌ Bypassing security for unauthorized access

## 🔧 Installation & Requirements

### 📦 Dependencies
```bash
pip install requests colorama
```

### 🐍 Python Requirements
- Python 3.6 or higher
- requests library for HTTP operations
- colorama library for colored output (optional)

### 📁 File Structure
```
security-testing-suite/
├── run_security_tests.py              # Interactive test runner
├── universal_security_scanner.py      # Comprehensive scanner
├── security_feature_validation.py     # Feature validator
├── security_vulnerability_simulation.py # Attack simulator
└── SECURITY_TESTING_README.md         # This documentation
```

## 🎯 Usage Examples

### 🚀 Interactive Mode (Recommended)
```bash
python3 run_security_tests.py
# Follow the interactive prompts to configure and run tests
```

### 🔧 Direct Tool Usage
```bash
# Comprehensive vulnerability scan
python3 universal_security_scanner.py
# Select target, test categories, and intensity level

# Validate security features
python3 security_feature_validation.py  
# Choose specific validation tests to run

# Simulate attack scenarios
python3 security_vulnerability_simulation.py
# Configure attack simulation parameters
```

### 🌐 Command Line Arguments
```bash
# Specify target URL directly
python3 universal_security_scanner.py https://example.com
python3 security_feature_validation.py http://localhost:8000
python3 security_vulnerability_simulation.py https://api.example.com
```

## 📈 Interpreting Results

### 🎯 Security Score Calculation
- **90-100%**: Excellent security posture, minimal vulnerabilities
- **80-89%**: Good security with minor issues to address
- **70-79%**: Adequate security, some improvements needed
- **Below 70%**: Significant security gaps require immediate attention

### 🔍 Key Metrics to Monitor
- **Blocked Attacks**: Higher percentage indicates better protection
- **Failed Authentication**: Should be high for invalid attempts
- **Rate Limiting**: Should activate under rapid request loads
- **Input Validation**: Should sanitize or reject malicious input
- **Security Headers**: Should be present and properly configured

### 🚨 Vulnerability Priorities
1. **Critical**: SQL injection, authentication bypass, file upload vulnerabilities
2. **High**: XSS, path traversal, information disclosure
3. **Medium**: Missing security headers, weak rate limiting
4. **Low**: Information leakage, configuration issues

## 🆘 Troubleshooting

### 🔧 Common Issues & Solutions

#### ❌ Tests Timing Out
```bash
# Increase timeout in script configuration
timeout = 30  # Instead of default 10
```

#### ❌ False Positives
- Review security middleware logs for legitimate request blocking
- Check if test payloads are too aggressive for your application
- Adjust intensity level to "light" for sensitive applications

#### ❌ Network Connectivity Issues
```bash
# Test local development server first
python3 universal_security_scanner.py http://localhost:8000

# Check firewall and proxy settings
# Verify target URL accessibility
```

#### ❌ Permission Errors
- Ensure you have explicit permission to test the target system
- Check if IP-based restrictions are blocking your tests
- Verify authentication requirements for protected endpoints

#### ❌ Script Dependencies
```bash
# Install required packages
pip install requests colorama

# Check Python version
python3 --version  # Should be 3.6+
```

## 🔄 Continuous Security Testing

### 🏗️ CI/CD Integration
```bash
# Add to your CI/CD pipeline
python3 security_feature_validation.py https://staging.example.com
# Parse JSON results for automated pass/fail decisions
```

### 📅 Regular Testing Schedule
- **Daily**: Feature validation on development environments
- **Weekly**: Comprehensive scans on staging environments
- **Monthly**: Full vulnerability assessment on production (with proper authorization)

### 📊 Trend Monitoring
- Track security scores over time
- Monitor for regression in security measures
- Document and address recurring vulnerabilities

## 🎓 Educational Resources

### 📚 Learning Objectives
- Understand common web application vulnerabilities
- Learn how security measures protect against attacks
- Practice defensive security testing methodologies
- Develop security-first development practices

### 🔬 Research Applications
- Security measure effectiveness analysis
- Vulnerability detection algorithm development
- Security tool comparison and benchmarking
- Academic security research projects

## 📞 Support & Contribution

### 🐛 Bug Reports
If you encounter issues with the security testing scripts:
1. Check the JSON output files for detailed error information
2. Review application logs for security middleware activity
3. Verify network connectivity and permissions
4. Test against local development environment first

### 🚀 Feature Requests
The security testing suite is designed to be extensible:
- Add custom vulnerability payloads
- Implement new test categories
- Enhance reporting capabilities
- Integrate with security tools and frameworks

### 🤝 Contributing
- Follow ethical security testing practices
- Document new test cases and payloads
- Maintain compatibility with general web applications
- Ensure proper error handling and user feedback

---

**Remember**: Security is an ongoing process, not a one-time check. Regular testing with this comprehensive suite helps maintain a strong security posture! 🛡️

## 🎉 What's New in This Version

### 🆕 Major Enhancements
- **Interactive User Interface**: All tools now have user-friendly configuration
- **Universal Compatibility**: Works with any web application, not framework-specific
- **Comprehensive Coverage**: 100+ endpoints, 12 test categories, 100+ payloads
- **Enhanced Reporting**: Color-coded output, detailed JSON reports, security scoring
- **Test Runner**: New orchestrator script for managing all testing tools
- **Configurable Intensity**: Light, medium, heavy testing modes
- **Better Error Handling**: Graceful failure handling and user feedback

### 🔧 Technical Improvements
- **Modular Design**: Each tool can be used independently or together
- **Smart Response Analysis**: Intelligent detection of security measures
- **Extensive Payload Database**: Comprehensive vulnerability test cases
- **Cross-Platform Support**: Works on Windows, macOS, and Linux
- **Python 3.6+ Compatibility**: Modern Python support with type hints

This enhanced security testing suite provides enterprise-grade security assessment capabilities while remaining accessible to developers, security professionals, and researchers. 🚀