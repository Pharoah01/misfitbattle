# Security Checklist - Before GitHub Push

## 🔒 Critical: Before Pushing to GitHub

### ✅ Environment Files
- [ ] `.env` files are in `.gitignore`
- [ ] No `.env` files committed to Git
- [ ] `.env.example` files created (safe to commit)
- [ ] All secrets removed from example files

### ✅ Database Files
- [ ] `db.sqlite3` is in `.gitignore`
- [ ] No database files committed
- [ ] Database backups not in repo

### ✅ Secrets & Keys
- [ ] No `SECRET_KEY` in code
- [ ] No API keys in code
- [ ] No passwords in code
- [ ] No `.pem` or `.key` files committed
- [ ] No AWS credentials in repo

### ✅ Configuration Files
- [ ] `local_settings.py` is ignored
- [ ] Production configs use environment variables
- [ ] No hardcoded URLs with credentials

---

## 🔍 Files to Check

### Backend Files to Review:
```bash
# Check for secrets in these files:
backend/backend/settings.py
backend/.env
backend/local_settings.py
```

### Frontend Files to Review:
```bash
# Check for API keys in these files:
frontend/.env
frontend/.env.production
frontend/src/config/constants.ts
```

---

## 🛡️ What's Safe to Commit

### ✅ Safe Files:
- `.env.example` (template with no real values)
- `settings.py` (if using environment variables)
- `constants.ts` (if no secrets)
- `README.md`
- Source code
- Documentation
- Configuration templates

### ❌ Never Commit:
- `.env` (actual environment variables)
- `db.sqlite3` (database)
- `*.pem` (SSH keys)
- `*.key` (private keys)
- `local_settings.py` (local overrides)
- `media/` (user uploads)
- `staticfiles/` (collected static files)
- `node_modules/` (dependencies)
- `venv/` (Python environment)

---

## 🔐 Security Best Practices

### 1. Environment Variables
```python
# ✅ GOOD - Use environment variables
SECRET_KEY = os.getenv('SECRET_KEY')
DEBUG = os.getenv('DEBUG', 'False') == 'True'

# ❌ BAD - Hardcoded secrets
SECRET_KEY = 'django-insecure-abc123...'
DEBUG = True
```

### 2. Database Credentials
```python
# ✅ GOOD
DATABASES = {
    'default': {
        'ENGINE': os.getenv('DB_ENGINE'),
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
    }
}

# ❌ BAD
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'misfits_battle',
        'USER': 'admin',
        'PASSWORD': 'password123',
    }
}
```

### 3. API URLs
```typescript
// ✅ GOOD - Use environment variables
const API_URL = import.meta.env.VITE_API_URL;

// ❌ BAD - Hardcoded with credentials
const API_URL = 'https://admin:password@api.example.com';
```

---

## 🧪 Pre-Push Verification

### Run These Commands:

```bash
# 1. Check for accidentally staged .env files
git status | grep -E "\.env$|\.env\."

# 2. Check for database files
git status | grep -E "db\.sqlite3|\.db$"

# 3. Check for secrets in staged files
git diff --cached | grep -i -E "password|secret|api_key|token"

# 4. List all files to be committed
git diff --cached --name-only

# 5. Check .gitignore is working
git check-ignore -v .env backend/.env frontend/.env
```

### Expected Output:
```bash
# .env files should be ignored:
.gitignore:10:.env    .env
.gitignore:10:.env    backend/.env
.gitignore:10:.env    frontend/.env
```

---

## 🚨 If You Accidentally Committed Secrets

### 1. Remove from Git History (Before Push)
```bash
# Remove file from staging
git reset HEAD .env

# Remove file from last commit
git reset --soft HEAD~1
git reset HEAD .env
git commit -m "Your commit message"
```

### 2. If Already Pushed (CRITICAL)
```bash
# 1. Remove from Git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 2. Force push (WARNING: Destructive)
git push origin --force --all

# 3. IMMEDIATELY rotate all secrets:
# - Generate new SECRET_KEY
# - Change database passwords
# - Rotate API keys
# - Update all .env files
```

### 3. Rotate All Compromised Secrets
- [ ] Generate new Django SECRET_KEY
- [ ] Change database passwords
- [ ] Rotate API keys
- [ ] Update AWS credentials
- [ ] Revoke and regenerate tokens

---

## 📋 Pre-Deployment Checklist

### Before Deploying to Production:

- [ ] All `.env` files configured on servers
- [ ] `DEBUG=False` in production
- [ ] `ALLOWED_HOSTS` properly configured
- [ ] CORS origins restricted to your domains
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Database credentials are strong
- [ ] Firewall rules configured
- [ ] SSH keys secured
- [ ] Backup strategy in place

---

## 🔍 Regular Security Audits

### Monthly Checks:
- [ ] Review `.gitignore` effectiveness
- [ ] Scan for accidentally committed secrets
- [ ] Update dependencies for security patches
- [ ] Review access logs
- [ ] Rotate credentials

### Tools to Use:
```bash
# Check for secrets in Git history
git log -p | grep -i -E "password|secret|api_key"

# Scan for sensitive data
# Install: pip install detect-secrets
detect-secrets scan

# Check for known vulnerabilities
# Backend: pip install safety
safety check

# Frontend: npm audit
npm audit
```

---

## 📞 If Security Breach Occurs

1. **Immediately**:
   - Rotate all credentials
   - Change all passwords
   - Revoke API keys
   - Review access logs

2. **Investigate**:
   - Check Git history
   - Review server logs
   - Identify compromised data

3. **Remediate**:
   - Patch vulnerabilities
   - Update security measures
   - Document incident
   - Notify affected parties if required

---

## ✅ Final Verification Before Push

```bash
# Run this checklist:
echo "=== Security Pre-Push Checklist ==="
echo ""
echo "1. Checking for .env files..."
git status | grep -E "\.env$|\.env\." && echo "❌ STOP: .env files found!" || echo "✅ No .env files"
echo ""
echo "2. Checking for database files..."
git status | grep -E "db\.sqlite3|\.db$" && echo "❌ STOP: Database files found!" || echo "✅ No database files"
echo ""
echo "3. Checking for secrets in staged changes..."
git diff --cached | grep -i -E "password|secret_key|api_key" && echo "⚠️  WARNING: Possible secrets found!" || echo "✅ No obvious secrets"
echo ""
echo "4. Files to be committed:"
git diff --cached --name-only
echo ""
echo "=== Review complete. Safe to push? ==="
```

---

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Django Security](https://docs.djangoproject.com/en/4.2/topics/security/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Git Secrets Tool](https://github.com/awslabs/git-secrets)

---

**Remember**: Once secrets are pushed to GitHub, consider them compromised. Always rotate immediately!

**Last Updated**: March 2026
