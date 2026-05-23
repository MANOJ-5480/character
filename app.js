/**
 * THE SYSTEM - CORE ENGINE
 * Implements a comprehensive, highly-gamified, Solo Leveling style training system.
 * Features: Client-side Obfuscation (preventing browser inspect cheating), LocalStorage, 
 * Web Audio Synth, Web Speech Synthesis, Dynamic Engineering/Physical Quests.
 * Tailored specifically for the User's Summer Plan (Buggy design, ANSYS simulation, 
 * Solid Mechanics, Heat Transfer, Mechatronics, Rocket Parachutes, Meditation & Strength).
 * Cloud Sync: Serverless Google Drive REST API integration for automated cross-device syncing.
 */

// ============================================================================
// 1. GAME STATE INITIAL VALUE DEFINITIONS
// ============================================================================
const DEFAULT_STATE = {
    name: "Hunter",
    title: "E-Rank Mech Apprentice",
    level: 1,
    xp: 0,
    xpNeeded: 100,
    gold: 250,
    fatigue: 0,
    maxFatigue: 100,
    statPoints: 0,
    skillPoints: 0,
    stats: {
        str: 10,
        agi: 10,
        int: 10,
        wis: 10,
        vit: 10
    },
    statBonuses: {
        str: 0,
        agi: 0,
        int: 0,
        wis: 0,
        vit: 0
    },
    equipment: {
        head: null,
        body: null,
        tool: null,
        accessory: null
    },
    inventory: [],
    skills: {
        chassisArchitect: 1,  // +INT bonus
        aeroRecovery: 1,      // +WIS bonus
        ironFortitude: 1,     // +VIT bonus
        zenFocus: 0,          // Buffs Wisdom temporarily and reduces fatigue
        feaVision: 0          // Buffs Intelligence temporarily for simulation
    },
    dailyQuest: {
        dateString: "",
        completed: false,
        claimed: false,
        objectives: []
    },
    penaltyActive: false,
    penaltyObjectives: [
        { id: "p_squats", text: "Survival Squats Repetitions", current: 0, target: 150 },
        { id: "p_math", text: "Calibrate Buggy Suspension Factor of Safety", completed: false }
    ],
    penaltyMathSolved: false,
    lastActiveDate: "",
    systemTampered: false,
    gdriveClientId: "",     // User Google Client ID
    gdriveApiKey: "",       // User Google API Key
    gdriveFileId: "",       // Google Drive Save File ID
    gdriveConnected: false  // Track Google Drive sync state
};

// ============================================================================
// SECURITY AND OBFUSCATION ENGINE (Prevent Inspect Cheating)
// ============================================================================
const SECURE_KEY = "SHADOW_MONARCH_ENGINEERING_PROTOCOL_2026";

function obfuscate(text) {
    let result = "";
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i) ^ SECURE_KEY.charCodeAt(i % SECURE_KEY.length);
        result += String.fromCharCode(charCode);
    }
    return btoa(unescape(encodeURIComponent(result)));
}

function deobfuscate(scrambled) {
    try {
        const decoded = decodeURIComponent(escape(atob(scrambled)));
        let result = "";
        for (let i = 0; i < decoded.length; i++) {
            const charCode = decoded.charCodeAt(i) ^ SECURE_KEY.charCodeAt(i % SECURE_KEY.length);
            result += String.fromCharCode(charCode);
        }
        return result;
    } catch (e) {
        return null;
    }
}

function generateChecksum(payload) {
    let hash = 0;
    const combined = payload + SECURE_KEY;
    for (let i = 0; i < combined.length; i++) {
        hash = (hash << 5) - hash + combined.charCodeAt(i);
        hash |= 0;
    }
    return hash.toString(36);
}

// ============================================================================
// SAVE / LOAD SYSTEM INTEGRATION
// ============================================================================
let gameState = null;
let gdriveAccessToken = ""; // Volatile OAuth2 access token

function loadGame() {
    const secureSave = localStorage.getItem("THE_SYSTEM_SECURE_SAVE");
    
    if (secureSave) {
        try {
            const decryptedString = deobfuscate(secureSave);
            if (!decryptedString) {
                handleTamperDetection();
                return;
            }
            
            const envelope = JSON.parse(decryptedString);
            const calculatedHash = generateChecksum(envelope.payload);
            
            if (calculatedHash !== envelope.hash) {
                handleTamperDetection();
                return;
            }
            
            gameState = JSON.parse(envelope.payload);
            
            // Retroactively inject cloud variables
            if (gameState.gdriveClientId === undefined) gameState.gdriveClientId = "";
            if (gameState.gdriveApiKey === undefined) gameState.gdriveApiKey = "";
            if (gameState.gdriveFileId === undefined) gameState.gdriveFileId = "";
            if (gameState.gdriveConnected === undefined) gameState.gdriveConnected = false;
            
            if (gameState.systemTampered) {
                activateTamperLockdown();
            }
        } catch (e) {
            handleTamperDetection();
        }
    } else {
        const legacySave = localStorage.getItem("THE_SYSTEM_SAVE");
        if (legacySave) {
            try {
                gameState = JSON.parse(legacySave);
                localStorage.removeItem("THE_SYSTEM_SAVE");
                saveGame();
            } catch (e) {
                gameState = JSON.parse(JSON.stringify(DEFAULT_STATE));
            }
        } else {
            gameState = JSON.parse(JSON.stringify(DEFAULT_STATE));
        }
    }
}

function saveGame() {
    if (!gameState) return;
    
    const payload = JSON.stringify(gameState);
    const hash = generateChecksum(payload);
    
    const envelope = {
        payload: payload,
        hash: hash
    };
    
    const scrambled = obfuscate(JSON.stringify(envelope));
    localStorage.setItem("THE_SYSTEM_SECURE_SAVE", scrambled);
    
    // Background Google Drive Update if connected
    if (gameState.gdriveConnected && gdriveAccessToken && gameState.gdriveFileId) {
        backgroundUpdateGDrive(scrambled);
    }
}

function handleTamperDetection() {
    gameState = JSON.parse(JSON.stringify(DEFAULT_STATE));
    gameState.systemTampered = true;
    gameState.penaltyActive = true;
    gameState.level = 1;
    gameState.xp = 0;
    gameState.gold = 0;
    
    saveGame();
    activateTamperLockdown();
}

function activateTamperLockdown() {
    setTimeout(() => {
        triggerSystemAlarm("Intrusion detected. Falsified parameters identified. System integrity compromised. Level reset. Commencing penalty survival protocol.");
        
        const alertTicker = document.getElementById("alert-scroller");
        alertTicker.innerHTML = `
            <div class="alert-item warning-msg">⚠️ INTRUSION DETECTED: STATUS RESET.</div>
            <div class="alert-item urgent-msg">SYSTEM SANCTION: LEVEL DECREASED TO 1.</div>
            <div class="alert-item urgent-msg">GOLD RESERVES FORFEITED.</div>
        `;
    }, 2000);
}

loadGame();

