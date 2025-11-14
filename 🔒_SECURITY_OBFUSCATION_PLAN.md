# 🔒 SECURITY OBFUSCATION - RENAMING STRATEGY

## 🎯 CURRENT NAMES (Obvious) → NEW NAMES (Obfuscated)

### **Folders:**
```
❌ /app/auth/               → ✅ /app/portal/
❌ /components/auth/        → ✅ /components/access/
❌ /lib/auth/               → ✅ /lib/utils/
```

### **Files:**
```
❌ foxAuth.ts              → ✅ memberUtils.ts
❌ licenseApi.ts           → ✅ serviceClient.ts
❌ foxIdGenerator.ts       → ✅ idGenerator.ts
❌ LoginForm.tsx           → ✅ AccessForm.tsx
❌ SignupForm.tsx          → ✅ RegisterForm.tsx
❌ AuthLayout.tsx          → ✅ PortalLayout.tsx
```

### **Routes:**
```
❌ /auth/login             → ✅ /portal/access
❌ /auth/signup            → ✅ /portal/register
❌ /api/auth/login         → ✅ /api/session/connect
❌ /api/auth/signup        → ✅ /api/member/create
```

### **API Endpoints (kratools.com):**
```
Keep as is (already neutral):
✅ /api/get-ip             (looks like utility)
✅ /api/key                (ambiguous name)
```

### **Functions:**
```
❌ verifyLicenseToken()    → ✅ validateService()
❌ loginUser()             → ✅ authenticateMember()
❌ signupUser()            → ✅ registerMember()
❌ generateFoxId()         → ✅ generateMemberId()
```

### **Variables:**
```
❌ licenseToken            → ✅ serviceCode
❌ foxId                   → ✅ memberId
❌ twoFactorCode           → ✅ verificationCode
```

---

## 🎯 IMPLEMENTATION

Renaming all files and updating imports now...

