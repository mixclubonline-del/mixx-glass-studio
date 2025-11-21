/**
 * Flow Sound Diagnostic Script
 * 
 * Run this in the browser console to diagnose why audio isn't working.
 * 
 * Usage:
 * 1. Open browser DevTools (F12)
 * 2. Go to Console tab
 * 3. Copy and paste this entire script
 * 4. Press Enter
 * 
 * The script will check all critical points in the audio signal path.
 */

(function() {
  console.log('%c🔍 FLOW SOUND DIAGNOSTIC', 'font-size: 16px; font-weight: bold; color: #9333ea;');
  console.log('='.repeat(60));
  
  // Access React component state via window (if exposed) or DOM
  // Note: This assumes the App component exposes refs or we can access them via React DevTools
  
  const issues = [];
  const warnings = [];
  const info = [];
  
  // Check 1: AudioContext
  console.group('1️⃣ AudioContext State');
  const audioContext = window.__audioContext || document.querySelector('audio')?.context;
  if (audioContext) {
    console.log('✅ AudioContext found');
    console.log('   State:', audioContext.state);
    console.log('   Sample Rate:', audioContext.sampleRate, 'Hz');
    console.log('   Current Time:', audioContext.currentTime.toFixed(2), 's');
    
    if (audioContext.state === 'suspended') {
      warnings.push('AudioContext is suspended - click play button to resume');
    } else if (audioContext.state === 'closed') {
      issues.push('AudioContext is closed - audio system needs restart');
    } else if (audioContext.state === 'running') {
      info.push('AudioContext is running ✅');
    }
  } else {
    issues.push('AudioContext not found - audio system not initialized');
  }
  console.groupEnd();
  
  // Check 2: Master Chain (if accessible)
  console.group('2️⃣ Master Chain');
  console.log('⚠️ Master chain check requires React DevTools or exposed refs');
  console.log('   To check manually:');
  console.log('   1. Open React DevTools');
  console.log('   2. Find App component');
  console.log('   3. Check masterNodesRef.current');
  console.log('   4. Verify: input, output, masterGain exist');
  console.groupEnd();
  
  // Check 3: TranslationMatrix (if accessible)
  console.group('3️⃣ TranslationMatrix');
  console.log('⚠️ TranslationMatrix check requires React DevTools');
  console.log('   To check manually:');
  console.log('   1. Open React DevTools');
  console.log('   2. Find App component');
  console.log('   3. Check translationMatrixRef.current');
  console.log('   4. Verify: attached === true');
  console.groupEnd();
  
  // Check 4: Browser Console Errors
  console.group('4️⃣ Browser Console Errors');
  console.log('📋 Check the console for these error patterns:');
  console.log('   ❌ [AUDIO] ❌ Master input missing');
  console.log('   ❌ [AUDIO] Skipping clip: missing nodes or buffer');
  console.log('   ❌ [AUDIO] Cannot schedule clips: No audio buffers loaded');
  console.log('   ❌ [MIXER] ❌ Cannot flush routes');
  console.log('   ❌ [AUDIO] AudioContext is null');
  console.groupEnd();
  
  // Check 5: Network Tab
  console.group('5️⃣ Audio File Loading');
  console.log('📋 Check Network tab for:');
  console.log('   - Audio files loading successfully (200 status)');
  console.log('   - No CORS errors');
  console.log('   - Audio files are decoded (check Application tab > IndexedDB)');
  console.groupEnd();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.group('%c📊 DIAGNOSTIC SUMMARY', 'font-size: 14px; font-weight: bold;');
  
  if (issues.length > 0) {
    console.group('%c❌ CRITICAL ISSUES', 'color: red; font-weight: bold;');
    issues.forEach(issue => console.error('  •', issue));
    console.groupEnd();
  }
  
  if (warnings.length > 0) {
    console.group('%c⚠️ WARNINGS', 'color: orange; font-weight: bold;');
    warnings.forEach(warning => console.warn('  •', warning));
    console.groupEnd();
  }
  
  if (info.length > 0) {
    console.group('%cℹ️ INFO', 'color: blue; font-weight: bold;');
    info.forEach(i => console.info('  •', i));
    console.groupEnd();
  }
  
  if (issues.length === 0 && warnings.length === 0) {
    console.log('%c✅ No obvious issues found in accessible checks', 'color: green; font-weight: bold;');
    console.log('   Use React DevTools to check component state');
  }
  
  console.groupEnd();
  
  // Manual Check Instructions
  console.log('\n' + '='.repeat(60));
  console.group('%c📝 MANUAL CHECKS REQUIRED', 'font-size: 14px; font-weight: bold;');
  console.log('To fully diagnose, you need to check React component state:');
  console.log('');
  console.log('1. Install React DevTools browser extension');
  console.log('2. Open React DevTools (Components tab)');
  console.log('3. Find the App component');
  console.log('4. Check these refs in the component:');
  console.log('   • audioContextRef.current');
  console.log('   • masterNodesRef.current');
  console.log('   • translationMatrixRef.current');
  console.log('   • trackNodesRef.current');
  console.log('   • clips (state)');
  console.log('   • audioBuffers (state)');
  console.log('   • mixerSettings (state)');
  console.log('   • isPlaying (state)');
  console.log('');
  console.log('Or use the diagnostic code in FLOW_SOUND_DIAGNOSTIC_REPORT.md');
  console.groupEnd();
  
  console.log('\n' + '='.repeat(60));
  console.log('%c💡 TIP: Check FLOW_SOUND_DIAGNOSTIC_REPORT.md for detailed analysis', 'color: #9333ea; font-style: italic;');
})();




