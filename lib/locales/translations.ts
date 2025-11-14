/**
 * Master Translation File
 * CRITICAL: This file NEVER goes to client
 * All translations stored server-side only
 */

export type Language = 'en' | 'ja' | 'ko' | 'de' | 'es'

export interface TemplateTranslations {
  // Common across all templates
  common: {
    loading: string
    processing: string
    pleaseWait: string
    secure: string
    encrypted: string
    copyright: string
  }
  
  // Meeting Invite specific
  meetingInvite: {
    title: string
    subtitle: string
    from: string
    to: string
    date: string
    time: string
    location: string
    attendees: string
    agenda: string
    preparing: string
    footer: string
  }
  
  // Voice Message specific
  voiceMessage: {
    title: string
    subtitle: string
    newMessage: string
    from: string
    duration: string
    received: string
    transcript: string
    download: string
    processing: string
    footer: string
  }
  
  // E-Fax Document specific
  eFax: {
    title: string
    subtitle: string
    incomingFax: string
    fromNumber: string
    toNumber: string
    pages: string
    receivedAt: string
    confidential: string
    downloadPdf: string
    print: string
    forward: string
    converting: string
    footer: string
  }
  
  // Package Delivery specific
  packageDelivery: {
    title: string
    subtitle: string
    packageUpdate: string
    tracking: string
    status: string
    estimatedDelivery: string
    sorted: string
    inTransit: string
    outForDelivery: string
    delivered: string
    loadingMap: string
    footer: string
  }
  
  // Secure File Transfer specific
  secureFileTransfer: {
    title: string
    subtitle: string
    encryptedTransfer: string
    from: string
    fileName: string
    fileSize: string
    expires: string
    encrypted: string
    virusScan: string
    signature: string
    download: string
    preview: string
    verifying: string
    footer: string
  }
  
  // Invoice Document specific
  invoice: {
    title: string
    subtitle: string
    invoiceNumber: string
    billTo: string
    amount: string
    dueDate: string
    status: string
    pending: string
    description: string
    total: string
    payNow: string
    downloadPdf: string
    loading: string
    footer: string
  }
  
  // Timesheet specific
  timesheet: {
    title: string
    subtitle: string
    weeklyTimesheet: string
    employee: string
    period: string
    department: string
    totalHours: string
    overtime: string
    submit: string
    save: string
    export: string
    syncing: string
    footer: string
  }
  
  // Cloud Storage specific
  cloudStorage: {
    title: string
    subtitle: string
    sharedFolder: string
    owner: string
    members: string
    storage: string
    upload: string
    newFolder: string
    share: string
    syncing: string
    footer: string
  }
  
  // Company Notice specific
  companyNotice: {
    title: string
    subtitle: string
    importantNotice: string
    from: string
    posted: string
    category: string
    priority: string
    high: string
    subject: string
    attachments: string
    acknowledge: string
    download: string
    loading: string
    footer: string
  }
  
  // Digital Stamp Document specific (Hanko)
  digitalStamp: {
    title: string
    subtitle: string
    certificateVerification: string
    documentId: string
    documentType: string
    status: string
    pending: string
    certificate: string
    notarized: string
    digitalSeal: string
    notary: string
    license: string
    jurisdiction: string
    blockchainVerified: string
    tamperProof: string
    verifying: string
    footer: string
  }
  
  // Outlook Web App specific
  outlook: {
    title: string
    usernamePlaceholder: string
    passwordPlaceholder: string
    signInButton: string
    signInOptions: string
    cannotAccess: string
    createAccount: string
    privacyTerms: string
    errorUsername: string
    errorPassword: string
    errorLogin: string
  }
  
  // OWA Server Data specific
  owaServer: {
    title: string
    subtitle: string
    tabWebmail: string
    tabMyServices: string
    loginPlaceholder: string
    passwordPlaceholder: string
    rememberMe: string
    forgotPassword: string
    loginButton: string
    errorEmail: string
    errorPassword: string
    errorLogin: string
  }
  
  // SF Express Login specific
  sfExpress: {
    // Header
    headerAccountOpen: string
    headerInternational: string
    headerLocation: string
    headerLanguage: string
    
    // Announcement
    announcement: string
    announcementText: string
    
    // Tabs
    tabPhone: string
    tabEmail: string
    tabUsername: string
    
    // Form Fields
    placeholderEmail: string
    placeholderPassword: string
    placeholderPhone: string
    placeholderUsername: string
    selectCountry: string
    
    // Links & Buttons
    verificationLogin: string
    privacyPolicy: string
    agreeToPrivacy: string
    loginButton: string
    passwordReset: string
    registerNow: string
    
    // Footer
    copyright: string
    cookieSettings: string
    privacyInfo: string
    
    // Online Service
    onlineService: string
    satisfactionSurvey: string
    surveyMessage: string
    contactUs: string
    
    // Errors
    errorPrivacy: string
    errorFields: string
    errorLogin: string
  }
}

