/**
 * Main application state and event handlers
 */

// Application State
const AppState = {
    patientData: null,
    ibwValues: null,
    selectedIBW: null,
    selectedMethod: '',
    calculationResults: null,
    selectedProduct: null,
    selectedProductIndex: null,
    filters: {
        lowSodium: false,
        fluidRestriction: false,
        highProtein: false,
        lowProtein: false,
        lowCalorieDensity: false,
        highCalorieDensity: false
    },
    sortAscending: true,
    dilutionType: 'standard',
    selectedRate: null,
    feedingHours: 18,
    targetPct: 0.7          // default 70%
};

// ─── Init ────────────────────────────────────────────────────────────────────

function initializeApp() {
    setupEventListeners();
    console.log('Clinical Diet Calculator initialized');
}

// ─── Event Listeners ─────────────────────────────────────────────────────────

function setupEventListeners() {
    document.getElementById('patient-form').addEventListener('submit', handlePatientFormSubmit);
    document.getElementById('calculate-diet-btn').addEventListener('click', handleCalculateDiet);

    // Filters
    ['filter-low-sodium','filter-fluid-restriction','filter-high-protein',
     'filter-low-protein','filter-low-calorie-density','filter-high-calorie-density']
        .forEach(id => document.getElementById(id).addEventListener('change', handleFilterChange));

    // Sort
    document.getElementById('sort-toggle').addEventListener('click', handleSortToggle);

    // Dilution cards
    document.querySelectorAll('.dilution-card').forEach(card => {
        card.addEventListener('click', handleDilutionSelect);
    });

    // Feeding hours
    document.querySelectorAll('.feeding-hours-btn').forEach(btn => {
        btn.addEventListener('click', handleFeedingHoursSelect);
    });

    // Target % buttons
    document.querySelectorAll('.target-pct-btn').forEach(btn => {
        btn.addEventListener('click', handleTargetPctSelect);
    });

    setupRateButtons();

    const generateBtn = document.querySelector('.btn-secondary');
    if (generateBtn) generateBtn.addEventListener('click', handleGeneratePrescription);

    const copyBtn = document.querySelector('.copy-btn');
    if (copyBtn) copyBtn.addEventListener('click', handleCopyPrescription);
}

function setupRateButtons() {
    const container = document.getElementById('rate-buttons');
    if (!container) return;
    container.innerHTML = '';
    for (let rate = 30; rate <= 120; rate += 10) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'rate-btn';
        btn.textContent = `${rate} ml/hr`;
        btn.setAttribute('data-rate', rate);
        btn.addEventListener('click', handleRateSelect);
        container.appendChild(btn);
    }
}

// ─── Handlers ────────────────────────────────────────────────────────────────

function handlePatientFormSubmit(e) {
    e.preventDefault();

    const heightCm = parseFloat(document.getElementById('height').value);
    const age      = parseFloat(document.getElementById('age').value);
    const gender   = document.querySelector('input[name="gender"]:checked').value;

    if (!heightCm || heightCm < 100 || heightCm > 250) {
        alert('Please enter a valid height between 100 and 250 cm'); return;
    }
    if (!age || age < 1 || age > 120) {
        alert('Please enter a valid age between 1 and 120 years'); return;
    }

    AppState.patientData = { heightCm, age, gender };
    AppState.ibwValues   = calculateIBWMethods(heightCm, gender);

    renderIBWCards(AppState.ibwValues, handleIBWSelect);
    toggleVisibility('ibw-selection', true);
    scrollToElement('ibw-selection');
}

function handleIBWSelect(method) {
    document.querySelectorAll('.ibw-selection-card').forEach(c => c.classList.remove('selected'));
    document.getElementById(`ibw-card-${method}`).classList.add('selected');

    AppState.selectedIBW    = AppState.ibwValues[method].value;
    AppState.selectedMethod = AppState.ibwValues[method].name;

    toggleVisibility('calculate-diet-btn', true);
}

