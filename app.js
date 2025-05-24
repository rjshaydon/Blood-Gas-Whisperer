document.getElementById('mode-switch-btn').addEventListener('click', function() {
  saveAllFieldValues(); // save current values in a JS object, not to localStorage
  let mode = localStorage.getItem('mode') || 'beginner';
  if (mode === 'beginner') {
    localStorage.setItem('mode', 'advanced');
    this.textContent = "Switch to Beginner";
    // renderAdvanced();
  } else {
    localStorage.setItem('mode', 'beginner');
    this.textContent = "Switch to Advanced";
    // renderBeginner();
  }
  loadAllFieldValues(); // reload the saved values after switching modes
});

function startupModeSwitch() {
  let mode = localStorage.getItem('mode') || 'beginner';
  if (mode === 'advanced') {
    document.getElementById('mode-switch-btn').textContent = "Switch to Beginner";
    // renderAdvanced();
  } else {
    document.getElementById('mode-switch-btn').textContent = "Switch to Advanced";
    // renderBeginner();
  }
}

// To preserve values between Beginner and Advanced...
let lastFieldValues = {};
function saveAllFieldValues() {
  const fields = document.querySelectorAll('input.value-field');
  fields.forEach(f => lastFieldValues[f.id] = f.value);
}
function loadAllFieldValues() {
  const fields = document.querySelectorAll('input.value-field');
  fields.forEach(f => {
    if (lastFieldValues[f.id] !== undefined) {
      f.value = lastFieldValues[f.id];
    }
  });
}


function showStep(step, focusFirst = false) {
  document.querySelectorAll('.tab').forEach((t,i) => t.classList.toggle('active', i===step-1));
  document.querySelectorAll('.step').forEach((s,i) => {
    const inputs = s.querySelectorAll('input');
    if (i <= window.maxStep-1) {          // once unlocked, stay active
      inputs.forEach(inp => { inp.readOnly = false; inp.tabIndex = 0; });
      s.style.opacity = '1';
    } else {
      s.style.opacity = '0.5';
    }
  });
  window.currentStep = step;   // remember which step is active
  window.maxStep = Math.max(window.maxStep, step);
  // Ensure all steps up to and including the selected step are activated
  document.querySelectorAll('.step').forEach((s, i) => {
    if (i <= step - 1) {
      const inputs = s.querySelectorAll('input');
      inputs.forEach(inp => {
        inp.readOnly = false;
        inp.tabIndex = 0;
      });
      s.style.opacity = '1';
    }
  });
  // Automatically tick the ABG checkbox when clicking the ABG tab
  if (step === 5) {
    const toggle = document.getElementById('toggleO2hb');
    if (!toggle.checked) {
      toggle.checked = true;
      toggle.dispatchEvent(new Event('change'));
    }
  }
  // If requested, move cursor to the first input (FiO₂ for ABG)
  if (focusFirst) {
    const stepEl = document.getElementById(`step${step}`);
    if (stepEl) {
      let targetInput;
      if (step === 5) {
        targetInput = document.getElementById('fio2');
      } else {
        targetInput = stepEl.querySelector('input');
      }
      if (targetInput) {
        // Delay allows previous focus handlers to finish without recursion
        setTimeout(() => targetInput.focus(), 0);
      }
    }
  }
  update();                    // refresh visibility rules

  // === Reveal prior interpretations for untouched steps ===
  if (step === 2 && !window.naClDirty) {
    document.getElementById('interp1').style.display = '';
  }
  if (step === 3 && !window.naClDirty && !window.agDirty) {
    document.getElementById('interp1').style.display = '';
    document.getElementById('interp2').style.display = '';
  }
  if ((step === 4 || step === 5) && !window.naClDirty && !window.agDirty && !window.co2Dirty) {
    document.getElementById('interp1').style.display = '';
    document.getElementById('interp2').style.display = '';
    document.getElementById('interp3').style.display = '';
  }

}
// Complete summary box management functions
// Add these functions to your app.js file

function repositionSummary() {
  const summaryEl = document.getElementById('summary');
  const mainEl = document.querySelector('.main');
  
  // Remove summary from its current position if it exists
  if (summaryEl && summaryEl.parentNode) {
    summaryEl.remove();
  }
  
  // Always append summary to .main (outside the scrollable .content)
  if (mainEl && summaryEl) {
    mainEl.appendChild(summaryEl);
  }
  
  // Update summary height and scrollable behavior
  updateSummaryHeight();
}

function updateSummaryHeight() {
  const summaryEl = document.getElementById('summary');
  const contentEl = document.querySelector('.content');
  
  // ----- 1. Decide which layout we’re in -----
  const isPortrait = window.matchMedia(
      '(orientation: portrait), (max-width: 950px)'
  ).matches;

  if (!summaryEl || summaryEl.style.display === 'none') {
    // If summary is hidden, reset content padding
    if (contentEl) {
      contentEl.style.paddingBottom = '20px';
      contentEl.style.overflowY = 'visible';
      contentEl.style.maxHeight = 'none';
    }
    return;
  }
  
  /* ----------------------------------------------------------------
     DESKTOP / LANDSCAPE – let the card size itself naturally and
     stop here so no height is forced on the grid row.
  ---------------------------------------------------------------- */
  if (!isPortrait) {
      summaryEl.style.height     = 'auto';
      summaryEl.style.maxHeight  = 'none';
      summaryEl.style.overflowY  = 'auto';   // scroll if necessary

      // Make sure .content isn’t artificially shortened from a
      // previous portrait run
      contentEl.style.paddingBottom = '20px';
      contentEl.style.overflowY     = 'auto';
      contentEl.style.maxHeight     = 'none';
      return;
  }

  /* ----------------------------------------------------------------
     PORTRAIT – keep the existing behaviour (cap height at 50 % and
     give .content extra padding so it can still scroll).
  ---------------------------------------------------------------- */
  const viewportHeight   = window.innerHeight;
  const maxSummaryHeight = Math.floor(viewportHeight * 0.5); // 50 %
  
  // Get the natural height of the summary content
  summaryEl.style.height = 'auto';
  summaryEl.style.maxHeight = 'none';
  const naturalHeight = summaryEl.scrollHeight;
  
  if (naturalHeight > maxSummaryHeight) {
    // Content is too tall - make it scrollable at 50% height
    summaryEl.style.height = maxSummaryHeight + 'px';
    summaryEl.style.maxHeight = maxSummaryHeight + 'px';
    summaryEl.style.overflowY = 'auto';
  } else {
    // Content fits - use natural height
    summaryEl.style.height = naturalHeight + 'px';
    summaryEl.style.maxHeight = 'none';
    summaryEl.style.overflowY = 'visible';
  }
  
  // Update main content scrolling
  updateMainContentScroll();
}

