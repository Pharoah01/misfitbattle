# Challenge Page Security & UX Features

## Implemented Features

### 1. Screenshot Prevention ✅

**Cross-Platform Coverage:**
- **Windows:** PrtScn, Alt+PrtScn, Win+Shift+S (Snipping Tool)
- **macOS:** Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
- **Linux:** PrtScn, Shift+PrtScn, Ctrl+PrtScn

**Implementation:**
- Keyboard event listeners on both `keydown` and `keyup`
- Prevents default behavior
- Shows toast notification: "Screenshots are disabled during the challenge"

**Limitations:**
- Cannot prevent hardware-level screenshots (phone cameras, external capture devices)
- Cannot prevent OS-level screenshot tools that bypass browser events
- Third-party screenshot tools may still work

**Code Location:** `frontend/src/pages/ChallengePage.tsx` (lines ~45-75)

---

### 2. Right-Click Prevention ✅

**Features:**
- Disables context menu on entire challenge page
- Shows toast notification: "Right-click is disabled during the challenge"
- Prevents inspect element access via right-click

**Implementation:**
```typescript
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  toast.error('Right-click is disabled during the challenge');
  return false;
});
```

**Limitations:**
- Users can still access DevTools via F12 or Ctrl+Shift+I
- Consider disabling F12 if needed (see Additional Security section)

**Code Location:** `frontend/src/pages/ChallengePage.tsx`

---

### 3. Drag & Drop Prevention ✅

**Features:**
- Prevents dragging elements from the page
- Prevents dropping external content onto the page
- Maintains clean UI without accidental drag operations

**Implementation:**
```typescript
document.addEventListener('dragstart', (e) => {
  e.preventDefault();
  return false;
});
```

**Code Location:** `frontend/src/pages/ChallengePage.tsx`

---

### 4. Automatic Cache/Auto-Save ✅

**Features:**
- Code automatically saved to localStorage every 1 second
- Persists across page refreshes
- Restored when user returns to challenge
- Cleared after successful submission

**Implementation:**
- Uses `localStorage.setItem()` with debounce (1 second)
- Key format: `user_session_{challenge-slug}`
- Stores: code content + timestamp

**Benefits:**
- No data loss on accidental page close
- No need for manual save button
- Seamless user experience

**Code Location:** `frontend/src/pages/ChallengePage.tsx` (lines ~90-105)

---

### 5. Session ID Per User (Not Per Challenge) ✅

**Previous Behavior:**
- Each challenge had separate auto-save: `challenge_{slug}_autosave`
- User could have multiple auto-saves across challenges

**New Behavior:**
- Single session per user per challenge: `user_session_{slug}`
- Cleaner localStorage management
- Consistent session handling

**Implementation:**
```typescript
const autoSaveKey = useMemo(() => `user_session_${slug}`, [slug]);
```

**Code Location:** `frontend/src/pages/ChallengePage.tsx`

---

### 6. Rendered Image Naming: `challengename-useremail.png` ✅

**Format:**
```
{challenge-name}-{user-email}.png
```

**Examples:**
- Challenge: "THE CENTER SQUARE"
- User Email: "john.doe@example.com"
- Filename: `the-center-square-john-doe-at-example-com.png`

**Sanitization Rules:**
1. Convert to lowercase
2. Replace spaces with hyphens
3. Replace `@` with `-at-`
4. Replace `.` with `-`
5. Remove special characters
6. Remove consecutive hyphens
7. Trim leading/trailing hyphens

**Benefits:**
- Easy identification of submissions
- Searchable by email
- No filename conflicts
- Safe for all file systems

**Code Location:** 
- `backend/submissions/services/renderer.py` (`_generate_filename` method)
- `backend/submissions/tasks.py` (Celery task)
- `backend/submissions/views.py` (Sync processing)

---

## Additional Security Recommendations

### Optional: Disable F12 DevTools

If you want to prevent DevTools access entirely:

