# Section 2 Attendance

Frontend-only attendance website for Section 2.

## Stack
- HTML
- CSS
- Vanilla JavaScript
- localStorage
- jsPDF + AutoTable via CDN

## Files
- `index.html` — page structure
- `style.css` — UI styling
- `students.js` — Section 2 student list
- `app.js` — attendance logic + PDF export

## How to use
1. Open `index.html` in a browser.
2. The current Section 2 list contains 38 students in `students.js`.
3. The instructor checks present students.
4. Optionally enter the instructor name.
5. Click `Download PDF Report`.

## Important
Because this is frontend-only, attendance is stored in the browser's `localStorage`. It is not shared between different devices.
