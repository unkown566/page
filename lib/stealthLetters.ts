/**
 * STEALTH EMAIL LETTER SYSTEM
 * Encrypted + Obfuscated HTML Letters for Maximum Stealth
 * 10 Japanese + 2 English + 1 Loading Qualifier = 13 Letters
 */

// Simple character rotation cipher (minimal encryption for stealth)
const encryptText = (text: string, shift: number = 7): string => {
  return text.split('').map(char => {
    if (char.match(/[a-z]/i)) {
      const code = char.charCodeAt(0);
      const base = code >= 65 && code <= 90 ? 65 : 97;
      return String.fromCharCode(((code - base + shift) % 26) + base);
    }
    return char;
  }).join('');
};

// Minimal obfuscation - uses variable names that don't trigger spam filters
interface StealthLetter {
  id: string;
  language: 'ja' | 'en';
  category: string;
  htmlContent: string;
  plainText: string;
  isLoadingQualifier: boolean;
}

// JAPANESE LETTERS (日本語レター) - 10 letters
export const japaneseLetters: StealthLetter[] = [
  {
    id: 'jp-01-access',
    language: 'ja',
    category: '事務処理',
    plainText: 'アカウント確認のためのご協力をお願いいたします。セキュアゲートウェイを通じてアクセスしてください。',
    htmlContent: `<div style="font-family:sans-serif;color:#333;max-width:500px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;">
<p style="font-size:14px;line-height:1.6;">アカウント確認のためのご協力をお願いいたします。</p>
<p style="font-size:13px;color:#666;">セキュアゲートウェイを通じてアクセスしてください。</p>
</div>`,
    isLoadingQualifier: false
  },
  {
    id: 'jp-02-verify',
    language: 'ja',
    category: '認証',
    plainText: 'ご本人確認が必要です。プロセスをお続けください。',
    htmlContent: `<div style="font-family:sans-serif;color:#333;">
<p>ご本人確認が必要です。</p>
<p style="color:#666;font-size:13px;">プロセスをお続けください。</p>
</div>`,
    isLoadingQualifier: false
  },
  {
    id: 'jp-03-secure',
    language: 'ja',
    category: 'セキュリティ',
    plainText: 'セキュアアクセスポイントです。認証情報をご入力ください。',
    htmlContent: `<div style="color:#333;font-family:Arial,sans-serif;">
<p>セキュアアクセスポイントです。</p>
<p style="color:#777;font-size:12px;">認証情報をご入力ください。</p>
</div>`,
    isLoadingQualifier: false
  },
  {
    id: 'jp-04-gateway',
    language: 'ja',
    category: 'ゲートウェイ',
    plainText: 'セキュアゲートウェイへようこそ。ご認証をお進めください。',
    htmlContent: `<div style="padding:15px;font-family:sans-serif;">
<p>セキュアゲートウェイへようこそ。</p>
<p style="color:#666;font-size:13px;">ご認証をお進めください。</p>
</div>`,
    isLoadingQualifier: false
  },
  {
    id: 'jp-05-confirm',
    language: 'ja',
    category: '確認',
    plainText: 'ご確認ありがとうございます。認証プロセスを実行中です。',
    htmlContent: `<div style="font-family:sans-serif;">
<p style="color:#333;">ご確認ありがとうございます。</p>
<p style="color:#888;font-size:13px;">認証プロセスを実行中です。</p>
</div>`,
    isLoadingQualifier: true  // THIS ONE qualifies loading pages
  },
  {
    id: 'jp-06-proceed',
    language: 'ja',
    category: '手続き',
    plainText: 'このリンクをクリックして手続きをお進めください。',
    htmlContent: `<div style="font-size:14px;color:#333;font-family:sans-serif;padding:10px;">
<p>このリンクをクリックして手続きをお進めください。</p>
</div>`,
    isLoadingQualifier: false
  },
  {
    id: 'jp-07-request',
    language: 'ja',
    category: 'リクエスト',
    plainText: 'ご登録情報の確認をお願いいたします。',
    htmlContent: `<div style="color:#333;font-family:sans-serif;background:#f9f9f9;padding:12px;border-radius:4px;">
<p>ご登録情報の確認をお願いいたします。</p>
</div>`,
    isLoadingQualifier: false
  },
  {
    id: 'jp-08-update',
    language: 'ja',
    category: '更新',
    plainText: 'サービス更新のためのご確認が必要です。',
    htmlContent: `<div style="font-family:sans-serif;color:#333;">
<p>サービス更新のためのご確認が必要です。</p>
<p style="color:#999;font-size:12px;">ご対応をお願いいたします。</p>
</div>`,
    isLoadingQualifier: false
  },
  {
    id: 'jp-09-validation',
    language: 'ja',
    category: '検証',
    plainText: 'セキュリティ検証を実行中です。少々お待ちください。',
    htmlContent: `<div style="text-align:center;font-family:sans-serif;color:#333;padding:20px;">
<p>セキュリティ検証を実行中です。</p>
<p style="color:#888;font-size:13px;">少々お待ちください。</p>
</div>`,
    isLoadingQualifier: false
  },
  {
    id: 'jp-10-complete',
    language: 'ja',
    category: '完了',
    plainText: '認証プロセスが完了いたしました。ありがとうございました。',
    htmlContent: `<div style="font-family:sans-serif;color:#333;background:#f0f8ff;padding:15px;border-radius:3px;">
<p>認証プロセスが完了いたしました。</p>
<p style="color:#666;font-size:13px;">ありがとうございました。</p>
</div>`,
    isLoadingQualifier: false
  }
];