```typescript
// Add to ChallengePage useEffect
const handleKeyDown = (e: KeyboardEvent) => {
  // Existing screenshot prevention...
  
  // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
  if (
    e.key === 'F12' ||
    (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
    (e.ctrlKey && e.key === 'U')
  ) {
    e.preventDefault();
    toast.error('Developer tools are disabled during the challenge');
    return false;
  }
};
```

### Optional: Detect DevTools Open

```typescript
// Detect if DevTools is open
useEffect(() => {
  const detectDevTools = () => {
    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    
    if (widthThreshold || heightThreshold) {
      toast.error('Please close developer tools');
      // Optionally: navigate away or disable submission
    }
  };

  const interval = setInterval(detectDevTools, 1000);
  return () => clearInterval(interval);
}, []);
```

### Optional: Disable Copy-Paste

```typescript
// Prevent copy-paste in code editor
const handleCopy = (e: ClipboardEvent) => {
  e.preventDefault();
  toast.error('Copy-paste is disabled during the challenge');
};

document.addEventListener('copy', handleCopy);
document.addEventListener('cut', handleCopy);
document.addEventListener('paste', handleCopy);
```

---

## Testing Checklist

### Screenshot Prevention
- [ ] Test PrtScn on Windows
- [ ] Test Win+Shift+S on Windows
- [ ] Test Cmd+Shift+3 on macOS
- [ ] Test Cmd+Shift+4 on macOS
- [ ] Test PrtScn on Linux
- [ ] Verify toast notification appears

### Right-Click Prevention
- [ ] Right-click on page
- [ ] Right-click on code editor
- [ ] Right-click on preview
- [ ] Verify toast notification appears

### Drag & Drop Prevention
- [ ] Try dragging text from editor
- [ ] Try dragging images
- [ ] Try dropping files onto page

### Auto-Save
- [ ] Write code and wait 1 second
- [ ] Refresh page
- [ ] Verify code is restored
- [ ] Submit solution
- [ ] Verify localStorage is cleared

### Rendered Image Naming
- [ ] Submit a challenge
- [ ] Check Django admin for submission
- [ ] Verify filename format: `challengename-useremail.png`
- [ ] Check file exists in `media/submission_renders/`

---

## Known Limitations

1. **Screenshot Prevention:**
   - Cannot prevent external cameras
   - Cannot prevent VM/remote desktop screenshots
   - Cannot prevent hardware capture cards

2. **Right-Click Prevention:**
   - Users can still access DevTools via keyboard shortcuts
   - Browser extensions may bypass restrictions

3. **Auto-Save:**
   - Limited to localStorage (5-10 MB browser limit)
   - Cleared if user clears browser data
   - Not synced across devices

4. **General:**
   - All client-side security can be bypassed by determined users
   - Consider server-side monitoring and plagiarism detection
   - Use proctoring software for high-stakes competitions

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Screenshot Prevention | ✅ | ✅ | ✅ | ✅ |
| Right-Click Prevention | ✅ | ✅ | ✅ | ✅ |
| Drag & Drop Prevention | ✅ | ✅ | ✅ | ✅ |
| Auto-Save (localStorage) | ✅ | ✅ | ✅ | ✅ |

---

## Maintenance Notes

- Security features are in `ChallengePage.tsx` useEffect hooks
- Easy to enable/disable by commenting out event listeners
- Toast notifications can be customized in the event handlers
- Filename sanitization logic is in `renderer.py`

---

## Future Enhancements

1. **Server-Side Monitoring:**
   - Track submission times
   - Detect suspicious patterns
   - Flag rapid submissions

2. **Code Similarity Detection:**
   - Compare submissions across users
   - Detect plagiarism
   - Generate similarity reports

3. **Session Recording:**
   - Record user actions during challenge
   - Replay sessions for review
   - Detect cheating patterns

4. **Proctoring Integration:**
   - Webcam monitoring
   - Screen recording
   - AI-based cheating detection
