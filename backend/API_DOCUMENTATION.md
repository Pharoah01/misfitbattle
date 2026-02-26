# API Documentation

Base URL: `http://localhost:8000/api/`

All endpoints except registration and login require JWT authentication.
Include the access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Authentication Endpoints

### Register User
**POST** `/api/auth/register/`

Request:
```json
{
  "register_number": "xxxxxxxx",
  "name": "XYZ",
  "password": "SecurePass123!"
}
```

Response (201):
```json
{
  "id": 1,
  "register_number": "CS2021001",
  "name": "John Doe",
  "is_admin": false,
  "created_at": "2025-01-15T10:30:00Z"
}
```

### Login
**POST** `/api/auth/login/`

Request:
```json
{
  "register_number": "CS2021001",
  "password": "SecurePass123!"
}
```

Response (200):
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "register_number": "CS2021001",
    "name": "John Doe",
    "is_admin": false
  }
}
```

### Logout
**POST** `/api/auth/logout/`

Headers: `Authorization: Bearer <access_token>`

Request:
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

Response (200):
```json
{
  "message": "Successfully logged out"
}
```

### Get Current User
**GET** `/api/auth/me/`

Headers: `Authorization: Bearer <access_token>`

Response (200):
```json
{
  "id": 1,
  "register_number": "CS2021001",
  "name": "John Doe",
  "is_admin": false,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Refresh Token
**POST** `/api/auth/token/refresh/`

Request:
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

Response (200):
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

## Challenge Endpoints

### List All Challenges
**GET** `/api/challenges/`

Headers: `Authorization: Bearer <access_token>`

Response (200):
```json
[
  {
    "id": 1,
    "title": "Simple Button",
    "description": "Create a centered blue button",
    "html_boilerplate": "<div></div>",
    "css_boilerplate": "body { margin: 0; }",
    "points": 100,
    "created_at": "2024-01-15T09:00:00Z"
  }
]
```

### Get Single Challenge
**GET** `/api/challenges/{id}/`

Headers: `Authorization: Bearer <access_token>`

Response (200):
```json
{
  "id": 1,
  "title": "Simple Button",
  "description": "Create a centered blue button",
  "html_boilerplate": "<div></div>",
  "css_boilerplate": "body { margin: 0; }",
  "points": 100,
  "created_at": "2024-01-15T09:00:00Z"
}
```

### Create Challenge (Admin Only)
**POST** `/api/challenges/`

Headers: `Authorization: Bearer <admin_access_token>`

Request:
```json
{
  "title": "Circle Challenge",
  "description": "Create a perfect circle in the center",
  "html_boilerplate": "<div></div>",
  "css_boilerplate": "body { margin: 0; }",
  "points": 200
}
```

Response (201):
```json
{
  "id": 3,
  "title": "Circle Challenge",
  "description": "Create a perfect circle in the center",
  "html_boilerplate": "<div></div>",
  "css_boilerplate": "body { margin: 0; }",
  "points": 200,
  "created_at": "2024-01-15T10:45:00Z"
}
```

### Update Challenge (Admin Only)
**PUT** `/api/challenges/{id}/`

Headers: `Authorization: Bearer <admin_access_token>`

Request:
```json
{
  "title": "Updated Circle Challenge",
  "description": "Create a perfect circle with shadow",
  "html_boilerplate": "<div></div>",
  "css_boilerplate": "body { margin: 0; }",
  "points": 250
}
```

Response (200): Same as create response

### Delete Challenge (Admin Only)
**DELETE** `/api/challenges/{id}/`

Headers: `Authorization: Bearer <admin_access_token>`

Response (204): No content

## Submission Endpoints

### Submit Solution
**POST** `/api/submissions/`

Headers: `Authorization: Bearer <access_token>`

Request:
```json
{
  "challenge": 1,
  "html_code": "<div class='button'>Click Me</div>",
  "css_code": ".button { background: blue; color: white; padding: 10px; }"
}
```

Response (201):
```json
{
  "id": 1,
  "challenge": 1,
  "html_code": "<div class='button'>Click Me</div>",
  "css_code": ".button { background: blue; color: white; padding: 10px; }",
  "code_length": 95,
  "submitted_at": "2024-01-15T11:00:00Z"
}
```

### Get User's Submissions
**GET** `/api/submissions/`

Headers: `Authorization: Bearer <access_token>`

Response (200):
```json
[
  {
    "id": 1,
    "user": 1,
    "user_name": "John Doe",
    "user_register_number": "CS2021001",
    "challenge": 1,
    "challenge_title": "Simple Button",
    "html_code": "<div class='button'>Click Me</div>",
    "css_code": ".button { background: blue; }",
    "code_length": 95,
    "submitted_at": "2024-01-15T11:00:00Z"
  }
]
```

### Get All Submissions (Admin Only)
**GET** `/api/submissions/all/`

Headers: `Authorization: Bearer <admin_access_token>`

Response (200): Same format as user submissions

### Get Submissions by Challenge (Admin Only)
**GET** `/api/submissions/challenge/{challenge_id}/`

Headers: `Authorization: Bearer <admin_access_token>`

Response (200): Same format as user submissions

### Get Submissions by User (Admin Only)
**GET** `/api/submissions/user/{user_id}/`

Headers: `Authorization: Bearer <admin_access_token>`

Response (200): Same format as user submissions

## Leaderboard Endpoint

### Get Leaderboard
**GET** `/api/leaderboard/`

Headers: `Authorization: Bearer <access_token>`

Response (200):
```json
[
  {
    "rank": 1,
    "register_number": "CS2021001",
    "name": "John Doe",
    "total_points": 450,
    "solved_count": 3
  },
  {
    "rank": 2,
    "register_number": "CS2021002",
    "name": "Jane Smith",
    "total_points": 300,
    "solved_count": 2
  }
]
```

## Error Responses

### 400 Bad Request
```json
{
  "field_name": ["Error message"]
}
```

### 401 Unauthorized
```json
{
  "detail": "Given token not valid for any token type"
}
```

### 403 Forbidden
```json
{
  "error": "Admin privileges required"
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### 500 Internal Server Error
```json
{
  "error": "An internal server error occurred"
}
```
