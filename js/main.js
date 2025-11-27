// --- DATOS ---
const ROOM_DATA = [
    { name: "Sala de Estudio", img: "sala_de_estudio.png" },
    { name: "Living", img: "living.png" },
    { name: "Cocina", img: "cocina.png" },
    { name: "Comedor", img: "comedor.png" },
    { name: "Biblioteca", img: "biblioteca.png" },
    { name: "Dormitorio 1", img: "habitacion_1.png" },
    { name: "Dormitorio 2", img: "habitacion_2.png" },
    { name: "Dormitorio 3", img: "habitacion_3.png" },
    { name: "Baño 1", img: "bano_1.png" },
    { name: "Baño 2", img: "bano_2.png" },
    { name: "Invernadero", img: "invernadero.png" },
    { name: "Cripta", img: "cripta.png" },
    { name: "Sótano", img: "sotano.png" },
    { name: "Garage", img: "garage.png" }
];

const GHOST_DATA = [
    { name: "Espectro", evidence: ["EMF", "DOTS", "CAJA ESPECTRAL"] },
    { name: "Sombra", evidence: ["EMF", "TEMPERATURA", "LIBRO"] },
    { name: "Yokai", evidence: ["DOTS", "CAJA ESPECTRAL", "ORBES"] },
    { name: "Demonio", evidence: ["TEMPERATURA", "LIBRO", "MICRÓFONO PARABÓLICO"] },
    { name: "Poltergeist", evidence: ["ULTRAVIOLETA", "ORBES", "MICRÓFONO PARABÓLICO"] }
];

const EVIDENCE_TYPES = [
    "EMF", "DOTS", "TEMPERATURA", "CAJA ESPECTRAL", 
    "ULTRAVIOLETA", "LIBRO", "ORBES", "MICRÓFONO PARABÓLICO"
];

const EVIDENCE_DISPLAY_NAMES = {
    "EMF": "EMF", "DOTS": "DOTS", "TEMPERATURA": "Temperatura",
    "CAJA ESPECTRAL": "Caja Espectral", "ULTRAVIOLETA": "Ultravioleta",
    "LIBRO": "Libro", "ORBES": "Orbes", "MICRÓFONO PARABÓLICO": "Micrófono"
};

const EVIDENCE_VALIDATION_NAMES = {
    "EMF": "EMF", "DOTS": "DOTS", "TEMPERATURA": "Termometro",
    "CAJA ESPECTRAL": "Caja Espectral", "ULTRAVIOLETA": "Ultravioleta",
    "LIBRO": "Escritura Fantasma", "ORBES": "Orbes", "MICRÓFONO PARABÓLICO": "Sonido"
};

const VALIDATION_ORDER = [
    "EMF", "DOTS", "ORBES",
    "TEMPERATURA", "CAJA ESPECTRAL", "MICRÓFONO PARABÓLICO",
    "ULTRAVIOLETA", "LIBRO"
];

const PLAYER_COLORS = ['var(--p1)', 'var(--p2)', 'var(--p3)', 'var(--p4)'];
const ICONS = { clues: 'assets/iconos/pista_boton.png', protection: 'assets/iconos/proteccion_boton.png' };

let gameState = {
    visits: {}, 
    validatedEvidence: [],
    incorrectEvidence: [],
    secretGhost: null
};

document.addEventListener('DOMContentLoaded', () => {
    initGame();
    initTabs();
    initValidation();
});

function initGame() {
    const rnd = Math.floor(Math.random() * GHOST_DATA.length);
    gameState.secretGhost = GHOST_DATA[rnd];
    ROOM_DATA.forEach(r => {
        gameState.visits[r.name] = { clues: [0, 0, 0, 0], protection: [0, 0, 0, 0] };
    });
    renderRooms();
    renderClues();
}

function initTabs() {
    const tabs = document.querySelectorAll('.folder-tab');
    const sections = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.target).classList.add('active');
        });
    });
}

function renderRooms() {
    const container = document.getElementById('room-list');
    container.innerHTML = ROOM_DATA.map(room => {
        let playersHtml = '';
        for (let i = 0; i < 4; i++) {
            const hasClue = gameState.visits[room.name].clues[i] === 1;
            const hasProt = gameState.visits[room.name].protection[i] === 1;
            const clueClass = hasClue ? 'status-icon active' : 'status-icon';
            const protClass = hasProt ? 'status-icon active' : 'status-icon';
            playersHtml += `
                <div class="player-row">
                    <div class="action-zone clue-zone" onclick="toggleAction('${room.name}', ${i}, 'clues')">
                        <div class="player-circle" style="background-color: ${PLAYER_COLORS[i]}"></div>
                        <img src="${ICONS.clues}" class="${clueClass}" alt="Pista">
                    </div>
                    <div class="row-divider"></div>
                    <div class="action-zone prot-zone" onclick="toggleAction('${room.name}', ${i}, 'protection')">
                        <img src="${ICONS.protection}" class="${protClass}" alt="Protección">
                    </div>
                </div>`;
        }
        return `
            <div class="room-card" style="background-image: url('assets/losetas/${room.img}');">
                <div class="room-overlay-bg">
                    <div class="room-header-card"><span class="room-name">${room.name}</span></div>
                    <div class="room-grid">${playersHtml}</div>
                </div>
            </div>`;
    }).join('');
}

