# API Filtering, Searching, and Ordering Guide

## Overview

All list endpoints support filtering, searching, and ordering capabilities using query parameters.

## General Syntax

```
GET /api/endpoint/?filter_field=value&search=query&ordering=field
```

## Challenges API

### Base Endpoint
`GET /api/challenges/`

### Filtering

**By Points:**
```bash
# Exact match
GET /api/challenges/?points=100

# Greater than or equal
GET /api/challenges/?points__gte=100

# Less than or equal
GET /api/challenges/?points__lte=200

# Range (combine filters)
GET /api/challenges/?points__gte=100&points__lte=200
```

**By Creation Date:**
```bash
# Created after date
GET /api/challenges/?created_at__gte=2024-01-01

# Created before date
GET /api/challenges/?created_at__lte=2024-12-31

# Date range
GET /api/challenges/?created_at__gte=2024-01-01&created_at__lte=2024-12-31
```

### Searching

Search in title and description:
```bash
# Search for "button"
GET /api/challenges/?search=button

# Search for "circle gradient"
GET /api/challenges/?search=circle%20gradient
```

### Ordering

```bash
# Order by points (ascending)
GET /api/challenges/?ordering=points

# Order by points (descending)
GET /api/challenges/?ordering=-points

# Order by creation date (newest first)
GET /api/challenges/?ordering=-created_at

# Order by title (alphabetical)
GET /api/challenges/?ordering=title

# Multiple ordering
GET /api/challenges/?ordering=-points,created_at
```

### Combined Example

```bash
# Get challenges with 100-200 points, containing "button", ordered by points
GET /api/challenges/?points__gte=100&points__lte=200&search=button&ordering=-points
```

### Delete Challenge

```bash
# Admin only
DELETE /api/challenges/{id}/
```

## Submissions API