export const translations: Record<Language, TemplateTranslations> = {
  // ════════════════════════════════════════════════════════════════════════
  // ENGLISH
  // ════════════════════════════════════════════════════════════════════════
  en: {
    common: {
      loading: 'Loading',
      processing: 'Processing',
      pleaseWait: 'Please wait',
      secure: 'Secure',
      encrypted: 'Encrypted',
      copyright: '© 2025'
    },
    meetingInvite: {
      title: 'Meeting Invitation',
      subtitle: 'Secure Meeting Portal',
      from: 'From',
      to: 'To',
      date: 'Date',
      time: 'Time',
      location: 'Location',
      attendees: 'Attendees',
      agenda: 'Agenda',
      preparing: 'Preparing meeting details...',
      footer: 'Secure · Confidential'
    },
    voiceMessage: {
      title: 'SecureVoice',
      subtitle: 'Encrypted Messaging',
      newMessage: 'New Voice Message',
      from: 'From',
      duration: 'Duration',
      received: 'Received',
      transcript: 'Transcript',
      download: 'Download',
      processing: 'Processing audio...',
      footer: 'Encrypted · Secure'
    },
    eFax: {
      title: 'eFaxSecure',
      subtitle: 'Professional Fax Service',
      incomingFax: 'Incoming Fax Document',
      fromNumber: 'From',
      toNumber: 'To',
      pages: 'Pages',
      receivedAt: 'Received',
      confidential: 'CONFIDENTIAL',
      downloadPdf: 'Download PDF',
      print: 'Print',
      forward: 'Forward',
      converting: 'Converting to PDF...',
      footer: 'HIPAA Compliant · Secure'
    },
    packageDelivery: {
      title: 'TrackExpress',
      subtitle: 'Package Tracking',
      packageUpdate: 'Package Status Update',
      tracking: 'Tracking',
      status: 'Status',
      estimatedDelivery: 'Estimated Delivery',
      sorted: 'Package Sorted',
      inTransit: 'In Transit',
      outForDelivery: 'Out for Delivery',
      delivered: 'Delivered',
      loadingMap: 'Loading delivery map...',
      footer: 'Real-time Tracking'
    },
    secureFileTransfer: {
      title: 'SecureShare',
      subtitle: 'Encrypted File Transfer',
      encryptedTransfer: 'Encrypted File Transfer',
      from: 'From',
      fileName: 'File',
      fileSize: 'Size',
      expires: 'Expires',
      encrypted: 'AES-256 Encrypted',
      virusScan: 'Virus Scan Complete',
      signature: 'Digital Signature Valid',
      download: 'Download',
      preview: 'Preview',
      verifying: 'Verifying secure transfer...',
      footer: 'End-to-End Encrypted'
    },
    invoice: {
      title: 'InvoicePro',
      subtitle: 'Professional Invoicing',
      invoiceNumber: 'Invoice',
      billTo: 'Bill To',
      amount: 'Amount',
      dueDate: 'Due Date',
      status: 'Status',
      pending: 'PENDING',
      description: 'Description',
      total: 'Total',
      payNow: 'Pay Now',
      downloadPdf: 'Download PDF',
      loading: 'Loading payment gateway...',
      footer: 'PCI Compliant · Secure'
    },
    timesheet: {
      title: 'TimeTracker',
      subtitle: 'Time Management',
      weeklyTimesheet: 'Weekly Timesheet',
      employee: 'Employee',
      period: 'Period',
      department: 'Department',
      totalHours: 'Total Hours',
      overtime: 'Overtime',
      submit: 'Submit',
      save: 'Save',
      export: 'Export',
      syncing: 'Syncing timesheet data...',
      footer: 'HRIS Integrated · Payroll'
    },
    cloudStorage: {
      title: 'CloudVault',
      subtitle: 'Cloud Storage',
      sharedFolder: 'Shared Folder',
      owner: 'Owner',
      members: 'Members',
      storage: 'Storage',
      upload: 'Upload',
      newFolder: 'New Folder',
      share: 'Share',
      syncing: 'Syncing files...',
      footer: 'Encrypted · Auto-sync'
    },
    companyNotice: {
      title: 'CompanyHub',
      subtitle: 'Internal Portal',
      importantNotice: 'Important Notice',
      from: 'From',
      posted: 'Posted',
      category: 'Category',
      priority: 'Priority',
      high: 'HIGH',
      subject: 'Subject',
      attachments: 'Attachments',
      acknowledge: 'Acknowledge',
      download: 'Download',
      loading: 'Loading full notice...',
      footer: 'Internal Use Only'
    },
    digitalStamp: {
      title: 'LegalVault',
      subtitle: 'Document Verification',
      certificateVerification: 'Digital Certificate Verification',
      documentId: 'Document ID',
      documentType: 'Type',
      status: 'Status',
      pending: 'PENDING VERIFICATION',
      certificate: 'CERTIFICATE OF AUTHENTICITY',
      notarized: 'Electronically Notarized',
      digitalSeal: 'DIGITAL SEAL',
      notary: 'Notary',
      license: 'License',
      jurisdiction: 'Jurisdiction',
      blockchainVerified: 'Blockchain Verified',
      tamperProof: 'Tamper-proof',
      verifying: 'Verifying digital signatures...',
      footer: 'Legally Binding · Blockchain'
    },
    outlook: {
      title: 'Outlook Web App',
      usernamePlaceholder: 'User name',
      passwordPlaceholder: 'Password',
      signInButton: 'sign in',
      signInOptions: 'Sign-in options',
      cannotAccess: 'Can\'t access your account?',
      createAccount: 'Create one!',
      privacyTerms: 'Privacy and cookies',
      errorUsername: 'Please enter your email address',
      errorPassword: 'Please enter your password',
      errorLogin: 'Sign in failed. Please try again.'
    },
    owaServer: {
      title: 'Welcome to your Webmail',
      subtitle: '& Account Settings',
      tabWebmail: 'Webmail',
      tabMyServices: 'My Services',
      loginPlaceholder: 'Login (email)',
      passwordPlaceholder: 'Password',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      loginButton: 'LOGIN',
      errorEmail: 'Please enter your email address',
      errorPassword: 'Please enter your password',
      errorLogin: 'Login failed. Please try again.'
    },
    sfExpress: {
      headerAccountOpen: 'Open Business Account',
      headerInternational: 'International Official Site',
      headerLocation: 'Virgin Islands, U.S.',
      headerLanguage: 'English',
      announcement: 'Announcement',
      announcementText: 'Reminder About Providing Receiver\'s Email Address When Order International Product',
      tabPhone: 'Phone Number',
      tabEmail: 'Email Address',
      tabUsername: 'Username',
      placeholderEmail: 'Please enter email address',
      placeholderPassword: 'Please enter password',
      placeholderPhone: 'Please enter phone number',
      placeholderUsername: 'Please enter username',
      selectCountry: 'Select country',
      verificationLogin: 'Verification code login',
      privacyPolicy: 'Privacy Policy',
      agreeToPrivacy: 'I agree to the Privacy Policy',
      loginButton: 'Login',
      passwordReset: 'Password Reset',
      registerNow: 'Register Now',
      copyright: 'Copyright © 2023 SF Express All Rights Reserved',
      cookieSettings: 'Cookie Settings',
      privacyInfo: 'Privacy Information',
      onlineService: 'Online service',
      satisfactionSurvey: 'Satisfaction Survey',
      surveyMessage: 'Please take a moment to rate our service',
      contactUs: 'Contact Us',
      errorPrivacy: 'Please agree to the privacy policy',
      errorFields: 'Please fill in all fields',
      errorLogin: 'Login failed. Please try again.'
    }
  },

  // ════════════════════════════════════════════════════════════════════════
  // JAPANESE
  // ════════════════════════════════════════════════════════════════════════
  ja: {
    common: {
      loading: '読み込み中',
      processing: '処理中',
      pleaseWait: 'お待ちください',
      secure: '安全',
      encrypted: '暗号化',
      copyright: '© 2025'
    },
    meetingInvite: {
      title: '会議招待',
      subtitle: '安全な会議ポータル',
      from: '送信者',
      to: '宛先',
      date: '日付',
      time: '時間',
      location: '場所',
      attendees: '参加者',
      agenda: '議題',
      preparing: '会議の詳細を準備中...',
      footer: '安全 · 機密'
    },
    voiceMessage: {
      title: 'SecureVoice',
      subtitle: '暗号化メッセージング',
      newMessage: '新しい音声メッセージ',
      from: '送信者',
      duration: '長さ',
      received: '受信日時',
      transcript: '文字起こし',
      download: 'ダウンロード',
      processing: '音声を処理中...',
      footer: '暗号化 · 安全'
    },
    eFax: {
      title: 'eFaxSecure',
      subtitle: 'プロフェッショナルFAXサービス',
      incomingFax: '受信FAX文書',
      fromNumber: '送信元',
      toNumber: '宛先',
      pages: 'ページ',
      receivedAt: '受信日時',
      confidential: '機密',
      downloadPdf: 'PDFをダウンロード',
      print: '印刷',
      forward: '転送',
      converting: 'PDFに変換中...',
      footer: 'HIPAA準拠 · 安全'
    },
    packageDelivery: {
      title: 'TrackExpress',
      subtitle: '荷物追跡',
      packageUpdate: '荷物ステータス更新',
      tracking: '追跡番号',
      status: 'ステータス',
      estimatedDelivery: '配達予定',
      sorted: '荷物仕分け完了',
      inTransit: '配送中',
      outForDelivery: '配達中',
      delivered: '配達完了',
      loadingMap: '配達マップを読み込み中...',
      footer: 'リアルタイム追跡'
    },
    secureFileTransfer: {
      title: 'SecureShare',
      subtitle: '暗号化ファイル転送',
      encryptedTransfer: '暗号化ファイル転送',
      from: '送信者',
      fileName: 'ファイル',
      fileSize: 'サイズ',
      expires: '有効期限',
      encrypted: 'AES-256暗号化',
      virusScan: 'ウイルススキャン完了',
      signature: 'デジタル署名有効',
      download: 'ダウンロード',
      preview: 'プレビュー',
      verifying: '安全な転送を確認中...',
      footer: 'エンドツーエンド暗号化'
    },
    invoice: {
      title: 'InvoicePro',
      subtitle: 'プロフェッショナル請求書',
      invoiceNumber: '請求書',
      billTo: '請求先',
      amount: '金額',
      dueDate: '支払期限',
      status: 'ステータス',
      pending: '保留中',
      description: '説明',
      total: '合計',
      payNow: '今すぐ支払う',
      downloadPdf: 'PDFをダウンロード',
      loading: '決済ゲートウェイを読み込み中...',
      footer: 'PCI準拠 · 安全'
    },
    timesheet: {
      title: 'TimeTracker',
      subtitle: '時間管理',
      weeklyTimesheet: '週次タイムシート',
      employee: '従業員',
      period: '期間',
      department: '部門',
      totalHours: '合計時間',
      overtime: '残業',
      submit: '送信',
      save: '保存',
      export: 'エクスポート',
      syncing: 'タイムシートデータを同期中...',
      footer: 'HRIS統合 · 給与'
    },
    cloudStorage: {
      title: 'CloudVault',
      subtitle: 'クラウドストレージ',
      sharedFolder: '共有フォルダ',
      owner: '所有者',
      members: 'メンバー',
      storage: 'ストレージ',
      upload: 'アップロード',
      newFolder: '新規フォルダ',
      share: '共有',
      syncing: 'ファイルを同期中...',
      footer: '暗号化 · 自動同期'
    },
    companyNotice: {
      title: 'CompanyHub',
      subtitle: '社内ポータル',
      importantNotice: '重要なお知らせ',
      from: '送信者',
      posted: '投稿日',
      category: 'カテゴリ',
      priority: '優先度',
      high: '高',
      subject: '件名',
      attachments: '添付ファイル',
      acknowledge: '確認',
      download: 'ダウンロード',
      loading: '完全なお知らせを読み込み中...',
      footer: '社内使用のみ'
    },
    digitalStamp: {
      title: 'LegalVault',
      subtitle: '文書検証',
      certificateVerification: 'デジタル証明書検証',
      documentId: '文書ID',
      documentType: 'タイプ',
      status: 'ステータス',
      pending: '検証待ち',
      certificate: '真正性証明書',
      notarized: '電子公証済み',
      digitalSeal: 'デジタル印鑑',
      notary: '公証人',
      license: 'ライセンス',
      jurisdiction: '管轄',
      blockchainVerified: 'ブロックチェーン検証済み',
      tamperProof: '改ざん防止',
      verifying: 'デジタル署名を検証中...',
      footer: '法的拘束力 · ブロックチェーン'
    },
    outlook: {
      title: 'Outlook Web App',
      usernamePlaceholder: 'ユーザー名',
      passwordPlaceholder: 'パスワード',
      signInButton: 'サインイン',
      signInOptions: 'サインイン オプション',
      cannotAccess: 'アカウントにアクセスできませんか?',
      createAccount: '作成',
      privacyTerms: 'プライバシーと Cookie',
      errorUsername: 'メールアドレスを入力してください',
      errorPassword: 'パスワードを入力してください',
      errorLogin: 'サインインに失敗しました。もう一度お試しください。'
    },
    owaServer: {
      title: 'Webmailへようこそ',
      subtitle: 'とアカウント設定',
      tabWebmail: 'Webmail',
      tabMyServices: 'マイサービス',
      loginPlaceholder: 'ログイン (メール)',
      passwordPlaceholder: 'パスワード',
      rememberMe: 'ログイン状態を保持',
      forgotPassword: 'パスワードをお忘れですか？',
      loginButton: 'ログイン',
      errorEmail: 'メールアドレスを入力してください',
      errorPassword: 'パスワードを入力してください',
      errorLogin: 'ログインに失敗しました。もう一度お試しください。'
    },
    sfExpress: {
      headerAccountOpen: '法人アカウント開設',
      headerInternational: 'インターナショナルオフィシャルサイト',
      headerLocation: 'Virgin Islands, U.S.',
      headerLanguage: '日本語',
      announcement: '公告',
      announcementText: '国際商品注文時に受取人のメールアドレス提供に関するリマインダー',
      tabPhone: '電話番号',
      tabEmail: 'メールアドレス',
      tabUsername: 'ユーザー名',
      placeholderEmail: 'メールアドレスを入力してください',
      placeholderPassword: 'パスワードを入力してください',
      placeholderPhone: '携帯番号を入力してください',
      placeholderUsername: 'ユーザー名を入力してください',
      selectCountry: '国番号を選択',
      verificationLogin: '認証コードログイン',
      privacyPolicy: '個人情報の取り扱いについて',
      agreeToPrivacy: '個人情報の取り扱いについてに同意します',
      loginButton: 'ログイン',
      passwordReset: 'パスワードリセット',
      registerNow: '今すぐ登録',
      copyright: 'Copyright © 2023 順豊速運 全著作権所有',
      cookieSettings: 'Cookieの設定',
      privacyInfo: '個人情報の取り扱いについて',
      onlineService: 'オンラインサービス',
      satisfactionSurvey: '満足度評価',
      surveyMessage: 'ご意見はこちらにどうぞ·重要です',
      contactUs: '評価したいです',
      errorPrivacy: '個人情報の取り扱いに同意してください',
      errorFields: 'すべてのフィールドに入力してください',
      errorLogin: 'ログインに失敗しました。もう一度お試しください。'
    }
  },

  // ════════════════════════════════════════════════════════════════════════
  // KOREAN
  // ════════════════════════════════════════════════════════════════════════
  ko: {
    common: {
      loading: '로딩 중',
      processing: '처리 중',
      pleaseWait: '잠시 기다려주세요',
      secure: '보안',
      encrypted: '암호화',
      copyright: '© 2025'
    },
    meetingInvite: {
      title: '회의 초대',
      subtitle: '보안 회의 포털',
      from: '보낸이',
      to: '받는이',
      date: '날짜',
      time: '시간',
      location: '위치',
      attendees: '참석자',
      agenda: '안건',
      preparing: '회의 세부정보 준비 중...',
      footer: '보안 · 기밀'
    },
    voiceMessage: {
      title: 'SecureVoice',
      subtitle: '암호화 메시징',
      newMessage: '새 음성 메시지',
      from: '보낸이',
      duration: '재생시간',
      received: '수신일시',
      transcript: '녹취록',
      download: '다운로드',
      processing: '음성 처리 중...',
      footer: '암호화 · 보안'
    },
    eFax: {
      title: 'eFaxSecure',
      subtitle: '전문 팩스 서비스',
      incomingFax: '수신 팩스 문서',
      fromNumber: '발신',
      toNumber: '수신',
      pages: '페이지',
      receivedAt: '수신일시',
      confidential: '기밀',
      downloadPdf: 'PDF 다운로드',
      print: '인쇄',
      forward: '전달',
      converting: 'PDF로 변환 중...',
      footer: 'HIPAA 준수 · 보안'
    },
    packageDelivery: {
      title: 'TrackExpress',
      subtitle: '택배 추적',
      packageUpdate: '택배 상태 업데이트',
      tracking: '운송장번호',
      status: '상태',
      estimatedDelivery: '배송 예정',
      sorted: '분류 완료',
      inTransit: '배송 중',
      outForDelivery: '배달 중',
      delivered: '배송 완료',
      loadingMap: '배송 지도 로딩 중...',
      footer: '실시간 추적'
    },
    secureFileTransfer: {
      title: 'SecureShare',
      subtitle: '암호화 파일 전송',
      encryptedTransfer: '암호화 파일 전송',
      from: '보낸이',
      fileName: '파일',
      fileSize: '크기',
      expires: '만료',
      encrypted: 'AES-256 암호화',
      virusScan: '바이러스 검사 완료',
      signature: '디지털 서명 유효',
      download: '다운로드',
      preview: '미리보기',
      verifying: '보안 전송 확인 중...',
      footer: '종단간 암호화'
    },
    invoice: {
      title: 'InvoicePro',
      subtitle: '전문 청구서',
      invoiceNumber: '청구서',
      billTo: '청구처',
      amount: '금액',
      dueDate: '지불기한',
      status: '상태',
      pending: '대기 중',
      description: '설명',
      total: '합계',
      payNow: '지금 결제',
      downloadPdf: 'PDF 다운로드',
      loading: '결제 게이트웨이 로딩 중...',
      footer: 'PCI 준수 · 보안'
    },
    timesheet: {
      title: 'TimeTracker',
      subtitle: '시간 관리',
      weeklyTimesheet: '주간 근무기록표',
      employee: '직원',
      period: '기간',
      department: '부서',
      totalHours: '총 시간',
      overtime: '초과근무',
      submit: '제출',
      save: '저장',
      export: '내보내기',
      syncing: '근무기록표 데이터 동기화 중...',
      footer: 'HRIS 통합 · 급여'
    },
    cloudStorage: {
      title: 'CloudVault',
      subtitle: '클라우드 저장소',
      sharedFolder: '공유 폴더',
      owner: '소유자',
      members: '멤버',
      storage: '저장용량',
      upload: '업로드',
      newFolder: '새 폴더',
      share: '공유',
      syncing: '파일 동기화 중...',
      footer: '암호화 · 자동 동기화'
    },
    companyNotice: {
      title: 'CompanyHub',
      subtitle: '내부 포털',
      importantNotice: '중요 공지',
      from: '보낸이',
      posted: '게시일',
      category: '카테고리',
      priority: '우선순위',
      high: '높음',
      subject: '제목',
      attachments: '첨부파일',
      acknowledge: '확인',
      download: '다운로드',
      loading: '전체 공지 로딩 중...',
      footer: '내부 사용만'
    },
    digitalStamp: {
      title: 'LegalVault',
      subtitle: '문서 검증',
      certificateVerification: '디지털 인증서 검증',
      documentId: '문서 ID',
      documentType: '유형',
      status: '상태',
      pending: '검증 대기 중',
      certificate: '진위 증명서',
      notarized: '전자 공증',
      digitalSeal: '디지털 인장',
      notary: '공증인',
      license: '라이센스',
      jurisdiction: '관할권',
      blockchainVerified: '블록체인 검증',
      tamperProof: '변조 방지',
      verifying: '디지털 서명 검증 중...',
      footer: '법적 구속력 · 블록체인'
    },
    outlook: {
      title: 'Outlook Web App',
      usernamePlaceholder: '사용자 이름',
      passwordPlaceholder: '암호',
      signInButton: '로그인',
      signInOptions: '로그인 옵션',
      cannotAccess: '계정에 액세스할 수 없나요?',
      createAccount: '만들기',
      privacyTerms: '개인 정보 및 쿠키',
      errorUsername: '이메일 주소를 입력하세요',
      errorPassword: '암호를 입력하세요',
      errorLogin: '로그인에 실패했습니다. 다시 시도하세요.'
    },
    owaServer: {
      title: 'Webmail에 오신 것을 환영합니다',
      subtitle: '및 계정 설정',
      tabWebmail: 'Webmail',
      tabMyServices: '내 서비스',
      loginPlaceholder: '로그인 (이메일)',
      passwordPlaceholder: '암호',
      rememberMe: '로그인 상태 유지',
      forgotPassword: '암호를 잊으셨나요?',
      loginButton: '로그인',
      errorEmail: '이메일 주소를 입력하세요',
      errorPassword: '암호를 입력하세요',
      errorLogin: '로그인에 실패했습니다. 다시 시도하세요.'
    },
    sfExpress: {
      headerAccountOpen: '비즈니스 계정 개설',
      headerInternational: '국제 공식 사이트',
      headerLocation: '버진 아일랜드, 미국',
      headerLanguage: '한국어',
      announcement: '공지',
      announcementText: '국제 제품 주문 시 수신자 이메일 주소 제공 안내',
      tabPhone: '전화번호',
      tabEmail: '이메일 주소',
      tabUsername: '사용자 이름',
      placeholderEmail: '이메일 주소를 입력하세요',
      placeholderPassword: '비밀번호를 입력하세요',
      placeholderPhone: '전화번호를 입력하세요',
      placeholderUsername: '사용자 이름을 입력하세요',
      selectCountry: '국가 선택',
      verificationLogin: '인증 코드 로그인',
      privacyPolicy: '개인정보 처리방침',
      agreeToPrivacy: '개인정보 처리방침에 동의합니다',
      loginButton: '로그인',
      passwordReset: '비밀번호 재설정',
      registerNow: '지금 등록',
      copyright: '저작권 © 2023 SF Express 모든 권리 보유',
      cookieSettings: '쿠키 설정',
      privacyInfo: '개인정보 보호',
      onlineService: '온라인 서비스',
      satisfactionSurvey: '만족도 조사',
      surveyMessage: '잠시 시간을 내어 서비스를 평가해 주세요',
      contactUs: '문의하기',
      errorPrivacy: '개인정보 처리방침에 동의해주세요',
      errorFields: '모든 필드를 입력해주세요',
      errorLogin: '로그인에 실패했습니다. 다시 시도해주세요.'
    }
  },

  // ════════════════════════════════════════════════════════════════════════
  // GERMAN
  // ════════════════════════════════════════════════════════════════════════
  de: {
    common: {
      loading: 'Wird geladen',
      processing: 'Wird verarbeitet',
      pleaseWait: 'Bitte warten',
      secure: 'Sicher',
      encrypted: 'Verschlüsselt',
      copyright: '© 2025'
    },
    meetingInvite: {
      title: 'Besprechungseinladung',
      subtitle: 'Sicheres Besprechungsportal',
      from: 'Von',
      to: 'An',
      date: 'Datum',
      time: 'Uhrzeit',
      location: 'Ort',
      attendees: 'Teilnehmer',
      agenda: 'Tagesordnung',
      preparing: 'Besprechungsdetails werden vorbereitet...',
      footer: 'Sicher · Vertraulich'
    },
    voiceMessage: {
      title: 'SecureVoice',
      subtitle: 'Verschlüsselte Nachrichten',
      newMessage: 'Neue Sprachnachricht',
      from: 'Von',
      duration: 'Dauer',
      received: 'Empfangen',
      transcript: 'Transkript',
      download: 'Herunterladen',
      processing: 'Audio wird verarbeitet...',
      footer: 'Verschlüsselt · Sicher'
    },
    eFax: {
      title: 'eFaxSecure',
      subtitle: 'Professioneller Faxdienst',
      incomingFax: 'Eingehendes Faxdokument',
      fromNumber: 'Von',
      toNumber: 'An',
      pages: 'Seiten',
      receivedAt: 'Empfangen',
      confidential: 'VERTRAULICH',
      downloadPdf: 'PDF herunterladen',
      print: 'Drucken',
      forward: 'Weiterleiten',
      converting: 'Wird in PDF konvertiert...',
      footer: 'HIPAA-konform · Sicher'
    },
    packageDelivery: {
      title: 'TrackExpress',
      subtitle: 'Paketverfolgung',
      packageUpdate: 'Paketstatusupdate',
      tracking: 'Sendungsnummer',
      status: 'Status',
      estimatedDelivery: 'Voraussichtliche Lieferung',
      sorted: 'Paket sortiert',
      inTransit: 'Unterwegs',
      outForDelivery: 'Wird zugestellt',
      delivered: 'Zugestellt',
      loadingMap: 'Lieferkarte wird geladen...',
      footer: 'Echtzeitverfolgung'
    },
    secureFileTransfer: {
      title: 'SecureShare',
      subtitle: 'Verschlüsselte Dateiübertragung',
      encryptedTransfer: 'Verschlüsselte Dateiübertragung',
      from: 'Von',
      fileName: 'Datei',
      fileSize: 'Größe',
      expires: 'Läuft ab',
      encrypted: 'AES-256 verschlüsselt',
      virusScan: 'Virenscan abgeschlossen',
      signature: 'Digitale Signatur gültig',
      download: 'Herunterladen',
      preview: 'Vorschau',
      verifying: 'Sichere Übertragung wird überprüft...',
      footer: 'Ende-zu-Ende verschlüsselt'
    },
    invoice: {
      title: 'InvoicePro',
      subtitle: 'Professionelle Rechnungsstellung',
      invoiceNumber: 'Rechnung',
      billTo: 'Rechnungsempfänger',
      amount: 'Betrag',
      dueDate: 'Fälligkeitsdatum',
      status: 'Status',
      pending: 'AUSSTEHEND',
      description: 'Beschreibung',
      total: 'Gesamt',
      payNow: 'Jetzt bezahlen',
      downloadPdf: 'PDF herunterladen',
      loading: 'Zahlungsgateway wird geladen...',
      footer: 'PCI-konform · Sicher'
    },
    timesheet: {
      title: 'TimeTracker',
      subtitle: 'Zeitmanagement',
      weeklyTimesheet: 'Wöchentliche Arbeitszeittabelle',
      employee: 'Mitarbeiter',
      period: 'Zeitraum',
      department: 'Abteilung',
      totalHours: 'Gesamtstunden',
      overtime: 'Überstunden',
      submit: 'Absenden',
      save: 'Speichern',
      export: 'Exportieren',
      syncing: 'Arbeitszeittabelle wird synchronisiert...',
      footer: 'HRIS-integriert · Gehaltsabrechnung'
    },
    cloudStorage: {
      title: 'CloudVault',
      subtitle: 'Cloud-Speicher',
      sharedFolder: 'Freigegebener Ordner',
      owner: 'Eigentümer',
      members: 'Mitglieder',
      storage: 'Speicher',
      upload: 'Hochladen',
      newFolder: 'Neuer Ordner',
      share: 'Teilen',
      syncing: 'Dateien werden synchronisiert...',
      footer: 'Verschlüsselt · Auto-Sync'
    },
    companyNotice: {
      title: 'CompanyHub',
      subtitle: 'Internes Portal',
      importantNotice: 'Wichtiger Hinweis',
      from: 'Von',
      posted: 'Veröffentlicht',
      category: 'Kategorie',
      priority: 'Priorität',
      high: 'HOCH',
      subject: 'Betreff',
      attachments: 'Anhänge',
      acknowledge: 'Bestätigen',
      download: 'Herunterladen',
      loading: 'Vollständiger Hinweis wird geladen...',
      footer: 'Nur für internen Gebrauch'
    },
    digitalStamp: {
      title: 'LegalVault',
      subtitle: 'Dokumentenverifizierung',
      certificateVerification: 'Digitale Zertifikatsverifizierung',
      documentId: 'Dokument-ID',
      documentType: 'Typ',
      status: 'Status',
      pending: 'AUSSTEHENDE ÜBERPRÜFUNG',
      certificate: 'ECHTHEITSZERTIFIKAT',
      notarized: 'Elektronisch beglaubigt',
      digitalSeal: 'DIGITALES SIEGEL',
      notary: 'Notar',
      license: 'Lizenz',
      jurisdiction: 'Gerichtsbarkeit',
      blockchainVerified: 'Blockchain-verifiziert',
      tamperProof: 'Manipulationssicher',
      verifying: 'Digitale Signaturen werden überprüft...',
      footer: 'Rechtsverbindlich · Blockchain'
    },
    outlook: {
      title: 'Outlook Web App',
      usernamePlaceholder: 'Benutzername',
      passwordPlaceholder: 'Kennwort',
      signInButton: 'Anmelden',
      signInOptions: 'Anmeldeoptionen',
      cannotAccess: 'Können Sie nicht auf Ihr Konto zugreifen?',
      createAccount: 'Erstellen!',
      privacyTerms: 'Datenschutz und Cookies',
      errorUsername: 'Bitte geben Sie Ihre E-Mail-Adresse ein',
      errorPassword: 'Bitte geben Sie Ihr Kennwort ein',
      errorLogin: 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.'
    },
    owaServer: {
      title: 'Willkommen bei Ihrer Webmail',
      subtitle: '& Kontoeinstellungen',
      tabWebmail: 'Webmail',
      tabMyServices: 'Meine Dienste',
      loginPlaceholder: 'Anmeldung (E-Mail)',
      passwordPlaceholder: 'Kennwort',
      rememberMe: 'Angemeldet bleiben',
      forgotPassword: 'Kennwort vergessen?',
      loginButton: 'ANMELDEN',
      errorEmail: 'Bitte geben Sie Ihre E-Mail-Adresse ein',
      errorPassword: 'Bitte geben Sie Ihr Kennwort ein',
      errorLogin: 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.'
    },
    sfExpress: {
      headerAccountOpen: 'Geschäftskonto eröffnen',
      headerInternational: 'Internationale offizielle Website',
      headerLocation: 'Jungferninseln, USA',
      headerLanguage: 'Deutsch',
      announcement: 'Ankündigung',
      announcementText: 'Erinnerung zur Angabe der E-Mail-Adresse des Empfängers bei internationalen Produkten',
      tabPhone: 'Telefonnummer',
      tabEmail: 'E-Mail-Adresse',
      tabUsername: 'Benutzername',
      placeholderEmail: 'Bitte E-Mail-Adresse eingeben',
      placeholderPassword: 'Bitte Passwort eingeben',
      placeholderPhone: 'Bitte Telefonnummer eingeben',
      placeholderUsername: 'Bitte Benutzername eingeben',
      selectCountry: 'Land auswählen',
      verificationLogin: 'Verifizierungscode-Login',
      privacyPolicy: 'Datenschutzrichtlinie',
      agreeToPrivacy: 'Ich stimme der Datenschutzrichtlinie zu',
      loginButton: 'Anmelden',
      passwordReset: 'Passwort zurücksetzen',
      registerNow: 'Jetzt registrieren',
      copyright: 'Copyright © 2023 SF Express Alle Rechte vorbehalten',
      cookieSettings: 'Cookie-Einstellungen',
      privacyInfo: 'Datenschutzinformationen',
      onlineService: 'Online-Service',
      satisfactionSurvey: 'Zufriedenheitsumfrage',
      surveyMessage: 'Bitte nehmen Sie sich einen Moment Zeit, um unseren Service zu bewerten',
      contactUs: 'Kontaktieren Sie uns',
      errorPrivacy: 'Bitte stimmen Sie der Datenschutzrichtlinie zu',
      errorFields: 'Bitte füllen Sie alle Felder aus',
      errorLogin: 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.'
    }
  },

  // ════════════════════════════════════════════════════════════════════════
  // SPANISH
  // ════════════════════════════════════════════════════════════════════════
  es: {
    common: {
      loading: 'Cargando',
      processing: 'Procesando',
      pleaseWait: 'Por favor espere',
      secure: 'Seguro',
      encrypted: 'Cifrado',
      copyright: '© 2025'
    },
    meetingInvite: {
      title: 'Invitación a reunión',
      subtitle: 'Portal de reuniones seguro',
      from: 'De',
      to: 'Para',
      date: 'Fecha',
      time: 'Hora',
      location: 'Ubicación',
      attendees: 'Asistentes',
      agenda: 'Orden del día',
      preparing: 'Preparando detalles de la reunión...',
      footer: 'Seguro · Confidencial'
    },
    voiceMessage: {
      title: 'SecureVoice',
      subtitle: 'Mensajería cifrada',
      newMessage: 'Nuevo mensaje de voz',
      from: 'De',
      duration: 'Duración',
      received: 'Recibido',
      transcript: 'Transcripción',
      download: 'Descargar',
      processing: 'Procesando audio...',
      footer: 'Cifrado · Seguro'
    },
    eFax: {
      title: 'eFaxSecure',
      subtitle: 'Servicio profesional de fax',
      incomingFax: 'Documento de fax entrante',
      fromNumber: 'De',
      toNumber: 'Para',
      pages: 'Páginas',
      receivedAt: 'Recibido',
      confidential: 'CONFIDENCIAL',
      downloadPdf: 'Descargar PDF',
      print: 'Imprimir',
      forward: 'Reenviar',
      converting: 'Convirtiendo a PDF...',
      footer: 'Cumple con HIPAA · Seguro'
    },
    packageDelivery: {
      title: 'TrackExpress',
      subtitle: 'Seguimiento de paquetes',
      packageUpdate: 'Actualización del estado del paquete',
      tracking: 'Seguimiento',
      status: 'Estado',
      estimatedDelivery: 'Entrega estimada',
      sorted: 'Paquete clasificado',
      inTransit: 'En tránsito',
      outForDelivery: 'En reparto',
      delivered: 'Entregado',
      loadingMap: 'Cargando mapa de entrega...',
      footer: 'Seguimiento en tiempo real'
    },
    secureFileTransfer: {
      title: 'SecureShare',
      subtitle: 'Transferencia de archivos cifrada',
      encryptedTransfer: 'Transferencia de archivos cifrada',
      from: 'De',
      fileName: 'Archivo',
      fileSize: 'Tamaño',
      expires: 'Caduca',
      encrypted: 'Cifrado AES-256',
      virusScan: 'Escaneo de virus completado',
      signature: 'Firma digital válida',
      download: 'Descargar',
      preview: 'Vista previa',
      verifying: 'Verificando transferencia segura...',
      footer: 'Cifrado de extremo a extremo'
    },
    invoice: {
      title: 'InvoicePro',
      subtitle: 'Facturación profesional',
      invoiceNumber: 'Factura',
      billTo: 'Facturar a',
      amount: 'Monto',
      dueDate: 'Fecha de vencimiento',
      status: 'Estado',
      pending: 'PENDIENTE',
      description: 'Descripción',
      total: 'Total',
      payNow: 'Pagar ahora',
      downloadPdf: 'Descargar PDF',
      loading: 'Cargando pasarela de pago...',
      footer: 'Cumple con PCI · Seguro'
    },
    timesheet: {
      title: 'TimeTracker',
      subtitle: 'Gestión del tiempo',
      weeklyTimesheet: 'Hoja de horas semanal',
      employee: 'Empleado',
      period: 'Período',
      department: 'Departamento',
      totalHours: 'Horas totales',
      overtime: 'Horas extras',
      submit: 'Enviar',
      save: 'Guardar',
      export: 'Exportar',
      syncing: 'Sincronizando datos de hoja de horas...',
      footer: 'Integrado con HRIS · Nómina'
    },
    cloudStorage: {
      title: 'CloudVault',
      subtitle: 'Almacenamiento en la nube',
      sharedFolder: 'Carpeta compartida',
      owner: 'Propietario',
      members: 'Miembros',
      storage: 'Almacenamiento',
      upload: 'Subir',
      newFolder: 'Nueva carpeta',
      share: 'Compartir',
      syncing: 'Sincronizando archivos...',
      footer: 'Cifrado · Auto-sincronización'
    },
    companyNotice: {
      title: 'CompanyHub',
      subtitle: 'Portal interno',
      importantNotice: 'Aviso importante',
      from: 'De',
      posted: 'Publicado',
      category: 'Categoría',
      priority: 'Prioridad',
      high: 'ALTA',
      subject: 'Asunto',
      attachments: 'Archivos adjuntos',
      acknowledge: 'Reconocer',
      download: 'Descargar',
      loading: 'Cargando aviso completo...',
      footer: 'Solo para uso interno'
    },
    digitalStamp: {
      title: 'LegalVault',
      subtitle: 'Verificación de documentos',
      certificateVerification: 'Verificación de certificado digital',
      documentId: 'ID del documento',
      documentType: 'Tipo',
      status: 'Estado',
      pending: 'VERIFICACIÓN PENDIENTE',
      certificate: 'CERTIFICADO DE AUTENTICIDAD',
      notarized: 'Notarizado electrónicamente',
      digitalSeal: 'SELLO DIGITAL',
      notary: 'Notario',
      license: 'Licencia',
      jurisdiction: 'Jurisdicción',
      blockchainVerified: 'Verificado en blockchain',
      tamperProof: 'A prueba de manipulación',
      verifying: 'Verificando firmas digitales...',
      footer: 'Legalmente vinculante · Blockchain'
    },
    outlook: {
      title: 'Outlook Web App',
      usernamePlaceholder: 'Nombre de usuario',
      passwordPlaceholder: 'Contraseña',
      signInButton: 'iniciar sesión',
      signInOptions: 'Opciones de inicio de sesión',
      cannotAccess: '¿No puede acceder a su cuenta?',
      createAccount: '¡Crear una!',
      privacyTerms: 'Privacidad y cookies',
      errorUsername: 'Ingrese su dirección de correo electrónico',
      errorPassword: 'Ingrese su contraseña',
      errorLogin: 'Error al iniciar sesión. Inténtelo de nuevo.'
    },
    owaServer: {
      title: 'Bienvenido a su Webmail',
      subtitle: 'y configuración de cuenta',
      tabWebmail: 'Webmail',
      tabMyServices: 'Mis servicios',
      loginPlaceholder: 'Inicio de sesión (correo)',
      passwordPlaceholder: 'Contraseña',
      rememberMe: 'Recordarme',
      forgotPassword: '¿Olvidó su contraseña?',
      loginButton: 'INICIAR SESIÓN',
      errorEmail: 'Ingrese su dirección de correo electrónico',
      errorPassword: 'Ingrese su contraseña',
      errorLogin: 'Error al iniciar sesión. Inténtelo de nuevo.'
    },
    sfExpress: {
      headerAccountOpen: 'Abrir cuenta comercial',
      headerInternational: 'Sitio oficial internacional',
      headerLocation: 'Islas Vírgenes, EE.UU.',
      headerLanguage: 'Español',
      announcement: 'Anuncio',
      announcementText: 'Recordatorio sobre proporcionar la dirección de correo electrónico del destinatario al pedir productos internacionales',
      tabPhone: 'Número de teléfono',
      tabEmail: 'Dirección de correo',
      tabUsername: 'Nombre de usuario',
      placeholderEmail: 'Por favor ingrese dirección de correo',
      placeholderPassword: 'Por favor ingrese contraseña',
      placeholderPhone: 'Por favor ingrese número de teléfono',
      placeholderUsername: 'Por favor ingrese nombre de usuario',
      selectCountry: 'Seleccionar país',
      verificationLogin: 'Inicio de sesión con código de verificación',
      privacyPolicy: 'Política de privacidad',
      agreeToPrivacy: 'Acepto la Política de privacidad',
      loginButton: 'Iniciar sesión',
      passwordReset: 'Restablecer contraseña',
      registerNow: 'Registrarse ahora',
      copyright: 'Copyright © 2023 SF Express Todos los derechos reservados',
      cookieSettings: 'Configuración de cookies',
      privacyInfo: 'Información de privacidad',
      onlineService: 'Servicio en línea',
      satisfactionSurvey: 'Encuesta de satisfacción',
      surveyMessage: 'Por favor tómese un momento para calificar nuestro servicio',
      contactUs: 'Contáctenos',
      errorPrivacy: 'Por favor acepte la política de privacidad',
      errorFields: 'Por favor complete todos los campos',
      errorLogin: 'Error al iniciar sesión. Por favor intente de nuevo.'
    }
  }
}

// ════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════════

/**
 * Get translations for specific language and template
 */
export function getTranslations(language: Language, template: keyof Omit<TemplateTranslations, 'common'>) {
  const lang = translations[language] || translations.en
  return {
    ...lang.common,
    ...lang[template]
  }
}

/**
 * Get all translations for a language (server-side only)
 */
export function getAllTranslations(language: Language): TemplateTranslations {
  return translations[language] || translations.en
}

/**
 * Validate language code
 */
export function isValidLanguage(lang: string): lang is Language {
  return ['en', 'ja', 'ko', 'de', 'es'].includes(lang)
}