function updateMainContentScroll() {
  const summaryEl = document.getElementById('summary');
  const contentEl = document.querySelector('.content');

  // bail out if summary is hidden
  if (!summaryEl || summaryEl.style.display === 'none') return;

  // only “reserve” space in portrait mode
  const isPortrait = window.matchMedia('(orientation: portrait), (max-width: 950px)').matches;
  if (!isPortrait) {
    // reset any inline overrides from a previous run
    contentEl.style.paddingBottom = '';
    contentEl.style.overflowY    = '';
    contentEl.style.maxHeight    = '';
    return;
  }

  const summaryHeight = summaryEl.offsetHeight;
  const viewportHeight = window.innerHeight;
  const availableHeight = viewportHeight - summaryHeight;
  
  // Add padding equal to summary height plus some extra space
  const paddingBottom = summaryHeight + 20;
  contentEl.style.paddingBottom = paddingBottom + 'px';
  
  // Make content scrollable if it would be obscured
  if (contentEl.scrollHeight > availableHeight) {
    contentEl.style.overflowY = 'auto';
    contentEl.style.maxHeight = availableHeight + 'px';
  } else {
    contentEl.style.overflowY = 'visible';
    contentEl.style.maxHeight = 'none';
  }
}

function handleResize() {
  // Debounce resize events
  clearTimeout(window.resizeTimeout);
  window.resizeTimeout = setTimeout(() => {
    updateSummaryHeight();
  }, 100);
}

