let gameConfig = {};
let gameState = {};
// --- LISTA DE HABITACIONES ACTUALIZADA ---
const ROOM_NAMES = [
    "Vestíbulo principal",
    "Biblioteca",
    "Comedor",
    "Cocina 1",
    "Sala de estar",
    "Dormitorio 1",
    "Dormitorio 2",
    "Dormitorio 3",
    "Invernadero",
    "Baño 1",
    "Baño 2",
    "Baño 3",
    "Cripta familiar",
    "Sótano",
    "Ático",
    "Sala de estudio (oficina)"
];
// Colores de jugador más sutiles y "góticos"
const PLAYER_COLORS = ['#8B0000', '#004D40', '#4A148C', '#B8860B']; // Rojo Oscuro, Verde Bosque, Púrpura, Oro Viejo


document.addEventListener('DOMContentLoaded', () => {
    // Iniciar con la animación de entrada
    transitionToScreen(renderSetupScreen);
});

// --- FUNCIÓN DE TRANSICIÓN (Sin cambios) ---
function transitionToScreen(renderFunction) {
    const app = document.getElementById('app');
    const currentScreen = app.firstElementChild; 

    if (currentScreen) {
        currentScreen.classList.add('fade-out');
        currentScreen.addEventListener('animationend', () => {
            renderFunction();
            const newScreen = app.firstElementChild;
            if (newScreen) {
                newScreen.classList.add('fade-in');
            }
        }, { once: true });
    } else {
        renderFunction();
        const newScreen = app.firstElementChild;
        if (newScreen) {
            newScreen.classList.add('fade-in');
        }
    }
}