// ============================================================================
// 2. AUDIO SYNTH ENGINE (Web Audio API & Text to Speech)
// ============================================================================
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (!document.getElementById("sound-toggle").checked) return;
    initAudio();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    switch (type) {
        case "click":
            osc.type = "sine";
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
            gainNode.gain.setValueAtTime(0.08, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
            break;

        case "chime":
            osc.type = "sine";
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.setValueAtTime(1600, now + 0.08);
            osc.frequency.setValueAtTime(2000, now + 0.16);
            gainNode.gain.setValueAtTime(0.12, now);
            gainNode.gain.linearRampToValueAtTime(0.1, now + 0.16);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
            break;

        case "level_up":
            osc.type = "triangle";
            osc.frequency.setValueAtTime(261.63, now);
            osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.15);
            osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.3);
            osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.45);
            
            const harmony = audioCtx.createOscillator();
            const harmGain = audioCtx.createGain();
            harmony.type = "sine";
            harmony.frequency.setValueAtTime(329.63, now);
            harmony.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);
            harmony.frequency.exponentialRampToValueAtTime(987.77, now + 0.3);
            harmony.frequency.exponentialRampToValueAtTime(1318.51, now + 0.45);
            harmony.connect(harmGain);
            harmGain.connect(audioCtx.destination);
            
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.linearRampToValueAtTime(0.15, now + 0.45);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

            harmGain.gain.setValueAtTime(0.08, now);
            harmGain.gain.linearRampToValueAtTime(0.08, now + 0.45);
            harmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

            osc.start(now);
            osc.stop(now + 0.9);
            harmony.start(now);
            harmony.stop(now + 0.9);
            break;

        case "siren":
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(300, now + 0.4);
            osc.frequency.linearRampToValueAtTime(150, now + 0.8);
            osc.frequency.linearRampToValueAtTime(300, now + 1.2);
            osc.frequency.linearRampToValueAtTime(150, now + 1.6);
            gainNode.gain.setValueAtTime(0.12, now);
            gainNode.gain.linearRampToValueAtTime(0.12, now + 1.4);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.65);
            osc.start(now);
            osc.stop(now + 1.7);
            break;
            
        case "buy":
            osc.type = "sine";
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.setValueAtTime(900, now + 0.08);
            osc.frequency.setValueAtTime(1350, now + 0.16);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
            break;
    }
}

function speakSystem(text) {
    if (!document.getElementById("voice-toggle").checked) return;
    try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
            voice.name.includes("Google US English") || 
            voice.name.includes("Zira") || 
            voice.lang.startsWith("en")
        );
        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.rate = 1.05;
        utterance.pitch = 0.95;
        utterance.volume = 0.8;
        window.speechSynthesis.speak(utterance);
    } catch (e) {
        console.error("Speech Synthesis failed:", e);
    }
}

// ============================================================================
// 3. SUMMER SHOP & SUMMER SKILLS CATALOGS
// ============================================================================
const SHOP_CATALOG = [
    {
        id: "ansys_license",
        name: "ANSYS Quantum Simulation License",
        slot: "tool",
        emoji: "💻",
        cost: 600,
        statBoost: { int: 5 },
        desc: "Virtual license enabling meshing convergence and structural analysis. [+5 INT]"
    },
    {
        id: "tune_to_win",
        name: "Tune to Win by Carroll Smith",
        slot: "accessory",
        emoji: "📖",
        cost: 400,
        statBoost: { wis: 3, agi: 1 },
        desc: "Essential literature on vehicle dynamics, suspension setups, and steering. [+3 WIS, +1 AGI]"
    },
    {
        id: "shigleys_design",
        name: "Shigley's Mechanical Engineering Design",
        slot: "accessory",
        emoji: "📙",
        cost: 300,
        statBoost: { int: 2, wis: 2 },
        desc: "Master key to shafts fatigue limits, bolt joints, and failure logic calculations. [+2 INT, +2 WIS]"
    },
    {
        id: "flame_wall",
        name: "Aramid Thermal Barrier Shielding",
        slot: "body",
        emoji: "🦺",
        cost: 500,
        statBoost: { vit: 3, int: 1 },
        desc: "Cockpit firewall composite shield to study heat transfer boundaries. [+3 VIT, +1 INT]"
    },
    {
        id: "yoga_mat",
        name: "Yoga Mat of Infinite Flexibility",
        slot: "body",
        emoji: "🧘",
        cost: 150,
        statBoost: { vit: 2 },
        desc: "Reduces fatigue building up during physical stretching workouts. [+2 VIT]"
    },
    {
        id: "caliper_precision",
        name: "Mitutoyo Vernier Calipers of Truth",
        slot: "tool",
        emoji: "🔧",
        cost: 350,
        statBoost: { int: 2, wis: 1 },
        desc: "Increases dimensional verification rates of physical chassis tubes. [+2 INT, +1 WIS]"
    },
    {
        id: "nylon_ripstop",
        name: "Ripstop Parachute Fabric (Nylon 6.6)",
        slot: "head",
        emoji: "🪂",
        cost: 450,
        statBoost: { wis: 3, str: 1 },
        desc: "High density canopy cloth to calculate aerodynamic drag for 5kg rockets. [+3 WIS, +1 STR]"
    }
];

const SKILL_CATALOG = {
    passives: [
        {
            id: "chassisArchitect",
            name: "Chassis Architect",
            emoji: "🏎️",
            desc: "Passive. Improves structural calculations for vehicle frames. Boosts Intelligence scaling.",
            statReq: "INT: 10",
            boostText: "INT base bonus: +[LVL]",
            checkReq: (state) => state.stats.int >= 10
        },
        {
            id: "aeroRecovery",
            name: "Aerodynamic Recovery Mastery",
            emoji: "🪂",
            desc: "Passive. Enhances parachute drag design and deployment mechanisms for high apogee rockets.",
            statReq: "WIS: 12",
            boostText: "WIS base bonus: +[LVL]",
            checkReq: (state) => state.stats.wis >= 12
        },
        {
            id: "ironFortitude",
            name: "Iron Fortitude",
            emoji: "🧘",
            desc: "Passive. Enhances study concentration and continuous attention span under thermal strain.",
            statReq: "STR: 12",
            boostText: "VIT base bonus: +[LVL]",
            checkReq: (state) => state.stats.str >= 12
        }
    ],
    actives: [
        {
            id: "zenFocus",
            name: "Zen Focus Protocol",
            emoji: "✨",
            desc: "Active. Enhances concentration. Can be triggered to immediately eliminate 20 points of fatigue.",
            statReq: "WIS: 12, VIT: 11",
            boostText: "Active: Decreases active Fatigue rate by [2 * LVL] points.",
            checkReq: (state) => state.stats.wis >= 12 && state.stats.vit >= 11
        },
        {
            id: "feaVision",
            name: "ANSYS FEA Sight",
            emoji: "🌈",
            desc: "Active. Double meshing speed. Enhances intelligence rating for static simulation calculations.",
            statReq: "INT: 15, AGI: 12",
            boostText: "Active: Increases mechanical INT by +[LVL * 2] during FEA tasks.",
            checkReq: (state) => state.stats.int >= 15 && state.stats.agi >= 12
        }
    ]
};

