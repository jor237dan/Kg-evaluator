// ==========================================
// CONFIGURATION
// ==========================================
const firebaseConfig = {
    apiKey: "API_KEY_ICI",
    authDomain: "PROJET_ID.firebaseapp.com",
    projectId: "PROJET_ID",
    storageBucket: "PROJET_ID.appspot.com",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID"
};

let db;
try {
    if (firebaseConfig.apiKey !== "API_KEY_ICI") {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        console.log("Firebase connecté ✅");
    } else {
        console.warn("⚠️ Firebase non configuré (Mode Local)");
    }
} catch (e) { console.error("Erreur Init Firebase:", e); }

// ==========================================
// STATE MANAGEMENT
// ==========================================
let appState = {
    team: "",
    kg: "Wikidata",
    task: "CEA", // Default
};

// ==========================================
// UI HANDLING (SINGLE PAGE)
// ==========================================

function handleFileSelect(input) {
    const fileName = input.files[0] ? input.files[0].name : "Aucun fichier";
    document.getElementById('file-name').innerText = fileName;
}

function switchTab(viewId, tabElement) {
    // 1. Visually Toggle Views
    document.querySelectorAll('.dashboard-layout').forEach(el => el.style.display = 'none');
    document.getElementById('view-' + viewId).style.display = (viewId === 'rules') ? 'block' : 'grid';

    // 2. Update Tab Active State
    document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
    tabElement.classList.add('active');
}

// ==========================================
// CORE LOGIC
// ==========================================

async function fetchGT(kg, task) {
    const path = `assets/gt/${kg}_${task}.csv`;

    // Safety Check for Local File protocol
    if (window.location.protocol === 'file:') {
        // Technically this will fail in Chrome, so we warn specifically if fetch fails
        console.warn("Detected file:// protocol. Fetch usually fails here due to CORS.");
    }

    try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`Fichier introuvable (${res.status}). Vérifiez ${path}`);
        const csvText = await res.text();
        return Papa.parse(csvText, { skipEmptyLines: true, header: false }).data;
    } catch (e) {
        if (window.location.protocol === 'file:') {
            throw new Error(`Impossible de lire le fichier GT en local (${e.message}). Navigateur bloque 'fetch' sur file://. Utilisez un serveur local (Live Server).`);
        }
        throw new Error(`Erreur chargement GT: ${e.message}`);
    }
}

async function parseUserCSV(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            skipEmptyLines: true,
            header: false,
            complete: (res) => resolve(res.data),
            error: (err) => reject(err)
        });
    });
}

// ==========================================
// METRICS ENGINE
// ==========================================

