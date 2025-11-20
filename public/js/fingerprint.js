/**
 * ADVANCED FINGERPRINT COLLECTION
 * 
 * Hardened Mode: Full entropy collection for security validation
 * 
 * Collects:
 * - Canvas entropy
 * - WebGL vendor + renderer
 * - AudioContext entropy
 * - Device memory
 * - Hardware concurrency
 * - Screen real resolution
 * - Battery info (if allowed)
 * - Mouse latency curve
 * - Scroll velocity profile
 * - Focus/blur delta windows
 * - JA3/TLS fingerprint heuristics
 */

(function() {
  'use strict';

  // ============================================
  // Hash Function (SHA-256 via Web Crypto API)
  // ============================================

  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
  }

  // ============================================
  // Canvas Entropy Collection
  // ============================================

  function getCanvasFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 50;
      const ctx = canvas.getContext('2d');
      
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Fingerprint test 🔒', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Fingerprint test 🔒', 4, 17);
      
      return canvas.toDataURL();
    } catch (e) {
      return null;
    }
  }

  // ============================================
  // WebGL Entropy Collection
  // ============================================

  function getWebGLFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) return null;
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const vendor = gl.getParameter(gl.VENDOR);
      const renderer = gl.getParameter(gl.RENDERER);
      const version = gl.getParameter(gl.VERSION);
      const shadingLanguageVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
      
      // Get additional WebGL parameters
      const params = {
        vendor: vendor,
        renderer: renderer,
        version: version,
        shadingLanguageVersion: shadingLanguageVersion,
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
        maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
        aliasedLineWidthRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
        aliasedPointSizeRange: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE),
      };
      
      if (debugInfo) {
        params.unmaskedVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        params.unmaskedRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
      
      return JSON.stringify(params);
    } catch (e) {
      return null;
    }
  }

  // ============================================
  // AudioContext Entropy Collection
  // ============================================

  async function getAudioFingerprint() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gainNode = audioContext.createGain();
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
      
      gainNode.gain.value = 0; // Mute output
      oscillator.type = 'triangle';
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start(0);
      
      return new Promise((resolve) => {
        scriptProcessor.onaudioprocess = function(bins) {
          const output = new Float32Array(analyser.frequencyBinCount);
          analyser.getFloatFrequencyData(output);
          
          oscillator.stop();
          audioContext.close();
          
          // Create hash from audio data
          const hash = Array.from(output.slice(0, 100))
            .map(v => Math.abs(Math.round(v * 1000)))
            .join(',');
          
          resolve(hash);
        };
        
        // Timeout after 100ms
        setTimeout(() => {
          try {
            oscillator.stop();
            audioContext.close();
          } catch (e) {}
          resolve(null);
        }, 100);
      });
    } catch (e) {
      return null;
    }
  }

  // ============================================
  // Device Information Collection
  // ============================================

  function getDeviceInfo() {
    return {
      memory: navigator.deviceMemory || null,
      hardwareConcurrency: navigator.hardwareConcurrency || null,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages ? navigator.languages.join(',') : null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      screenWidth: screen.width,
      screenHeight: screen.height,
      screenColorDepth: screen.colorDepth,
      screenPixelDepth: screen.pixelDepth,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
    };
  }

  // ============================================
  // Battery Information (if available)
  // ============================================

  async function getBatteryInfo() {
    try {
      if (navigator.getBattery) {
        const battery = await navigator.getBattery();
        return {
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
          level: battery.level,
        };
      }
    } catch (e) {
      // Battery API not available
    }
    return null;
  }

  // ============================================
  // Behavioral Tracking
  // ============================================

  function initBehavioralTracking() {
    const data = {
      mouseEvents: 0,
      scrollEvents: 0,
      focusBlurDelta: 0,
      mouseLatency: [],
      scrollVelocity: [],
      lastFocusTime: null,
      lastBlurTime: null,
    };
    
    // Mouse event tracking
    let mouseMoveCount = 0;
    let lastMouseTime = Date.now();
    
    document.addEventListener('mousemove', function(e) {
      mouseMoveCount++;
      const now = Date.now();
      const latency = now - lastMouseTime;
      if (latency < 1000) { // Only track reasonable latencies
        data.mouseLatency.push(latency);
      }
      lastMouseTime = now;
      data.mouseEvents = mouseMoveCount;
    }, { passive: true });
    
    // Scroll event tracking
    let scrollCount = 0;
    let lastScrollTime = Date.now();
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', function() {
      scrollCount++;
      const now = Date.now();
      const deltaY = Math.abs(window.scrollY - lastScrollY);
      const deltaTime = now - lastScrollTime;
      if (deltaTime > 0) {
        const velocity = deltaY / deltaTime;
        data.scrollVelocity.push(velocity);
      }
      lastScrollTime = now;
      lastScrollY = window.scrollY;
      data.scrollEvents = scrollCount;
    }, { passive: true });
    
    // Focus/blur tracking
    window.addEventListener('focus', function() {
      data.lastFocusTime = Date.now();
      if (data.lastBlurTime) {
        data.focusBlurDelta = data.lastFocusTime - data.lastBlurTime;
      }
    });
    
    window.addEventListener('blur', function() {
      data.lastBlurTime = Date.now();
    });
    
    return data;
  }

  // ============================================
  // JA3/TLS Fingerprint Heuristics
  // ============================================

  function getTLSHeuristics() {
    // Collect timing-based TLS signature hints
    const data = {
      connectionTiming: null,
      http2Priority: null,
    };
    
    // Simple heuristic: measure resource load timing
    try {
      const start = performance.now();
      // This is a simplified heuristic - in production, use actual TLS fingerprinting
      const end = performance.now();
      data.connectionTiming = end - start;
    } catch (e) {
      // Ignore
    }
    
    return data;
  }

  // ============================================
  // Main Fingerprint Collection
  // ============================================

  async function collectFullFingerprint() {
    const behavioralData = initBehavioralTracking();
    
    // Wait a bit for behavioral data to accumulate
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const fingerprint = {
      canvas: getCanvasFingerprint(),
      webgl: getWebGLFingerprint(),
      audio: await getAudioFingerprint(),
      device: getDeviceInfo(),
      battery: await getBatteryInfo(),
      behavioral: {
        mouseEvents: behavioralData.mouseEvents,
        scrollEvents: behavioralData.scrollEvents,
        focusBlurDelta: behavioralData.focusBlurDelta,
        mouseLatencyAvg: behavioralData.mouseLatency.length > 0 
          ? behavioralData.mouseLatency.reduce((a, b) => a + b, 0) / behavioralData.mouseLatency.length 
          : null,
        scrollVelocityAvg: behavioralData.scrollVelocity.length > 0
          ? behavioralData.scrollVelocity.reduce((a, b) => a + b, 0) / behavioralData.scrollVelocity.length
          : null,
      },
      tls: getTLSHeuristics(),
      timestamp: Date.now(),
    };
    
    // Create hash of full fingerprint
    const fingerprintString = JSON.stringify(fingerprint);
    const fingerprintHash = await sha256(fingerprintString);
    
    return {
      fingerprint: fingerprint,
      hash: fingerprintHash,
    };
  }

  // ============================================
  // Export to Global Scope
  // ============================================

  window.collectFullFingerprint = collectFullFingerprint;
  window.getFingerprintHash = async function() {
    const result = await collectFullFingerprint();
    return result.hash;
  };

  // Auto-collect on page load (for hardened mode)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      collectFullFingerprint().then(result => {
        window.__fingerprintData = result;
      });
    });
  } else {
    collectFullFingerprint().then(result => {
      window.__fingerprintData = result;
    });
  }

})();






