/**
 * MICRO HUMAN VERIFICATION - Phase 5.11
 * 
 * Collects micro-interaction signals for human verification
 * - Mouse path jitter (variance)
 * - Scroll velocity change rate
 * - Hover durations
 * - Micro delay before interacting
 * 
 * SAFETY: Only sends positive signals, never blocks
 */

(function() {
  'use strict';
  
  // Configuration
  const API_ENDPOINT = '/api/behavior/micro';
  const COLLECTION_INTERVAL = 2000; // Collect for 2 seconds
  const MIN_SIGNALS = 3; // Minimum signals before sending
  
  // State
  let mousePath = [];
  let scrollVelocities = [];
  let hoverStartTime = null;
  let hoverDurations = [];
  let lastInteractionTime = null;
  let clickDelays = [];
  let scrollPauses = [];
  let mousePositions = [];
  let lastMouseTime = null;
  
  // === MOUSE PATH JITTER TRACKING ===
  function trackMousePath(e) {
    const now = Date.now();
    const pos = { x: e.clientX, y: e.clientY, time: now };
    
    if (mousePositions.length > 0) {
      const lastPos = mousePositions[mousePositions.length - 1];
      const dx = pos.x - lastPos.x;
      const dy = pos.y - lastPos.y;
      const dt = pos.time - lastPos.time;
      
      if (dt > 0) {
        const velocity = Math.sqrt(dx * dx + dy * dy) / dt;
        mousePath.push(velocity);
      }
    }
    
    mousePositions.push(pos);
    
    // Keep only last 50 positions
    if (mousePositions.length > 50) {
      mousePositions.shift();
    }
    if (mousePath.length > 50) {
      mousePath.shift();
    }
    
    lastMouseTime = now;
  }
  
  // === SCROLL VELOCITY TRACKING ===
  let lastScrollTime = null;
  let lastScrollY = window.scrollY;
  
  function trackScroll(e) {
    const now = Date.now();
    const currentY = window.scrollY;
    const dy = Math.abs(currentY - lastScrollY);
    const dt = now - (lastScrollTime || now);
    
    if (dt > 0 && dt < 100) {
      const velocity = dy / dt;
      scrollVelocities.push(velocity);
      
      // Track pauses
      if (lastScrollTime && now - lastScrollTime > 100) {
        scrollPauses.push(now - lastScrollTime);
      }
    }
    
    lastScrollY = currentY;
    lastScrollTime = now;
    
    // Keep only last 30 velocities
    if (scrollVelocities.length > 30) {
      scrollVelocities.shift();
    }
    if (scrollPauses.length > 20) {
      scrollPauses.shift();
    }
  }
  
  // === HOVER DURATION TRACKING ===
  function trackHoverStart(e) {
    hoverStartTime = Date.now();
  }
  
  function trackHoverEnd(e) {
    if (hoverStartTime) {
      const duration = Date.now() - hoverStartTime;
      if (duration > 50) { // Only track meaningful hovers
        hoverDurations.push(duration);
      }
      hoverStartTime = null;
    }
  }
  
  // === CLICK DELAY TRACKING ===
  let mouseDownTime = null;
  
  function trackMouseDown(e) {
    mouseDownTime = Date.now();
    lastInteractionTime = Date.now();
  }
  
  function trackMouseUp(e) {
    if (mouseDownTime) {
      const delay = Date.now() - mouseDownTime;
      if (delay > 10 && delay < 500) {
        clickDelays.push(delay);
      }
      mouseDownTime = null;
    }
    lastInteractionTime = Date.now();
  }
  
  // === CALCULATE SIGNALS ===
  function calculateJitterVariance() {
    if (mousePath.length < 5) return 0;
    
    // Calculate variance in mouse velocities
    const mean = mousePath.reduce((a, b) => a + b, 0) / mousePath.length;
    const variance = mousePath.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / mousePath.length;
    
    return variance;
  }
  
  function calculateScrollCurveVar() {
    if (scrollVelocities.length < 5) return 0;
    
    // Calculate variance in scroll velocities (curves)
    const mean = scrollVelocities.reduce((a, b) => a + b, 0) / scrollVelocities.length;
    const variance = scrollVelocities.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / scrollVelocities.length;
    
    return variance;
  }
  
  function calculatePointerCurvature() {
    if (mousePositions.length < 10) return 0;
    
    // Calculate curvature by measuring deviation from straight lines
    let totalCurvature = 0;
    let count = 0;
    
    for (let i = 2; i < mousePositions.length; i++) {
      const p1 = mousePositions[i - 2];
      const p2 = mousePositions[i - 1];
      const p3 = mousePositions[i];
      
      // Calculate angle change
      const dx1 = p2.x - p1.x;
      const dy1 = p2.y - p1.y;
      const dx2 = p3.x - p2.x;
      const dy2 = p3.y - p2.y;
      
      const angle1 = Math.atan2(dy1, dx1);
      const angle2 = Math.atan2(dy2, dx2);
      const angleDiff = Math.abs(angle2 - angle1);
      
      totalCurvature += Math.min(angleDiff, Math.PI - angleDiff);
      count++;
    }
    
    return count > 0 ? totalCurvature / count : 0;
  }
  
  function calculateHesitationTime() {
    if (!lastInteractionTime) return 0;
    
    // Time since last interaction (hesitation before next action)
    const timeSinceLastInteraction = Date.now() - lastInteractionTime;
    
    // Only return if within reasonable range
    if (timeSinceLastInteraction >= 50 && timeSinceLastInteraction <= 2000) {
      return timeSinceLastInteraction;
    }
    
    return 0;
  }
  
  // === SEND SIGNALS TO API ===
  function sendMicroSignals() {
    const jitterVariance = calculateJitterVariance();
    const scrollCurveVar = calculateScrollCurveVar();
    const pointerCurvature = calculatePointerCurvature();
    const hesitationTime = calculateHesitationTime();
    
    // Only send if we have meaningful signals
    const hasSignals = 
      jitterVariance > 0 ||
      scrollCurveVar > 0 ||
      pointerCurvature > 0 ||
      hesitationTime > 0 ||
      hoverDurations.length > 0;
    
    if (!hasSignals) {
      return;
    }
    
    const signals = {
      jitterVariance: jitterVariance > 0 ? jitterVariance : undefined,
      scrollCurveVar: scrollCurveVar > 0 ? scrollCurveVar : undefined,
      pointerCurvature: pointerCurvature > 0 ? pointerCurvature : undefined,
      hesitationTime: hesitationTime > 0 ? hesitationTime : undefined,
      hoverDurations: hoverDurations.length > 0 ? hoverDurations : undefined,
      clickDelay: clickDelays.length > 0 ? clickDelays.reduce((a, b) => a + b, 0) / clickDelays.length : undefined,
      scrollPauses: scrollPauses.length > 0 ? scrollPauses : undefined,
      mouseAcceleration: mousePath.length > 5 ? calculateJitterVariance() / 100 : undefined,
    };
    
    // Remove undefined values
    Object.keys(signals).forEach(key => {
      if (signals[key] === undefined) {
        delete signals[key];
      }
    });
    
    // Send to API
    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signals),
    }).catch(() => {
      // Silent fail - micro signals are optional
    });
  }
  
  // === EVENT LISTENERS ===
  document.addEventListener('mousemove', trackMousePath, { passive: true });
  document.addEventListener('scroll', trackScroll, { passive: true });
  document.addEventListener('mouseenter', trackHoverStart, { passive: true });
  document.addEventListener('mouseleave', trackHoverEnd, { passive: true });
  document.addEventListener('mousedown', trackMouseDown, { passive: true });
  document.addEventListener('mouseup', trackMouseUp, { passive: true });
  
  // Track hover on interactive elements
  document.addEventListener('mouseover', function(e) {
    if (e.target && (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button') || e.target.closest('a'))) {
      trackHoverStart(e);
    }
  }, { passive: true });
  
  document.addEventListener('mouseout', function(e) {
    if (e.target && (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button') || e.target.closest('a'))) {
      trackHoverEnd(e);
    }
  }, { passive: true });
  
  // === PERIODIC SENDING ===
  // Send signals every 2 seconds if we have data
  setInterval(() => {
    if (mousePath.length >= MIN_SIGNALS || scrollVelocities.length >= MIN_SIGNALS || hoverDurations.length > 0) {
      sendMicroSignals();
    }
  }, COLLECTION_INTERVAL);
  
  // Send on page unload
  window.addEventListener('beforeunload', () => {
    sendMicroSignals();
  });
  
})();