function handleCalculateDiet() {
    if (!AppState.selectedIBW) { alert('Please select an IBW method first'); return; }

    const proteinRange = document.getElementById('protein-range-select').value;
    const { heightCm, age, gender } = AppState.patientData;
    const weightKg = AppState.selectedIBW;

    const reeValue       = calculateREE(weightKg, heightCm, age, gender);
    const nonProteinCal  = calculateNonProteinCalories(weightKg);
    const proteinCal     = calculateProteinCalories(proteinRange, weightKg);
    const totals         = calculateTotalAndTargetCalories(nonProteinCal, proteinCal, AppState.targetPct);

    AppState.calculationResults = {
        selectedIBW:      AppState.selectedIBW,
        selectedMethod:   AppState.selectedMethod,
        proteinRange,
        reeValue,
        nonProteinCalMin: nonProteinCal.min,
        nonProteinCalMax: nonProteinCal.max,
        proteinGramsMin:  proteinCal.gramsMin,
        proteinGramsMax:  proteinCal.gramsMax,
        proteinCalMin:    proteinCal.caloriesMin,
        proteinCalMax:    proteinCal.caloriesMax,
        totalCalMin:      totals.totalCalMin,
        totalCalMax:      totals.totalCalMax,
        targetCalMin:     totals.targetCalMin,
        targetCalMax:     totals.targetCalMax,
        targetProteinMin: proteinCal.gramsMin,
        targetProteinMax: proteinCal.gramsMax,
        targetPct:        AppState.targetPct
    };

    document.getElementById('selected-method').textContent       = `${AppState.selectedMethod} Method`;
    document.getElementById('selected-ibw').textContent          = `${formatNumber(AppState.selectedIBW, 2)} kg`;
    document.getElementById('selected-protein-range').textContent = proteinRange;

    updateCalculationDisplay(reeValue, nonProteinCal, proteinCal, totals, AppState.targetPct);
    renderProducts(ENTERAL_PRODUCTS, AppState.filters, AppState.sortAscending, handleProductSelect);

    toggleVisibility('results', true);
    scrollToElement('results');
}

function handleTargetPctSelect(e) {
    const pct = parseFloat(e.currentTarget.getAttribute('data-pct'));
    AppState.targetPct = pct;

    document.querySelectorAll('.target-pct-btn').forEach(b => b.classList.remove('selected'));
    e.currentTarget.classList.add('selected');

    // If calculations have already been run, recalculate with new target
    if (AppState.calculationResults) {
        const { nonProteinCalMin, nonProteinCalMax, proteinCalMin, proteinCalMax,
                proteinGramsMin, proteinGramsMax } = AppState.calculationResults;

        const nonProteinCal = { min: nonProteinCalMin, max: nonProteinCalMax };
        const proteinCal    = {
            gramsMin: proteinGramsMin, gramsMax: proteinGramsMax,
            caloriesMin: proteinCalMin, caloriesMax: proteinCalMax
        };
        const totals = calculateTotalAndTargetCalories(nonProteinCal, proteinCal, pct);

        AppState.calculationResults.targetCalMin = totals.targetCalMin;
        AppState.calculationResults.targetCalMax = totals.targetCalMax;
        AppState.calculationResults.targetPct    = pct;

        // Update display label
        const reeValue = AppState.calculationResults.reeValue;
        updateCalculationDisplay(reeValue, nonProteinCal, proteinCal, totals, pct);

        // Recalculate feed preview if product already selected
        if (AppState.selectedProduct) calculateAndSetSuggestedRate();
    }
}

function handleFilterChange(e) {
    const filterMap = {
        'filter-low-sodium':         'lowSodium',
        'filter-fluid-restriction':  'fluidRestriction',
        'filter-high-protein':       'highProtein',
        'filter-low-protein':        'lowProtein',
        'filter-low-calorie-density':'lowCalorieDensity',
        'filter-high-calorie-density':'highCalorieDensity'
    };

    AppState.filters[filterMap[e.target.id]] = e.target.checked;

    // Mutual exclusivity for density filters
    if (e.target.id === 'filter-low-calorie-density' && e.target.checked) {
        AppState.filters.highCalorieDensity = false;
        const el = document.getElementById('filter-high-calorie-density');
        if (el) { el.checked = false; el.closest('.filter-chip').classList.remove('active'); }
    }
    if (e.target.id === 'filter-high-calorie-density' && e.target.checked) {
        AppState.filters.lowCalorieDensity = false;
        const el = document.getElementById('filter-low-calorie-density');
        if (el) { el.checked = false; el.closest('.filter-chip').classList.remove('active'); }
    }

    const chip = e.target.closest('.filter-chip');
    e.target.checked ? chip.classList.add('active') : chip.classList.remove('active');

    renderProducts(ENTERAL_PRODUCTS, AppState.filters, AppState.sortAscending, handleProductSelect);
}

function handleSortToggle() {
    AppState.sortAscending = !AppState.sortAscending;
    document.getElementById('sort-icon').textContent = AppState.sortAscending ? '↑' : '↓';
    document.getElementById('sort-text').textContent = AppState.sortAscending ? 'Ascending' : 'Descending';
    const toggle = document.getElementById('sort-toggle');
    toggle.classList.add('active');
    setTimeout(() => toggle.classList.remove('active'), 300);
    renderProducts(ENTERAL_PRODUCTS, AppState.filters, AppState.sortAscending, handleProductSelect);
}