// ============================================================================
// 4. SUMMER PLAN SPECIFIC DAILY QUESTS DATABASE
// ============================================================================
const ENGINEERING_DB = {
    0: [
        { text: "Calculate the load vectors acting on the buggy front suspension mounting points during a 2G bump", steps: 1 },
        { text: "Design the buggy roll cage geometry in CAD using circular structural hollow tubes", steps: 1 },
        { text: "Draft suspension double-wishbone layouts and check steering scrub radius bounds", steps: 1 }
    ],
    1: [
        { text: "Complete one ANSYS tutorial on structural shell elements meshing convergence", steps: 1 },
        { text: "Perform a static structural FEA in ANSYS on your self-designed buggy roll cage model", steps: 1 },
        { text: "Evaluate mechanical stress concentration and factor of safety on front wheel spindle in ANSYS", steps: 1 }
    ],
    2: [
        { text: "Derive beam deflection formula for the rear swing-arm cantilever mount under cyclic load", steps: 1 },
        { text: "Construct Mohr's Circle to evaluate principal shear stress at the critical buggy engine joint", steps: 1 },
        { text: "Read and summarize fatigue endurance limit parameters (S_e) for AISI 4130 steel tubing", steps: 1 }
    ],
    3: [
        { text: "Determine heat transfer rate through composite cockpit firewall using layered convection rules", steps: 1 },
        { text: "Calculate heat dissipation surface area required for front braking rotor under friction braking", steps: 1 },
        { text: "Review convective heat transfer formulas for fluid flow across external suspension dampers", steps: 1 }
    ],
    4: [
        { text: "Draft a microcontroller schematic to read suspension travel pots using analog inputs", steps: 1 },
        { text: "Design a PID algorithm block diagram to maintain optimal mechatronic actuator steering alignment", steps: 1 },
        { text: "Calculate current requirements for driving H-bridge motor drivers cooling active radiator fans", steps: 1 }
    ],
    5: [
        { text: "Calculate required parachute surface area for 5kg rocket to ensure descent velocity < 5m/s", steps: 1 },
        { text: "Determine parachute cord load limits based on shock opening deceleration at apogee", steps: 1 },
        { text: "Draft CAD assembly layout for a dual-deployment rocket parachute canister recovery system", steps: 1 }
    ],
    6: [
        { text: "Calculate steering Ackermann geometry parameters for short wheelbase buggy design", steps: 1 },
        { text: "Determine braking force distribution (front/rear bias) based on dynamic buggy CG height", steps: 1 },
        { text: "Calculate suspension spring rates and ride frequencies matching front double-wishbone dampers", steps: 1 }
    ]
};

function generateQuestsForDate(date) {
    const dayOfWeek = date.getDay();
    const dateString = date.toDateString();
    
    const baseCount = Math.min(100, 30 + gameState.level * 5);
    
    const tasksPool = ENGINEERING_DB[dayOfWeek];
    const idx1 = date.getDate() % tasksPool.length;
    const idx2 = (date.getDate() + 1) % tasksPool.length;
    
    const engTask1 = tasksPool[idx1];
    const engTask2 = tasksPool[idx2 === idx1 ? (idx2 + 1) % tasksPool.length : idx2];

    const objectives = [
        { id: "pushups", category: "physical", text: "Push-ups (Physical Strength)", current: 0, target: baseCount },
        { id: "squats", category: "physical", text: "Squats (Physical Strength)", current: 0, target: baseCount },
        { id: "stretching", category: "physical", text: "Stretching & Yoga (Flexibility)", current: 0, target: 10 },
        { id: "meditation", category: "physical", text: "Zen Meditation (Fortitude & Dedication)", current: 0, target: 15 },
        { id: "eng_task_1", category: "technical", text: engTask1.text, current: 0, target: engTask1.steps },
        { id: "eng_task_2", category: "technical", text: engTask2.text, current: 0, target: engTask2.steps }
    ];

    return {
        dateString: dateString,
        completed: false,
        claimed: false,
        objectives: objectives
    };
}

function generateTutorialQuest() {
    return {
        dateString: new Date().toDateString(),
        completed: false,
        claimed: false,
        objectives: [
            { id: "pushups", category: "physical", text: "Calibration Push-ups", current: 0, target: 10 },
            { id: "meditation", category: "physical", text: "Zen Meditation (Concentration)", current: 0, target: 5 },
            { id: "eng_tutorial_1", category: "technical", text: "Calculate parachute drag force for 5kg rocket at apogee to calibrate recovery limits", current: 0, target: 1 }
        ]
    };
}

// ============================================================================
// 5. GAME STATS CALCULATION PIPELINE
// ============================================================================
function updatePlayerStats() {
    const baseBonuses = { str: 0, agi: 0, int: 0, wis: 0, vit: 0 };
    
    if (gameState.skills.chassisArchitect > 0) {
        baseBonuses.int += gameState.skills.chassisArchitect;
    }
    if (gameState.skills.aeroRecovery > 0) {
        baseBonuses.wis += gameState.skills.aeroRecovery;
    }
    if (gameState.skills.ironFortitude > 0) {
        baseBonuses.vit += gameState.skills.ironFortitude;
    }

    Object.keys(gameState.equipment).forEach(slot => {
        const itemId = gameState.equipment[slot];
        if (itemId) {
            const item = SHOP_CATALOG.find(i => i.id === itemId);
            if (item && item.statBoost) {
                Object.keys(item.statBoost).forEach(stat => {
                    baseBonuses[stat] += item.statBoost[stat];
                });
            }
        }
    });

    gameState.statBonuses = baseBonuses;
    
    const totalVit = gameState.stats.vit + gameState.statBonuses.vit;
    gameState.maxFatigue = 100 + totalVit * 5;

    const totalStatsSum = Object.values(gameState.stats).reduce((a, b) => a + b, 0);
    if (totalStatsSum >= 150) {
        gameState.title = "S-Rank Shadow Inventor";
    } else if (totalStatsSum >= 115) {
        gameState.title = "A-Rank Cyber Engineer";
    } else if (totalStatsSum >= 85) {
        gameState.title = "B-Rank Buggy Monarch";
    } else if (totalStatsSum >= 65) {
        gameState.title = "C-Rank Senior Design Tech";
    } else if (totalStatsSum >= 45) {
        gameState.title = "D-Rank FEA Specialist";
    } else {
        gameState.title = "E-Rank Mech Apprentice";
    }
}