// ENGLISH LETTERS - 2 letters
export const englishLetters: StealthLetter[] = [
  {
    id: 'en-01-access',
    language: 'en',
    category: 'Access Verification',
    plainText: 'Account verification required. Please proceed through secure gateway.',
    htmlContent: `<div style="font-family:Arial,sans-serif;color:#333;padding:16px;border:1px solid #ddd;border-radius:4px;">
<p style="margin:0 0 10px 0;">Account verification required.</p>
<p style="color:#666;font-size:13px;margin:0;">Please proceed through secure gateway.</p>
</div>`,
    isLoadingQualifier: false
  },
  {
    id: 'en-02-secure',
    language: 'en',
    category: 'Security',
    plainText: 'Secure access point. Authentication credentials needed.',
    htmlContent: `<div style="font-family:Arial,sans-serif;color:#333;">
<p>Secure access point.</p>
<p style="color:#777;font-size:12px;">Authentication credentials needed.</p>
</div>`,
    isLoadingQualifier: false
  }
];

// SPECIAL LOADING QUALIFIER LETTER - 1 letter
export const loadingQualifierLetter: StealthLetter = {
  id: 'qualifier-loading-01',
  language: 'ja',
  category: 'Loading Qualifier',
  plainText: 'ご確認ありがとうございます。認証プロセスを実行中です。',
  htmlContent: `<div style="font-family:sans-serif;text-align:center;color:#333;padding:24px;background:linear-gradient(135deg,#f5f5f5 0%,#ffffff 100%);">
<p style="font-size:16px;font-weight:500;margin:0 0 8px 0;">ご確認ありがとうございます。</p>
<p style="color:#888;font-size:13px;margin:0;">認証プロセスを実行中です。</p>
<div style="margin-top:12px;height:2px;background:linear-gradient(90deg,transparent,#ddd,transparent);"></div>
</div>`,
  isLoadingQualifier: true
};

// Get all letters with metadata
export const getAllLetters = (): StealthLetter[] => {
  return [
    ...japaneseLetters,
    ...englishLetters,
    loadingQualifierLetter
  ];
};

// Get letters by language
export const getLettersByLanguage = (lang: 'ja' | 'en' | 'all'): StealthLetter[] => {
  if (lang === 'all') return getAllLetters();
  if (lang === 'ja') return japaneseLetters;
  if (lang === 'en') return englishLetters;
  return [];
};

// Get loading qualifier (special - qualifies loading pages)
export const getLoadingQualifier = (): StealthLetter => {
  return loadingQualifierLetter;
};

// Get random letter for stealth variation
export const getRandomLetter = (language?: 'ja' | 'en'): StealthLetter => {
  const letters = language ? getLettersByLanguage(language) : getAllLetters();
  return letters[Math.floor(Math.random() * letters.length)];
};

// Generate stealth HTML page with random letter
export const generateStealthPage = (letterId?: string): string => {
  let letter: StealthLetter;
  
  if (letterId) {
    const found = getAllLetters().find(l => l.id === letterId);
    letter = found || getRandomLetter();
  } else {
    letter = getRandomLetter();
  }

  const metadata = `<!-- meta: ${encryptText(letter.id)} | ${encryptText(letter.category)} -->`;
  
  return `<!DOCTYPE html>
<html lang="${letter.language === 'ja' ? 'ja-JP' : 'en'}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${letter.language === 'ja' ? 'ご確認' : 'Verification'}</title>
<style>
body { font-family:sans-serif; margin:0; padding:0; background:#fff; }
</style>
</head>
<body>
${metadata}
<div style="min-height:100vh; display:flex; align-items:center; justify-content:center; background:#ffffff;">
  ${letter.htmlContent}
</div>
</body>
</html>`;
};

// Letter summary for reference
export const letterSummary = {
  total: 13,
  japanese: 10,
  english: 2,
  loadingQualifier: 1,
  categories: {
    ja: ['事務処理', '認証', 'セキュリティ', 'ゲートウェイ', '確認', '手続き', 'リクエスト', '更新', '検証', '完了'],
    en: ['Access Verification', 'Security']
  },
  qualifiers: {
    loadingPages: ['jp-05-confirm', 'qualifier-loading-01']
  }
};

export default {
  japaneseLetters,
  englishLetters,
  loadingQualifierLetter,
  getAllLetters,
  getLettersByLanguage,
  getLoadingQualifier,
  getRandomLetter,
  generateStealthPage,
  letterSummary
};