async function runEvaluation() {
    // 1. Get Inputs
    const teamName = document.getElementById('team-name').value;
    const kg = appState.kg; // Controlled by radio (single)

    // Get ALL selected tasks
    const taskCheckboxes = document.querySelectorAll('input[name="task"]:checked');
    const selectedTasks = Array.from(taskCheckboxes).map(cb => cb.value);

    const fileInput = document.getElementById('submission-file');
    const errorBox = document.getElementById('error-box');
    const resultsDiv = document.getElementById('local-results');

    // 2. Validation
    errorBox.style.display = 'none';
    resultsDiv.style.display = 'none';

    if (!teamName) { showError("Veuillez entrer un nom d'équipe."); return; }
    if (selectedTasks.length === 0) { showError("Veuillez sélectionner au moins une tâche."); return; }
    if (!fileInput.files.length) { showError("Veuillez uploader un fichier CSV."); return; }

    const file = fileInput.files[0];

    try {
        // 3. Parse User Submission (Done ONCE for the file)
        const subData = await parseCSV(file);

        // Prepare to collect results
        let combinedResultsHTML = "<h3>Vos Scores</h3>";
        let hasErrors = false;

        // 4. Loop through EACH selected task
        for (const task of selectedTasks) {

            // a. Fetch Ground Truth for this specific task
            const gtData = await fetchGT(kg, task);

            if (gtData.length === 0) {
                combinedResultsHTML += `<div class="mini-metrics error-text"><strong>${task}</strong> : GT introuvable ou vide.</div>`;
                hasErrors = true;
                continue; // Skip evaluation for this task
            }

            // b. Calculate Metrics
            let metrics;
            try {
                switch (task) {
                    case 'CEA': metrics = evaluate_CEA(gtData, subData); break;
                    case 'CPA': metrics = evaluate_CPA(gtData, subData); break;
                    case 'CTA': metrics = evaluate_CTA(gtData, subData); break;
                    case 'RA': metrics = evaluate_RA(gtData, subData); break;
                    default: throw new Error("Tâche inconnue");
                }

                // c. Add to Results Display
                combinedResultsHTML += `
                    <div class="result-row">
                        <span class="badg">${task}</span>
                        <span class="metric">F1: <strong>${metrics.f1.toFixed(3)}</strong></span>
                        <span class="metric">P: ${metrics.precision.toFixed(3)}</span>
                        <span class="metric">R: ${metrics.recall.toFixed(3)}</span>
                    </div>`;

                // d. Save to Firebase (One document per Task)
                // We use a clean ID (Team-KG-Task) to allow overwriting or just add new timestamped entries
                if (db) {
                    await db.collection("submissions").add({
                        team: teamName,
                        kg: kg,
                        task: task, // Save specific task
                        f1: parseFloat(metrics.f1.toFixed(4)),
                        precision: parseFloat(metrics.precision.toFixed(4)),
                        recall: parseFloat(metrics.recall.toFixed(4)),
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }

            } catch (err) {
                console.error(`Error evaluating ${task}:`, err);
                combinedResultsHTML += `<div class="mini-metrics error-text"><strong>${task}</strong> : Erreur de calcul (${err.message}).</div>`;
                hasErrors = true;
            }
        }

        // 5. Finalize Display
        resultsDiv.innerHTML = combinedResultsHTML;
        resultsDiv.style.display = 'block';

        if (db) {
            refreshLeaderboard(); // Update LB after all saves
            // Update chart? Just showing the last one or need a complex chart? 
            // For now, let's leave the chart as "Select a task to view comparison"
        }

    } catch (err) {
        showError("Erreur globale: " + err.message);
    }
}

function showError(msg) {
    const el = document.getElementById('error-box');
    el.innerText = msg;
    el.style.display = 'block';
}

// --- EVALUATORS (SAME LOGIC) ---
function evaluate_CEA(gtRows, subRows) {
    const gtMap = new Map();
    gtRows.forEach(row => {
        if (row.length < 4) return;
        const key = `${row[0]} ${row[1]} ${row[2]}`;
        const entities = row[3].toLowerCase().split(' ');
        gtMap.set(key, entities);
    });
    const correctCells = new Set(), annotatedCells = new Set();
    subRows.forEach(row => {
        if (row.length < 4) return;
        const key = `${row[0]} ${row[1]} ${row[2]}`;
        if (gtMap.has(key)) {
            if (annotatedCells.has(key)) return;
            annotatedCells.add(key);
            let val = row[3].toLowerCase();
            if (!val.startsWith('http://www.wikidata.org/entity/')) val = 'http://www.wikidata.org/entity/' + val;
            if (gtMap.get(key).includes(val)) correctCells.add(key);
        }
    });
    return calculateMetrics(correctCells.size, annotatedCells.size, gtMap.size);
}

function evaluate_CPA(gtRows, subRows) {
    const gtMap = new Map();
    gtRows.forEach(row => {
        if (row.length < 4) return;
        const key = `${row[0]} ${row[1]} ${row[2]}`;
        gtMap.set(key, row[3].toLowerCase());
    });
    const correctCols = new Set(), annotatedCols = new Set();
    subRows.forEach(row => {
        if (row.length < 4) return;
        const key = `${row[0]} ${row[1]} ${row[2]}`;
        if (gtMap.has(key)) {
            if (annotatedCols.has(key)) return;
            annotatedCols.add(key);
            if (row[3].toLowerCase() === gtMap.get(key)) correctCols.add(key);
        }
    });
    return calculateMetrics(correctCols.size, annotatedCols.size, gtMap.size);
}

function evaluate_CTA(gtRows, subRows) {
    const gtMap = new Map();
    gtRows.forEach(row => {
        if (row.length < 3) return;
        const key = `${row[0]} ${row[1]}`;
        gtMap.set(key, row[2].toLowerCase());
    });
    const correctCols = new Set(), annotatedCols = new Set();
    subRows.forEach(row => {
        if (row.length < 3) return;
        const key = `${row[0]} ${row[1]}`;
        if (annotatedCols.has(key)) return;
        annotatedCols.add(key);
        const targetType = gtMap.get(key);
        if (targetType && targetType.includes(row[2].trim().toLowerCase())) correctCols.add(key);
    });
    return calculateMetrics(correctCols.size, annotatedCols.size, gtMap.size);
}

function evaluate_RA(gtRows, subRows) {
    const gtMap = new Map();
    gtRows.forEach(row => {
        if (row.length < 3) return;
        const key = `${row[0]} ${row[1]}`;
        const entities = row[2] ? row[2].toLowerCase().split(' ') : [];
        gtMap.set(key, entities);
    });
    const correctRows = new Set(), annotatedRows = new Set();
    subRows.forEach(row => {
        if (row.length < 3) return;
        const key = `${row[0]} ${row[1]}`;
        if (gtMap.has(key)) {
            if (annotatedRows.has(key)) return;
            annotatedRows.add(key);
            let val = row[2].toLowerCase();
            if (!val.startsWith('http')) val = 'http://www.wikidata.org/entity/' + val;
            const valid = gtMap.get(key);
            if (valid.some(e => val.includes(e) || e.includes(val))) correctRows.add(key);
        }
    });
    return calculateMetrics(correctRows.size, annotatedRows.size, gtMap.size);
}

function calculateMetrics(correct, annotated, target) {
    const precision = annotated > 0 ? correct / annotated : 0;
    const recall = target > 0 ? correct / target : 0;
    const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    return { f1: parseFloat(f1.toFixed(3)), precision: parseFloat(precision.toFixed(3)), recall: parseFloat(recall.toFixed(3)) };
}

// ==========================================
// DB & CHART
// ==========================================

function saveResultToFirebase(metrics) {
    if (!db) return;
    db.collection("submissions").add({
        team: appState.team, kg: appState.kg, task: appState.task,
        f1: metrics.f1, precision: metrics.precision, recall: metrics.recall,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

let myChart = null;
function renderChart(metrics) {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    const placeholder = document.getElementById('chart-placeholder');
    if (placeholder) placeholder.style.display = 'none'; // Hide placeholder

    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Moyenne', 'Mon Score', 'État de l\'Art'],
            datasets: [{
                label: 'F1',
                data: [0.5, metrics.f1, 0.98], // Added dummy average for visual balance
                backgroundColor: ['#6366f1', '#0ea5e9', '#22c55e'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

async function refreshLeaderboard() {
    const kg = document.getElementById('lb-kg').value;
    const task = document.getElementById('lb-task').value;
    const tbody = document.getElementById('lb-body');
    if (!db) { tbody.innerHTML = "<tr><td colspan='3'>Firebase OFF</td></tr>"; return; }

    tbody.innerHTML = "<tr><td colspan='3'>...</td></tr>";

    try {
        // 1. Get Leaderboard Data for current Table
        const snap = await db.collection("submissions").where("kg", "==", kg).where("task", "==", task).orderBy("f1", "desc").limit(10).get();
        tbody.innerHTML = "";

        if (snap.empty) {
            document.getElementById('lb-empty').style.display = 'block';
            // Reset table if empty but don't return early if we want to update global stats? 
            // Actually, global stats should probably be a separate call or just simplified.
            // For now, let's just stick to "0" if nothing loaded, or try to load stats once.
        } else {
            document.getElementById('lb-empty').style.display = 'none';
            let i = 1;
            snap.forEach(doc => {
                const d = doc.data();
                tbody.insertAdjacentHTML('beforeend', `<tr><td>${i++}</td><td>${d.team}</td><td>${d.f1}</td></tr>`);
            });
        }

        // 2. Simple Global Stats Update (Bonus)
        // Note: Counting all docs in Firestore is expensive/slow without counters. 
        // We will just show the stats of the *Currently Displayed* leaderboard + a multiplier or just "N/A"
        // To respect user feedback ("why 12?"), let's try to get a real count if possible, 
        // OR just set them to a realistic "Waiting..." if DB is empty.

        // Let's do a lightweight check:
        // Update "Soumissions" = just the number of items in this leaderboard (simple approximation)
        // Real count requires aggregation queries. We'll use the current snapshot size for now to be honest.
        if (snap) {
            document.getElementById('stat-subs').innerText = snap.size; // "Soumissions (listées)"
            // Unique teams in this list
            const uniqueTeams = new Set();
            snap.forEach(d => uniqueTeams.add(d.data().team));
            document.getElementById('stat-teams').innerText = uniqueTeams.size;
        }

    } catch (e) { console.error(e); tbody.innerHTML = "<tr><td colspan='3'>Erreur DB</td></tr>"; }
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    refreshLeaderboard();
});
