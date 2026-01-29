// ==========================================
// 1. CONFIGURATION FIREBASE
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
    // Initialisation
    if (firebaseConfig.apiKey !== "API_KEY_ICI") {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        console.log("Firebase connecté ✅");
    } else {
        console.warn("Mode local : Configurez les clés Firebase pour sauvegarder en BD.");
    }
} catch (e) { console.error("Erreur Firebase:", e); }

// ==========================================
// 2. DONNÉES DE RÉFÉRENCE (BENCHMARK)
// ==========================================
// C'est ici qu'on définit les scores "des autres" pour la comparaison graphique
const BENCHMARK_DATA = {
    CEA: { avg: 0.75, best: 0.96 },
    CTA: { avg: 0.72, best: 0.94 },
    CPA: { avg: 0.68, best: 0.91 },
    RA:  { avg: 0.81, best: 0.98 }
};

// ==========================================
// 3. NAVIGATION & UI
// ==========================================
let currentSession = { team: '', tasks: [], kg: '' };

function updateStepper(step) {
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    if(step >= 1) document.getElementById('step1').classList.add('active');
    if(step >= 2) document.getElementById('step2').classList.add('active');
    if(step >= 3) document.getElementById('step3').classList.add('active');
}

function showSection(id) {
    document.querySelectorAll('section').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('fade-in');
    });
    const section = document.getElementById(id);
    section.style.display = 'block';
    void section.offsetWidth; // Force Reflow
    section.classList.add('fade-in');
    
    if(id === 'setupSection') updateStepper(1);
    if(id === 'uploadSection') updateStepper(2);
    if(id === 'dashboardSection') updateStepper(3);
}

