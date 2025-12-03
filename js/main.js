
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
    { name: "Baño 3", img: "bano_3.png" },
    { name: "Invernadero", img: "invernadero.png" },
    { name: "Cripta", img: "cripta.png" },
    { name: "Sótano", img: "sotano.png" },
    { name: "Garage", img: "garage.png" }
];


const SAFE_ROOMS = [
    "Biblioteca",
    "Baño 1",
    "Dormitorio 2",
    "Sala de Estudio"
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
const EVIDENCE_ASSETS = {
    "EMF": "emf.png",  
    "DOTS": "proyector_dots.png",
    "TEMPERATURA": "termometro.png", 
    "CAJA ESPECTRAL": "caja_espectral.png",
    "ULTRAVIOLETA": "ultravioleta.png", 
    "LIBRO": "libro_de_escritura_fantasma.png",
    "ORBES": "orbes_espectrales.png",
    "MICRÓFONO PARABÓLICO": "microfono_parabolico.png"
};

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
    secretGhost: null,
    primeraRonda: true,
    fantasmaSeleccionado: null
};

let selectedEv = null;

document.addEventListener('DOMContentLoaded', () => {
    initGame();
    initTabs();
    initValidation();

    const startBtn = document.getElementById('start-game-btn');
    const cover = document.getElementById('book-cover');
    if (startBtn && cover) {
        startBtn.addEventListener('click', () => {
            cover.classList.add('book-opened');
            setTimeout(() => { cover.style.display = 'none'; }, 800);
        });
    }
});

function initGame() {
    // 1. Elegir Fantasma
    const rnd = Math.floor(Math.random() * GHOST_DATA.length);
    gameState.secretGhost = GHOST_DATA[rnd];
    console.log("Fantasma secreto:", gameState.secretGhost.name);
    const rndRoomIndex = Math.floor(Math.random() * ROOM_DATA.length);
    gameState.ghostRoomName = ROOM_DATA[rndRoomIndex].name;
    const msgElement = document.getElementById('ghost-location-msg');
    if (msgElement) {
        msgElement.innerHTML = `Se cree que el fantasma se encuentra en:<br><span class="ghost-room-highlight">${gameState.ghostRoomName}</span>`;
    }
    ROOM_DATA.forEach(r => {
        gameState.visits[r.name] = { clues: [0, 0, 0, 0], protection: [0, 0, 0, 0] };
    });

    renderRooms();
    renderClues();
    preloadImages();
}

function preloadImages() {
    const imagesToLoad = [
        "assets/validacion/marco_puerta2.png",
        "assets/validacion/Fantasma.png",
        "assets/validacion/pentagrama.png",
        "assets/botones/verificar.png",

        ...Object.values(EVIDENCE_ASSETS).map(filename => `assets/botones/${filename}`)
    ];

    imagesToLoad.forEach(src => {
        const img = new Image();
        img.src = src;
    });
    console.log("Imágenes precargadas en memoria.");
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
        const isSafeRoom = SAFE_ROOMS.includes(room.name);
        const isHaunted = room.name === gameState.ghostRoomName;
        const extraClass = isHaunted ? 'haunted-room' : '';

        let playersHtml = '';
        for (let i = 0; i < 4; i++) {
            const hasClue = gameState.visits[room.name].clues[i] === 1;
            const hasProt = gameState.visits[room.name].protection[i] === 1;
            const clueClass = hasClue ? 'status-icon active' : 'status-icon';
            const protClass = hasProt ? 'status-icon active' : 'status-icon';

            if (isSafeRoom) {
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
            } else {
                playersHtml += `
                    <div class="player-row" style="grid-template-columns: 1fr;">
                        <div class="action-zone clue-zone" onclick="toggleAction('${room.name}', ${i}, 'clues')" style="justify-content: center; gap: 20px;">
                            <div class="player-circle" style="background-color: ${PLAYER_COLORS[i]}"></div>
                            <img src="${ICONS.clues}" class="${clueClass}" alt="Pista">
                        </div>
                    </div>`;
            }
        }
        return `
            <div class="room-card ${extraClass}" style="background-image: url('assets/losetas/${room.img}');">
                <div class="room-overlay-bg">
                    <div class="room-header-card"><span class="room-name">${room.name}</span></div>
                    <div class="room-grid">${playersHtml}</div>
                </div>
            </div>`;
    }).join('');
}