function handleProductSelect(index) {
    document.querySelectorAll('.product-card').forEach(c => c.classList.remove('selected'));
    const card = document.getElementById(`product-${index}`);
    if (card) {
        card.classList.add('selected');
        AppState.selectedProduct      = ENTERAL_PRODUCTS[index];
        AppState.selectedProductIndex = index;
        toggleVisibility('dilution-controls', true);
        calculateAndSetSuggestedRate();
        scrollToElement('dilution-controls');
    }
}

function calculateAndSetSuggestedRate() {
    if (!AppState.selectedProduct || !AppState.calculationResults) return;

    const diluted       = applyDilution(AppState.selectedProduct.standardDilution, AppState.dilutionType);
    const targetCalAvg  = (AppState.calculationResults.targetCalMin + AppState.calculationResults.targetCalMax) / 2;
    const requiredPreps = targetCalAvg / diluted.calories;
    const requiredVol   = requiredPreps * diluted.finalVolumeMl;
    const requiredRate  = requiredVol / AppState.feedingHours;

    let suggestedRate = Math.round(requiredRate / 10) * 10;
    suggestedRate = Math.min(Math.max(suggestedRate, 30), 120);

    AppState.selectedRate = suggestedRate;
    updateRateButtonSelection(suggestedRate);
    updateDilutionPreview();
}

function updateRateButtonSelection(rate) {
    document.querySelectorAll('.rate-btn').forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.getAttribute('data-rate')) === rate);
    });
}

