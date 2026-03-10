# Git Push Guide - Safe GitHub Deployment

## 🎯 Quick Start

Before pushing to GitHub, run:

```bash
# Run security check
./check-security.sh

# If all checks pass, push
git push origin main
```

---

## 📋 Pre-Push Checklist

### ✅ Must Do Before Every Push

1. **Run Security Check**
   ```bash
   ./check-security.sh
   ```

2. **Review Staged Files**
   ```bash
   git status
   git diff --cached --name-only
   ```

3. **Check for Secrets**
   ```bash
   git diff --cached | grep -i -E "password|secret|api_key"
   ```

4. **Verify .gitignore**
   ```bash
   git check-ignore -v .env backend/.env frontend/.env
   ```

---

## 🔒 What's Protected

### ✅ Files Ignored by Git (Safe):

```
.env                          # All environment files
.env.local
.env.production
.env.development

db.sqlite3                    # Database
*.pem                         # SSH keys
*.key                         # Private keys

__pycache__/                  # Python cache
node_modules/                 # Node dependencies
venv/                         # Python environment

staticfiles/                  # Django static files
media/                        # User uploads

.vscode/                      # Editor config
.idea/                        # IDE config
```

### ✅ Files Safe to Commit:

```
.env.example                  # Template (no real values)
.gitignore                    # Git configuration
netlify.toml                  # Netlify config
README.md                     # Documentation
docs/                         # All documentation
frontend/src/                 # Source code
backend/                      # Source code (no secrets)
```

---

## 🚀 First Time Setup

### 1. Initialize Git (if not done)

```bash
git init
git add .
git commit -m "Initial commit"
```

### 2. Create GitHub Repository

1. Go to https://github.com/new
2. Create repository (don't initialize with README)
3. Copy the repository URL

### 3. Connect and Push

```bash
# Add remote
git remote add origin https://github.com/yourusername/misfits-battle.git

# Verify remote
git remote -v

# Push to GitHub
git push -u origin main
```

---

## 📝 Regular Workflow

### Making Changes

```bash
# 1. Check current status
git status

# 2. Add files
git add .

# 3. Review what will be committed
git diff --cached --name-only

# 4. Run security check
./check-security.sh

# 5. Commit
git commit -m "Your descriptive commit message"

# 6. Push
git push origin main
```

---

## 🔍 Verification Commands

### Check What's Being Tracked

```bash
# List all tracked files
git ls-files

# Check if specific file is ignored
git check-ignore -v .env

# See what's staged
git diff --cached --name-only

# See what's not staged
git diff --name-only
```

### Search for Secrets

```bash
# Search in staged files
git diff --cached | grep -i "password"
git diff --cached | grep -i "secret_key"
git diff --cached | grep -i "api_key"

# Search in all tracked files
git grep -i "password"
git grep -i "secret_key"
```

---

## 🚨 Emergency: Accidentally Committed Secrets

### If Not Yet Pushed

```bash
# Remove from last commit
git reset --soft HEAD~1
git reset HEAD .env
git commit -m "Your commit message"
```

### If Already Pushed (CRITICAL)

```bash
# 1. Remove from history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 2. Force push (WARNING: Destructive)
git push origin --force --all

# 3. IMMEDIATELY rotate all secrets!
```

### Then Rotate All Secrets

1. Generate new Django SECRET_KEY:
   ```bash
   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   ```

2. Change database passwords
3. Rotate API keys
4. Update all .env files
5. Redeploy applications

---

## 📂 Repository Structure

### What Gets Pushed to GitHub:

```
misfits-battle/
├── .gitignore                ✅ Pushed
├── netlify.toml              ✅ Pushed
├── README.md                 ✅ Pushed
├── check-security.sh         ✅ Pushed
│
├── docs/                     ✅ Pushed
│   ├── deployment/
│   ├── development/
│   └── ...
│
├── backend/                  ✅ Pushed (source code only)
│   ├── .env.example         ✅ Pushed (template)
│   ├── .env                 ❌ NOT pushed (secrets)
│   ├── db.sqlite3           ❌ NOT pushed (database)
│   ├── manage.py            ✅ Pushed
│   ├── requirements.txt     ✅ Pushed
│   └── ...
│
└── frontend/                 ✅ Pushed (source code only)
    ├── .env.example         ✅ Pushed (template)
    ├── .env.development     ❌ NOT pushed (secrets)
    ├── .env.production      ❌ NOT pushed (secrets)
    ├── node_modules/        ❌ NOT pushed (dependencies)
    ├── dist/                ❌ NOT pushed (build output)
    ├── package.json         ✅ Pushed
    └── ...
```

---

## 🛡️ Security Best Practices

### 1. Never Commit:
- ❌ `.env` files
- ❌ Database files
- ❌ SSH keys (`.pem`, `.key`)
- ❌ API keys or tokens
- ❌ Passwords
- ❌ User uploads (`media/`)
- ❌ Build artifacts (`dist/`, `staticfiles/`)

### 2. Always Use:
- ✅ Environment variables
- ✅ `.env.example` templates
- ✅ `.gitignore` properly configured
- ✅ Security check script before push
- ✅ Descriptive commit messages

### 3. Regular Audits:
```bash
# Monthly security check
git log -p | grep -i -E "password|secret|api_key"

# Check for large files
git ls-files | xargs ls -lh | sort -k5 -hr | head -20
```

---

## 📊 Common Git Commands

### Status & Info
```bash
git status                    # Check current status
git log --oneline            # View commit history
git remote -v                # View remote repositories
git branch                   # List branches
```

### Adding & Committing
```bash
git add .                    # Stage all changes
git add file.txt             # Stage specific file
git commit -m "message"      # Commit with message
git commit --amend           # Amend last commit
```

### Pushing & Pulling
```bash
git push origin main         # Push to main branch
git pull origin main         # Pull latest changes
git fetch origin             # Fetch without merging
```

### Undoing Changes
```bash
git reset HEAD file.txt      # Unstage file
git checkout -- file.txt     # Discard changes
git reset --soft HEAD~1      # Undo last commit (keep changes)
git reset --hard HEAD~1      # Undo last commit (discard changes)
```

---

## 🔗 Connecting to Netlify

### After Pushing to GitHub:

1. **Go to Netlify**: https://app.netlify.com
2. **Import Project**: Click "Add new site" → "Import an existing project"
3. **Connect GitHub**: Authorize Netlify to access your repository
4. **Select Repository**: Choose `misfits-battle`
5. **Configure Build**:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
6. **Add Environment Variable**:
   - Key: `VITE_API_URL`
   - Value: Your backend URL
7. **Deploy**: Click "Deploy site"

Netlify will automatically deploy on every push to main branch!

---

## 📞 Troubleshooting

### "Permission denied (publickey)"
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to GitHub
cat ~/.ssh/id_ed25519.pub
# Copy and add to GitHub → Settings → SSH Keys
```

### "Failed to push some refs"
```bash
# Pull first, then push
git pull origin main --rebase
git push origin main
```

### "Large files detected"
```bash
# Remove large file from history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/large/file" \
  --prune-empty --tag-name-filter cat -- --all
```

---

## ✅ Final Checklist

Before pushing:

- [ ] Ran `./check-security.sh`
- [ ] No `.env` files in Git
- [ ] No database files in Git
- [ ] No secrets in code
- [ ] `.env.example` files updated
- [ ] Commit message is descriptive
- [ ] Reviewed staged files
- [ ] All tests passing (if applicable)

---

**Remember**: Once pushed to GitHub, consider it public. Never commit secrets!

**Last Updated**: March 2026