window.toggleAction = function (roomName, playerIndex, type) {
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
        const ruledOut = gameState.validatedEvidence.some(e => !g.evidence.includes(e));
        let cls = 'handwritten-item';
        if (ruledOut) cls += ' ruled-out';
        if (gameState.fantasmaSeleccionado === g.name) cls += ' selected-ghost';

        return `<div class="${cls}" onclick="toggleGhostGuess('${g.name}')">${g.name}</div>`;
    }).join('');
    const valBtn = document.getElementById('open-validation-btn');
    if (valBtn) {
        valBtn.textContent = gameState.fantasmaSeleccionado ? `¿Es un ${gameState.fantasmaSeleccionado}?` : "Validar Prueba";
    }
}
window.toggleGhostGuess = function (ghostName) {
    if (gameState.fantasmaSeleccionado === ghostName) {
        gameState.fantasmaSeleccionado = null;
    } else {
        gameState.fantasmaSeleccionado = ghostName;
    }
    renderClues();
};


function initValidation() {
    const btn = document.getElementById('open-validation-btn');
    const overlay = document.getElementById('validation-overlay');
    btn.addEventListener('click', () => {
        if (gameState.fantasmaSeleccionado) {
            overlay.classList.remove('hidden');
            setTimeout(() => overlay.classList.add('visible'), 10);
            doVerify();
        } else {
            resetValidation();
            overlay.classList.remove('hunt-mode');
            overlay.classList.remove('escape-mode');
            overlay.classList.remove('hidden');
            setTimeout(() => overlay.classList.add('visible'), 10);
        }
    });
}
function resetValidation() {
    selectedEv = null;
    const content = document.getElementById('validation-content');
    content.classList.remove('fade-out-active');

    const btns = VALIDATION_ORDER.map(ev => {
        const imageName = EVIDENCE_ASSETS[ev];
        const isDisabled = gameState.validatedEvidence.includes(ev) || gameState.incorrectEvidence.includes(ev);
        const disabledClass = isDisabled ? 'disabled' : '';

        if (!imageName) return ``;

        return `
            <div class="val-img-wrapper ${disabledClass}" data-ev="${ev}">
                <img src="assets/botones/${imageName}" alt="${ev}" class="val-img-btn">
            </div>
        `;
    }).join('');
    content.innerHTML = `
        <div class="val-header">
            <button class="back-btn" onclick="closeVal()"><i class="fas fa-chevron-left"></i></button>
        </div>
        
        <div class="val-grid-images">
            ${btns}
        </div>
        
        <div class="verify-action-container">
            <img src="assets/botones/verificar.png" id="verify-img-btn" onclick="doVerify()" alt="Verificar">
        </div>
    `;

    content.querySelectorAll('.val-img-wrapper').forEach(wrapper => {
        if (!wrapper.classList.contains('disabled')) {
            wrapper.addEventListener('click', (e) => {
                content.querySelectorAll('.val-img-wrapper').forEach(x => x.classList.remove('selected'));
                wrapper.classList.add('selected');
                selectedEv = wrapper.dataset.ev;
            });
        }
    });
}