// ============================================================================
// 6. UI RENDERING SYSTEM
// ============================================================================
function showToast(msg, isLevelUp = false) {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${isLevelUp ? 'level-up' : ''}`;
    
    const emoji = isLevelUp ? "👑" : "🔔";
    toast.innerHTML = `
        <span class="toast-emoji">${emoji}</span>
        <span class="toast-msg">${msg}</span>
    `;
    
    container.appendChild(toast);
    playSound(isLevelUp ? "level_up" : "chime");
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function triggerSystemAlarm(text) {
    playSound("siren");
    speakSystem(text);
    
    const flash = document.createElement("div");
    flash.style.position = "fixed";
    flash.style.top = "0";
    flash.style.left = "0";
    flash.style.width = "100%";
    flash.style.height = "100%";
    flash.style.background = "rgba(255, 42, 95, 0.25)";
    flash.style.zIndex = "999";
    flash.style.pointerEvents = "none";
    flash.style.animation = "toastFadeOut 1s ease forwards";
    document.body.appendChild(flash);
    
    setTimeout(() => {
        flash.remove();
    }, 1000);
}

function renderAll() {
    updatePlayerStats();
    
    document.getElementById("hunter-name-title").innerText = gameState.name.toUpperCase();
    document.getElementById("lvl-display").innerText = gameState.level;
    document.getElementById("rank-display").innerText = gameState.title.toUpperCase();
    
    const xpPercent = Math.min(100, (gameState.xp / gameState.xpNeeded) * 100);
    document.getElementById("xp-bar-fill").style.width = `${xpPercent}%`;
    document.getElementById("xp-text").innerText = `${gameState.xp} / ${gameState.xpNeeded}`;
    
    const ringCircle = document.getElementById("lvl-progress-bar");
    const ringRadius = 28;
    const circumference = 2 * Math.PI * ringRadius;
    const strokeOffset = circumference - (xpPercent / 100) * circumference;
    ringCircle.style.strokeDashoffset = strokeOffset;
    
    const fatiguePercent = Math.min(100, (gameState.fatigue / gameState.maxFatigue) * 100);
    document.getElementById("fatigue-bar-fill").style.width = `${fatiguePercent}%`;
    document.getElementById("fatigue-text").innerText = `${Math.floor(gameState.fatigue)} / ${gameState.maxFatigue}`;
    
    document.getElementById("gold-display").innerText = gameState.gold;
    document.getElementById("shop-gold-display").innerText = gameState.gold;
    
    renderStatusTab();
    renderQuestsTab();
    renderSkillsTab();
    renderShopTab();
    renderPenaltyState();
}

function renderStatusTab() {
    const pointsPool = gameState.statPoints;
    document.getElementById("stat-points-val").innerText = pointsPool;
    
    const statsList = ["str", "agi", "int", "wis", "vit"];
    statsList.forEach(stat => {
        document.getElementById(`stat-${stat}`).innerText = gameState.stats[stat];
        const bonus = gameState.statBonuses[stat];
        const bonusEl = document.getElementById(`stat-${stat}-bonus`);
        
        if (bonus > 0) {
            bonusEl.innerText = `+${bonus}`;
            bonusEl.style.display = "inline";
        } else {
            bonusEl.style.display = "none";
        }
        
        const upBtn = document.querySelector(`.stat-up-btn[data-stat="${stat}"]`);
        if (pointsPool > 0) {
            upBtn.classList.remove("disabled");
        } else {
            upBtn.classList.add("disabled");
        }
    });

    const slots = ["head", "body", "tool", "accessory"];
    slots.forEach(slot => {
        const itemId = gameState.equipment[slot];
        const titleEl = document.getElementById(`equip-${slot}`);
        if (itemId) {
            const item = SHOP_CATALOG.find(i => i.id === itemId);
            titleEl.innerText = item.name;
            titleEl.classList.remove("none");
        } else {
            titleEl.innerText = "NONE";
            titleEl.classList.add("none");
        }
    });
}

function renderQuestsTab() {
    const activeQuest = gameState.dailyQuest;
    const physContainer = document.getElementById("physical-objectives-list");
    const techContainer = document.getElementById("technical-objectives-list");
    
    physContainer.innerHTML = "";
    techContainer.innerHTML = "";
    
    const calibHeader = document.getElementById("quest-calib-header");
    if (activeQuest.dateString === new Date().toDateString()) {
        calibHeader.classList.remove("hidden");
    } else {
        calibHeader.classList.add("hidden");
    }

    let allCompleted = true;
    
    activeQuest.objectives.forEach((obj, index) => {
        const itemCard = document.createElement("div");
        itemCard.className = `objective-item ${obj.current >= obj.target ? 'completed' : ''}`;
        
        if (obj.current < obj.target) {
            allCompleted = false;
        }

        const isCompleted = obj.current >= obj.target;
        
        let progressDisplay = `${obj.current} / ${obj.target}`;
        if (obj.id === "meditation" || obj.id === "stretching") {
            progressDisplay = `${obj.current} / ${obj.target} min`;
        }

        itemCard.innerHTML = `
            <span class="objective-name">${obj.text}</span>
            <div class="objective-controls">
                <span class="objective-progress-text">${progressDisplay}</span>
                <button class="ctr-btn" data-act="minus" data-idx="${index}" ${isCompleted || obj.current === 0 ? 'disabled' : ''}>-</button>
                <button class="ctr-btn" data-act="plus" data-idx="${index}" ${isCompleted ? 'disabled' : ''}>+</button>
            </div>
        `;

        if (obj.category === "physical") {
            physContainer.appendChild(itemCard);
        } else {
            techContainer.appendChild(itemCard);
        }
    });

    const claimBtn = document.getElementById("claim-quest-btn");
    if (allCompleted && !activeQuest.claimed) {
        claimBtn.classList.remove("disabled");
        document.getElementById("quest-badge").classList.remove("hidden");
        gameState.dailyQuest.completed = true;
    } else {
        claimBtn.classList.add("disabled");
        document.getElementById("quest-badge").classList.add("hidden");
    }

    if (activeQuest.claimed) {
        claimBtn.querySelector("span").innerText = "QUEST REWARDS CLAIMED";
        claimBtn.classList.add("disabled");
    } else {
        claimBtn.querySelector("span").innerText = "CLAIM REWARDS";
    }
}

function renderSkillsTab() {
    const pointsPool = gameState.skillPoints;
    document.getElementById("skill-points-display").innerText = pointsPool;
    
    const passiveContainer = document.getElementById("passive-skills-grid");
    const activeContainer = document.getElementById("active-skills-grid");
    
    passiveContainer.innerHTML = "";
    activeContainer.innerHTML = "";

    SKILL_CATALOG.passives.forEach(skill => {
        const card = document.createElement("div");
        card.className = "skill-card";
        const level = gameState.skills[skill.id] || 0;
        const canUpgrade = pointsPool > 0 && skill.checkReq(gameState);
        
        card.innerHTML = `
            <div class="skill-card-top">
                <div class="skill-icon-title">
                    <span class="skill-emoji">${skill.emoji}</span>
                    <span class="skill-title">${skill.name}</span>
                </div>
                <span class="skill-level-badge">Lvl. ${level}</span>
            </div>
            <p class="skill-description">${skill.desc}</p>
            <div class="skill-card-actions">
                <span class="skill-bonus-val">${skill.boostText.replace("[LVL]", level)}</span>
                <button class="skill-upgrade-btn" data-skill="${skill.id}" ${!canUpgrade ? 'disabled' : ''}>UPGRADE</button>
            </div>
            <div class="skill-stat-requirement">Required: ${skill.statReq}</div>
        `;
        passiveContainer.appendChild(card);
    });

    SKILL_CATALOG.actives.forEach(skill => {
        const card = document.createElement("div");
        card.className = "skill-card";
        const level = gameState.skills[skill.id] || 0;
        const canUpgrade = pointsPool > 0 && skill.checkReq(gameState);
        
        let activeText = skill.boostText.replace("[LVL]", level).replace("[2 * LVL]", level * 2);
        
        card.innerHTML = `
            <div class="skill-card-top">
                <div class="skill-icon-title">
                    <span class="skill-emoji">${skill.emoji}</span>
                    <span class="skill-title">${skill.name}</span>
                </div>
                <span class="skill-level-badge">Lvl. ${level}</span>
            </div>
            <p class="skill-description">${skill.desc}</p>
            <div class="skill-card-actions">
                <span class="skill-bonus-val">${activeText}</span>
                <button class="skill-upgrade-btn" data-skill="${skill.id}" ${!canUpgrade ? 'disabled' : ''}>UPGRADE</button>
            </div>
            <div class="skill-stat-requirement">Required: ${skill.statReq}</div>
        `;
        activeContainer.appendChild(card);
    });
}

function renderShopTab() {
    const shopContainer = document.getElementById("shop-items-grid");
    shopContainer.innerHTML = "";

    SHOP_CATALOG.forEach(item => {
        const card = document.createElement("div");
        card.className = "shop-item-card";
        const canAfford = gameState.gold >= item.cost;
        
        card.innerHTML = `
            <div class="shop-item-icon">${item.emoji}</div>
            <span class="shop-item-name">${item.name}</span>
            <span class="shop-item-stats">${item.desc.split(".")[0]}</span>
            <div class="shop-item-actions">
                <span class="shop-item-cost">⚜ ${item.cost}</span>
                <button class="shop-buy-btn" data-id="${item.id}" ${!canAfford ? 'disabled' : ''}>BUY</button>
            </div>
        `;
        shopContainer.appendChild(card);
    });

    const invBag = document.getElementById("inventory-bag-slots");
    invBag.innerHTML = "";
    
    for (let i = 0; i < 16; i++) {
        const slotEl = document.createElement("div");
        const item = gameState.inventory[i];
        
        if (item) {
            const catalogItem = SHOP_CATALOG.find(c => c.id === item.id);
            const isEquipped = gameState.equipment[catalogItem.slot] === item.instanceId;
            
            slotEl.className = `inv-slot ${isEquipped ? 'equipped' : ''}`;
            slotEl.innerHTML = `
                <span>${catalogItem.emoji}</span>
                <div class="tooltip">
                    <span class="tooltip-title">${catalogItem.name}</span>
                    <span class="tooltip-stats">${catalogItem.desc}</span>
                    <span class="tooltip-action-hint">${isEquipped ? 'Click to UNEQUIP' : 'Click to EQUIP'}</span>
                </div>
            `;
            slotEl.addEventListener("click", () => handleInventoryClick(item.instanceId, catalogItem.slot));
        } else {
            slotEl.className = "inv-slot empty";
        }
        invBag.appendChild(slotEl);
    }
}

function renderPenaltyState() {
    const penaltyOverlay = document.getElementById("penalty-overlay");
    if (gameState.penaltyActive) {
        penaltyOverlay.classList.remove("hidden");
        document.getElementById("penalty-squats-count").innerText = `${gameState.penaltyObjectives[0].current} / 150`;
        
        const answerInput = document.getElementById("penalty-math-answer");
        if (gameState.penaltyMathSolved) {
            document.getElementById("penalty-math-equation").innerText = "Calibration Equation Solved! [CORRECT]";
            answerInput.style.display = "none";
            document.getElementById("penalty-math-submit").style.display = "none";
        } else {
            document.getElementById("penalty-math-equation").innerText = "Calculate safety factor for a shaft under 80Nm shear (Yield stress = 240MPa, Dia = 16mm): (n = Yield / (16 * T / (PI * d^3)))";
            answerInput.style.display = "inline";
            document.getElementById("penalty-math-submit").style.display = "inline";
        }
    } else {
        penaltyOverlay.classList.add("hidden");
    }
}

// ============================================================================
// 7. TIME MANAGEMENT, COUNTDOWN & MIDNIGHT TICKER
// ============================================================================
function updateTimeTicker() {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const diffMs = midnight - now;
    
    if (diffMs <= 0) {
        triggerMidnightTransition();
        return;
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    const pad = (n) => String(n).padStart(2, '0');
    const timerText = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    
    document.getElementById("quest-countdown-timer").innerText = timerText;

    if (gameState.penaltyActive) {
        const penaltyCount = document.getElementById("penalty-countdown-timer");
        const pMinutes = 45 - now.getMinutes();
        const pSeconds = 59 - now.getSeconds();
        penaltyCount.innerText = `03:${pad(pMinutes < 0 ? 0 : pMinutes)}:${pad(pSeconds)}`;
    }
}

function checkDateTransitions() {
    const todayStr = new Date().toDateString();
    if (gameState.lastActiveDate === "") {
        gameState.lastActiveDate = todayStr;
        gameState.dailyQuest = generateTutorialQuest();
        saveGame();
    } else if (gameState.lastActiveDate !== todayStr) {
        triggerMidnightTransition();
    }
}

function triggerMidnightTransition() {
    const yesterdayQuest = gameState.dailyQuest;
    const wasCompleted = yesterdayQuest.completed;
    
    gameState.lastActiveDate = new Date().toDateString();
    
    if (!wasCompleted && yesterdayQuest.dateString !== "") {
        gameState.penaltyActive = true;
        gameState.penaltyMathSolved = false;
        gameState.penaltyObjectives[0].current = 0;
        gameState.fatigue = 0;
        
        triggerSystemAlarm("Penalty Protocol activated. Fulfill critical survival tasks to unlock Status.");
    } else {
        gameState.fatigue = 0;
        gameState.penaltyActive = false;
    }
    
    gameState.dailyQuest = generateQuestsForDate(new Date());
    saveGame();
    renderAll();
    
    showToast("Daily Quest updated. The System expects results.");
    speakSystem("A new daily quest has arrived.");
}

// ============================================================================
// 8. INTERACTIVE GAMEPLAY EVENT ACTIONS
// ============================================================================
function allocateStat(stat) {
    if (gameState.statPoints > 0) {
        gameState.stats[stat]++;
        gameState.statPoints--;
        playSound("click");
        renderAll();
        saveGame();
    }
}

function handleObjectiveRepChange(index, action) {
    playSound("click");
    const activeQuest = gameState.dailyQuest;
    const obj = activeQuest.objectives[index];
    
    let fatigueIncurred = 0.5;
    if (obj.id === "meditation") fatigueIncurred = -0.2;
    else if (obj.id === "stretching") fatigueIncurred = 0.1;
    else if (obj.category === "technical") fatigueIncurred = 1.5;

    if (obj.category === "technical" && gameState.skills.feaVision > 0) {
        fatigueIncurred *= (1.0 - Math.min(0.7, gameState.skills.feaVision * 0.08));
    }

    if (action === "plus") {
        obj.current = Math.min(obj.target, obj.current + 1);
        gameState.fatigue = Math.max(0, Math.min(gameState.maxFatigue, gameState.fatigue + fatigueIncurred));
    } else {
        obj.current = Math.max(0, obj.current - 1);
        gameState.fatigue = Math.max(0, Math.min(gameState.maxFatigue, gameState.fatigue - fatigueIncurred));
    }
    
    renderAll();
    saveGame();
}

function handleClaimRewards() {
    if (gameState.dailyQuest.completed && !gameState.dailyQuest.claimed) {
        gameState.dailyQuest.claimed = true;
        
        const xpReward = 150 + gameState.level * 20;
        const goldReward = 100 + gameState.level * 15;
        
        gameState.gold += goldReward;
        gameState.xp += xpReward;
        
        showToast(`Acquired +${xpReward} XP & +${goldReward} Gold!`);
        
        let leveledUp = false;
        while (gameState.xp >= gameState.xpNeeded) {
            gameState.xp -= gameState.xpNeeded;
            gameState.level++;
            gameState.statPoints += 5;
            gameState.skillPoints += 1;
            gameState.xpNeeded = Math.floor(gameState.xpNeeded * 1.5);
            leveledUp = true;
        }

        if (leveledUp) {
            setTimeout(() => {
                showToast(`LEVEL UP! You have gained 5 Ability Points & 1 Skill Token.`, true);
                speakSystem(`Level Up. Ability parameters increased. New parameters available.`);
            }, 1000);
        }

        setTimeout(() => {
            triggerLootBoxAnimation();
        }, 1800);
        
        renderAll();
        saveGame();
    }
}

function triggerLootBoxAnimation() {
    const overlay = document.getElementById("lootbox-overlay");
    const chest = document.getElementById("chest-box");
    const text = document.getElementById("lootbox-text");
    const reveal = document.getElementById("lootbox-reveal");
    const closeBtn = document.getElementById("lootbox-close-btn");
    const header = document.getElementById("lootbox-header");
    
    overlay.classList.remove("hidden");
    reveal.classList.add("hidden");
    closeBtn.classList.add("hidden");
    chest.className = "chest-box-visual";
    header.innerText = "LOOT CHEST UNLOCKED";
    text.innerText = "Click the chest to synthesize mechanical loot drop...";
    playSound("chime");
}

function openChestLoot() {
    const chest = document.getElementById("chest-box");
    const text = document.getElementById("lootbox-text");
    const reveal = document.getElementById("lootbox-reveal");
    const closeBtn = document.getElementById("lootbox-close-btn");
    const header = document.getElementById("lootbox-header");

    playSound("click");
    chest.className = "chest-box-visual opening";
    text.innerText = "Decompressing quantum elements...";
    
    setTimeout(() => {
        chest.className = "chest-box-visual hidden";
        header.innerText = "ACQUIRED SYSTEM LOOT!";
        text.innerText = "The System has rewarded you with mechatronic gear.";
        
        const randomItem = SHOP_CATALOG[Math.floor(Math.random() * SHOP_CATALOG.length)];
        
        document.getElementById("loot-icon").innerText = randomItem.emoji;
        document.getElementById("loot-name").innerText = randomItem.name;
        document.getElementById("loot-stats").innerText = randomItem.desc.split(".")[0];
        
        reveal.classList.remove("hidden");
        closeBtn.classList.remove("hidden");
        playSound("chime");
        speakSystem(`Acquired ${randomItem.name}`);

        const instanceId = Date.now().toString();
        gameState.inventory.push({
            id: randomItem.id,
            instanceId: instanceId
        });
        
        renderAll();
        saveGame();
    }, 1500);
}

function handleInventoryClick(instanceId, slot) {
    playSound("click");
    const currentEquipped = gameState.equipment[slot];
    
    if (currentEquipped === instanceId) {
        gameState.equipment[slot] = null;
        showToast("Gear unequipped.");
    } else {
        gameState.equipment[slot] = instanceId;
        showToast("Gear active.");
    }
    
    renderAll();
    saveGame();
}

function handleBuyItem(itemId) {
    const item = SHOP_CATALOG.find(i => i.id === itemId);
    if (item && gameState.gold >= item.cost) {
        gameState.gold -= item.cost;
        playSound("buy");
        
        const instanceId = Date.now().toString();
        gameState.inventory.push({
            id: item.id,
            instanceId: instanceId
        });
        
        showToast(`Purchased ${item.name}!`);
        renderAll();
        saveGame();
    }
}

function handleSkillUpgrade(skillId) {
    if (gameState.skillPoints > 0) {
        let skillMeta = SKILL_CATALOG.passives.find(s => s.id === skillId) || 
                         SKILL_CATALOG.actives.find(s => s.id === skillId);
                         
        if (skillMeta && skillMeta.checkReq(gameState)) {
            gameState.skills[skillId] = (gameState.skills[skillId] || 0) + 1;
            gameState.skillPoints--;
            playSound("chime");
            showToast(`Upgraded ${skillMeta.name} to Lvl. ${gameState.skills[skillId]}!`);
            renderAll();
            saveGame();
        }
    }
}

function triggerZenFocusActive() {
    const lvl = gameState.skills.zenFocus;
    if (lvl > 0 && gameState.fatigue > 0) {
        playSound("chime");
        const reduction = lvl * 20;
        gameState.fatigue = Math.max(0, gameState.fatigue - reduction);
        showToast(`Zen Focus Activated! Eliminated ${reduction} fatigue points.`);
        speakSystem("Mind calmed. Fatigue levels adjusted.");
        renderAll();
        saveGame();
    }
}

// ============================================================================
// 9. PENALTY ZONE CHALLENGES SURVIVAL
// ============================================================================
function handleAddPenaltySquat() {
    playSound("click");
    gameState.penaltyObjectives[0].current = Math.min(150, gameState.penaltyObjectives[0].current + 5);
    renderAll();
    checkPenaltyCompletion();
}

function handleSolvePenaltyMath() {
    playSound("click");
    const ans = parseFloat(document.getElementById("penalty-math-answer").value);
    
    if (ans >= 2.3 && ans <= 2.5) {
        gameState.penaltyMathSolved = true;
        playSound("chime");
        showToast("Calibration Safety Factor verified. System parameters steady.");
        renderAll();
        checkPenaltyCompletion();
    } else {
        triggerSystemAlarm("Structural safety factor incorrect. Buggy model risk high.");
        document.getElementById("penalty-math-answer").value = "";
    }
}

function checkPenaltyCompletion() {
    const squatsDone = gameState.penaltyObjectives[0].current >= 150;
    const mathDone = gameState.penaltyMathSolved;
    
    if (squatsDone && mathDone) {
        gameState.penaltyActive = false;
        gameState.dailyQuest = generateQuestsForDate(new Date());
        showToast("Escaped Penalty Zone. Normal operations resumed.", true);
        speakSystem("Penalty completed. Normal system protocols reinstated.");
        renderAll();
        saveGame();
    }
}

// ============================================================================
// 10. GOOGLE DRIVE BACKUPS INTEGRATION (OAuth2 & REST Direct Engine)
// ============================================================================
async function backgroundUpdateGDrive(scrambledPayload) {
    if (!gdriveAccessToken || !gameState.gdriveFileId) return;
    
    const url = `https://www.googleapis.com/upload/drive/v3/files/${gameState.gdriveFileId}?uploadType=media`;
    try {
        await fetch(url, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${gdriveAccessToken}`,
                "Content-Type": "application/json"
            },
            body: scrambledPayload
        });
    } catch (e) {
        console.error("GDrive auto background save failed:", e);
    }
}

async function syncGoogleDriveData() {
    if (!gdriveAccessToken) return;
    
    showToast("Connecting to Google Cloud matrix...");
    speakSystem("Accessing cloud server parameters.");

    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='the_system_secure_save.json' and trashed=false&fields=files(id,name)`;
    try {
        const searchResp = await fetch(searchUrl, {
            headers: { "Authorization": `Bearer ${gdriveAccessToken}` }
        });
        const searchData = await searchResp.json();
        
        if (searchData.files && searchData.files.length > 0) {
            // File Found on Cloud! Download content
            const fileId = searchData.files[0].id;
            gameState.gdriveFileId = fileId;
            
            const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
            const downloadResp = await fetch(downloadUrl, {
                headers: { "Authorization": `Bearer ${gdriveAccessToken}` }
            });
            const cloudPayload = await downloadResp.text();
            
            const decryptedString = deobfuscate(cloudPayload);
            if (!decryptedString) {
                // Cloud save corrupt? Overwrite cloud with local
                uploadNewSaveToGDrive();
                return;
            }
            
            const envelope = JSON.parse(decryptedString);
            const cloudState = JSON.parse(envelope.payload);
            
            // Compare stats/levels
            const localXPScore = gameState.level * 10000 + gameState.xp;
            const cloudXPScore = cloudState.level * 10000 + cloudState.xp;
            
            if (localXPScore === cloudXPScore) {
                // Already synced
                gameState.gdriveConnected = true;
                showToast("System synchronization active. Local & Cloud parameters match.");
                speakSystem("Sync successful.");
                saveGame();
                renderAll();
                return;
            }
            
            // Prompt user which save to keep (via custom System dialog prompts)
            const dialog = document.getElementById("dialog-overlay");
            const cancel = document.getElementById("dialog-cancel-btn");
            const confirm = document.getElementById("dialog-ok-btn");
            const promptText = document.getElementById("dialog-prompt-text");
            
            cancel.innerText = "IMPORT CLOUD";
            confirm.innerText = "OVERWRITE CLOUD";
            promptText.innerHTML = `<strong>Cloud Sync Matrix Conflict:</strong><br><br>Local Save Level: <strong>${gameState.level}</strong> (XP: ${gameState.xp})<br>Cloud Save Level: <strong>${cloudState.level}</strong> (XP: ${cloudState.xp})<br><br>Choose parameter restoration path:`;
            
            dialog.classList.remove("hidden");
            
            const handleImportCloud = () => {
                localStorage.setItem("THE_SYSTEM_SECURE_SAVE", cloudPayload);
                gameState.gdriveConnected = true;
                gameState.gdriveFileId = fileId;
                saveGame();
                playSound("level_up");
                showToast("Import Successful! Cloud state loaded.");
                speakSystem("Progress restored from cloud.");
                
                dialog.classList.add("hidden");
                cleanupHooks();
                loadGame();
                renderAll();
            };
            
            const handleOverwriteCloud = async () => {
                dialog.classList.add("hidden");
                cleanupHooks();
                showToast("Overwriting cloud parameters...");
                
                const payload = localStorage.getItem("THE_SYSTEM_SECURE_SAVE");
                await backgroundUpdateGDrive(payload);
                
                gameState.gdriveConnected = true;
                showToast("Cloud parameters updated successfully!");
                speakSystem("Cloud database updated.");
                saveGame();
                renderAll();
            };
            
            const cleanupHooks = () => {
                cancel.innerText = "CANCEL";
                confirm.innerText = "CONFIRM";
                cancel.removeEventListener("click", handleImportCloud);
                confirm.removeEventListener("click", handleOverwriteCloud);
            };
            
            cancel.addEventListener("click", handleImportCloud);
            confirm.addEventListener("click", handleOverwriteCloud);
        } else {
            // File not found on Drive. Create a new one!
            uploadNewSaveToGDrive();
        }
    } catch (e) {
        console.error("GDrive Sync failure:", e);
        triggerSystemAlarm("Cloud Sync failed. Connection timed out.");
    }
}

async function uploadNewSaveToGDrive() {
    showToast("Generating cloud save node...");
    
    // Multipart body creation for File Creation REST API
    const metadata = {
        name: "the_system_secure_save.json",
        mimeType: "application/json"
    };
    
    const scrambledSave = localStorage.getItem("THE_SYSTEM_SECURE_SAVE");
    
    const boundary = "boundary_the_system_sync";
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;
    
    const multipartBody = 
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        scrambledSave +
        closeDelimiter;
        
    const url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
    try {
        const resp = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${gdriveAccessToken}`,
                "Content-Type": `multipart/related; boundary=${boundary}`
            },
            body: multipartBody
        });
        const data = await resp.json();
        
        if (data.id) {
            gameState.gdriveConnected = true;
            gameState.gdriveFileId = data.id;
            saveGame();
            showToast("Cloud Save created! Real-time syncing active.");
            speakSystem("Cloud synchronization initialized.");
            renderAll();
        }
    } catch (e) {
        console.error("Failed to upload save to GDrive:", e);
        triggerSystemAlarm("Failed to create cloud node.");
    }
}

function initGoogleDriveSync() {
    const syncBtn = document.getElementById("gdrive-sync-btn");
    const configBtn = document.getElementById("configure-gdrive-btn");
    
    // Redraw button state
    if (gameState.gdriveConnected) {
        syncBtn.innerText = "☁️ CLOUD SYNC ACTIVE";
        syncBtn.style.backgroundColor = "rgba(52, 168, 83, 0.15)";
    }

    configBtn.addEventListener("click", () => {
        playSound("click");
        const dialog = document.getElementById("dialog-overlay");
        const cancel = document.getElementById("dialog-cancel-btn");
        const confirm = document.getElementById("dialog-ok-btn");
        const input = document.getElementById("dialog-input");
        const promptText = document.getElementById("dialog-prompt-text");
        
        input.removeAttribute("maxlength");
        promptText.innerHTML = "<strong>Google Drive Console Keys:</strong><br><br>Enter Client ID and API Key, separated by a comma (Client_ID, API_Key):";
        input.value = (gameState.gdriveClientId && gameState.gdriveApiKey) ? 
            `${gameState.gdriveClientId}, ${gameState.gdriveApiKey}` : "";
        input.placeholder = "Client_ID.apps.googleusercontent.com, API_Key_AIzaSy...";
        dialog.classList.remove("hidden");
        
        const newConfirm = () => {
            const val = input.value.trim();
            if (val.includes(",")) {
                const parts = val.split(",");
                gameState.gdriveClientId = parts[0].trim();
                gameState.gdriveApiKey = parts[1].trim();
                
                playSound("chime");
                showToast("Google Drive Credentials linked successfully!");
                dialog.classList.add("hidden");
                confirm.removeEventListener("click", newConfirm);
                renderAll();
                saveGame();
            } else if (!val) {
                gameState.gdriveClientId = "";
                gameState.gdriveApiKey = "";
                gameState.gdriveConnected = false;
                gameState.gdriveFileId = "";
                
                playSound("click");
                showToast("Google Drive Credentials unlinked.");
                dialog.classList.add("hidden");
                confirm.removeEventListener("click", newConfirm);
                renderAll();
                saveGame();
            } else {
                triggerSystemAlarm("Sync keys format incorrect. Use a comma to separate.");
            }
        };
        
        const newCancel = () => {
            dialog.classList.add("hidden");
            confirm.removeEventListener("click", newConfirm);
        };
        
        confirm.addEventListener("click", newConfirm);
        cancel.addEventListener("click", newCancel);
    });

    syncBtn.addEventListener("click", () => {
        playSound("click");
        
        if (!gameState.gdriveClientId || !gameState.gdriveApiKey) {
            showToast("Sync keys not configured. Click CONFIGURE DRIVE KEYS first.");
            return;
        }
        
        // Console logger to verify exact keys and prevent copy-paste cutoffs or typos
        console.log("THE SYSTEM -> Google OAuth Client ID loaded:", gameState.gdriveClientId);
        console.log("THE SYSTEM -> Google Cloud API Key loaded:", gameState.gdriveApiKey);
        
        // Trigger Google OAuth2 flow using Google Identity Services client loaded dynamically
        try {
            const client = google.accounts.oauth2.initTokenClient({
                client_id: gameState.gdriveClientId,
                scope: 'https://www.googleapis.com/auth/drive.file',
                callback: (tokenResponse) => {
                    if (tokenResponse && tokenResponse.access_token) {
                        gdriveAccessToken = tokenResponse.access_token;
                        syncGoogleDriveData();
                    } else {
                        triggerSystemAlarm("OAuth2 authorization failed.");
                    }
                }
            });
            client.requestAccessToken({ prompt: 'consent' });
        } catch (e) {
            console.error("OAuth client init failed:", e);
            triggerSystemAlarm("Google Identity library failed to initialize.");
        }
    });
}

// ============================================================================
// 10. TAB NAVIGATION & INITIAL LOADING GATES
// ============================================================================
function initNavigation() {
    const navButtons = document.querySelectorAll(".nav-btn");
    navButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            playSound("click");
            const targetTab = btn.getAttribute("data-tab");
            
            navButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            const tabPanes = document.querySelectorAll(".tab-pane");
            tabPanes.forEach(pane => {
                pane.classList.remove("active");
                if (pane.id === `${targetTab}-tab`) {
                    pane.classList.add("active");
                }
            });
        });
    });
}

function awakenSystem() {
    const awakeOverlay = document.getElementById("awake-overlay");
    const mainHud = document.getElementById("main-hud");
    
    initAudio();
    awakeOverlay.classList.add("fade-out");
    mainHud.classList.remove("hidden");
    
    playSound("level_up");
    showToast("The System has Awakened. Welcome Hunter.", true);
    
    setTimeout(() => {
        speakSystem(`System Awakened. Welcome, ${gameState.name}. Today's Calibration sequence has initialized.`);
    }, 1500);
}

function initDialogEditName() {
    const dialog = document.getElementById("dialog-overlay");
    const cancel = document.getElementById("dialog-cancel-btn");
    const confirm = document.getElementById("dialog-ok-btn");
    const input = document.getElementById("dialog-input");
    const promptText = document.getElementById("dialog-prompt-text");
    
    document.getElementById("edit-name-btn").addEventListener("click", () => {
        playSound("click");
        input.maxLength = 20;
        promptText.innerText = "Enter your Hunter Designation:";
        input.value = gameState.name;
        input.placeholder = "Type name here...";
        dialog.classList.remove("hidden");
        
        const newConfirm = () => {
            const newName = input.value.trim();
            if (newName.length > 0) {
                gameState.name = newName;
                playSound("chime");
                showToast(`Designation updated: ${newName}`);
                dialog.classList.add("hidden");
                confirm.removeEventListener("click", newConfirm);
                renderAll();
                saveGame();
            }
        };
        
        const newCancel = () => {
            dialog.classList.add("hidden");
            confirm.removeEventListener("click", newConfirm);
        };
        
        confirm.addEventListener("click", newConfirm);
        cancel.addEventListener("click", newCancel);
    });
}

function initSaveSync() {
    const exportBtn = document.getElementById("export-save-btn");
    const importBtn = document.getElementById("import-save-btn");

    exportBtn.addEventListener("click", () => {
        playSound("chime");
        const secureSave = localStorage.getItem("THE_SYSTEM_SECURE_SAVE");
        if (secureSave) {
            navigator.clipboard.writeText(secureSave).then(() => {
                showToast("System backup generated! Scrambled save copied to clipboard.");
                speakSystem("Backup generated. Coordinates copied.");
            }).catch(err => {
                const dummy = document.createElement("textarea");
                document.body.appendChild(dummy);
                dummy.value = secureSave;
                dummy.select();
                document.execCommand("copy");
                document.body.removeChild(dummy);
                showToast("Save signature copied to clipboard!");
            });
        }
    });

    importBtn.addEventListener("click", () => {
        playSound("click");
        const dialog = document.getElementById("dialog-overlay");
        const cancel = document.getElementById("dialog-cancel-btn");
        const confirm = document.getElementById("dialog-ok-btn");
        const input = document.getElementById("dialog-input");
        const promptText = document.getElementById("dialog-prompt-text");

        input.removeAttribute("maxlength");
        promptText.innerHTML = "<strong>Import System Save:</strong><br><br>Paste your scrambled backup save string below. WARNING: This will overwrite your current progress:";
        input.value = "";
        input.placeholder = "Paste scrambled code here...";
        dialog.classList.remove("hidden");

        const newConfirm = () => {
            const code = input.value.trim();
            if (code.length > 0) {
                const decryptedString = deobfuscate(code);
                if (!decryptedString) {
                    triggerSystemAlarm("Sync failed: Backup signature corrupted or invalid.");
                    dialog.classList.add("hidden");
                    confirm.removeEventListener("click", newConfirm);
                    return;
                }

                try {
                    const envelope = JSON.parse(decryptedString);
                    const calculatedHash = generateChecksum(envelope.payload);
                    if (calculatedHash !== envelope.hash) {
                        triggerSystemAlarm("Sync failed: Checksum mismatch. Code tampered.");
                        dialog.classList.add("hidden");
                        confirm.removeEventListener("click", newConfirm);
                        return;
                    }

                    localStorage.setItem("THE_SYSTEM_SECURE_SAVE", code);
                    playSound("level_up");
                    showToast("Progress successfully synchronized!");
                    speakSystem("Sync coordinates loaded. Restored.");
                    dialog.classList.add("hidden");
                    confirm.removeEventListener("click", newConfirm);
                    loadGame();
                    renderAll();
                } catch (e) {
                    triggerSystemAlarm("Sync failed: Invalid save packet.");
                    dialog.classList.add("hidden");
                    confirm.removeEventListener("click", newConfirm);
                }
            }
        };

        const newCancel = () => {
            dialog.classList.add("hidden");
            confirm.removeEventListener("click", newConfirm);
        };

        confirm.addEventListener("click", newConfirm);
        cancel.addEventListener("click", newCancel);
    });
}

// ============================================================================
// 11. BOOTSTRAP INITIALIZATION
// ============================================================================
window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("awaken-btn").addEventListener("click", awakenSystem);
    document.getElementById("claim-quest-btn").addEventListener("click", handleClaimRewards);
    document.getElementById("chest-box").addEventListener("click", openChestLoot);
    document.getElementById("lootbox-close-btn").addEventListener("click", () => {
        playSound("click");
        document.getElementById("lootbox-overlay").classList.add("hidden");
    });
    
    initNavigation();
    initDialogEditName();
    initSaveSync();
    initGoogleDriveSync();
    
    document.querySelectorAll(".stat-up-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const stat = btn.getAttribute("data-stat");
            allocateStat(stat);
        });
    });

    document.getElementById("shop-items-grid").addEventListener("click", (e) => {
        const buyBtn = e.target.closest(".shop-buy-btn");
        if (buyBtn) {
            const itemId = buyBtn.getAttribute("data-id");
            handleBuyItem(itemId);
        }
    });

    document.getElementById("skills-tab").addEventListener("click", (e) => {
        const upBtn = e.target.closest(".skill-upgrade-btn");
        if (upBtn) {
            const skillId = upBtn.getAttribute("data-skill");
            handleSkillUpgrade(skillId);
        }
    });

    document.getElementById("quests-tab").addEventListener("click", (e) => {
        const ctrBtn = e.target.closest(".ctr-btn");
        if (ctrBtn) {
            const index = parseInt(ctrBtn.getAttribute("data-idx"));
            const action = ctrBtn.getAttribute("data-act");
            handleObjectiveRepChange(index, action);
        }
    });

    document.getElementById("penalty-add-squat").addEventListener("click", handleAddPenaltySquat);
    document.getElementById("penalty-math-submit").addEventListener("click", handleSolvePenaltyMath);

    checkDateTransitions();
    setInterval(updateTimeTicker, 1000);
    renderAll();
    
    setInterval(() => {
        const scroller = document.getElementById("alert-scroller");
        const items = scroller.querySelectorAll(".alert-item");
        if (items.length > 0) {
            const first = items[0];
            first.remove();
            scroller.appendChild(first);
        }
    }, 8000);
});