function goToUpload() {
    const team = document.getElementById('teamName').value;
    const kg = document.querySelector('input[name="kg"]:checked')?.value;
    const checkboxes = document.querySelectorAll('input[name="tasks"]:checked');
    let selectedTasks = [];
    checkboxes.forEach(cb => selectedTasks.push(cb.value));

    if (!team) return alert("Veuillez entrer un nom d'équipe.");
    if (!kg) return alert("Veuillez sélectionner un Knowledge Graph.");
    if (selectedTasks.length === 0) return alert("Sélectionnez au moins une tâche.");
    
    currentSession.team = team;
    currentSession.tasks = selectedTasks;
    currentSession.kg = kg;

    // Génération dynamique des zones d'upload
    const container = document.getElementById('dynamicUploadContainer');
    container.innerHTML = ''; 

    selectedTasks.forEach(task => {
        const html = `
            <div class="upload-group" data-task="${task}">
                <h3>Tâche : ${task} (${kg})</h3>
                <div class="file-row">
                    <div class="file-input-wrapper">
                        <label>Vérité Terrain (GT) .csv</label>
                        <input type="file" class="gt-file" accept=".csv">
                    </div>
                    <div class="file-input-wrapper">
                        <label>Votre Soumission .csv</label>
                        <input type="file" class="sub-file" accept=".csv">
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });

    showSection('uploadSection');
}

function resetEvaluation() {
    document.getElementById('setupForm').reset();
    document.getElementById('errorMsg').style.display = 'none';
    showSection('setupSection');
}

// ==========================================
// 4. MOTEUR D'ANALYSE CSV (JS pur)
// ==========================================

async function parseCSV(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            complete: (results) => resolve(results.data),
            error: (err) => reject(err),
            skipEmptyLines: true,
            header: false 
        });
    });
}

async function processEvaluation() {
    const uploadGroups = document.querySelectorAll('.upload-group');
    const errorMsg = document.getElementById('errorMsg');
    const btn = document.querySelector('#uploadSection .btn-primary');
    
    errorMsg.style.display = 'none';
    btn.innerText = "Calcul en cours...";
    btn.disabled = true;

    let globalResults = [];

    try {
        for (const group of uploadGroups) {
            const task = group.getAttribute('data-task');
            const gtFile = group.querySelector('.gt-file').files[0];
            const subFile = group.querySelector('.sub-file').files[0];

            if (!gtFile || !subFile) throw new Error(`Fichiers manquants pour la tâche ${task}.`);

            const gtData = await parseCSV(gtFile);
            const subData = await parseCSV(subFile);
            
            let res;
            if (task === 'CEA') res = evaluateCEA(gtData, subData);
            else if (task === 'CTA') res = evaluateCTA(gtData, subData);
            else if (task === 'CPA') res = evaluateCPA(gtData, subData);
            else if (task === 'RA') res = evaluateRA(gtData, subData);

            res.taskName = task;
            globalResults.push(res);
        }

        displayResults(globalResults);
        saveToFirebase(globalResults);

    } catch (err) {
        console.error(err);
        errorMsg.innerText = "Erreur : " + err.message;
        errorMsg.style.display = 'block';
    } finally {
        btn.innerText = "Lancer l'Évaluation";
        btn.disabled = false;
    }
}

// --- ALGORITHMES DE CALCUL (CEA, CTA, CPA, RA) ---
function computeMetrics(correct, annotated, target) {
    const precision = annotated > 0 ? correct / annotated : 0;
    const recall = target > 0 ? correct / target : 0;
    const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    return {
        f1: parseFloat(f1.toFixed(3)),
        precision: parseFloat(precision.toFixed(3)),
        recall: parseFloat(recall.toFixed(3))
    };
}

// (Les algorithmes d'évaluation sont compressés pour la lisibilité, mais fonctionnent comme avant)
function evaluateCEA(gt, sub) {
    const gtMap = new Map();
    gt.forEach(r => { if(r.length>=4) gtMap.set(`${r[0]} ${r[1]} ${r[2]}`, r[3].toLowerCase().split(' ')); });
    let correct=0, annotated=0; const annSet = new Set();
    sub.forEach(r => {
        if(r.length<4) return;
        const k=`${r[0]} ${r[1]} ${r[2]}`; if(annSet.has(k)) return; annSet.add(k);
        let val=r[3].toLowerCase().trim();
        if(val!=="i don't know" && val!=="") {
            annotated++;
            if(!val.startsWith('http')) val='http://www.wikidata.org/entity/'+val;
            if(gtMap.has(k) && gtMap.get(k).includes(val)) correct++;
        }
    });
    return computeMetrics(correct, annotated, gtMap.size);
}

function evaluateCTA(gt, sub) {
    const gtMap = new Map();
    gt.forEach(r => { if(r.length>=3) gtMap.set(`${r[0]} ${r[1]}`, r[2].toLowerCase()); });
    let correct=0, annotated=0; const annSet = new Set();
    sub.forEach(r => {
        if(r.length<3) return;
        const k=`${r[0]} ${r[1]}`; if(annSet.has(k)) return; annSet.add(k);
        let val=r[2].toLowerCase().trim();
        if(val!=="i don't know" && val!=="") {
            annotated++;
            if(gtMap.has(k) && gtMap.get(k).includes(val)) correct++;
        }
    });
    return computeMetrics(correct, annotated, gtMap.size);
}

function evaluateCPA(gt, sub) {
    const gtMap = new Map();
    gt.forEach(r => { if(r.length>=4) gtMap.set(`${r[0]} ${r[1]} ${r[2]}`, r[3].toLowerCase()); });
    let correct=0, annotated=0; const annSet = new Set();
    sub.forEach(r => {
        if(r.length<4) return;
        const k=`${r[0]} ${r[1]} ${r[2]}`; if(annSet.has(k)) return; annSet.add(k);
        let val=r[3].toLowerCase().trim();
        if(val!=="i don't know" && val!=="") {
            annotated++;
            if(gtMap.has(k) && gtMap.get(k)===val) correct++;
        }
    });
    return computeMetrics(correct, annotated, gtMap.size);
}

function evaluateRA(gt, sub) {
    const gtMap = new Map();
    gt.forEach(r => { if(r.length>=3) gtMap.set(`${r[0]} ${r[1]}`, r[2].toLowerCase().split(' ')); });
    let correct=0, annotated=0; const annSet = new Set();
    sub.forEach(r => {
        if(r.length<3) return;
        const k=`${r[0]} ${r[1]}`; if(annSet.has(k)) return; annSet.add(k);
        let val=r[2].toLowerCase().trim();
        if(val!=="i don't know" && val!=="") {
            annotated++;
            if(!val.startsWith('http')) val='http://www.wikidata.org/entity/'+val;
            if(gtMap.has(k) && gtMap.get(k).includes(val)) correct++;
        }
    });
    return computeMetrics(correct, annotated, gtMap.size);
}

// ==========================================
// 5. AFFICHAGE & GRAPHIQUES (COMPARATIF)
// ==========================================

function displayResults(resultsArray) {
    document.getElementById('resTeamName').innerText = currentSession.team;
    const container = document.getElementById('resultsContainer');
    container.innerHTML = '';

    resultsArray.forEach((res, index) => {
        const canvasId = `chart-${res.taskName}-${index}`;

        const html = `
            <div class="result-card">
                <h3>Résultats : ${res.taskName}</h3>
                
                <div class="res-metrics">
                    <div class="metric"><span class="metric-val" style="color:#004e92">${res.f1}</span><span class="metric-label">F1-Score</span></div>
                    <div class="metric"><span class="metric-val">${res.precision}</span><span class="metric-label">Precision</span></div>
                    <div class="metric"><span class="metric-val">${res.recall}</span><span class="metric-label">Recall</span></div>
                </div>

                <div class="chart-container">
                    <canvas id="${canvasId}"></canvas>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
        
        // Appel de la fonction graphique
        renderComparisonChart(canvasId, res);
    });

    showSection('dashboardSection');
}

// GRAPHIQUE COMPARATIF (MOI vs AUTRES vs TOP)
function renderComparisonChart(canvasId, userRes) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // On récupère les stats de référence (Benchmark)
    const bench = BENCHMARK_DATA[userRes.taskName] || { avg: 0.5, best: 0.9 };

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Mon Score', 'Moyenne (Autres)', 'Meilleur (SOTA)'],
            datasets: [{
                label: 'F1-Score',
                data: [userRes.f1, bench.avg, bench.best],
                backgroundColor: [
                    '#004e92', // Moi (Bleu)
                    '#9ca3af', // Moyenne (Gris)
                    '#10b981'  // Top (Vert)
                ],
                borderRadius: 5,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Comparaison F1-Score' }
            },
            scales: {
                y: { beginAtZero: true, max: 1.05 }
            }
        }
    });
}

function saveToFirebase(resultsArray) {
    if(!db) return;
    db.collection("submissions").add({
        team: currentSession.team,
        kg: currentSession.kg,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        results: resultsArray
    }).then(() => console.log("Sauvegarde OK en BD."));
}