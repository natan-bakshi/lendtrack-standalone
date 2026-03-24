# LendTrack — Standalone

גרסה עצמאית של LendTrack, ללא תלות ב-base44 SDK.

## התקנה

```bash
npm install
npm run dev
```

## הערות

- קובץ `src/api/base44Client.js` הוא stub — צריך לחבר backend/auth אמיתי
- ה-UI והלוגיקה עובדים במלואם
- Authentication ו-Data persistence דורשים חיבור ל-Firebase / Supabase / כל backend אחר