function handleDilutionSelect(e) {
    const radio = e.currentTarget.querySelector('input[type="radio"]');
    if (radio) {
        AppState.dilutionType = radio.value;
        document.querySelectorAll('.dilution-card').forEach(c => c.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        calculateAndSetSuggestedRate();
    }
}

function handleFeedingHoursSelect(e) {
    AppState.feedingHours = parseInt(e.currentTarget.getAttribute('data-hours'));
    document.querySelectorAll('.feeding-hours-btn').forEach(b => b.classList.remove('selected'));
    e.currentTarget.classList.add('selected');
    calculateAndSetSuggestedRate();
}

function handleRateSelect(e) {
    AppState.selectedRate = parseInt(e.currentTarget.getAttribute('data-rate'));
    updateRateButtonSelection(AppState.selectedRate);
    updateDilutionPreview();
}

// ─── Dilution Preview ─────────────────────────────────────────────────────────

function updateDilutionPreview() {
    if (!AppState.selectedProduct || !AppState.calculationResults) return;

    const diluted = applyDilution(AppState.selectedProduct.standardDilution, AppState.dilutionType);
    const { targetCalMin, targetCalMax, targetProteinMin, targetProteinMax, targetPct } = AppState.calculationResults;
    const currentRate = AppState.selectedRate || 60;

    const caloriesPerPrep = diluted.calories;
    const proteinPerPrep  = diluted.protein;
    const volumePerPrep   = diluted.finalVolumeMl;
    const timePerPrep     = volumePerPrep / currentRate;
    const prepsPerDay     = AppState.feedingHours / timePerPrep;
    const actualCalories  = prepsPerDay * caloriesPerPrep;
    const actualProtein   = prepsPerDay * proteinPerPrep;
    const actualVolume    = prepsPerDay * volumePerPrep;

    const calorieDeficitMin  = Math.max(0, targetCalMin - actualCalories);
    const calorieDeficitMax  = Math.max(0, targetCalMax - actualCalories);
    const proteinDeficitMin  = Math.max(0, targetProteinMin - actualProtein);
    const proteinDeficitMax  = Math.max(0, targetProteinMax - actualProtein);
    const meetsCalorieTarget = actualCalories >= targetCalMin && actualCalories <= targetCalMax;
    const meetsProteinTarget = actualProtein  >= targetProteinMin && actualProtein  <= targetProteinMax;
    const exceedsCalorieMax  = actualCalories > targetCalMax;
    const exceedsProteinMax  = actualProtein  > targetProteinMax;

    const targetCalAvg  = (targetCalMin + targetCalMax) / 2;
    const requiredPreps = targetCalAvg / caloriesPerPrep;
    const requiredVol   = requiredPreps * volumePerPrep;
    let suggestedRate   = Math.round((requiredVol / AppState.feedingHours) / 10) * 10;
    suggestedRate = Math.min(Math.max(suggestedRate, 30), 120);

    const feedsPerDay = Math.round(prepsPerDay * 2) / 2;
    const pctLabel    = Math.round((targetPct || 0.7) * 100);

    AppState.currentSchedule = {
        timePerPrep, prepsPerDay, feedsPerDay,
        actualCalories, actualProtein, actualVolume,
        caloriesPerPrep, proteinPerPrep, volumePerPrep,
        calorieDeficitMin, calorieDeficitMax,
        proteinDeficitMin, proteinDeficitMax,
        meetsCalorieTarget, meetsProteinTarget,
        suggestedRate, targetCalMin, targetCalMax,
        targetProteinMin, targetProteinMax,
        exceedsCalorieMax, exceedsProteinMax
    };

    const dilutionLabels = { half:'½ Standard Dilution', standard:'Standard Dilution', double:'2× Standard Dilution' };

    const calorieColor  = exceedsCalorieMax ? '#ff9800' : (meetsCalorieTarget ? '#4CAF50' : '#f44336');
    const proteinColor  = exceedsProteinMax ? '#ff9800' : (meetsProteinTarget ? '#4CAF50' : '#f44336');
    const calorieStatus = exceedsCalorieMax ? '⚠️ Exceeds upper limit' : (meetsCalorieTarget ? '✅ Within target range' : '⚠️ Below target range');
    const proteinStatus = exceedsProteinMax ? '⚠️ Exceeds upper limit' : (meetsProteinTarget ? '✅ Within target range' : '⚠️ Below target range');

    document.getElementById('dilution-preview').innerHTML = `
        <h4 style="color:#2e7d32;margin-bottom:15px;">📊 Feed Configuration</h4>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin-bottom:20px;">
            <div style="padding:15px;background:#f8f9fa;border-radius:8px;">
                <strong style="color:#667eea;">Dilution Type:</strong><br>
                <span style="font-size:1.2em;font-weight:700;">${dilutionLabels[AppState.dilutionType]}</span>
            </div>
            <div style="padding:15px;background:#f8f9fa;border-radius:8px;">
                <strong style="color:#667eea;">Feeding Hours:</strong><br>
                <span style="font-size:1.2em;font-weight:700;">${AppState.feedingHours} hours</span>
            </div>
            <div style="padding:15px;background:#f8f9fa;border-radius:8px;">
                <strong style="color:#667eea;">Current Rate:</strong><br>
                <span style="font-size:1.2em;font-weight:700;color:#2196F3;">${currentRate} ml/hour</span>
            </div>
            <div style="padding:15px;background:#f8f9fa;border-radius:8px;">
                <strong style="color:#667eea;">Time per Feed:</strong><br>
                <span style="font-size:1.2em;font-weight:700;">${formatNumber(timePerPrep,1)} hours</span>
            </div>
        </div>

        <div style="background:#f8f9fa;padding:20px;border-radius:8px;border:2px solid #e0e0e0;margin-bottom:20px;">
            <h5 style="color:#2196F3;margin-bottom:15px;">🎯 Target Analysis (${pctLabel}%)</h5>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;">
                <div style="padding:20px;background:white;border-radius:8px;border-left:4px solid ${calorieColor};">
                    <strong style="color:#667eea;">Calorie Target (${pctLabel}%):</strong><br>
                    <span style="font-size:1.2em;font-weight:bold;color:#333;">${Math.round(targetCalMin)} – ${Math.round(targetCalMax)} kcal/day</span>
                    <hr style="margin:10px 0;border:none;border-top:1px solid #eee;">
                    <strong>Delivered:</strong> ${Math.round(actualCalories)} kcal/day<br><br>
                    <div style="padding:8px;background:${exceedsCalorieMax?'#fff3e0':(meetsCalorieTarget?'#e8f5e9':'#ffebee')};border-radius:4px;">
                        <strong style="color:${calorieColor};">${calorieStatus}</strong>
                        ${!meetsCalorieTarget&&!exceedsCalorieMax?`<br>Deficit: ${Math.round(calorieDeficitMin)}–${Math.round(calorieDeficitMax)} kcal`
                        :exceedsCalorieMax?`<br>Exceeds by: ${Math.round(actualCalories-targetCalMax)} kcal`:''}
                    </div>
                </div>
                <div style="padding:20px;background:white;border-radius:8px;border-left:4px solid ${proteinColor};">
                    <strong style="color:#667eea;">Protein Target:</strong><br>
                    <span style="font-size:1.2em;font-weight:bold;color:#333;">${formatNumber(targetProteinMin,1)} – ${formatNumber(targetProteinMax,1)} g/day</span>
                    <hr style="margin:10px 0;border:none;border-top:1px solid #eee;">
                    <strong>Delivered:</strong> ${formatNumber(actualProtein,1)} g/day<br><br>
                    <div style="padding:8px;background:${exceedsProteinMax?'#fff3e0':(meetsProteinTarget?'#e8f5e9':'#ffebee')};border-radius:4px;">
                        <strong style="color:${proteinColor};">${proteinStatus}</strong>
                        ${!meetsProteinTarget&&!exceedsProteinMax?`<br>Deficit: ${formatNumber(proteinDeficitMin,1)}–${formatNumber(proteinDeficitMax,1)} g`
                        :exceedsProteinMax?`<br>Exceeds by: ${formatNumber(actualProtein-targetProteinMax,1)} g`:''}
                    </div>
                </div>
            </div>
        </div>

        <div style="background:#e8f5e9;padding:20px;border-radius:8px;border:2px solid #4CAF50;">
            <h5 style="color:#2e7d32;margin-bottom:15px;">🍼 Feed Schedule</h5>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin-bottom:15px;">
                <div style="padding:15px;background:white;border-radius:8px;text-align:center;">
                    <strong style="color:#667eea;display:block;margin-bottom:5px;">Feeds per Day</strong>
                    <span style="font-size:1.5em;font-weight:bold;color:#2196F3;">${feedsPerDay}</span><br>
                    <small style="color:#666;">(Every ${formatNumber(timePerPrep,1)} hours)</small>
                </div>
                <div style="padding:15px;background:white;border-radius:8px;text-align:center;">
                    <strong style="color:#667eea;display:block;margin-bottom:5px;">Each Feed Contains</strong>
                    <span style="font-weight:bold;color:#4CAF50;">${Math.round(caloriesPerPrep)} kcal</span><br>
                    <span style="font-weight:bold;color:#2196F3;">${formatNumber(proteinPerPrep,1)} g protein</span>
                </div>
                <div style="padding:15px;background:white;border-radius:8px;text-align:center;">
                    <strong style="color:#667eea;display:block;margin-bottom:5px;">Feed Volume</strong>
                    <span style="font-size:1.5em;font-weight:bold;color:#FF9800;">${Math.round(volumePerPrep)} ml</span><br>
                    <small style="color:#666;">per feed</small>
                </div>
            </div>
            <div style="background:#f1f8e9;padding:15px;border-radius:6px;margin-top:10px;">
                <h6 style="color:#2e7d32;margin-bottom:10px;">📊 Daily Total</h6>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;">
                    <div style="padding:10px;background:white;border-radius:6px;text-align:center;">
                        <strong>Calories</strong><br><span style="font-weight:bold;color:#4CAF50;">${Math.round(actualCalories)} kcal</span>
                    </div>
                    <div style="padding:10px;background:white;border-radius:6px;text-align:center;">
                        <strong>Protein</strong><br><span style="font-weight:bold;color:#2196F3;">${formatNumber(actualProtein,1)} g</span>
                    </div>
                    <div style="padding:10px;background:white;border-radius:6px;text-align:center;">
                        <strong>Volume</strong><br><span style="font-weight:bold;color:#FF9800;">${Math.round(actualVolume)} ml</span>
                    </div>
                </div>
            </div>
            <div style="margin-top:15px;padding:10px;background:#fff8e1;border-radius:6px;border:1px solid #ffd54f;">
                <small style="color:#5d4037;">
                    💡 <strong>Instruction:</strong> Prepare fresh feed every ${formatNumber(timePerPrep,1)} hours.
                    Each feed requires ${Math.round(volumePerPrep)} ml to be administered over ${formatNumber(timePerPrep,1)} hours.
                </small>
            </div>
        </div>`;
}

// ─── Prescription ─────────────────────────────────────────────────────────────

function handleGeneratePrescription() {
    if (!AppState.selectedProduct || !AppState.calculationResults || !AppState.selectedRate) {
        alert('Please select a feeding rate first'); return;
    }

    const prescriptionText = generatePrescriptionText(
        AppState.patientData,
        AppState.calculationResults,
        AppState.selectedProduct,
        AppState.dilutionType,
        AppState.selectedRate,
        AppState.feedingHours,
        AppState.currentSchedule
    );

    document.getElementById('prescription-text').textContent = prescriptionText;
    toggleVisibility('feeding-results', true);
    scrollToElement('feeding-results');
}

function handleCopyPrescription() {
    const text = document.getElementById('prescription-text').textContent;
    navigator.clipboard.writeText(text)
        .then(() => {
            const btn = document.querySelector('.copy-btn');
            const orig = btn.textContent;
            btn.textContent = '✅ Copied!';
            setTimeout(() => btn.textContent = orig, 2000);
        })
        .catch(() => alert('Failed to copy. Please copy manually.'));
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}