// Enhanced startup functions
function startupSummaryManagement() {
  // Initial positioning
  repositionSummary();
  
  // Add resize listener
  window.addEventListener('resize', handleResize);
  
  // Setup mutation observer to watch for summary content changes
  const summaryTextEl = document.getElementById('summary-text');
  if (summaryTextEl && window.MutationObserver) {
    const observer = new MutationObserver(() => {
      updateSummaryHeight();
    });
    
    observer.observe(summaryTextEl, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
}

// Update your existing DOMContentLoaded event listener to include this:
document.addEventListener('DOMContentLoaded', function() {
  startupModeSwitch();
  startupTabNavigation();
  startupTabsTouchBlock();
  startupSummaryTouchBlock();
  startupSummaryManagement(); // Add this line
  if (typeof startupValueFieldRestrictions === 'function') {
    startupValueFieldRestrictions();
  }
});

// Also make sure to call updateSummaryHeight() in your update() function
// Add this line at the end of your update() function:
// updateSummaryHeight();
// Globals
window.currentStep = 1;
window.maxStep = 1;
window.initialNa   = parseFloat(document.getElementById('na').value);
window.initialCl   = parseFloat(document.getElementById('cl').value);
window.naClDirty = false;
window.initialHco3 = parseFloat(document.getElementById('hco3').value);
window.agDirty = false;
window.initialCo2 = parseFloat(document.getElementById('co2').value);
window.co2Dirty = false;

function update() {
  const get = id => parseFloat(document.getElementById(id).value) || 0;
  const set = (id, html) => document.getElementById(id).innerHTML = html;
  const na = get('na'), cl = get('cl'), hco3 = get('hco3'), co2 = get('co2');
  if (na !== window.initialNa || cl !== window.initialCl) {
    window.naClDirty = true;
  }
  const hco3Value = get('hco3');
  if (hco3Value !== window.initialHco3) {
    window.agDirty = true;
  }
  if (co2 !== window.initialCo2) {
    window.co2Dirty = (co2 !== window.initialCo2);
  }
  // Scratch holders for later summary building
  let aaPlainText = '';
  let fhbPlainText = '';
  const glucose = get('glucose'), k = get('k'), lactate = get('lactate');
  const hb = get('hb'); // Re-added hb
  const fo2hb = get('fo2hb');
  const fcohb = get('fcohb');
  const fhhb = get('fhhb');
  const fmethb = get('fmethb');

  const naclDelta = Math.round(na - cl);
  // Anion gap rounded to nearest whole number
  const ag = Math.round(naclDelta - hco3);
  const interp1El = document.getElementById('interp1');
  if (window.naClDirty || na !== window.initialNa || cl !== window.initialCl) {
    // Determine chloride arrow indicator based on NaClΔ thresholds
    let clArrow = '';
    if (naclDelta > 45) {
      clArrow = '(↓Cl⁻)';
    } else if (naclDelta <= 25) {
      clArrow = '(↑↑Cl⁻)';
    } else if (naclDelta > 25 && naclDelta < 30) {
      clArrow = '(↑Cl⁻)';
    }
    set('interp1', `<strong>NaClΔ:</strong> ${naclDelta} ${clArrow}`);
    interp1El.style.display = '';
  } else if (window.currentStep > 1 && !window.naClDirty) {
    // Show normal interpretation if user progressed and didn't change values
    set('interp1', `<strong>NaClΔ:</strong> ${naclDelta} (normal)`);
    // Only show if reveal logic in showStep() says to do so
    // (Leave interp1El.style.display alone so showStep() controls it)
    } else {
    interp1El.style.display = 'none';
  }

  const interp2El = document.getElementById('interp2');
  if (window.maxStep >= 2 && (window.agDirty || ag <= 8 || ag >= 16)) {
    // Determine RAGMA arrow indicator based on AG thresholds
    let agArrow = '';
    if (ag <= 8) {
      agArrow = '(↓)';
    } else if (ag >= 16 && ag <= 17) {
      agArrow = '(↑)';
    } else if (ag > 17) {
      agArrow = '(↑↑)';
    }
    set('interp2', `<strong>Anion Gap:</strong> ${ag} ${agArrow}`);
    interp2El.style.display = '';
  } else if (window.currentStep > 2 && !window.agDirty) {
    // Show normal AG if user progressed and didn't change values
    set('interp2', `<strong>Anion Gap:</strong> ${ag} (normal)`);
    // Let showStep() decide when to display
  } else {
    interp2El.style.display = 'none';
  }
  let interp3 = '';

  /* ---------- Respiratory evaluation (pure & mixed) ---------- */
  const deltaCO2  = co2 - 40;          // deviation from 40 mmHg
  const deltaHCO3 = hco3 - 24;         // deviation from 24 mmol L⁻¹

  /* “MetabolicDisturbance” flags any significant primary metabolic process.  
     Normal NaClΔ is 30‑45; normal/low‑normal AG is ≤ 16. */
  const metabolicDisturbance =

  /*. // I have disabled this code...
        (hco3 <= 20 || hco3 >= 30) ||          // bicarbonate out of normal band 
  */

        (naclDelta <= 25 || naclDelta >= 45) ||// chloride‑based clues
        (ag >= 16);                            // raised anion‑gap

  /* Candidate for a *pure* respiratory disorder → all metabolic markers normal.  
     Low‑normal AG (≤ 8) is tolerated because chronic respiratory acidosis can
     lower the AG slightly without implying a metabolic process. */
  const pureRespCandidate =
        (!metabolicDisturbance && ag <= 16);   // AG up to 16 regarded as normal

  /* ------------------------------------------------------------------ */
  /* 1. No metabolic disturbance present – evaluate pure respiratory status */
  if (!metabolicDisturbance) {
    if (Math.abs(deltaCO2) <= 5) {
      // If CO₂ is unchanged (co2 === 40), and step 4 or above, show "Normal respiration"
      if (co2 === 40 && window.maxStep >= 4) {
        interp3 = '<strong>Normal respiration</strong>';
      } else if (naclDelta >= 30) {
        // No longer show "Normal acid/base status" here
        interp3 = '';
      } else {
        interp3 = '<strong>Normal CO₂</strong>';
      }
    } else {
      /* ——— Pure primary respiratory disorders ——— */

      if (deltaCO2 > 5) {                       // respiratory acidosis
        const expA = (deltaCO2 / 10) * 1;       // acute compensation
        const expC = (deltaCO2 / 10) * 4;       // chronic compensation
        if (deltaHCO3 <= expA + 0.5) {
          respType = 'Acute resp acidosis';
        } else if (deltaHCO3 >= expC - 0.5) {
          respType = 'Chronic resp acidosis';
        } else {
          respType = 'Acute‑on‑chronic resp acidosis';
        }

      } else if (deltaCO2 < -5) {               // respiratory alkalosis
        const absChange = Math.abs(deltaCO2);
        const expA = -(absChange / 10) * 2;     // acute compensation
        const expC = -(absChange / 10) * 5;     // chronic compensation
        if (deltaHCO3 >= expA - 0.5) {
          respType = 'Acute resp alkalosis';
        } else if (deltaHCO3 <= expC + 0.5) {
          respType = '?Chronic resp alkalosis';
        } else {
          respType = 'Acute‑on‑chronic resp alkalosis';
        }
      }

      interp3 = `<strong>${respType}</strong>`;
    }

  /* ------------------------------------------------------------------ */
  /* 2. Metabolic disturbance present – keep original compensation logic */
  } else {

    /* 2a. Metabolic acidosis – Winter’s formula */
    if ((naclDelta < 30 || ag > 14) && hco3 <= 20) {
      const expected = Math.round(1.5 * hco3 + 8);
      if (co2 >= expected - 5 && co2 <= expected + 5) {
        interp3 = '<strong>Respiratory compensation</strong>';
      } else if (co2 > expected + 5) {
        interp3 = `<strong>Decomp. resp acidosis</strong><br>CO₂ = ${co2} (exp. ≃ ${expected} ± 5)`;
      } else {
        interp3 = `<strong>2º resp alkalosis</strong><br>CO₂ = ${co2} (exp. ≃ ${expected} ± 5)`;
      }

    /* 2b. Metabolic alkalosis – expected CO₂ ≈ 0.7 × (HCO₃⁻‑24)+40 */
    } else if (naclDelta > 45 && hco3 >= 30) {
      const expected = Math.round(0.7 * (hco3 - 24) + 40);
      if (co2 >= expected - 5 && co2 <= expected + 5) {
        interp3 = '<strong>Appropriate respiratory compensation</strong>';
      } else if (co2 > expected + 5) {
        interp3 = `<strong>Decompensated resp acidosis</strong><br>CO₂ = ${co2} (exp. ≃ ${expected} ± 5)`;
      } else {
        interp3 = `<strong>2º resp alkalosis</strong><br>CO₂ = ${co2} (exp. ≃ ${expected} ± 5)`;
      }

    /* 2c. Primary respiratory disturbance *with* an abnormal HCO₃⁻ band */
    } else {
      let respType = 'No resp disturbance';

      if (deltaCO2 > 0) {                       // respiratory acidosis
        const expA = (deltaCO2 / 10) * 1;
        const expC = (deltaCO2 / 10) * 4;
        if (deltaHCO3 <= expA + 0.5) {
          respType = 'Acute resp acidosis';
        } else if (deltaHCO3 >= expC - 0.5) {
          respType = 'Chronic resp acidosis';
        } else if (deltaHCO3 > expA + 0.5 && deltaHCO3 < expC - 0.5) {
          respType = 'Acute‑on‑chronic resp acidosis';
        } else if (deltaHCO3 > expC + 0.5) {
          respType = 'Resp acidosis + metabolic alkalosis';
        } else if (deltaHCO3 < expA - 0.5) {
          respType = 'Resp acidosis + metabolic acidosis';
        }

      } else if (deltaCO2 < 0) {                // respiratory alkalosis
        const absChange = Math.abs(deltaCO2);
        const expA = -(absChange / 10) * 2;
        const expC = -(absChange / 10) * 5;
        if (deltaHCO3 >= expA - 0.5) {
          respType = 'Acute resp alkalosis';
        } else if (deltaHCO3 <= expC + 0.5) {
          respType = 'Chronic resp alkalosis';
        } else if (deltaHCO3 < expA - 0.5 && deltaHCO3 > expC + 0.5) {
          respType = 'Acute‑on‑chronic resp alkalosis';
        } else if (deltaHCO3 < expC - 0.5) {
          respType = 'Resp alkalosis + metabolic acidosis';
        } else if (deltaHCO3 > expA + 0.5) {
          respType = 'Resp alkalosis + metabolic alkalosis';
        }
      }

      interp3 = `<strong>${respType}</strong>`;
    }
  }
  /* ---------- End respiratory evaluation ---------- */

      set('interp3', interp3);
      // Determine visibility of previous interpretations
      const interp1Visible = interp1El.style.display !== 'none';
      const interp2Visible = interp2El.style.display !== 'none';
      // Base condition: show only if step ≥3 and there is interp3 text
      let interp3ShouldShow = window.maxStep >= 3 && interp3;
      // If both NaClΔ and AG boxes are hidden and CO₂ is within 35–45 with normal metabolic, hide CO₂ box
      if (!interp1Visible && !interp2Visible && Math.abs(deltaCO2) <= 5 && naclDelta >= 30 && ag <= 16) {
        interp3ShouldShow = false;
      }
      document.getElementById('interp3').style.display = interp3ShouldShow ? '' : 'none';

  const ph = (6.1 + Math.log10(hco3 / (0.03 * co2))).toFixed(2);
  document.getElementById('ph').value = ph;
  const phVal = parseFloat(ph);
  const correctedNa = Math.round(na + glucose / 4);
  // Correct K+ normalized to pH 7.40: 0.5 mmol/L change per 0.1 pH unit
  const correctedK = (k - 5 * (7.4 - phVal)).toFixed(1);
  const osmCalc = Math.round(2 * na + glucose);
  const correctedKVal = parseFloat(correctedK);
  let interp4Html = '';
  if (glucose >= 20) {
    interp4Html += `<strong>Na⁺<sub>c</sub>:</strong> ${correctedNa} mmol/L`;
  }
  // Show corrected K only if measured or corrected falls outside normal (3.5–5.2 mmol/L)
  if (k < 3.5 || k >= 5.2 || correctedKVal < 3.5 || correctedKVal >= 5.2) {
    interp4Html += (interp4Html ? '<br>' : '') + `<strong>K⁺<sub>c</sub>:</strong> ${correctedK} mmol/L`;
  }
  // Hypoglycaemia thresholds
  if (glucose < 2.2) {
    interp4Html += (interp4Html ? '<br>' : '') + '<strong>Sev. hypoglycaemia</strong>';
  } else if (glucose >= 2.2 && glucose <= 2.9) {
    interp4Html += (interp4Html ? '<br>' : '') + '<strong>Mod.</strong> hypoglycaemia';
  } else if (glucose >= 3.0 && glucose < 4.0) {
    interp4Html += (interp4Html ? '<br>' : '') + 'Mild hypoglycaemia';
  }
  if (glucose >= 15) {
    interp4Html += (interp4Html ? '<br>' : '') + 'Hyperglycaemia';
  }
  if (lactate > 2.0) {
    interp4Html += (interp4Html ? '<br>' : '') + 'Hyperlactataemia';
  }
  // Removed: if (hb <= 100) { interp4Html += ... }
  if (osmCalc >= 320) {
    interp4Html += (interp4Html ? '<br>' : '') + `Hyperosmolality (${osmCalc})`;
  } else if (osmCalc >= 300) {
    interp4Html += (interp4Html ? '<br>' : '') + `Hyperosmolality (${osmCalc})`;
  }

  const interp4El = document.getElementById('interp4');
  
  if (window.maxStep >= 4) {
  // Show "Normal acid/base status" in Step 4 if NaClΔ, AG, and CO₂ are all normal, and nothing else is reported
  if (
    interp4Html.trim() === '' &&
    naclDelta >= 30 && naclDelta <= 45 &&
    ag > 8 && ag < 16 &&
    co2 === 40
  ) {
    interp4El.style.display = '';
    interp4El.innerHTML = '<strong>Normal acid/base status</strong>';
  } else if (interp4Html.trim() !== '') {
    interp4El.style.display = '';
    interp4El.innerHTML = interp4Html;
  } else {
    interp4El.style.display = 'none';
  }
} else {
  interp4El.style.display = 'none';
}

  // O₂ and Hb section interpretation (using user-entered FiO₂)
  const fio2 = get('fio2');
  const fio2Frac = fio2 / 100;
  const pao2Val = get('pao2');
  const ph2o = 47, patm = 760, r = 0.8;
  const PAO2 = fio2Frac * (patm - ph2o) - co2 / r;
  const aag = Math.round(PAO2 - pao2Val);
  let interpO2hbHtml = '';
  // Only show A–a gradient if greater than 10
  if (aag > 10) {
    interpO2hbHtml = `<strong>A–a gradient:</strong> ${aag} (normal ≃ [age + 10] ÷ 4)`;
    aaPlainText = `Raised A–a gradient (${aag} mmHg)`;
  }
  // Placeholder for F-Hb interpretation, to be appended when available
  const interpO2hbEl = document.getElementById('interpO2hb');
  // Single toggle declaration for O₂/Hb section
  const o2toggle = document.getElementById('toggleO2hb').checked;
  if (interpO2hbHtml && o2toggle) {
    interpO2hbEl.style.display = '';
    interpO2hbEl.innerHTML = interpO2hbHtml;
  } else {
    interpO2hbEl.style.display = 'none';
  }

  // Hb/F-Hb interpretation logic
  const interpHbFhbEl = document.getElementById('interpHbFhb');
  let interpList = [];
  // Anaemia thresholds
  if (hb > 0) {
    if (hb < 70) {
      interpList.push('Severe anaemia, consider transfusion');
    } else if (hb < 80) {
      interpList.push('Significant anaemia');
    } else if (hb < 100) {
      interpList.push('Anaemia');
    }
  }
  // COHb thresholds
  if (fcohb > 2) {
    if (fcohb < 10) {
      let txt = 'Mild CO poisoning';
      if (fcohb < 5) txt += ' (≤5% normal in heavy smokers)';
      interpList.push(txt);
    } else if (fcohb <= 25) {
      interpList.push('Moderate CO poisoning');
    } else {
      interpList.push('Severe CO poisoning (indication for HBOT)');
    }
  }
  // MetHb thresholds
  if (fmethb >= 1) {
    if (fmethb < 5) {
      interpList.push('Mild methaemoglobinaemia');
    } else if (fmethb < 15) {
      interpList.push('Moderate methaemoglobinaemia');
    } else {
      interpList.push('Severe methaemoglobinaemia (indication for methylene blue administration)');
    }
  }
  // (Oxyhaemoglobin / A-a gradient check removed)
  // Fraction summation check (ensure fractions sum to 100%)
  const sumFrac = fo2hb + fcohb + fhhb + fmethb;
  if (Math.abs(sumFrac - 100) >= 1) {
    interpList.push('<em>Please enter all Hb fractions</em>');
  }
  if (o2toggle && interpList.length) {
    interpHbFhbEl.style.display = '';
    // Build output sentence based on number of phrases
    let sentence;
    if (interpList.length === 1) {
      // Single phrase: capitalise first letter, no full stop
      sentence = interpList[0];
      sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
    } else {
      // Multiple phrases: join with semicolons and end with full stop
      sentence = interpList.join('; ') + '.';
      sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
      // Lowercase letter immediately following each semicolon, allowing for optional HTML tags
      sentence = sentence.replace(/;\s*((?:<[^>]*>\s*)*)([A-Za-z])/g,
        (match, p1, p2) => '; ' + p1 + p2.toLowerCase()
      );
    }
    interpHbFhbEl.innerHTML = sentence;
    fhbPlainText = sentence.replace(/\.$/, '');
  } else {
    interpHbFhbEl.style.display = 'none';
    interpHbFhbEl.innerHTML = '';
    fhbPlainText = '';
  }

  /* ---------- Ordered summary rebuild ---------- */
  // Convert <br> to " – ", then strip <strong> tags for summary
  const interp3Plain = interp3
    .replace(/<br\s*\/?>/g, ' – ')
    .replace(/<\/?strong>/g, '')
    // Wrap text following " – " in italics
    .replace(/ –\s*(.+)$/, ' – <em>$1</em>')
    .trim();
  const phNum = parseFloat(ph);
  const lifeArr  = [], severeArr = [],
        nagmaArr = [], ragmaArr  = [],
        naArr    = [], kArr     = [],
        gluArr   = [], lacArr   = [],
        aaArr    = [], fhbArr   = [],
        osmArr   = [], acidArr  = [];
  const respArr = [];

  /* pH categories */
  if (window.maxStep >= 4) {
    if (phNum <= 7.00) lifeArr.push('Life-threatening acidaemia');
    else if (phNum >= 7.55) acidArr.push('Severe alkalaemia');
    else if (phNum >= 7.01 && phNum <= 7.24) acidArr.push('Severe acidaemia');
  }

  /* NaClΔ & AG */
  // NaClΔ group always allowed, so leave as is (do not gate)
  if (naclDelta > 45) nagmaArr.push('Hypochloraemic metabolic alkalosis');
  else if (naclDelta <= 25) severeArr.push('Severe NAGMA');
  else if (naclDelta > 25 && naclDelta < 30) nagmaArr.push('NAGMA');

  // Show AG/RAGMA from Step 2 onward – but only add lactate commentary once we reach Step 4
  if (window.maxStep >= 2) {
    if (ag <= 8) ragmaArr.push('Low anion gap');
    else if (ag >= 16 && ag <= 17) ragmaArr.push('Mild RAGMA');
    else if (ag > 17) {
      const extra = ag - 12;
      const ragmaBase = `${ag >= 20 ? 'Severe RAGMA' : 'RAGMA'} (${extra} extra anions`;
      let lactateNote = '';
      if (window.maxStep >= 4) {        // only evaluate lactate once we’re in Step 4
        if (extra > lactate + 1) {
          lactateNote = ` - note: lactate is only ${lactate} – ${glucose >= 20 ? '<strong>check ketones</strong>' : 'check ketones'}`;
        } else if (lactate >= extra + 1 && lactate <= extra + 3) {
          lactateNote = ' - likely due to lactate';
        } else if (lactate > extra + 3) {
          lactateNote = ` - lactate ${lactate} ⇒ ↓AG + ↑AG`;
        }
      }
      const ragmaLine = ragmaBase + lactateNote + ')';
      if (ag >= 20) severeArr.push(ragmaLine);
      else ragmaArr.push(ragmaLine);
    }
  }

  /* Sodium disturbances (corrected) */
  if (window.maxStep >= 4) {
    if (correctedNa < 125) severeArr.push('Severe hyponatraemia');
    else if (correctedNa >= 125 && correctedNa <= 129) naArr.push('Moderate hyponatraemia');
    else if (correctedNa >= 130 && correctedNa <= 134) naArr.push('Mild hyponatraemia');
    else if (correctedNa >= 160) severeArr.push('Severe hypernatraemia');
    else if (correctedNa >= 150 && correctedNa <= 159) naArr.push('Moderate hypernatraemia');
    else if (correctedNa >= 146 && correctedNa <= 149) naArr.push('Mild hypernatraemia');
  }

  /* Potassium (corrected) severity stratification */
  if (window.maxStep >= 4) {
    if (correctedKVal < 2.5) {
      kArr.push('Severe hypokalaemia');
    } else if (correctedKVal < 3.0) {
      kArr.push('Moderate hypokalaemia');
    } else if (correctedKVal < 3.5) {
      kArr.push('Mild hypokalaemia');
    } else if (correctedKVal >= 6.0) {
      kArr.push('Severe hyperkalaemia');
    } else if (correctedKVal >= 5.5) {
      kArr.push('Moderate hyperkalaemia');
    } else if (correctedKVal >= 5.2) {
      kArr.push('Mild hyperkalaemia');
    }
  }

  /* Glucose */
  if (window.maxStep >= 4) {
    if (glucose < 2.0) lifeArr.push('Life-threatening hypoglycaemia');
    else if (glucose >= 2.0 && glucose <= 2.1) severeArr.push('Severe hypoglycaemia');
    else if (glucose >= 2.2 && glucose <= 2.9) gluArr.push('Moderate hypoglycaemia');
    else if (glucose >= 3.0 && glucose < 4.0) gluArr.push('Mild hypoglycaemia');
    else if (glucose >= 15) gluArr.push('Hyperglycaemia');
  }

  /* Osmolality / HHS */
  if (window.maxStep >= 4) {
    if (osmCalc >= 320 && glucose >= 20) {
      severeArr.push(`<strong>HHS</strong> (&gt;${osmCalc})`);
    } else if (osmCalc >= 300) {
      osmArr.push(`Hyperosmolar (&gt;${osmCalc})`);
    }
  }

  /* Lactate */
  if (window.maxStep >= 4) {
    if (lactate > 2.0) lacArr.push('Hyperlactataemia');
  }

  /* A–a gradient */
  if (window.maxStep >= 5 && document.getElementById('toggleO2hb').checked) {
    if (aaPlainText) aaArr.push(aaPlainText);
  }

  /* Respiratory (CO₂) */
  if (
    window.maxStep >= 3 &&
    interp3Plain &&
    !(naclDelta >= 30 && naclDelta <= 45 && ag > 8 && ag < 16 && co2 === 40)
  ) {
    // Only push respiratory interpretations if not all are normal
    respArr.push(interp3Plain);
  }

  /* F‑Hb (only when O₂/Hb enabled) */
  if (window.maxStep >= 5 && document.getElementById('toggleO2hb').checked) {
    if (fhbPlainText) fhbArr.push(fhbPlainText);
  }

  /* Assemble ordered list */
  const orderedLines = [].concat(
    lifeArr, severeArr,
    nagmaArr, ragmaArr,
    respArr,
    naArr, kArr, gluArr, lacArr,
    osmArr,
    aaArr, fhbArr,
    acidArr            // acidaemia/alkalaemia last
  );

  const summaryEl = document.getElementById('summary');
  const summaryTextEl = document.getElementById('summary-text');

  // --- Custom summary reveal logic starts here ---

// Compute whether each is "abnormal"
const naclDeltaAbnormal = (naclDelta > 45) || (naclDelta <= 25);  // Your thresholds for NaClΔ abnormal
const agAbnormal = (ag <= 8) || (ag >= 16);                      // Your thresholds for AG abnormal
const co2Abnormal = (co2 < 35) || (co2 > 45);                    // Normal CO₂: 35–45

// Show summary if any is abnormal, OR if step 4 or ABG is reached
let shouldShowSummary = false;
if (naclDeltaAbnormal || agAbnormal || co2Abnormal) {
  shouldShowSummary = window.maxStep > 1;  // Any abnormal, show after Step 2+
} else {
  shouldShowSummary = window.maxStep >= 4; // All normal, show at Step 4 (or higher)
}

// Show/hide summary box
if (shouldShowSummary) {
  let summaryHtml = '';
  if (
    orderedLines.length === 0 &&
    naclDelta >= 30 && naclDelta <= 45 &&
    ag > 8 && ag < 16 &&
    co2 === 40
  ) {
    summaryHtml = '<strong>Summary:</strong><br><ul style="margin:0; padding-left:1.2em; list-style-position:outside;"><li>Normal acid/base status</li></ul>';
  } else if (orderedLines.length) {
    summaryHtml = '<strong>Summary:</strong><br><ul style="margin:0; padding-left:1.2em; list-style-position:outside;">'
      + orderedLines.map(l => `<li>${l}</li>`).join('')
      + '</ul>';
  }
  summaryTextEl.innerHTML = summaryHtml;
  summaryEl.style.display = summaryHtml ? 'flex' : 'none';
} else {
  summaryTextEl.innerHTML = '';
  summaryEl.style.display = 'none';
}
  /* ---------- End ordered summary ---------- */
  
  // Generate recommendations based on the blood gas analysis
  let recommendationsHtml = '';
  let recList = [];
  // Suggest sample error if anion gap is negative
  if (window.maxStep >= 2 && ag < 0) {
    recList.push('Negative anion gap – consider sample or measurement error');
  }
  
  // Add LTKR recommendation for high anion gap
  if (window.maxStep >= 4 && ag > 16) {
    // Add check ketones recommendation if summary check ketones logic triggered
    if ((ag - 12) > lactate + 1 && glucose >= 20) {
      recList.push(`<strong>Check ketones</strong> (glucose ${glucose.toFixed(1)} & ↑AG)`);
    }
    recList.push(`Consider causes of high anion gap: <strong>LTKR</strong> (<strong>L</strong>actate, <strong>T</strong>oxic alcohols, <strong>K</strong>etones, and <strong>R</strong>enal failure)`);
  }
  
  // Add lactate causes if high lactate
  if (window.maxStep >= 4 && lactate > 4.0) {
    recList.push(`High lactate is also seen in salbutamol toxicity (5-10), metformin with AKI (8-20), alcohol toxicity (typically 4-8), cyanide toxicity (10-40)`);
  }
  
  // Add glucose recommendation before pH recommendation (for better semantic flow)
  if (window.maxStep >= 4 && glucose > 20) {
    recList.push(`Suggest IV fluids & consider insulin therapy`);
  }
  // Add recommendation for life‑threatening hypoglycaemia
  if (window.maxStep >= 4 && glucose < 3.0) {
    recList.push('<strong>Urgent</strong> treatment for hypoglycaemia indicated');
  }
  
  // Add other recommendations based on conditions
  if (window.maxStep >= 4 && phNum <= 7.15) {
    recList.push(`Consider avoiding saline as this will ↑Cl⁻ and further ↓pH`);
  }
  
  if (window.maxStep >= 4 && correctedKVal >= 6.0) {
    recList.push(`<strong>Urgent</strong> treatment for hyperkalaemia indicated`);
  } else if (window.maxStep >= 4 && correctedKVal >= 5.2) {
    recList.push(`Monitor potassium closely`);
  }
  
  // Convert recList into a bulleted list and promote life‑threatening items
  if (recList.length > 0) {
    // Capitalise first letter of each recommendation
    const processedRecs = recList.map(rec => rec.charAt(0).toUpperCase() + rec.slice(1));

    // Preserve specific acronyms/chemical symbols
    const termsToPreserve = [
      { term: 'iv',  replace: 'IV'  },
      { term: 'aki', replace: 'AKI' },
      { term: 'ltkr',replace: 'LTKR'},
      { term: 'cl⁻', replace: 'Cl⁻'},
      { term: 'cl-', replace: 'Cl⁻'},
      { term: 'ph',  replace: 'pH'  }
    ];
    processedRecs.forEach((rec, idx) => {
      let txt = rec;
      termsToPreserve.forEach(item => {
        const re = new RegExp('\\b' + item.term + '\\b', 'gi');
        txt = txt.replace(re, item.replace);
      });
      processedRecs[idx] = txt;
    });

    // Identify life‑threatening recommendations
    const lifeThreat = processedRecs.filter(r => /hyperkalaemia|hypoglycaemia/i.test(r));
    const others      = processedRecs.filter(r => !(/hyperkalaemia|hypoglycaemia/i.test(r)));

    // Build HTML bullet list with life‑threatening items first
    const ordered = lifeThreat.concat(others);
    recommendationsHtml = '<ul style="margin:0; padding-left:1.2em; list-style-position:outside;">'
                        + ordered.map(r => '<li>' + r + '</li>').join('')
                        + '</ul>';
  }
  
  // Set recommendations and show/hide title based on content
  document.getElementById('recommendations-text').innerHTML = recommendationsHtml;
  document.getElementById('recommendations-title').style.display = recommendationsHtml ? '' : 'none';
  document.getElementById('recommendations-container').style.display = recommendationsHtml ? '' : 'none';
  
  // Call repositionSummary to ensure proper placement
  updateSummaryHeight();
  initDynamicPadding()
}

function initTabNavigation() {
  const steps = Array.from(document.querySelectorAll('.step'));
  steps.forEach((stepDiv, idx) => {
    const inputs = stepDiv.querySelectorAll('input');
    inputs.forEach((inp, i) => {
      inp.addEventListener('focus', () => showStep(idx + 1));
      inp.addEventListener('keydown', e => {
        if (!e.shiftKey && e.key === 'Tab' && i === inputs.length - 1) {
          e.preventDefault();
          const next = idx + 1 < steps.length ? idx + 1 : idx;
          const nextInputs = steps[next].querySelectorAll('input');
          showStep(next + 1);
          if (nextInputs[0]) nextInputs[0].focus();
        }
      });
    });
  });
}
function repositionSummary() {
  const summaryEl = document.getElementById('summary');
  const mainEl = document.querySelector('.main');
  
  // Remove summary from its current position if it exists
  if (summaryEl && summaryEl.parentNode) {
    summaryEl.remove();
  }
  
  // Always append summary to .main (outside the scrollable .content)
  if (mainEl && summaryEl) {
    mainEl.appendChild(summaryEl);
  }
  
  // Update summary height and scrollable behavior
  updateSummaryHeight();
}



function updateMainContentScroll() {
  const summaryEl = document.getElementById('summary');
  const contentEl = document.querySelector('.content');
  
  if (!summaryEl || !contentEl || summaryEl.style.display === 'none') {
    return;
  }
  
  const summaryHeight = summaryEl.offsetHeight;
  const viewportHeight = window.innerHeight;
  const availableHeight = viewportHeight - summaryHeight;
  
  // Add padding equal to summary height plus some extra space
  const paddingBottom = summaryHeight + 20;
  contentEl.style.paddingBottom = paddingBottom + 'px';
  
  // Make content scrollable if it would be obscured
  if (contentEl.scrollHeight > availableHeight) {
    contentEl.style.overflowY = 'auto';
    contentEl.style.maxHeight = availableHeight + 'px';
  } else {
    contentEl.style.overflowY = 'visible';
    contentEl.style.maxHeight = 'none';
  }
}

function handleResize() {
  // Debounce resize events
  clearTimeout(window.resizeTimeout);
  window.resizeTimeout = setTimeout(() => {
    updateSummaryHeight();
  }, 100);
}

// Enhanced startup functions
function startupSummaryManagement() {
  // Initial positioning
  repositionSummary();
  
  // Add resize listener
  window.addEventListener('resize', handleResize);
  
  // Setup mutation observer to watch for summary content changes
  const summaryTextEl = document.getElementById('summary-text');
  if (summaryTextEl && window.MutationObserver) {
    const observer = new MutationObserver(() => {
      updateSummaryHeight();
    });
    
    observer.observe(summaryTextEl, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
}

// Update your existing DOMContentLoaded event listener to include this:
document.addEventListener('DOMContentLoaded', function() {
  startupModeSwitch();
  startupTabNavigation();
  startupTabsTouchBlock();
  startupSummaryTouchBlock();
  startupSummaryManagement(); // Add this line
  if (typeof startupValueFieldRestrictions === 'function') {
    startupValueFieldRestrictions();
  }
});

// Also make sure to call updateSummaryHeight() in your update() function
// Add this line at the end of your update() function:
// updateSummaryHeight();


function startupTabNavigation() {
  showStep(1, true);
  update();
  initTabNavigation();
}

// Toggle O₂ and Hb analysis fields (show inputs/labels, show interpretations only if content)
document.getElementById('toggleO2hb').addEventListener('change', function() {
  if (this.checked) {
    showStep(5, true); // Advance to ABG tab and focus
  }
  const showFields = this.checked;
  // Show/hide only input fields and labels
  document.querySelectorAll('.o2hb-field').forEach(el => {
    if (el.tagName === 'INPUT' || el.tagName === 'LABEL') {
      el.style.display = showFields ? '' : 'none';
    }
  });
  // Show/hide interpretation boxes based on content
  ['interpO2hb', 'interpHbFhb'].forEach(id => {
    const el = document.getElementById(id);
    if (showFields && el.innerHTML.trim()) {
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  });
  repositionSummary();
  update();
});

// Initialise O₂ and Hb analysis based on checkbox and content
(function() {
  const showFields = document.getElementById('toggleO2hb').checked;
  document.querySelectorAll('.o2hb-field').forEach(el => {
    if (el.tagName === 'INPUT' || el.tagName === 'LABEL') {
      el.style.display = showFields ? '' : 'none';
    }
  });
  ['interpO2hb', 'interpHbFhb'].forEach(id => {
    const el = document.getElementById(id);
    if (showFields && el.innerHTML.trim()) {
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  });
  repositionSummary();
})();
// Format Glucose, K⁺, and Lactate on blur to one decimal place
['glucose', 'k', 'lactate'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('blur', function() {
    const val = parseFloat(this.value) || 0;
    this.value = val.toFixed(1);
    update();
  });
});

// Format HCO₃⁻ and CO₂ on blur: remove trailing .0 if integer, otherwise one decimal
['hco3', 'co2'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('blur', function() {
    const val = parseFloat(this.value) || 0;
    if (val % 1 === 0) {
      this.value = val.toString();
    } else {
      this.value = val.toFixed(1);
    }
    update();
  });
});
// Format Na⁺ and Cl⁻ on blur to whole numbers
['na','cl'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('blur', function() {
    const val = Math.round(parseFloat(this.value) || 0);
    this.value = val;
    update();
  });
});

function startupTabsTouchBlock() {
  const tabsEl = document.querySelector('.tabs');
  if (tabsEl) {
    tabsEl.addEventListener('touchmove', function(e){
      e.preventDefault();
    }, { passive: false });
  }
}

(function(){
  function restrictToPositiveNumbers(input) {
    // Allow arrow keys and select-all commands
    input.addEventListener('keydown', function(e) {
      // Up/down arrows step the value
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const step = parseFloat(input.getAttribute('step')) || 1;
        let val = parseFloat(input.value) || 0;
        val = e.key === 'ArrowUp' ? val + step : val - step;
        // Prevent negative
        if (val < 0) val = 0;
        // Apply to one or zero decimals based on step
        const precision = (step.toString().split('.')[1] || '').length;
        input.value = precision ? val.toFixed(precision) : Math.round(val);
        input.dispatchEvent(new Event('input'));
        return;
      }
      // Permit left/right arrows for navigation
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') return;
      // Permit select-all (Cmd+A / Ctrl+A)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') return;
    });
    input.addEventListener('beforeinput', function(e) {
      if (e.inputType !== 'insertText') return;
      const char = e.data;
      const val = this.value;
      const start = this.selectionStart;
      const end = this.selectionEnd;
      if (/^[0-9]$/.test(char)) return;
      if (char === '.') {
        const newVal = val.slice(0, start) + '.' + val.slice(end);
        if ((newVal.match(/\./g) || []).length <= 1) {
          return;
        }
      }
      e.preventDefault();
    });
    input.addEventListener('paste', function(e) {
      const paste = (e.clipboardData || window.clipboardData).getData('text');
      if (!/^\d*\.?\d*$/.test(paste)) {
        e.preventDefault();
      }
    });
    input.addEventListener('drop', function(e) {
      e.preventDefault();
    });
  }
  function startupValueFieldRestrictions() {
    document.querySelectorAll('input.value-field').forEach(function(input) {
      restrictToPositiveNumbers(input);
      input.addEventListener('focus', function() {
        var el = this;
        setTimeout(function(){ el.select(); }, 0);
      });
    });
  }
  // This needs to be called on DOMContentLoaded
  // We'll call startupValueFieldRestrictions in the main DOMContentLoaded handler below.
})();

// Prevent touch dragging on the summary panel if there's no overflow
function startupSummaryTouchBlock() {
  const summaryEl = document.getElementById('summary');
  if (summaryEl) {
    summaryEl.addEventListener('touchmove', function(e) {
      // Block dragging when content fits; allow only if scrollable
      if (summaryEl.scrollHeight <= summaryEl.clientHeight) {
        e.preventDefault();
      }
    }, { passive: false });
  }
}

// At the end of the file, call all startup functions on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  startupModeSwitch();
  startupTabNavigation();
  startupTabsTouchBlock();
  startupSummaryTouchBlock();
  if (typeof startupValueFieldRestrictions === 'function') {
    startupValueFieldRestrictions();
  }
  initDynamicPadding()
});