// --- SETUP SCREEN (Sin cambios) ---
function renderSetupScreen() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div id="setup-screen">
            <p class="setup-intro">Prepare su diario para la investigación...</p>
            <div class="form-group">
                <label for="player-count">Nº de Investigadores:</label>
                <select id="player-count">
                    <option value="2">2 Jugadores</option>
                    <option value="4">4 Jugadores</option>
                </select>
            </div>
            <div class="form-group">
                <label for="game-mode">Modo de Juego:</label>
                <select id="game-mode">
                    <option value="standard">Estándar (Máx 2 visitas)</option>
                    <option value="strict">Estricto (Máx 1 visita)</option>
                    <option value="objects">Objetos (Visitas varían)</option>
                </select>
            </div>
            <button id="start-game-btn">Comenzar Investigación <i class="fas fa-book-open"></i></button>
        </div>
    `;

    document.getElementById('start-game-btn').addEventListener('click', () => {
        gameConfig = {
            playerCount: parseInt(document.getElementById('player-count').value, 10),
            gameMode: document.getElementById('game-mode').value,
        };
        initializeGameState();
        transitionToScreen(renderGameScreen);
    });
}

// --- GAME SCREEN ---
function initializeGameState() {
    gameState = {
        currentPlayer: 0,
        objects: 0,
        visits: ROOM_NAMES.reduce((acc, room) => {
            acc[room] = Array(gameConfig.playerCount).fill(0);
            return acc;
        }, {})
    };
}

function getMaxVisits(playerIndex) {
    // 1. Modo Estricto
    if (gameConfig.gameMode === 'strict') {
        return 1;
    }

    // 2. Modo Estándar
    if (gameConfig.gameMode === 'standard') {
        return 2;
    }

    // 3. Modo Objetos
    if (gameConfig.gameMode === 'objects') {
        if (gameConfig.playerCount === 2) {
            return 1 + gameState.objects;
        }
        return 2;
    }
    return 2; // Fallback
}

// --- NUEVA FUNCIÓN AYUDANTE ---
function rerenderRoomList() {
    const list = document.getElementById('room-list');
    list.innerHTML = generateRoomList(); 

    list.querySelectorAll('.room-item').forEach((item, index) => {
        item.style.animation = `fadeIn 0.4s ease-out ${index * 0.05}s backwards forwards`;
    });
    
    addVisitButtonListeners();
}


function renderGameScreen() {
    const app = document.getElementById('app');
    const currentGlobalObjects = gameState.objects;

    // --- ¡AQUÍ ESTÁ EL CAMBIO! ---
    // Generar el HTML de los controles de objetos SÓLO si el modo es 'objects'
    let objectControlsHTML = '';
    if (gameConfig.gameMode === 'objects') {
        objectControlsHTML = `
            <div class="object-controls">
                <span>Objetos</span>
                <div class="object-counter">
                    <button id="remove-object-btn" ${currentGlobalObjects <= 0 ? 'disabled' : ''}><i class="fas fa-minus"></i></button>
                    <span class="object-count">${currentGlobalObjects}</span>
                    <button id="add-object-btn"><i class="fas fa-plus"></i></button>
                </div>
            </div>
        `;
    }

    app.innerHTML = `
        <div id="game-screen">
            <div class="game-header">
                <div class="player-turn" style="background-color: ${PLAYER_COLORS[gameState.currentPlayer]};">
                    Turno: Jugador ${gameState.currentPlayer + 1}
                </div>
                ${objectControlsHTML}
            </div>
            
            <h2 class="room-header">Registro de Habitaciones</h2>
            <ul id="room-list">
                ${generateRoomList()}
            </ul>
            <button id="next-turn-btn">Siguiente Turno <i class="fas fa-arrow-right"></i></button>
        </div>
    `;

    // Animación escalonada (sin cambios)
    document.querySelectorAll('.room-item').forEach((item, index) => {
        item.style.animation = `fadeIn 0.4s ease-out ${index * 0.05}s backwards forwards`;
    });

    // --- Listeners de botones ---
    document.getElementById('next-turn-btn').addEventListener('click', nextTurn);
    
    // --- ¡AQUÍ ESTÁ EL CAMBIO! (Solo añadir listeners si los botones existen) ---
    if (gameConfig.gameMode === 'objects') {
        document.getElementById('add-object-btn').addEventListener('click', () => {
            gameState.objects++; 
            const count = gameState.objects;
            
            document.querySelector('.object-count').textContent = count;
            document.getElementById('remove-object-btn').disabled = false;

            if (gameConfig.playerCount === 2) {
                rerenderRoomList();
            }
        });
        
        document.getElementById('remove-object-btn').addEventListener('click', () => {
            if (gameState.objects > 0) { 
                gameState.objects--; 
                const count = gameState.objects;

                document.querySelector('.object-count').textContent = count;
                if (count === 0) {
                    document.getElementById('remove-object-btn').disabled = true;
                }

                if (gameConfig.playerCount === 2) {
                    rerenderRoomList();
                }
            }
        });
    }
    
    addVisitButtonListeners();
}

function generateRoomList() {
    return ROOM_NAMES.map(room => `
        <li class="room-item">
            <span class="room-name">${room}</span>
            <div class="player-visits">
                ${generatePlayerVisits(room)}
            </div>
        </li>
    `).join('');
}


function generateVisitMarkersHTML(player, room) {
    const currentVisits = gameState.visits[room][player];
    const maxVisits = getMaxVisits(player); 
    let markers = '';
    for (let j = 0; j < maxVisits; j++) {
        const markerIcon = (j < currentVisits) ? 'fa-solid fa-circle' : 'fa-regular fa-circle';
        const style = (j < currentVisits) ? `style="color: ${PLAYER_COLORS[player]};"` : '';
        markers += `<i class="visit-marker ${markerIcon}" ${style}></i> `;
    }
    return markers;
}


function generatePlayerVisits(room) {
    let html = '';
    for (let i = 0; i < gameConfig.playerCount; i++) {
        const currentVisits = gameState.visits[room][i];
        const maxVisits = getMaxVisits(i); 
        const isMaxedOut = currentVisits >= maxVisits;
        const isAtZero = currentVisits === 0;

        html += `
            <div class="player-visit-control">
                <span class="player-indicator" style="background-color: ${PLAYER_COLORS[i]};">P${i + 1}</span>
                <div class="visit-markers">
                    ${generateVisitMarkersHTML(i, room)}
                </div>
                <div class="visit-controls">
                    <button class="visit-btn remove-visit-btn" data-room="${room}" data-player="${i}" ${isAtZero ? 'disabled' : ''}>
                        <i class="fas fa-minus"></i>
                    </button>
                    <button class="visit-btn add-visit-btn" data-room="${room}" data-player="${i}" ${isMaxedOut ? 'disabled' : ''}>
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        `;
    }
    return html;
}

// --- LISTENER DE BOTONES (Sin cambios) ---
function addVisitButtonListeners() {
    
    // Listener para AÑADIR visita
    document.querySelectorAll('.add-visit-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const targetButton = e.target.closest('.add-visit-btn');
            if (!targetButton || targetButton.disabled) return;

            const room = targetButton.dataset.room;
            const player = parseInt(targetButton.dataset.player, 10);
            const maxVisits = getMaxVisits(player); 

            if (gameState.visits[room][player] < maxVisits) {
                gameState.visits[room][player]++; 
                
                const controlElement = targetButton.closest('.player-visit-control');
                const markersContainer = controlElement.querySelector('.visit-markers');
                markersContainer.innerHTML = generateVisitMarkersHTML(player, room); 
                
                controlElement.querySelector('.remove-visit-btn').disabled = false;
                
                if (gameState.visits[room][player] >= maxVisits) {
                    targetButton.disabled = true;
                }
            }
        });
    });

    // Listener para QUITAR visita
    document.querySelectorAll('.remove-visit-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const targetButton = e.target.closest('.remove-visit-btn');
            if (!targetButton || targetButton.disabled) return;

            const room = targetButton.dataset.room;
            const player = parseInt(targetButton.dataset.player, 10);

            if (gameState.visits[room][player] > 0) {
                gameState.visits[room][player]--; 
                
                const controlElement = targetButton.closest('.player-visit-control');
                const markersContainer = controlElement.querySelector('.visit-markers');
                markersContainer.innerHTML = generateVisitMarkersHTML(player, room); 
                
                controlElement.querySelector('.add-visit-btn').disabled = false;
                
                if (gameState.visits[room][player] === 0) {
                    targetButton.disabled = true;
                }
            }
        });
    });
}

function nextTurn() {
    gameState.currentPlayer = (gameState.currentPlayer + 1) % gameConfig.playerCount;
    transitionToScreen(renderGameScreen);
}