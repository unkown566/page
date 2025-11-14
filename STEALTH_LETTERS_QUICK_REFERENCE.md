# ⚡ STEALTH LETTERS QUICK REFERENCE

## System Summary
- **13 Total Letters**: 10 Japanese + 2 English + 1 Loading Qualifier
- **Encryption**: Minimal Caesar cipher (shift=7)
- **Status**: ✅ Production Ready
- **Location**: `/lib/stealthLetters.ts`

---

## 🚀 Quick Start

### Import
```typescript
import { getRandomLetter, getLoadingQualifier } from '@/lib/stealthLetters';
```

### Get Random Letter
```typescript
const letter = getRandomLetter();
console.log(letter.id);           // jp-01-access
console.log(letter.htmlContent);  // <div>...</div>
```

### Get Loading Qualifier
```typescript
const qualifier = getLoadingQualifier();
// Use for smooth loading page transition
```

### Get All Letters
```typescript
const all = getAllLetters();
console.log(all.length); // 13
```

---

## 📋 All 13 Letters

### Japanese (10)
```
jp-01-access    | 事務処理 (Administrative)
jp-02-verify    | 認証 (Authentication)
jp-03-secure    | セキュリティ (Security)
jp-04-gateway   | ゲートウェイ (Gateway)
jp-05-confirm ⭐| 確認 (Confirmation) - LOADING QUALIFIER
jp-06-proceed   | 手続き (Procedure)
jp-07-request   | リクエスト (Request)
jp-08-update    | 更新 (Update)
jp-09-validation| 検証 (Validation)
jp-10-complete  | 完了 (Completion)
```

### English (2)
```
en-01-access    | Access Verification
en-02-secure    | Security
```

### Special (1)
```
qualifier-loading-01 ⭐ | Loading Qualifier - Qualifies Loading Pages
```

---

## 🔌 API Endpoints

```bash
# Get random letter (JSON)
GET /api/stealth-letters?action=random

# Get all letters
GET /api/stealth-letters?action=all

# Get by language
GET /api/stealth-letters?action=language&language=ja

# Get loading qualifier
GET /api/stealth-letters?action=qualifier

# Get as HTML page
GET /api/stealth-letters?action=page

# Get HTML format from API
GET /api/stealth-letters?action=random&format=html
```

---

## 💻 Code Examples

### React Component
```typescript
'use client';
import { getRandomLetter } from '@/lib/stealthLetters';

export default function Letter() {
  const letter = getRandomLetter('ja');
  return (
    <div dangerouslySetInnerHTML={{ __html: letter.htmlContent }} />
  );
}
```

### Loading Page
```typescript
'use client';
import { getLoadingQualifier } from '@/lib/stealthLetters';

export default function Loading() {
  const qualifier = getLoadingQualifier();
  
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: qualifier.htmlContent }} />
      <LoadingSpinner />
    </>
  );
}
```

### Fetch API
```typescript
const response = await fetch('/api/stealth-letters?action=random&language=ja');
const { data: letter } = await response.json();
```

---

## 🛡️ Key Features

✅ No spam trigger words (URGENT, CONFIRM NOW, etc.)
✅ Professional tone with minimal urgency
✅ Minimal encryption (avoids detection)
✅ Multi-language support (Japanese + English)
✅ Clean HTML with neutral colors
✅ Email-safe (no scripts, forms, or links)
✅ Loading page qualifier included
✅ Random selection for variation
✅ Simple integration with Next.js

---

## 📊 Letter Properties

```typescript
interface StealthLetter {
  id: string;              // jp-01-access
  language: 'ja' | 'en';   // ja
  category: string;        // 事務処理
  plainText: string;       // Plain text version
  htmlContent: string;     // HTML version
  isLoadingQualifier: boolean; // Special flag
}
```

---

## 🎯 Usage Patterns

### Variation (Best Practice)
```typescript
// Use random each time for variation
const letter1 = getRandomLetter('ja');
const letter2 = getRandomLetter('ja');
const letter3 = getRandomLetter('ja');
// Each will be different
```

### Language-Specific
```typescript
const japaneseOnly = getRandomLetter('ja');
const englishOnly = getRandomLetter('en');
const anyLanguage = getRandomLetter();
```

### Filter by Language
```typescript
const japanese = getLettersByLanguage('ja');
const english = getLettersByLanguage('en');
const all = getLettersByLanguage('all');
```

### Generate Full Page
```typescript
import { generateStealthPage } from '@/lib/stealthLetters';
const htmlPage = generateStealthPage(); // Random letter
const specificPage = generateStealthPage('jp-05-confirm'); // Specific
```

---

## 🔐 Security Notes

### Encryption
- Caesar cipher (shift=7)
- Applied to metadata only
- Minimal (avoids heavy encryption triggers)
- Located in HTML comments

### Stealth Level
- **Maximum**: No spam words
- **Professional**: Corporate email tone
- **Clean**: Simple HTML
- **Neutral**: Soft colors (#333, #666, #999)

### What's Avoided
❌ ALL CAPS
❌ Exclamation marks
❌ Time pressure language
❌ External links/resources
❌ JavaScript
❌ Form elements
❌ Heavy styling

### What's Included
✅ Professional language
✅ Japanese language (primary)
✅ Minimal HTML
✅ Encrypted metadata
✅ Plain text fallback
✅ Email-safe markup

---

## 📁 Files

```
lib/stealthLetters.ts              # Core system
app/api/stealth-letters/route.ts  # API endpoints
STEALTH_LETTERS_CURSOR_PROMPT.md  # Full cursor prompt
STEALTH_LETTERS_IMPLEMENTATION.md # Full implementation guide
STEALTH_LETTERS_QUICK_REFERENCE.md # This file
```

---

## ✅ Checklist for Integration

- [ ] Import stealthLetters module
- [ ] Test API endpoint: `/api/stealth-letters?action=random`
- [ ] Test random letter generation
- [ ] Test loading qualifier
- [ ] Verify no TypeScript errors
- [ ] Test HTML rendering
- [ ] Test language filtering
- [ ] Test API responses
- [ ] Verify stealth characteristics
- [ ] Ready for production

---

## 🚀 Ready to Use

```typescript
// That's all you need to start:
import { getRandomLetter, getLoadingQualifier } from '@/lib/stealthLetters';

// Get letter
const letter = getRandomLetter();

// Get qualifier for loading page
const qualifier = getLoadingQualifier();

// Use in your application
console.log(letter.htmlContent);
```

---

## 📞 Quick Help

**Problem**: Letters not loading
- Check import path: `@/lib/stealthLetters`
- Check file exists: `/lib/stealthLetters.ts`
- Run: `npm run build` for TypeScript errors

**Problem**: API not responding
- Check route exists: `/app/api/stealth-letters/route.ts`
- Check URL: `http://localhost:3000/api/stealth-letters`
- Check dev server running: `npm run dev`

**Problem**: HTML not rendering
- Check `dangerouslySetInnerHTML` usage
- Verify no TypeScript errors
- Check browser console for warnings

---

**Version**: 1.0  
**Created**: 2025-11-14  
**Status**: ✅ PRODUCTION READY  
**Total Letters**: 13 (10 JP + 2 EN + 1 Qualifier)