// Function to adjust content padding based on summary height
function adjustContentPadding() {
  const summary = document.getElementById('summary');
  const content = document.querySelector('.content');
  
  // Only adjust padding in portrait/narrow mode
  const isPortraitMode = window.matchMedia('(orientation: portrait), (max-width: 950px)').matches;
  
  if (!isPortraitMode) {
    // Reset padding for desktop mode
    content.style.paddingBottom = '';
    return;
  }
  
  if (summary && summary.classList.contains('active')) {
    // Get the actual height of the summary box
    const summaryHeight = summary.offsetHeight;
    
    // Add extra padding (2rem = 32px) for comfortable spacing
    const extraPadding = 32;
    const totalPadding = summaryHeight + extraPadding;
    
    // Apply the dynamic padding
    content.style.paddingBottom = `${totalPadding}px`;
  } else {
    // Summary is not active, use minimal padding
    content.style.paddingBottom = '2rem';
  }
}

// Function to observe summary content changes and adjust padding
function setupSummaryObserver() {
  const summary = document.getElementById('summary');
  const summaryContent = document.querySelector('.summary-content');
  
  if (!summary || !summaryContent) return;
  
  // Use ResizeObserver to watch for summary size changes
  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(() => {
      // Small delay to ensure DOM has updated
      setTimeout(adjustContentPadding, 50);
    });
    
    resizeObserver.observe(summary);
    resizeObserver.observe(summaryContent);
  }
  
  // Also use MutationObserver to watch for content changes
  const mutationObserver = new MutationObserver(() => {
    setTimeout(adjustContentPadding, 50);
  });
  
  mutationObserver.observe(summaryContent, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

// Function to handle window resize
function handleResize() {
  adjustContentPadding();
}

// Initialize the dynamic padding system
function initDynamicPadding() {
  // Set up observers
  setupSummaryObserver();
  
  // Listen for window resize
  window.addEventListener('resize', handleResize);
  
  // Listen for orientation change
  window.addEventListener('orientationchange', () => {
    setTimeout(adjustContentPadding, 100);
  });
  
  // Initial adjustment
  setTimeout(adjustContentPadding, 100);
}

// Call this function when your app initializes
// You should call initDynamicPadding() after your DOM is ready
// For example, add this to your existing initialization code:
// initDynamicPadding();