### Base Endpoint
`GET /api/submissions/` (returns user's own submissions)

### Filtering

**By Challenge:**
```bash
# Submissions for challenge ID 1
GET /api/submissions/?challenge=1
```

**By Code Length:**
```bash
# Exact length
GET /api/submissions/?code_length=150

# Greater than or equal
GET /api/submissions/?code_length__gte=100

# Less than or equal
GET /api/submissions/?code_length__lte=500

# Range
GET /api/submissions/?code_length__gte=100&code_length__lte=500
```

**By Submission Date:**
```bash
# Submitted after date
GET /api/submissions/?submitted_at__gte=2024-01-01T00:00:00

# Submitted before date
GET /api/submissions/?submitted_at__lte=2024-12-31T23:59:59

# Date range
GET /api/submissions/?submitted_at__gte=2024-01-01&submitted_at__lte=2024-12-31
```

### Searching

Search in HTML code, CSS code, and challenge title:
```bash
# Search for "button" in code
GET /api/submissions/?search=button

# Search for "background"
GET /api/submissions/?search=background
```

### Ordering

```bash
# Order by code length (ascending)
GET /api/submissions/?ordering=code_length

# Order by submission date (newest first)
GET /api/submissions/?ordering=-submitted_at

# Order by challenge ID
GET /api/submissions/?ordering=challenge
```

### Combined Example

```bash
# Get submissions for challenge 1, code length < 300, ordered by length
GET /api/submissions/?challenge=1&code_length__lte=300&ordering=code_length
```

### Delete Submission

```bash
# Users can delete their own submissions
DELETE /api/submissions/{id}/

# Admins can delete any submission
DELETE /api/submissions/{id}/
```

### Admin Endpoints

**All Submissions (with filtering):**
```bash
GET /api/submissions/all/?challenge=1&ordering=-submitted_at
```

**By Challenge (with filtering):**
```bash
GET /api/submissions/challenge/1/?code_length__lte=300&ordering=code_length
```

**By User (with filtering):**
```bash
GET /api/submissions/user/5/?ordering=-submitted_at
```

## Pagination

All list endpoints are paginated with 50 items per page by default.

### Pagination Parameters

```bash
# Get page 2
GET /api/challenges/?page=2

# Combine with filters
GET /api/challenges/?points__gte=100&page=2
```

### Pagination Response Format

```json
{
  "count": 150,
  "next": "http://localhost:8000/api/challenges/?page=3",
  "previous": "http://localhost:8000/api/challenges/?page=1",
  "results": [
    {
      "id": 1,
      "title": "Challenge Title",
      ...
    }
  ]
}
```

## Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `exact` | Exact match (default) | `?points=100` |
| `gte` | Greater than or equal | `?points__gte=100` |
| `lte` | Less than or equal | `?points__lte=200` |
| `gt` | Greater than | `?points__gt=100` |
| `lt` | Less than | `?points__lt=200` |
| `contains` | Case-sensitive contains | `?title__contains=Button` |
| `icontains` | Case-insensitive contains | `?title__icontains=button` |

## Complete Examples

### Example 1: Find Easy Challenges
```bash
curl -X GET "http://localhost:8000/api/challenges/?points__lte=100&ordering=points" \
  -H "Authorization: Token YOUR_TOKEN"
```

### Example 2: Search Recent Submissions
```bash
curl -X GET "http://localhost:8000/api/submissions/?submitted_at__gte=2024-01-01&ordering=-submitted_at" \
  -H "Authorization: Token YOUR_TOKEN"
```

### Example 3: Find Short Code Submissions
```bash
curl -X GET "http://localhost:8000/api/submissions/?code_length__lte=200&ordering=code_length" \
  -H "Authorization: Token YOUR_TOKEN"
```

### Example 4: Search Challenges by Keyword
```bash
curl -X GET "http://localhost:8000/api/challenges/?search=gradient&ordering=-points" \
  -H "Authorization: Token YOUR_TOKEN"
```

### Example 5: Admin - View All Submissions for a Challenge
```bash
curl -X GET "http://localhost:8000/api/submissions/challenge/1/?ordering=code_length" \
  -H "Authorization: Token ADMIN_TOKEN"
```

### Example 6: Delete a Challenge (Admin)
```bash
curl -X DELETE "http://localhost:8000/api/challenges/5/" \
  -H "Authorization: Token ADMIN_TOKEN"
```

### Example 7: Delete Own Submission
```bash
curl -X DELETE "http://localhost:8000/api/submissions/10/" \
  -H "Authorization: Token YOUR_TOKEN"
```

## Tips

1. **URL Encoding**: Remember to URL-encode special characters in query parameters
   - Space: `%20`
   - Colon: `%3A`
   - Example: `2024-01-01 10:00:00` → `2024-01-01%2010%3A00%3A00`

2. **Multiple Filters**: Combine multiple filters with `&`
   ```
   ?points__gte=100&points__lte=200&search=button
   ```

3. **Ordering Direction**: Use `-` prefix for descending order
   ```
   ?ordering=-created_at  # Newest first
   ?ordering=created_at   # Oldest first
   ```

4. **Search is Fuzzy**: Search looks for partial matches across multiple fields

5. **Pagination**: Use `page` parameter to navigate through results

6. **Admin Privileges**: Some endpoints require `is_admin=True` flag

## Error Responses

### Invalid Filter Field
```json
{
  "error": "Invalid filter field"
}
```

### Invalid Date Format
```json
{
  "created_at": ["Enter a valid date/time."]
}
```

### Permission Denied
```json
{
  "error": "Admin privileges required"
}
```

## Summary

- **Filtering**: Use field names with operators (`__gte`, `__lte`, etc.)
- **Searching**: Use `?search=query` to search across multiple fields
- **Ordering**: Use `?ordering=field` or `?ordering=-field` for descending
- **Pagination**: Use `?page=N` to navigate pages
- **Deletion**: Use `DELETE` method on detail endpoints
- **Combine**: Mix filters, search, ordering, and pagination in one request