window.closeVal = function () {
    const overlay = document.getElementById('validation-overlay');
    overlay.classList.remove('visible');
    setTimeout(() => {
        overlay.classList.remove('hunt-mode');
        overlay.classList.remove('escape-mode');
    }, 300);
    renderClues();
};
window.doVerify = function () {
    const content = document.getElementById('validation-content');
    const overlay = document.getElementById('validation-overlay');
    content.classList.add('fade-out-active');

    setTimeout(() => {
        if (gameState.fantasmaSeleccionado) {
            const fantasmaCorrecto = gameState.fantasmaSeleccionado === gameState.secretGhost.name;

            if (fantasmaCorrecto) {
    // FANTASMA CORRECTO -> PANTALLA DE ESCAPE
    overlay.classList.add('escape-mode');
    content.innerHTML = `
        <div class="val-header">
            <button class="back-btn-fixed" onclick="closeVal()">
                <i class="fas fa-chevron-left"></i>
            </button>
        </div>
        
        <div class="escape-screen-container">
            
            <img src="assets/validacion/marco_puerta2.png" class="door-frame-fullscreen" alt="Marco Puerta">

            <div class="door-opening-zone">
                 
                 <div class="blinking-light-bg-full"></div>

                 <img src="assets/validacion/pentagrama.png" class="pentagram-floor" alt="Pentagrama">

                 <img src="assets/validacion/Fantasma2.png" class="ghost-in-door-centered" alt="Fantasma">
            </div>

            <h1 class="title-escape">¡ESCAPA!</h1>
            <p class="escape-message-bottom">
                ¡Has descubierto al <span class="text-red-glow">${gameState.secretGhost.name}</span>!<br>
                Su furia se ha desatado. ¡Huye de la casa antes de que te atrape!
            </p>
        </div>`;
} else {
                // FANTASMA INCORRECTO -> CACERÍA DIRECTA
                overlay.classList.add('hunt-mode');
                content.innerHTML = `
                    <div class="val-header"><button class="back-btn" onclick="closeVal()"><i class="fas fa-chevron-left"></i></button></div>
                    <div class="hunt-screen-container">
                         <h1 class="title-hunt">CACERÍA</h1>
                        <div class="hunt-visual-group">
                            <img src="assets/validacion/Fantasma.png" class="ghost-hunt-img" alt="Fantasma">
                            <img src="assets/validacion/pentagrama.png" class="hunt-pentagram-img" alt="Pentagrama">
                        </div>
                        <p class="hunt-message-bottom">
                            Te has equivocado... No es un <span class="text-red">${gameState.fantasmaSeleccionado}</span>.<br>
                            Tu error ha condenado a todos.<br>
                            Empieza la cacería final...
                        </p>
                    </div>`;
            }
            gameState.fantasmaSeleccionado = null;

        }
        else if (selectedEv) {
            const isCorrect = gameState.secretGhost.evidence.includes(selectedEv);
            if (isCorrect) {
                if (gameState.primeraRonda) gameState.primeraRonda = false;
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
                let contenido = '';
                if (gameState.primeraRonda) {
                    contenido = `<h1 class="title-hunt">CUIDADO</h1>
                    <div class="hunt-visual-group">
                        <img src="assets/validacion/Fantasma.png" class="ghost-warn-img" alt="Fantasma">
                        <img src="assets/validacion/pentagrama.png" class="hunt-pentagram-img" alt="Pentagrama">
                    </div>
                    <p class="hunt-message-bottom">
                        Has ingresado una pista <span class="text-red">incorrecta</span>...<br>
                        La ira del fantasma crece... A partir de ahora <br>
                        ya no pasará por alto las pistas erróneas e irá por vosotros...
                    </p>`
                    gameState.primeraRonda = false
                } else {
                    contenido = `<h1 class="title-hunt">CACERÍA</h1>
                    <div class="hunt-visual-group">
                        <img src="assets/validacion/Fantasma.png" class="ghost-hunt-img" alt="Fantasma">
                        <img src="assets/validacion/pentagrama.png" class="hunt-pentagram-img" alt="Pentagrama">
                    </div>
                    <p class="hunt-message-bottom">
                        Has ingresado una pista <span class="text-red">incorrecta</span>...<br>
                        Y desembocado la ira del fantasma.<br>
                        Empieza la cacería...
                    </p>`
                }
                // HTML Pantalla CACERÍA (sin cambios sustanciales)
                content.innerHTML = `
                <div class="val-header"><button class="back-btn" onclick="closeVal()"><i class="fas fa-chevron-left"></i></button></div>
                <div class="hunt-screen-container">${contenido}</div>`;
            }
        }
        content.classList.remove('fade-out-active');

    }, 500);
};