window.toggleAction = function(roomName, playerIndex, type) {
    const currentValue = gameState.visits[roomName][type][playerIndex];
    gameState.visits[roomName][type][playerIndex] = 1 - currentValue;
    renderRooms();
};

function renderClues() {
    const evContainer = document.getElementById('evidence-grid');
    evContainer.innerHTML = EVIDENCE_TYPES.map(ev => {
        const displayName = EVIDENCE_DISPLAY_NAMES[ev];
        let cls = 'handwritten-item';
        if (gameState.validatedEvidence.includes(ev)) cls += ' found';
        if (gameState.incorrectEvidence.includes(ev)) cls += ' ruled-out';
        return `<div class="${cls}">${displayName}</div>`;
    }).join('');

    const ghContainer = document.getElementById('ghost-grid');
    ghContainer.innerHTML = GHOST_DATA.map(g => {
        const ruledOut = gameState.validatedEvidence.some(e => !g.evidence.includes(e)) ||
                         gameState.incorrectEvidence.some(e => g.evidence.includes(e));
        return `<div class="handwritten-item ${ruledOut ? 'ruled-out' : ''}">${g.name}</div>`;
    }).join('');
}

function initValidation() {
    const btn = document.getElementById('open-validation-btn');
    const overlay = document.getElementById('validation-overlay');
    btn.addEventListener('click', () => {
        resetValidation();
        overlay.classList.remove('hunt-mode');
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.add('visible'), 10);
    });
}

function resetValidation() {
    selectedEv = null;
    const content = document.getElementById('validation-content');
    const btns = VALIDATION_ORDER.map(ev => {
        const displayName = EVIDENCE_VALIDATION_NAMES[ev];
        const dis = gameState.validatedEvidence.includes(ev) || gameState.incorrectEvidence.includes(ev);
        let style = "";
        if (displayName.length > 11) style = "font-size: 0.85em; line-height: 1;";
        return `<button class="val-option" style="${style}" data-ev="${ev}" ${dis ? 'disabled' : ''}>${displayName}</button>`;
    }).join('');

    content.innerHTML = `
        <div class="val-header">
            <button class="back-btn" onclick="closeVal()"><i class="fas fa-chevron-left"></i></button>
        </div>
        <div class="val-grid-container">${btns}</div>
        <button id="verify-btn" onclick="doVerify()">Verificar</button>
    `;

    content.querySelectorAll('.val-option').forEach(b => {
        b.addEventListener('click', (e) => {
            const target = e.target.closest('.val-option');
            content.querySelectorAll('.val-option').forEach(x => x.classList.remove('selected'));
            target.classList.add('selected');
            selectedEv = target.dataset.ev;
        });
    });
}

window.closeVal = function() {
    const overlay = document.getElementById('validation-overlay');
    overlay.classList.remove('visible');
    overlay.classList.remove('hunt-mode');
    renderClues();
};

window.doVerify = function() {
    if (!selectedEv) return;
    const isCorrect = gameState.secretGhost.evidence.includes(selectedEv);
    const content = document.getElementById('validation-content');
    const overlay = document.getElementById('validation-overlay');
    
    if (isCorrect) {
        if (!gameState.validatedEvidence.includes(selectedEv)) gameState.validatedEvidence.push(selectedEv);
        overlay.classList.remove('hunt-mode');
        
        content.innerHTML = `
            <div class="val-header"><button class="back-btn" onclick="closeVal()"><i class="fas fa-chevron-left"></i></button></div>
            
            <div class="safe-screen-container">
                <h1 class="title-safe">ESTÁS A SALVO</h1>
                
                <p class="safe-message-bottom">
                    La pista ingresada es <span class="text-green">correcta</span>.<br>
                    El fantasma permanece tranquilo...
                </p>
            </div>`;
            
    } else {
        if (!gameState.incorrectEvidence.includes(selectedEv)) gameState.incorrectEvidence.push(selectedEv);
        overlay.classList.add('hunt-mode'); 
        
        // AQUÍ ESTABA EL ERROR: Ahora la clase es 'ghost-hunt-img' para coincidir con CSS
        content.innerHTML = `
            <div class="val-header"><button class="back-btn" onclick="closeVal()"><i class="fas fa-chevron-left"></i></button></div>
            
            <div class="hunt-screen-container">
                <h1 class="title-hunt">CACERÍA</h1>
                
                <div class="hunt-visual-group">
                    <img src="assets/validacion/Fantasma.png" class="ghost-hunt-img" alt="Fantasma">
                    <img src="assets/validacion/pentagrama.png" class="hunt-pentagram-img" alt="Pentagrama">
                </div>
                
                <p class="hunt-message-bottom">
                    Has ingresado una pista <span class="text-red">incorrecta</span>...<br>
                    Y desembocado la ira del fantasma.<br>
                    Empieza la cacería...
                </p>
            </div>`;
    }
};