# Access Control Documentation

## User Roles and Permissions

### 1. Regular Users (Participants)
**Created via**: API registration endpoint (`POST /api/auth/register/`)

**Permissions**:
- ✅ Can access all API endpoints
- ✅ Can register and login
- ✅ Can view challenges
- ✅ Can submit solutions
- ✅ Can view their own submissions
- ✅ Can view leaderboard
- ❌ **CANNOT access Django admin panel** (`/admin/`)
- ❌ Cannot create/edit/delete challenges via admin
- ❌ Cannot view other users' submissions (unless via API with proper permissions)

**Flags**:
- `is_staff = False`
- `is_superuser = False`
- `is_admin = False` (or `True` for API-level admin permissions)

### 2. API Admins
**Created via**: API registration + manual flag update in Django admin

**Permissions**:
- ✅ All regular user permissions
- ✅ Can create/edit/delete challenges via API
- ✅ Can view all submissions via API
- ❌ **CANNOT access Django admin panel** (unless also superuser)

**Flags**:
- `is_staff = False`
- `is_superuser = False`
- `is_admin = True`

### 3. Superusers (System Administrators)
**Created via**: `python manage.py createsuperuser`

**Permissions**:
- ✅ All API permissions
- ✅ **Full access to Django admin panel** (`/admin/`)
- ✅ Can manage all users
- ✅ Can manage all challenges
- ✅ Can view all submissions
- ✅ Can access Django admin interface

**Flags**:
- `is_staff = True`
- `is_superuser = True`
- `is_admin = True`

## Access Control Matrix

| Feature | Regular User | API Admin | Superuser |
|---------|-------------|-----------|-----------|
| API Access | ✅ | ✅ | ✅ |
| Django Admin Panel | ❌ | ❌ | ✅ |
| Register/Login | ✅ | ✅ | ✅ |
| View Challenges | ✅ | ✅ | ✅ |
| Create Challenges (API) | ❌ | ✅ | ✅ |
| Edit Challenges (API) | ❌ | ✅ | ✅ |
| Delete Challenges (API) | ❌ | ✅ | ✅ |
| Submit Solutions | ✅ | ✅ | ✅ |
| View Own Submissions | ✅ | ✅ | ✅ |
| View All Submissions (API) | ❌ | ✅ | ✅ |
| View Leaderboard | ✅ | ✅ | ✅ |
| Manage Users (Admin Panel) | ❌ | ❌ | ✅ |
| Manage Challenges (Admin Panel) | ❌ | ❌ | ✅ |
| View Submissions (Admin Panel) | ❌ | ❌ | ✅ |

## Creating Users

### Create Regular User (Participant)
```bash
# Via API
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "register_number": "CS2021001",
    "name": "John Doe",
    "password": "securepass123"
  }'
```

This creates a user with:
- `is_staff = False`
- `is_superuser = False`
- `is_admin = False`

### Create Superuser (System Admin)
```bash
# Via Django management command
python manage.py createsuperuser
```

Follow the prompts:
- Register number: (e.g., ADMIN001)
- Name: (e.g., Admin User)
- Password: (secure password)

This creates a user with:
- `is_staff = True`
- `is_superuser = True`
- `is_admin = True`

### Promote User to API Admin
1. Login to Django admin panel as superuser
2. Navigate to Users
3. Select the user
4. Check the `is_admin` checkbox
5. Save

This gives the user API-level admin permissions without Django admin access.

## Django Admin Panel Access

**URL**: `http://localhost:8000/admin/`

**Who can access**:
- Only users with **both** `is_staff=True` AND `is_superuser=True`
- Regular users will see "You don't have permission to access this page"

**Login**:
- Register number: (your superuser register_number)
- Password: (your superuser password)

## API Authentication

All API endpoints (except register and login) require authentication.

**Header Format**:
```
Authorization: Token YOUR_TOKEN_HERE
```

**Getting a Token**:
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "register_number": "CS2021001",
    "password": "securepass123"
  }'

# Response includes token
{
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
  "user": {
    "id": 1,
    "register_number": "CS2021001",
    "name": "John Doe",
    "is_admin": false
  }
}
```

## Security Best Practices

1. **Never give regular users `is_staff` or `is_superuser` permissions**
   - These flags grant Django admin panel access
   - Only system administrators should have these

2. **Use `is_admin` flag for API-level permissions**
   - This allows challenge management via API
   - Does NOT grant Django admin access

3. **Protect superuser credentials**
   - Use strong passwords
   - Limit number of superusers
   - Regularly audit superuser accounts

4. **Regular users should only access API endpoints**
   - They should never need Django admin panel
   - All participant features are available via API

## Troubleshooting

### User can't access Django admin
**Check**:
- Is `is_staff = True`?
- Is `is_superuser = True`?
- Both must be True for admin access

### User can't create challenges via API
**Check**:
- Is `is_admin = True`?
- This flag controls API-level admin permissions

### Regular user trying to access admin panel
**Expected behavior**: They should see "You don't have permission"
- This is correct - regular users should not access admin panel
- They should use the frontend/API instead

## Summary

- **Regular Users**: API access only, no admin panel
- **API Admins**: API access + challenge management, no admin panel
- **Superusers**: Full access to everything including Django admin panel

Only superusers should access `/admin/`. Regular users and API admins use the API endpoints.
