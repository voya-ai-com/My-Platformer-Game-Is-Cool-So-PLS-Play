// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameRunning = true;
let score = 0;
let gameSpeed = 2;
let camera = { x: 0, y: 0, shakeX: 0, shakeY: 0 };
let survivalTimer = 0;
let currentLevel = 1;
let levelProgress = 0;
let maxLevel = 10;
let screenShake = 0;

// Performance optimization variables
let frameCount = 0;
let lastFrameTime = 0;
let targetFPS = 60;
let frameTime = 1000 / targetFPS;
let performanceMode = true; // Enable performance optimizations

// Audio state
let backgroundMusic = null;
let isMuted = false;
let volume = 0.5;
let audioContext = null;
let soundEffects = {};

// Account System
let currentAccount = null;
let accounts = JSON.parse(localStorage.getItem('platformerAccounts') || '{}');

// Leaderboard - now per account
let leaderboard = JSON.parse(localStorage.getItem('platformerLeaderboard') || '[]');

// Initialize account system
function initAccountSystem() {
    // Check if user was previously logged in
    const savedAccount = localStorage.getItem('currentAccount');
    if (savedAccount) {
        const accountData = accounts[savedAccount];
        if (accountData) {
            currentAccount = savedAccount;
            updateAccountUI();
        }
    }
}

// Simple hash function for passwords (basic obfuscation, not secure)
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
}

// Register new account
function register() {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    if (!username || !password) {
        alert('Please enter both username and password');
        return;
    }
    
    if (username.length < 3) {
        alert('Username must be at least 3 characters');
        return;
    }
    
    if (password.length < 4) {
        alert('Password must be at least 4 characters');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    if (accounts[username]) {
        alert('Username already exists');
        return;
    }
    
    // Create new account
    accounts[username] = {
        passwordHash: hashPassword(password),
        bestScore: 0,
        bestLevel: 1,
        gamesPlayed: 0,
        createdAt: new Date().toISOString(),
        leaderboard: []
    };
    
    localStorage.setItem('platformerAccounts', JSON.stringify(accounts));
    alert('Account created successfully!');
    
    // Auto-login
    currentAccount = username;
    localStorage.setItem('currentAccount', username);
    updateAccountUI();
    showLogin();
}

// Login to account
function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        alert('Please enter both username and password');
        return;
    }
    
    const account = accounts[username];
    if (!account) {
        alert('Username not found');
        return;
    }
    
    if (account.passwordHash !== hashPassword(password)) {
        alert('Incorrect password');
        return;
    }
    
    currentAccount = username;
    localStorage.setItem('currentAccount', username);
    updateAccountUI();
    hideAccountMenu();
    
    // Load account's leaderboard
    leaderboard = account.leaderboard || [];
}

// Logout
function logout() {
    currentAccount = null;
    localStorage.removeItem('currentAccount');
    leaderboard = JSON.parse(localStorage.getItem('platformerLeaderboard') || '[]');
    updateAccountUI();
    showLogin();
}

// Switch account (logout and show login)
function switchAccount() {
    logout();
    showAccountMenu();
}

// Update account UI
function updateAccountUI() {
    const accountInfo = document.getElementById('accountInfo');
    const accountLogin = document.getElementById('accountLogin');
    const accountRegister = document.getElementById('accountRegister');
    const accountLoggedIn = document.getElementById('accountLoggedIn');
    
    if (currentAccount) {
        accountInfo.style.display = 'block';
        document.getElementById('currentUser').textContent = currentAccount;
        accountLogin.style.display = 'none';
        accountRegister.style.display = 'none';
        accountLoggedIn.style.display = 'block';
        
        const account = accounts[currentAccount];
        document.getElementById('loggedInUsername').textContent = currentAccount;
        document.getElementById('accountBestScore').textContent = account.bestScore || 0;
        document.getElementById('accountBestLevel').textContent = account.bestLevel || 1;
        document.getElementById('accountGamesPlayed').textContent = account.gamesPlayed || 0;
    } else {
        accountInfo.style.display = 'none';
        accountLogin.style.display = 'block';
        accountRegister.style.display = 'none';
        accountLoggedIn.style.display = 'none';
    }
}

// Show account menu
function showAccountMenu() {
    document.getElementById('accountMenu').style.display = 'block';
    updateAccountUI();
}

// Hide account menu
function hideAccountMenu() {
    document.getElementById('accountMenu').style.display = 'none';
    // Clear input fields
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('registerUsername').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('registerConfirmPassword').value = '';
}

// Show register form
function showRegister() {
    document.getElementById('accountLogin').style.display = 'none';
    document.getElementById('accountRegister').style.display = 'block';
}

// Show login form
function showLogin() {
    document.getElementById('accountRegister').style.display = 'none';
    document.getElementById('accountLogin').style.display = 'block';
}


// Input handling
const keys = {
    left: false,
    right: false,
    jump: false
};

// Player object
const player = {
    x: 100,
    y: 300,
    width: 28,
    height: 38,
    velocityX: 0,
    velocityY: 0,
    speed: 5,
    jumpPower: 14, // Increased from 12 to 14
    onGround: false,
    health: 100,
    color: '#007AFF', // Apple blue
    speedBoost: 0,
    jumpBoost: 0,
    shield: 0,
    doubleJump: 0,
    scoreMultiplier: 1,
    invincibility: 0,
    canDoubleJump: false,
    jumpCount: 0,
    magnet: 0,
    timeSlow: 0,
    explosive: 0,
    superJump: 0,
    coins: 0,
    teleport: 0,
    multiJump: 0,
    freeze: 0,
    laser: 0,
    ghost: 0,
    rocket: 0,
    shieldBurst: 0,
    megaCoin: 0,
    rainbow: 0,
    gravity: 0,
    // Avatar customization
    hairColor: '#8B4513',
    shirtColor: '#4169E1',
    pantsColor: '#2F4F4F',
    shoesColor: '#8B0000'
};

// Game mode settings
let gameMode = 'classic';
let difficulty = 'normal';

// Arrays for game objects
let platforms = [];
let enemies = [];
let powerups = [];
let particles = [];

// Physics constants
const gravity = 0.5;
const friction = 0.8;

// Initialize game
function init() {
    // Initialize account system
    initAccountSystem();
    
    // Resize canvas to fullscreen
    resizeCanvas();
    
    // Create initial platforms
    createInitialPlatforms();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize audio
    initAudio();
    
    // Start game loop
    gameLoop();
}

// Resize canvas to fullscreen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Handle window resize
window.addEventListener('resize', () => {
    resizeCanvas();
    // Recreate initial platforms with new canvas size
    createInitialPlatforms();
});

// Create initial platforms for the game
function createInitialPlatforms() {
    platforms = [];
    
    // Ground platform
    platforms.push({
        x: 0,
        y: canvas.height - 50,
        width: canvas.width * 3,
        height: 50,
        type: 'ground'
    });
    
    // Add some initial platforms
    for (let i = 0; i < 20; i++) {
        const x = i * 200 + 300;
        const y = canvas.height - Math.random() * 200 - 100;
        const width = 80 + Math.random() * 60;
        
        platforms.push({
            x: x,
            y: y,
            width: width,
            height: 20,
            type: 'platform'
        });
    }
    
    // Generate initial powerups on existing platforms
    generatePowerups(300);
}

// Generate new platforms as player progresses
function generateNewPlatforms() {
    const rightmostPlatform = Math.max(...platforms.map(p => p.x + p.width));
    const viewportRight = camera.x + canvas.width + 300; // Reduced from 500 to 300 for more frequent generation
    
    if (rightmostPlatform < viewportRight) {
        // Generate new platforms
        for (let i = 0; i < 10; i++) {
            const x = rightmostPlatform + i * 150 + Math.random() * 100;
            const y = canvas.height - Math.random() * 300 - 50;
            const width = 60 + Math.random() * 80;
            
            platforms.push({
                x: x,
                y: y,
                width: width,
                height: 20,
                type: 'platform'
            });
        }
        
        // Generate new enemies
        generateEnemies(rightmostPlatform);
    }
}

// Generate enemies
function generateEnemies(startX) {
    const enemyTypes = ['walker', 'flyer', 'spiker', 'boss', 'megaBoss', 'rainbowBoss', 'fireBoss', 'iceBoss', 'shadowBoss', 'lightningBoss'];
    
    for (let i = 0; i < 20; i++) { // Increased enemy count
        const x = startX + i * 100 + Math.random() * 60; // Reduced spacing for more enemies
        const platform = platforms.find(p => 
            x >= p.x && x <= p.x + p.width && 
            p.y > canvas.height - 300
        );
        
        if (platform && Math.random() < 0.8) { // 80% chance to spawn enemy (increased)
            const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            let enemy = {
                x: x,
                y: platform.y - 30,
                width: 22,
                height: 28,
                type: enemyType,
                velocityX: Math.random() < 0.5 ? -1.5 : 1.5,
                health: 1,
                color: '#ff9500',
                specialAbility: null,
                animationFrame: 0
            };
            
            // Customize enemy based on type
            switch(enemyType) {
                case 'walker':
                    enemy.color = '#ff9500';
                    enemy.health = 1;
                    enemy.velocityX = Math.random() < 0.5 ? -2 : 2;
                    break;
                case 'flyer':
                    enemy.color = '#8A2BE2';
                    enemy.health = 1;
                    enemy.velocityX = Math.random() < 0.5 ? -1.5 : 1.5;
                    enemy.y = platform.y - 80; // Fly above platforms
                    break;
                case 'spiker':
                    enemy.color = '#FF4500';
                    enemy.health = 2;
                    enemy.velocityX = 0; // Doesn't move
                    enemy.width = 30;
                    enemy.height = 20;
                    break;
                case 'boss':
                    enemy.color = '#FF0000';
                    enemy.health = 3;
                    enemy.velocityX = Math.random() < 0.5 ? -1 : 1;
                    enemy.width = 35;
                    enemy.height = 35;
                    enemy.specialAbility = 'charge';
                    break;
                case 'megaBoss':
                    enemy.color = '#8B0000';
                    enemy.health = 5;
                    enemy.velocityX = Math.random() < 0.5 ? -0.8 : 0.8;
                    enemy.width = 45;
                    enemy.height = 45;
                    enemy.specialAbility = 'earthquake';
                    break;
                case 'rainbowBoss':
                    enemy.color = '#FF1493';
                    enemy.health = 4;
                    enemy.velocityX = Math.random() < 0.5 ? -1.2 : 1.2;
                    enemy.width = 40;
                    enemy.height = 40;
                    enemy.specialAbility = 'rainbow';
                    break;
                case 'fireBoss':
                    enemy.color = '#FF4500';
                    enemy.health = 4;
                    enemy.velocityX = Math.random() < 0.5 ? -1.5 : 1.5;
                    enemy.width = 38;
                    enemy.height = 38;
                    enemy.specialAbility = 'fireball';
                    break;
                case 'iceBoss':
                    enemy.color = '#00BFFF';
                    enemy.health = 4;
                    enemy.velocityX = Math.random() < 0.5 ? -1.3 : 1.3;
                    enemy.width = 38;
                    enemy.height = 38;
                    enemy.specialAbility = 'freeze';
                    break;
                case 'shadowBoss':
                    enemy.color = '#2F2F2F';
                    enemy.health = 4;
                    enemy.velocityX = Math.random() < 0.5 ? -1.8 : 1.8;
                    enemy.width = 36;
                    enemy.height = 36;
                    enemy.specialAbility = 'teleport';
                    break;
                case 'lightningBoss':
                    enemy.color = '#FFD700';
                    enemy.health = 4;
                    enemy.velocityX = Math.random() < 0.5 ? -2 : 2;
                    enemy.width = 42;
                    enemy.height = 42;
                    enemy.specialAbility = 'lightning';
                    break;
            }
            
            // Spawn bosses more frequently for more action
            if (enemyType.includes('Boss') && Math.random() < 0.4) { // 40% chance for bosses
                enemies.push(enemy);
            } else if (!enemyType.includes('Boss')) {
                enemies.push(enemy);
            }
        }
    }
    
    // Generate powerups more frequently
    generatePowerups(startX);
}

// Spawn powerups when jumping (heavily optimized for performance)
function spawnJumpPowerups() {
    // Much more aggressive powerup reduction in performance mode
    if (performanceMode && Math.random() < 0.8) return; // 80% chance to skip in performance mode
    
    const numPowerups = performanceMode ? 0 : 1; // No powerups in performance mode, 1 in visual mode
    
    for (let i = 0; i < numPowerups; i++) {
        const angle = (Math.PI * 2 * i) / numPowerups + Math.random() * 0.5;
        const distance = 60 + Math.random() * 80; // 60-140 pixels away
        const x = player.x + player.width/2 + Math.cos(angle) * distance;
        const y = player.y + player.height/2 + Math.sin(angle) * distance;
        
        const powerupTypes = ['health', 'speed', 'jump', 'shield', 'doubleJump', 'scoreMultiplier', 'invincibility', 'magnet', 'timeSlow', 'explosive', 'superJump', 'coin', 'teleport', 'multiJump', 'freeze', 'laser', 'ghost', 'rocket', 'shieldBurst', 'megaCoin', 'rainbow', 'gravity'];
        const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        
        let color = '#34C759';
        switch(type) {
            case 'health': color = '#34C759'; break;
            case 'speed': color = '#007AFF'; break;
            case 'jump': color = '#FF9500'; break;
            case 'shield': color = '#5856D6'; break;
            case 'doubleJump': color = '#FF2D92'; break;
            case 'scoreMultiplier': color = '#FFCC00'; break;
            case 'invincibility': color = '#FF3B30'; break;
            case 'magnet': color = '#FF1493'; break;
            case 'timeSlow': color = '#00CED1'; break;
            case 'explosive': color = '#FF4500'; break;
            case 'superJump': color = '#8A2BE2'; break;
            case 'coin': color = '#FFD700'; break;
            case 'teleport': color = '#9400D3'; break;
            case 'multiJump': color = '#FF69B4'; break;
            case 'freeze': color = '#00BFFF'; break;
            case 'laser': color = '#FF0000'; break;
            case 'ghost': color = '#C0C0C0'; break;
            case 'rocket': color = '#FF8C00'; break;
            case 'shieldBurst': color = '#9932CC'; break;
            case 'megaCoin': color = '#FFD700'; break;
            case 'rainbow': color = '#FF1493'; break;
            case 'gravity': color = '#2F4F4F'; break;
        }
        
        powerups.push({
            x: x,
            y: y,
            width: 18,
            height: 18,
            type: type,
            color: color,
            collected: false
        });
    }
}

// Spawn powerups when landing on platforms (heavily optimized for performance)
function spawnLandingPowerups(platform) {
    // Much more aggressive reduction for landing powerups
    if (performanceMode && Math.random() < 0.9) return; // 90% chance to skip in performance mode
    
    const numPowerups = performanceMode ? 0 : 1; // No powerups in performance mode
    
    for (let i = 0; i < numPowerups; i++) {
        const x = platform.x + Math.random() * platform.width;
        const y = platform.y - 20 - Math.random() * 40; // Above the platform
        
        const powerupTypes = ['health', 'speed', 'jump', 'shield', 'doubleJump', 'scoreMultiplier', 'invincibility', 'magnet', 'timeSlow', 'explosive', 'superJump', 'coin', 'teleport', 'multiJump', 'freeze', 'laser', 'ghost', 'rocket', 'shieldBurst', 'megaCoin', 'rainbow', 'gravity'];
        const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        
        let color = '#34C759';
        switch(type) {
            case 'health': color = '#34C759'; break;
            case 'speed': color = '#007AFF'; break;
            case 'jump': color = '#FF9500'; break;
            case 'shield': color = '#5856D6'; break;
            case 'doubleJump': color = '#FF2D92'; break;
            case 'scoreMultiplier': color = '#FFCC00'; break;
            case 'invincibility': color = '#FF3B30'; break;
            case 'magnet': color = '#FF1493'; break;
            case 'timeSlow': color = '#00CED1'; break;
            case 'explosive': color = '#FF4500'; break;
            case 'superJump': color = '#8A2BE2'; break;
            case 'coin': color = '#FFD700'; break;
            case 'teleport': color = '#9400D3'; break;
            case 'multiJump': color = '#FF69B4'; break;
            case 'freeze': color = '#00BFFF'; break;
            case 'laser': color = '#FF0000'; break;
            case 'ghost': color = '#C0C0C0'; break;
            case 'rocket': color = '#FF8C00'; break;
            case 'shieldBurst': color = '#9932CC'; break;
            case 'megaCoin': color = '#FFD700'; break;
            case 'rainbow': color = '#FF1493'; break;
            case 'gravity': color = '#2F4F4F'; break;
        }
        
        powerups.push({
            x: x,
            y: y,
            width: 18,
            height: 18,
            type: type,
            color: color,
            collected: false
        });
    }
}

// Spawn powerups as player moves around (heavily optimized for performance)
function spawnMovementPowerups() {
    // Much further reduce powerup spawning in performance mode
    const spawnChance = performanceMode ? 0.001 : 0.003; // Even less frequent
    if (Math.random() < spawnChance) {
        const x = player.x + player.width/2 + (Math.random() - 0.5) * 200;
        const y = player.y + (Math.random() - 0.5) * 100;
        
        const powerupTypes = ['health', 'speed', 'jump', 'shield', 'doubleJump', 'scoreMultiplier', 'invincibility', 'magnet', 'timeSlow', 'explosive', 'superJump', 'coin', 'teleport', 'multiJump', 'freeze', 'laser', 'ghost', 'rocket', 'shieldBurst', 'megaCoin', 'rainbow', 'gravity'];
        const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        
        let color = '#34C759';
        switch(type) {
            case 'health': color = '#34C759'; break;
            case 'speed': color = '#007AFF'; break;
            case 'jump': color = '#FF9500'; break;
            case 'shield': color = '#5856D6'; break;
            case 'doubleJump': color = '#FF2D92'; break;
            case 'scoreMultiplier': color = '#FFCC00'; break;
            case 'invincibility': color = '#FF3B30'; break;
            case 'magnet': color = '#FF1493'; break;
            case 'timeSlow': color = '#00CED1'; break;
            case 'explosive': color = '#FF4500'; break;
            case 'superJump': color = '#8A2BE2'; break;
            case 'coin': color = '#FFD700'; break;
            case 'teleport': color = '#9400D3'; break;
            case 'multiJump': color = '#FF69B4'; break;
            case 'freeze': color = '#00BFFF'; break;
            case 'laser': color = '#FF0000'; break;
            case 'ghost': color = '#C0C0C0'; break;
            case 'rocket': color = '#FF8C00'; break;
            case 'shieldBurst': color = '#9932CC'; break;
            case 'megaCoin': color = '#FFD700'; break;
            case 'rainbow': color = '#FF1493'; break;
            case 'gravity': color = '#2F4F4F'; break;
        }
        
        powerups.push({
            x: x,
            y: y,
            width: 18,
            height: 18,
            type: type,
            color: color,
            collected: false
        });
    }
}

// Generate powerups (heavily optimized for performance)
function generatePowerups(startX) {
    // Generate much fewer powerups for better performance
    const powerupCount = performanceMode ? 3 : 6; // Even fewer powerups
    for (let i = 0; i < powerupCount; i++) {
        const x = startX + i * 200 + Math.random() * 150; // Increased spacing even more
        const platform = platforms.find(p => 
            x >= p.x && x <= p.x + p.width && 
            p.y > canvas.height - 300
        );
        
        if (platform && Math.random() < 0.2) { // Reduced to 20% chance per area for performance
            const powerupTypes = ['health', 'speed', 'jump', 'shield', 'doubleJump', 'scoreMultiplier', 'invincibility'];
            const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
            
            let color = '#34C759'; // default green
            switch(type) {
                case 'health': color = '#34C759'; break;
                case 'speed': color = '#007AFF'; break;
                case 'jump': color = '#FF9500'; break;
                case 'shield': color = '#5856D6'; break;
                case 'doubleJump': color = '#FF2D92'; break;
                case 'scoreMultiplier': color = '#FFCC00'; break;
                case 'invincibility': color = '#FF3B30'; break;
            }
            
            powerups.push({
                x: x,
                y: platform.y - 25,
                width: 18,
                height: 18,
                type: type,
                color: color,
                collected: false
            });
        }
    }
    
    // Also generate floating powerups that don't require platforms (heavily reduced)
    const floatingCount = performanceMode ? 2 : 4; // Much fewer floating powerups
    for (let i = 0; i < floatingCount; i++) {
        const x = startX + i * 300 + Math.random() * 200; // Much increased spacing
        const y = canvas.height - 150 - Math.random() * 200; // Floating in mid-air
        
        const powerupTypes = ['health', 'speed', 'jump', 'shield', 'doubleJump', 'scoreMultiplier', 'invincibility', 'magnet', 'timeSlow', 'explosive', 'superJump', 'coin', 'teleport', 'multiJump', 'freeze', 'laser', 'ghost', 'rocket', 'shieldBurst', 'megaCoin', 'rainbow', 'gravity'];
        const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        
        let color = '#34C759';
        switch(type) {
            case 'health': color = '#34C759'; break;
            case 'speed': color = '#007AFF'; break;
            case 'jump': color = '#FF9500'; break;
            case 'shield': color = '#5856D6'; break;
            case 'doubleJump': color = '#FF2D92'; break;
            case 'scoreMultiplier': color = '#FFCC00'; break;
            case 'invincibility': color = '#FF3B30'; break;
            case 'magnet': color = '#FF1493'; break;
            case 'timeSlow': color = '#00CED1'; break;
            case 'explosive': color = '#FF4500'; break;
            case 'superJump': color = '#8A2BE2'; break;
            case 'coin': color = '#FFD700'; break;
            case 'teleport': color = '#9400D3'; break;
            case 'multiJump': color = '#FF69B4'; break;
            case 'freeze': color = '#00BFFF'; break;
            case 'laser': color = '#FF0000'; break;
            case 'ghost': color = '#C0C0C0'; break;
            case 'rocket': color = '#FF8C00'; break;
            case 'shieldBurst': color = '#9932CC'; break;
            case 'megaCoin': color = '#FFD700'; break;
            case 'rainbow': color = '#FF1493'; break;
            case 'gravity': color = '#2F4F4F'; break;
        }
        
        powerups.push({
            x: x,
            y: y,
            width: 18,
            height: 18,
            type: type,
            color: color,
            collected: false
        });
    }
}

// Event listeners
function setupEventListeners() {
    document.addEventListener('keydown', (e) => {
        switch(e.code) {
            case 'ArrowLeft':
                keys.left = true;
                break;
            case 'ArrowRight':
                keys.right = true;
                break;
            case 'Space':
                e.preventDefault();
                keys.jump = true;
                break;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        switch(e.code) {
            case 'ArrowLeft':
                keys.left = false;
                break;
            case 'ArrowRight':
                keys.right = false;
                break;
            case 'Space':
                keys.jump = false;
                break;
        }
    });
}

// Update player input and physics
function updatePlayer() {
    // Apply boost timers
    if (player.speedBoost > 0) player.speedBoost--;
    if (player.jumpBoost > 0) player.jumpBoost--;
    if (player.shield > 0) player.shield--;
    if (player.doubleJump > 0) player.doubleJump--;
    if (player.scoreMultiplier > 1) player.scoreMultiplier = Math.max(1, player.scoreMultiplier - 0.01);
    if (player.invincibility > 0) player.invincibility--;
    if (player.magnet > 0) player.magnet--;
    if (player.timeSlow > 0) player.timeSlow--;
    if (player.superJump > 0) player.superJump--;
    if (player.multiJump > 0) player.multiJump--;
    if (player.freeze > 0) player.freeze--;
    if (player.laser > 0) player.laser--;
    if (player.ghost > 0) player.ghost--;
    if (player.rainbow > 0) player.rainbow--;
    if (player.gravity > 0) player.gravity--;
    
    // Calculate current speed and jump power with boosts
    const currentSpeed = player.speed + (player.speedBoost > 0 ? 3 : 0);
    const currentJumpPower = player.jumpPower + (player.jumpBoost > 0 ? 4 : 0) + (player.superJump > 0 ? 6 : 0);
    
    // Horizontal movement
    if (keys.left) {
        player.velocityX = -currentSpeed;
    } else if (keys.right) {
        player.velocityX = currentSpeed;
    } else {
        player.velocityX *= friction;
    }
    
    // Jumping with double jump support
    if (keys.jump) {
        if (player.onGround) {
            player.velocityY = -currentJumpPower;
            player.onGround = false;
            player.jumpCount = 1;
            playSound('jump');
            
            // Spawn powerups when jumping!
            spawnJumpPowerups();
        } else if (player.doubleJump > 0 && player.jumpCount < 2) {
            player.velocityY = -currentJumpPower * 0.8;
            player.jumpCount++;
            playSound('doubleJump');
            
            // Spawn one extra powerup for double jump (reduced for performance)
            spawnJumpPowerups();
        }
    }
    
    // Reset jump count when landing
    if (player.onGround) {
        player.jumpCount = 0;
    }
    
    
    // Apply gravity
    player.velocityY += gravity;
    
    // Update position
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    // Spawn powerups as player moves around
    spawnMovementPowerups();
    
    // Create rainbow trail when player has rainbow powerup
    if (player.rainbow > 0 && Math.random() < 0.3) {
        createRainbowTrail(player.x + player.width/2, player.y + player.height/2);
    }
    
    // Platform collision
    player.onGround = false;
    for (let platform of platforms) {
        if (player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y < platform.y + platform.height &&
            player.y + player.height > platform.y) {
            
            // Landing on top
            if (player.velocityY > 0 && player.y < platform.y) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.onGround = true;
                
                // Spawn powerups when landing on platforms! (heavily reduced)
                const landingChance = performanceMode ? 0.05 : 0.15; // Much lower chance
                if (Math.random() < landingChance) {
                    spawnLandingPowerups(platform);
                }
            }
            // Hitting from below
            else if (player.velocityY < 0 && player.y > platform.y) {
                player.y = platform.y + platform.height;
                player.velocityY = 0;
            }
            // Side collisions
            else if (player.velocityX > 0 && player.x < platform.x) {
                player.x = platform.x - player.width;
                player.velocityX = 0;
            }
            else if (player.velocityX < 0 && player.x > platform.x) {
                player.x = platform.x + platform.width;
                player.velocityX = 0;
            }
        }
    }
    
    // Keep player on screen (with some buffer)
    if (player.x < camera.x + 100) {
        player.x = camera.x + 100;
    }
    
    // Update camera to follow player (centered better)
    camera.x = player.x - 300;
    
    // Deadly ground collision - instant death
    if (player.y + player.height > canvas.height - 50) {
        player.health = 0; // Instant death on ground contact
    }
}

// Update powerups (optimized for performance)
function updatePowerups() {
    // Limit total powerups for performance
    const maxPowerups = performanceMode ? 10 : 25;
    if (powerups.length > maxPowerups) {
        // Remove oldest powerups first
        powerups.splice(0, powerups.length - maxPowerups);
    }
    
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        
        if (!powerup.collected) {
            // Magnet effect - attract powerups to player
            if (player.magnet > 0) {
                const dx = (player.x + player.width/2) - (powerup.x + powerup.width/2);
                const dy = (player.y + player.height/2) - (powerup.y + powerup.height/2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) { // Magnet range
                    const magnetForce = 3;
                    powerup.x += (dx / distance) * magnetForce;
                    powerup.y += (dy / distance) * magnetForce;
                }
            }
            
            // Check collision with player
            if (player.x < powerup.x + powerup.width &&
                player.x + player.width > powerup.x &&
                player.y < powerup.y + powerup.height &&
                player.y + player.height > powerup.y) {
                
                // Collect powerup
                powerup.collected = true;
                collectPowerup(powerup);
                powerups.splice(i, 1);
                createParticles(powerup.x + powerup.width/2, powerup.y + powerup.height/2);
            }
        }
        
        // Remove powerups that are too far behind (more aggressive cleanup)
        const cleanupDistance = performanceMode ? 100 : 200;
        if (powerup.x < camera.x - cleanupDistance) {
            powerups.splice(i, 1);
        }
    }
}

// Handle powerup collection
function collectPowerup(powerup) {
    let baseScore = 10;
    let finalScore = Math.floor(baseScore * player.scoreMultiplier);
    
    switch(powerup.type) {
        case 'health':
            player.health = Math.min(100, player.health + 30);
            finalScore = Math.floor(15 * player.scoreMultiplier);
            playSound('health');
            break;
        case 'speed':
            player.speedBoost = 300; // 5 seconds at 60fps
            finalScore = Math.floor(12 * player.scoreMultiplier);
            playSound('powerup');
            break;
        case 'jump':
            player.jumpBoost = 300; // 5 seconds at 60fps
            finalScore = Math.floor(12 * player.scoreMultiplier);
            playSound('powerup');
            break;
        case 'shield':
            player.shield = 600; // 10 seconds at 60fps
            finalScore = Math.floor(20 * player.scoreMultiplier);
            playSound('shield');
            break;
        case 'doubleJump':
            player.doubleJump = 900; // 15 seconds at 60fps
            finalScore = Math.floor(18 * player.scoreMultiplier);
            playSound('powerup');
            break;
        case 'scoreMultiplier':
            player.scoreMultiplier = Math.min(3, player.scoreMultiplier + 0.5);
            finalScore = Math.floor(25 * player.scoreMultiplier);
            playSound('multiplier');
            break;
        case 'invincibility':
            player.invincibility = 300; // 5 seconds at 60fps
            finalScore = Math.floor(30 * player.scoreMultiplier);
            playSound('invincibility');
            break;
        case 'magnet':
            player.magnet = 600; // 10 seconds at 60fps
            finalScore = Math.floor(20 * player.scoreMultiplier);
            playSound('powerup');
            break;
        case 'timeSlow':
            player.timeSlow = 300; // 5 seconds at 60fps
            finalScore = Math.floor(25 * player.scoreMultiplier);
            playSound('powerup');
            break;
        case 'explosive':
            player.explosive = 1; // One-time use
            finalScore = Math.floor(30 * player.scoreMultiplier);
            playSound('powerup');
            break;
        case 'superJump':
            player.superJump = 450; // 7.5 seconds at 60fps
            finalScore = Math.floor(18 * player.scoreMultiplier);
            playSound('powerup');
            break;
        case 'coin':
            player.coins += 1;
            finalScore = Math.floor(50 * player.scoreMultiplier);
            playSound('multiplier');
            break;
        case 'teleport':
            player.teleport = 1; // One-time use
            finalScore = Math.floor(40 * player.scoreMultiplier);
            playSound('powerup');
            break;
        case 'multiJump':
            player.multiJump = 600; // 10 seconds at 60fps
            finalScore = Math.floor(25 * player.scoreMultiplier);
            playSound('powerup');
            break;
        case 'freeze':
            player.freeze = 300; // 5 seconds at 60fps
            finalScore = Math.floor(30 * player.scoreMultiplier);
            playSound('powerup');
            break;
        case 'laser':
            player.laser = 450; // 7.5 seconds at 60fps
            finalScore = Math.floor(35 * player.scoreMultiplier);
            playSound('powerup');
            break;
        case 'ghost':
            player.ghost = 300; // 5 seconds at 60fps
            finalScore = Math.floor(30 * player.scoreMultiplier);
            playSound('powerup');
            break;
        case 'rocket':
            player.rocket = 1; // One-time use
            finalScore = Math.floor(45 * player.scoreMultiplier);
            playSound('powerup');
            break;
        case 'shieldBurst':
            player.shieldBurst = 1; // One-time use
            finalScore = Math.floor(50 * player.scoreMultiplier);
            playSound('powerup');
            break;
        case 'megaCoin':
            player.megaCoin = 1; // One-time use
            finalScore = Math.floor(200 * player.scoreMultiplier);
            playSound('multiplier');
            break;
        case 'rainbow':
            player.rainbow = 600; // 10 seconds at 60fps
            finalScore = Math.floor(40 * player.scoreMultiplier);
            playSound('powerup');
            break;
        case 'gravity':
            player.gravity = 300; // 5 seconds at 60fps
            finalScore = Math.floor(35 * player.scoreMultiplier);
            playSound('powerup');
            break;
    }
    
    score += finalScore;
}

// Update enemies
function updateEnemies() {
    const timeSlowMultiplier = player.timeSlow > 0 ? 0.3 : 1; // Slow enemies when time slow is active
    
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Apply time slow effect
        const deltaTime = timeSlowMultiplier;
        
        // Update enemy based on type
        switch(enemy.type) {
            case 'walker':
                enemy.x += enemy.velocityX * deltaTime;
                
                // Simple AI - turn around at platform edges
                const currentPlatform = platforms.find(p => 
                    enemy.x >= p.x && enemy.x <= p.x + p.width && 
                    Math.abs(enemy.y - (p.y - enemy.height)) < 10
                );
                
                if (!currentPlatform) {
                    enemy.velocityX *= -1;
                }
                
                // Turn around at world boundaries
                if (enemy.x < camera.x - 50 || enemy.x > camera.x + canvas.width + 50) {
                    enemy.velocityX *= -1;
                }
                break;
                
            case 'flyer':
                enemy.x += enemy.velocityX * deltaTime;
                enemy.y += Math.sin(Date.now() * 0.003 + enemy.x * 0.01) * 0.5 * deltaTime;
                
                // Turn around at boundaries
                if (enemy.x < camera.x - 50 || enemy.x > camera.x + canvas.width + 50) {
                    enemy.velocityX *= -1;
                }
                break;
                
            case 'spiker':
                // Spike enemies don't move
                break;
                
            case 'boss':
                enemy.x += enemy.velocityX * deltaTime;
                enemy.y += Math.sin(Date.now() * 0.002) * 0.3 * deltaTime;
                
                // Boss movement pattern
                if (enemy.x < camera.x + 100 || enemy.x > camera.x + canvas.width - 100) {
                    enemy.velocityX *= -1;
                }
                break;
        }
        
        // Check collision with player
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            
            // Check if player is jumping on enemy (stomp attack)
            if (player.velocityY > 0 && player.y < enemy.y - 10) {
                // Player stomped the enemy
                enemy.health--;
                addScreenShake(8); // Screen shake on enemy hit
                if (enemy.health <= 0) {
                    // Enemy defeated
                    createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#FFD700', 15);
                    if (enemy.type.includes('Boss')) {
                        createRainbowTrail(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                        addScreenShake(12); // Bigger shake for boss defeat
                    }
                    enemies.splice(i, 1);
                    score += Math.floor(100 * player.scoreMultiplier);
                    playSound('powerup');
                } else {
                    // Enemy damaged but not defeated
                    player.velocityY = -8; // Bounce player up
                    createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#FF6B6B', 10);
                    playSound('jump');
                }
            } else if (player.invincibility <= 0 && player.shield <= 0) {
                // Player takes damage
                player.health -= 20;
                playSound('damage');
                createParticles(player.x + player.width/2, player.y + player.height/2, '#FF3B30', 12);
                addScreenShake(10); // Screen shake on damage
                
                // Knockback effect
                const knockbackX = player.x < enemy.x ? -5 : 5;
                player.velocityX = knockbackX;
                player.velocityY = -5;
            } else if (player.shield > 0) {
                // Shield blocks damage
                player.shield -= 60; // Reduce shield duration
                createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#5856D6', 8);
                addScreenShake(4); // Light shake for shield hit
                playSound('shieldHit');
            } else if (player.invincibility > 0) {
                // Invincibility blocks damage
                createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#FFD700', 8);
                addScreenShake(3); // Light shake for invincible hit
                playSound('invincibleHit');
            }
        }
        
        // Remove enemies that are too far behind
        if (enemy.x < camera.x - 200) {
            enemies.splice(i, 1);
        }
    }
}

// Create particle effects with enhanced visuals (optimized for performance)
function createParticles(x, y, color = null, count = 8) {
    // Reduce particle count in performance mode
    const actualCount = performanceMode ? Math.min(count, 4) : count;
    
    for (let i = 0; i < actualCount; i++) {
        particles.push({
            x: x,
            y: y,
            velocityX: (Math.random() - 0.5) * 6, // Reduced velocity for performance
            velocityY: (Math.random() - 0.5) * 6,
            life: 30, // Reduced life for faster cleanup
            maxLife: 30,
            size: Math.random() * 3 + 1, // Smaller particles
            color: color || `hsl(${Math.random() * 360}, 100%, 60%)`,
            glow: !performanceMode // Disable glow in performance mode
        });
    }
}

// Create rainbow trail particles (optimized for performance)
function createRainbowTrail(x, y) {
    const trailCount = performanceMode ? 6 : 12; // Reduce trail particles in performance mode
    
    for (let i = 0; i < trailCount; i++) {
        const hue = (Date.now() * 0.1 + i * 30) % 360;
        particles.push({
            x: x,
            y: y,
            velocityX: (Math.random() - 0.5) * 8, // Reduced velocity
            velocityY: (Math.random() - 0.5) * 8,
            life: 40, // Reduced life
            maxLife: 40,
            size: Math.random() * 4 + 2, // Smaller particles
            color: `hsl(${hue}, 100%, 70%)`,
            glow: !performanceMode // Disable glow in performance mode
        });
    }
}

// Add screen shake effect
function addScreenShake(intensity = 5) {
    screenShake = Math.max(screenShake, intensity);
}

// Update particles
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
        particle.velocityY += 0.15; // gravity
        particle.velocityX *= 0.98; // air resistance
        particle.life--;
        
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
    
    // Update screen shake
    if (screenShake > 0) {
        camera.shakeX = (Math.random() - 0.5) * screenShake;
        camera.shakeY = (Math.random() - 0.5) * screenShake;
        screenShake *= 0.9; // Decay
        if (screenShake < 0.1) {
            screenShake = 0;
            camera.shakeX = 0;
            camera.shakeY = 0;
        }
    }
}

// Render game objects
function render() {
    // Fill canvas with black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Save context for camera transformation with screen shake
    ctx.save();
    ctx.translate(-camera.x + camera.shakeX, camera.shakeY);
    
    // Draw platforms with rainbow colors and Apple-style rounded rectangles
    for (let i = 0; i < platforms.length; i++) {
        const platform = platforms[i];
        
        // Create rainbow gradient for each platform
        const gradient = ctx.createLinearGradient(platform.x, platform.y, platform.x + platform.width, platform.y + platform.height);
        const hue = (Date.now() * 0.1 + i * 30) % 360; // Animated rainbow colors
        gradient.addColorStop(0, `hsl(${hue}, 100%, 60%)`);
        gradient.addColorStop(0.5, `hsl(${(hue + 60) % 360}, 100%, 70%)`);
        gradient.addColorStop(1, `hsl(${(hue + 120) % 360}, 100%, 60%)`);
        
        ctx.fillStyle = gradient;
        
        // Draw rounded rectangle for platforms
        const radius = 8;
        ctx.beginPath();
        ctx.roundRect(platform.x, platform.y, platform.width, platform.height, radius);
        ctx.fill();
        
        // Add rainbow border with glow effect
        ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
        ctx.shadowBlur = 5;
        ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    // Draw enemies
    for (let enemy of enemies) {
        // Update animation frame
        enemy.animationFrame = (enemy.animationFrame || 0) + 1;
        
        // Draw enemy based on type with enhanced visuals
        switch(enemy.type) {
            case 'walker':
                // Simple rectangle for walker with enhanced glow
                ctx.shadowColor = enemy.color;
                ctx.shadowBlur = 8;
                ctx.fillStyle = enemy.color;
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                // Add simple eyes
                ctx.fillStyle = '#000';
                ctx.fillRect(enemy.x + 4, enemy.y + 4, 3, 3);
                ctx.fillRect(enemy.x + enemy.width - 7, enemy.y + 4, 3, 3);
                break;
                
            case 'flyer':
                // Draw flyer as a circle with wings and pulsing effect
                const flyerPulse = Math.sin(enemy.animationFrame * 0.1) * 0.2 + 1;
                ctx.shadowColor = enemy.color;
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(enemy.x + enemy.width/2, enemy.y + enemy.height/2, (enemy.width/2) * flyerPulse, 0, Math.PI * 2);
                ctx.fill();
                // Wings with animation
                ctx.fillStyle = enemy.color;
                const wingOffset = Math.sin(enemy.animationFrame * 0.15) * 2;
                ctx.fillRect(enemy.x - 5, enemy.y + 5 + wingOffset, 10, 8);
                ctx.fillRect(enemy.x + enemy.width - 5, enemy.y + 5 - wingOffset, 10, 8);
                break;
                
            case 'spiker':
                // Draw spiker as triangle spikes with pulsing
                const spikePulse = Math.sin(enemy.animationFrame * 0.08) * 0.3 + 1;
                ctx.shadowColor = enemy.color;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(enemy.x + enemy.width/2, enemy.y);
                ctx.lineTo(enemy.x, enemy.y + enemy.height * spikePulse);
                ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height * spikePulse);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'boss':
                // Draw boss as larger rectangle with crown and charge effect
                ctx.shadowColor = enemy.color;
                ctx.shadowBlur = 15;
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                // Crown with glow
                ctx.fillStyle = '#FFD700';
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 8;
                ctx.fillRect(enemy.x + 5, enemy.y - 8, enemy.width - 10, 8);
                break;
                
            case 'megaBoss':
                // Mega boss with earthquake effect
                const earthquakeOffset = Math.sin(enemy.animationFrame * 0.2) * 3;
                ctx.shadowColor = enemy.color;
                ctx.shadowBlur = 20;
                ctx.fillRect(enemy.x + earthquakeOffset, enemy.y, enemy.width, enemy.height);
                // Mega crown
                ctx.fillStyle = '#FFD700';
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 12;
                ctx.fillRect(enemy.x + 3, enemy.y - 12, enemy.width - 6, 12);
                break;
                
            case 'rainbowBoss':
                // Rainbow boss with color cycling
                const hue = (enemy.animationFrame * 2) % 360;
                const rainbowColor = `hsl(${hue}, 100%, 50%)`;
                ctx.shadowColor = rainbowColor;
                ctx.shadowBlur = 18;
                ctx.fillStyle = rainbowColor;
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                // Rainbow crown
                ctx.fillStyle = '#FFD700';
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 10;
                ctx.fillRect(enemy.x + 4, enemy.y - 10, enemy.width - 8, 10);
                break;
                
            case 'fireBoss':
                // Fire boss with flame effect
                const fireIntensity = Math.sin(enemy.animationFrame * 0.3) * 0.5 + 0.5;
                ctx.shadowColor = '#FF4500';
                ctx.shadowBlur = 16;
                ctx.fillStyle = `rgba(255, 69, 0, ${0.7 + fireIntensity * 0.3})`;
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                // Fire crown
                ctx.fillStyle = '#FFD700';
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 8;
                ctx.fillRect(enemy.x + 4, enemy.y - 9, enemy.width - 8, 9);
                break;
                
            case 'iceBoss':
                // Ice boss with frost effect
                const frostIntensity = Math.sin(enemy.animationFrame * 0.12) * 0.4 + 0.6;
                ctx.shadowColor = '#00BFFF';
                ctx.shadowBlur = 14;
                ctx.fillStyle = `rgba(0, 191, 255, ${frostIntensity})`;
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                // Ice crown
                ctx.fillStyle = '#87CEEB';
                ctx.shadowColor = '#87CEEB';
                ctx.shadowBlur = 6;
                ctx.fillRect(enemy.x + 4, enemy.y - 9, enemy.width - 8, 9);
                break;
                
            case 'shadowBoss':
                // Shadow boss with teleport effect
                const shadowAlpha = Math.sin(enemy.animationFrame * 0.25) * 0.3 + 0.7;
                ctx.shadowColor = '#2F2F2F';
                ctx.shadowBlur = 12;
                ctx.fillStyle = `rgba(47, 47, 47, ${shadowAlpha})`;
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                // Shadow crown
                ctx.fillStyle = '#4B0082';
                ctx.shadowColor = '#4B0082';
                ctx.shadowBlur = 8;
                ctx.fillRect(enemy.x + 4, enemy.y - 9, enemy.width - 8, 9);
                break;
                
            case 'lightningBoss':
                // Lightning boss with electric effect
                const lightningIntensity = Math.sin(enemy.animationFrame * 0.4) * 0.6 + 0.4;
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 22;
                ctx.fillStyle = `rgba(255, 215, 0, ${lightningIntensity})`;
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                // Lightning crown
                ctx.fillStyle = '#FFFF00';
                ctx.shadowColor = '#FFFF00';
                ctx.shadowBlur = 10;
                ctx.fillRect(enemy.x + 4, enemy.y - 10, enemy.width - 8, 10);
                break;
        }
        
        // Reset shadow effects
        ctx.shadowBlur = 0;
    }
    
    // Draw powerups with Apple-style rounded rectangles
    for (let powerup of powerups) {
        if (!powerup.collected) {
            ctx.fillStyle = powerup.color;
            const powerupRadius = 6;
            ctx.beginPath();
            ctx.roundRect(powerup.x, powerup.y, powerup.width, powerup.height, powerupRadius);
            ctx.fill();
            
            // Add a subtle glow effect
            ctx.shadowColor = powerup.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.roundRect(powerup.x - 1, powerup.y - 1, powerup.width + 2, powerup.height + 2, powerupRadius);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
    
    // Draw particles with enhanced visuals (optimized for performance)
    if (particles.length > 0) {
        // Limit particle rendering in performance mode
        const maxParticles = performanceMode ? 20 : 50;
        const particlesToRender = particles.slice(0, maxParticles);
        
        for (let particle of particlesToRender) {
            const alpha = particle.life / particle.maxLife;
            const size = particle.size || 3;
            
            // Skip rendering if particle is too small or transparent
            if (alpha < 0.1 || size < 0.5) continue;
            
            if (particle.glow && !performanceMode) {
                ctx.shadowColor = particle.color;
                ctx.shadowBlur = 8;
            }
            
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = alpha;
            
            // Draw particle as circle for better visual effect
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        }
    }
    
    // Draw detailed character player with improved proportions
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    const headRadius = 10;
    const bodyHeight = 22;
    const armLength = 12;
    const legLength = 16;
    const shoulderWidth = 14;
    
    ctx.strokeStyle = player.color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    // Add powerup effects (glow around stick figure)
    if (player.shield > 0) {
        ctx.shadowColor = '#5856D6';
        ctx.shadowBlur = 10;
        ctx.globalAlpha = 0.6;
    } else if (player.invincibility > 0) {
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15;
        ctx.globalAlpha = 0.8;
    } else if (player.speedBoost > 0) {
        ctx.shadowColor = '#007AFF';
        ctx.shadowBlur = 8;
        ctx.globalAlpha = 0.7;
    } else if (player.magnet > 0) {
        ctx.shadowColor = '#FF1493';
        ctx.shadowBlur = 12;
        ctx.globalAlpha = 0.7;
    } else if (player.timeSlow > 0) {
        ctx.shadowColor = '#00CED1';
        ctx.shadowBlur = 10;
        ctx.globalAlpha = 0.6;
    } else if (player.superJump > 0) {
        ctx.shadowColor = '#8A2BE2';
        ctx.shadowBlur = 10;
        ctx.globalAlpha = 0.7;
    } else if (player.explosive > 0) {
        ctx.shadowColor = '#FF4500';
        ctx.shadowBlur = 15;
        ctx.globalAlpha = 0.8;
    } else if (player.multiJump > 0) {
        ctx.shadowColor = '#FF69B4';
        ctx.shadowBlur = 12;
        ctx.globalAlpha = 0.7;
    } else if (player.freeze > 0) {
        ctx.shadowColor = '#00BFFF';
        ctx.shadowBlur = 10;
        ctx.globalAlpha = 0.6;
    } else if (player.laser > 0) {
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 15;
        ctx.globalAlpha = 0.8;
    } else if (player.ghost > 0) {
        ctx.shadowColor = '#C0C0C0';
        ctx.shadowBlur = 8;
        ctx.globalAlpha = 0.5;
    } else if (player.rocket > 0) {
        ctx.shadowColor = '#FF8C00';
        ctx.shadowBlur = 12;
        ctx.globalAlpha = 0.7;
    } else if (player.shieldBurst > 0) {
        ctx.shadowColor = '#9932CC';
        ctx.shadowBlur = 15;
        ctx.globalAlpha = 0.8;
    } else if (player.rainbow > 0) {
        ctx.shadowColor = '#FF1493';
        ctx.shadowBlur = 20;
        ctx.globalAlpha = 0.9;
    } else if (player.gravity > 0) {
        ctx.shadowColor = '#2F4F4F';
        ctx.shadowBlur = 10;
        ctx.globalAlpha = 0.6;
    }
    
    // Calculate animation values
    const time = Date.now() * 0.01;
    const walkCycle = Math.sin(time * 0.02) * 0.5;
    const armSwing = Math.sin(time * 0.015) * 0.3;
    const headBob = Math.sin(time * 0.025) * 0.5;
    const isMoving = Math.abs(player.velocityX) > 0.1;
    const isJumping = player.velocityY < -2;
    const isFalling = player.velocityY > 2;
    
    // Draw character with enhanced details
    
    // 1. HAIR - Improved spiky anime-style hair with better shape
    ctx.fillStyle = player.hairColor;
    ctx.beginPath();
    const hairY = player.y + headRadius - 4;
    const hairBaseY = hairY - headRadius * 0.3;
    
    // Main hair shape - more natural curve
    ctx.arc(centerX, hairBaseY, headRadius + 3, Math.PI * 0.3, Math.PI * 0.7, false);
    
    // Spiky hair details - more dynamic spikes
    const numSpikes = 6;
    for (let i = 0; i < numSpikes; i++) {
        const spikeAngle = (i * Math.PI * 0.4) - Math.PI * 0.2;
        const spikeX = centerX + Math.cos(spikeAngle) * (headRadius + 4);
        const spikeY = hairBaseY + Math.sin(spikeAngle) * (headRadius + 4);
        ctx.lineTo(spikeX, spikeY - 3);
        // Add small secondary spikes
        const smallSpikeX = spikeX + Math.cos(spikeAngle + 0.3) * 2;
        const smallSpikeY = spikeY - 3 + Math.sin(spikeAngle + 0.3) * 2;
        ctx.lineTo(smallSpikeX, smallSpikeY);
    }
    ctx.closePath();
    ctx.fill();
    
    // Hair highlights - multiple highlights for depth
    ctx.fillStyle = lightenColor(player.hairColor, 25);
    ctx.beginPath();
    ctx.arc(centerX - 3, hairBaseY - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 2, hairBaseY - 1, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Hair shadow for depth
    ctx.fillStyle = darkenColor(player.hairColor, 15);
    ctx.beginPath();
    ctx.arc(centerX + 2, hairBaseY + 1, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // 2. HEAD - More detailed face
    ctx.strokeStyle = '#FFDBAC'; // Skin color
    ctx.fillStyle = '#FFDBAC';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, player.y + headRadius + 2 + headBob, headRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // 3. EYES - More expressive eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX - 3, player.y + headRadius + 2 + headBob - 1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 3, player.y + headRadius + 2 + headBob - 1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye pupils with expression
    ctx.fillStyle = '#000000';
    let pupilOffset = 0;
    if (isJumping) pupilOffset = -0.5; // Excited eyes when jumping
    if (isFalling) pupilOffset = 0.5;  // Worried eyes when falling
    
    ctx.beginPath();
    ctx.arc(centerX - 3, player.y + headRadius + 2 + headBob - 1 + pupilOffset, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 3, player.y + headRadius + 2 + headBob - 1 + pupilOffset, 1.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye shine
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX - 2.5, player.y + headRadius + 2 + headBob - 1.5, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 3.5, player.y + headRadius + 2 + headBob - 1.5, 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // 4. EYEBROWS - Expressive eyebrows
    ctx.strokeStyle = player.hairColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 5, player.y + headRadius + 2 + headBob - 3);
    ctx.lineTo(centerX - 1, player.y + headRadius + 2 + headBob - 2.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX + 1, player.y + headRadius + 2 + headBob - 2.5);
    ctx.lineTo(centerX + 5, player.y + headRadius + 2 + headBob - 3);
    ctx.stroke();
    
    // 5. NOSE - Small nose
    ctx.fillStyle = '#FFDBAC';
    ctx.beginPath();
    ctx.arc(centerX, player.y + headRadius + 2 + headBob + 1, 0.8, 0, Math.PI * 2);
    ctx.fill();
    
    // 6. MOUTH - Expressive mouth
    ctx.strokeStyle = '#FF69B4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (isJumping) {
        // Happy/excited mouth when jumping
        ctx.arc(centerX, player.y + headRadius + 2 + headBob + 3, 2, 0, Math.PI);
    } else if (isFalling) {
        // Worried mouth when falling
        ctx.arc(centerX, player.y + headRadius + 2 + headBob + 4, 1.5, Math.PI, 0);
    } else {
        // Normal smile
        ctx.arc(centerX, player.y + headRadius + 2 + headBob + 3, 1.5, 0, Math.PI);
    }
    ctx.stroke();
    
    // 7. BODY - Improved shirt with better proportions and details
    const bodyStartY = player.y + headRadius * 2 + 2;
    const bodyEndY = bodyStartY + bodyHeight;
    
    // Shirt with rounded top
    ctx.fillStyle = player.shirtColor;
    ctx.beginPath();
    ctx.roundRect(centerX - shoulderWidth/2, bodyStartY, shoulderWidth, bodyHeight, 2);
    ctx.fill();
    
    // Shirt collar - V-neck style
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(centerX - 5, bodyStartY);
    ctx.lineTo(centerX, bodyStartY + 5);
    ctx.lineTo(centerX + 5, bodyStartY);
    ctx.lineTo(centerX + 4, bodyStartY + 2);
    ctx.lineTo(centerX, bodyStartY + 4);
    ctx.lineTo(centerX - 4, bodyStartY + 2);
    ctx.closePath();
    ctx.fill();
    
    // Shirt buttons - more visible
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(centerX, bodyStartY + 8 + i * 5, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    
    // Body outline - smoother
    ctx.strokeStyle = darkenColor(player.shirtColor, 20);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(centerX - shoulderWidth/2, bodyStartY, shoulderWidth, bodyHeight, 2);
    ctx.stroke();
    
    // Shirt shading for depth
    ctx.fillStyle = darkenColor(player.shirtColor, 10);
    ctx.beginPath();
    ctx.rect(centerX - shoulderWidth/2, bodyStartY + bodyHeight * 0.6, shoulderWidth, bodyHeight * 0.4);
    ctx.fill();
    
    // 8. ARMS - Improved arms with better proportions and sleeves
    const armY = bodyStartY + bodyHeight * 0.25;
    const armSwingAmount = isMoving ? armSwing * 4 : armSwing * 2;
    
    // Sleeves
    ctx.fillStyle = player.shirtColor;
    ctx.beginPath();
    ctx.arc(centerX - shoulderWidth/2, armY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + shoulderWidth/2, armY, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Left arm - upper and forearm
    ctx.strokeStyle = '#FFDBAC';
    ctx.lineWidth = 4;
    const leftUpperEndX = centerX - armLength * 0.6;
    const leftUpperEndY = armY + armSwingAmount * 0.5;
    ctx.beginPath();
    ctx.moveTo(centerX - shoulderWidth/2, armY);
    ctx.lineTo(leftUpperEndX, leftUpperEndY);
    ctx.stroke();
    
    // Left forearm
    ctx.beginPath();
    ctx.moveTo(leftUpperEndX, leftUpperEndY);
    ctx.lineTo(centerX - armLength - 2, armY + armSwingAmount * 1.2);
    ctx.stroke();
    
    // Right arm - upper and forearm
    const rightUpperEndX = centerX + armLength * 0.6;
    const rightUpperEndY = armY - armSwingAmount * 0.5;
    ctx.beginPath();
    ctx.moveTo(centerX + shoulderWidth/2, armY);
    ctx.lineTo(rightUpperEndX, rightUpperEndY);
    ctx.stroke();
    
    // Right forearm
    ctx.beginPath();
    ctx.moveTo(rightUpperEndX, rightUpperEndY);
    ctx.lineTo(centerX + armLength + 2, armY - armSwingAmount * 1.2);
    ctx.stroke();
    
    // Hands - more detailed
    ctx.fillStyle = '#FFDBAC';
    ctx.beginPath();
    ctx.arc(centerX - armLength - 2, armY + armSwingAmount * 1.2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + armLength + 2, armY - armSwingAmount * 1.2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Hand shadows
    ctx.fillStyle = darkenColor('#FFDBAC', 15);
    ctx.beginPath();
    ctx.arc(centerX - armLength - 2, armY + armSwingAmount * 1.2 + 1, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + armLength + 2, armY - armSwingAmount * 1.2 + 1, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // 9. LEGS - Pants with details
    const legStartY = bodyEndY;
    const legEndY = legStartY + legLength;
    const legSwing = isMoving ? walkCycle * 4 : 0;
    
    // Left leg (pants)
    ctx.fillStyle = player.pantsColor; // Customizable pants color
    ctx.fillRect(centerX - 4, legStartY, 8, legLength);
    
    // Right leg (pants)
    ctx.fillRect(centerX - 4, legStartY, 8, legLength);
    
    // Pants outline
    ctx.strokeStyle = player.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - 4, legStartY, 8, legLength);
    
    // Leg movement animation
    ctx.strokeStyle = '#FFDBAC'; // Skin color for lower legs
    ctx.lineWidth = 3;
    
    // Left lower leg
    ctx.beginPath();
    ctx.moveTo(centerX - 2, legEndY);
    ctx.lineTo(centerX - 4 + legSwing, legEndY + 8);
    ctx.stroke();
    
    // Right lower leg
    ctx.beginPath();
    ctx.moveTo(centerX + 2, legEndY);
    ctx.lineTo(centerX + 4 - legSwing, legEndY + 8);
    ctx.stroke();
    
    // 10. FEET - Improved shoes with better detail
    ctx.fillStyle = player.shoesColor || '#8B0000';
    
    // Left shoe
    ctx.beginPath();
    ctx.ellipse(centerX - 4 + legSwing, legEndY + 10, 4, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Right shoe
    ctx.beginPath();
    ctx.ellipse(centerX + 4 - legSwing, legEndY + 10, 4, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Shoe soles
    ctx.fillStyle = darkenColor(player.shoesColor || '#8B0000', 30);
    ctx.beginPath();
    ctx.ellipse(centerX - 4 + legSwing, legEndY + 11.5, 4, 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + 4 - legSwing, legEndY + 11.5, 4, 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Shoe laces - more detailed
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    // Left shoe laces
    ctx.beginPath();
    ctx.moveTo(centerX - 6 + legSwing, legEndY + 9);
    ctx.lineTo(centerX - 4 + legSwing, legEndY + 10.5);
    ctx.lineTo(centerX - 2 + legSwing, legEndY + 9);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX - 5 + legSwing, legEndY + 10);
    ctx.lineTo(centerX - 3 + legSwing, legEndY + 11);
    ctx.stroke();
    
    // Right shoe laces
    ctx.beginPath();
    ctx.moveTo(centerX + 2 - legSwing, legEndY + 9);
    ctx.lineTo(centerX + 4 - legSwing, legEndY + 10.5);
    ctx.lineTo(centerX + 6 - legSwing, legEndY + 9);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX + 3 - legSwing, legEndY + 10);
    ctx.lineTo(centerX + 5 - legSwing, legEndY + 11);
    ctx.stroke();
    
    // 11. ACCESSORIES - Backpack
    ctx.fillStyle = '#8B4513'; // Brown backpack
    ctx.fillRect(centerX + 8, bodyStartY + 2, 6, 12);
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 1;
    ctx.strokeRect(centerX + 8, bodyStartY + 2, 6, 12);
    
    // Backpack straps
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX + 8, bodyStartY + 2);
    ctx.lineTo(centerX + 4, bodyStartY + 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX + 14, bodyStartY + 2);
    ctx.lineTo(centerX + 10, bodyStartY + 6);
    ctx.stroke();
    
    // 12. CHARACTER MOOD EFFECTS
    
    // Excitement sparkles when jumping
    if (isJumping && Math.random() < 0.3) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(centerX + (Math.random() - 0.5) * 20, player.y + (Math.random() - 0.5) * 20, 1, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Sweat drops when falling (worried)
    if (isFalling && Math.random() < 0.2) {
        ctx.fillStyle = '#87CEEB';
        ctx.beginPath();
        ctx.arc(centerX + (Math.random() - 0.5) * 10, player.y + headRadius + 5, 0.8, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Happy hearts when collecting powerups (if recently collected)
    if (player.health > 80 && Math.random() < 0.1) {
        ctx.fillStyle = '#FF69B4';
        ctx.font = '12px Arial';
        ctx.fillText('♥', centerX + (Math.random() - 0.5) * 15, player.y - 10 + (Math.random() - 0.5) * 10);
    }
    
    // 13. PERSONALITY INDICATORS
    
    // Energy level indicator (small bar above head)
    const energyLevel = player.health / 100;
    const barWidth = 20;
    const barHeight = 3;
    const barX = centerX - barWidth / 2;
    const barY = player.y - 15;
    
    // Background bar
    ctx.fillStyle = '#333333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Energy bar
    ctx.fillStyle = energyLevel > 0.6 ? '#00FF00' : energyLevel > 0.3 ? '#FFFF00' : '#FF0000';
    ctx.fillRect(barX, barY, barWidth * energyLevel, barHeight);
    
    // 14. CHARACTER NAME TAG (optional - shows when idle)
    if (!isMoving && Math.random() < 0.01) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Eric', centerX, player.y - 25);
        ctx.textAlign = 'left';
    }
    
    // 15. SPECIAL POWERUP VISUAL EFFECTS ON CHARACTER
    
    // Speed lines when speed boost is active
    if (player.speedBoost > 0 && isMoving) {
        ctx.strokeStyle = '#007AFF';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(centerX - 15 - i * 5, player.y + 10);
            ctx.lineTo(centerX - 25 - i * 5, player.y + 10 + (Math.random() - 0.5) * 4);
            ctx.stroke();
        }
    }
    
    // Jump boost sparkles
    if (player.jumpBoost > 0) {
        ctx.fillStyle = '#FF9500';
        for (let i = 0; i < 2; i++) {
            ctx.beginPath();
            ctx.arc(centerX + (Math.random() - 0.5) * 12, player.y + (Math.random() - 0.5) * 12, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Shield aura
    if (player.shield > 0) {
        ctx.strokeStyle = '#5856D6';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(centerX, centerY, headRadius + 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
    
    // Invincibility stars
    if (player.invincibility > 0) {
        ctx.fillStyle = '#FFD700';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        for (let i = 0; i < 3; i++) {
            const angle = (Date.now() * 0.01 + i * Math.PI * 2 / 3) % (Math.PI * 2);
            const starX = centerX + Math.cos(angle) * 20;
            const starY = centerY + Math.sin(angle) * 20;
            ctx.fillText('★', starX, starY);
        }
        ctx.textAlign = 'left';
    }
    
    // Reset shadow effects
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    
    // Restore context
    ctx.restore();
    
    // Update UI
    document.getElementById('score').textContent = score;
    document.getElementById('health').textContent = Math.max(0, player.health);
    document.getElementById('level').textContent = currentLevel;
    document.getElementById('levelProgress').textContent = `${Math.floor(levelProgress)}%`;
    
    // Update level progression
    updateLevelProgression();
    
    // Check game over
    if (player.health <= 0) {
        gameOver();
    }
}

// Level progression function
function updateLevelProgression() {
    const levelThreshold = currentLevel * 1000; // 1000 points per level
    levelProgress = ((score % 1000) / 1000) * 100;
    
    if (score >= levelThreshold && currentLevel < maxLevel) {
        currentLevel++;
        levelProgress = 0;
        playSound('levelUp');
        
        // Increase difficulty
        gameSpeed += 0.5;
        
        // Heal player slightly on level up
        player.health = Math.min(100, player.health + 20);
        
        // Show level up notification
        showLevelUpNotification();
    }
}

// Show level up notification
function showLevelUpNotification() {
    const notification = document.createElement('div');
    notification.className = 'level-up-notification';
    notification.textContent = `Level ${currentLevel}!`;
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(45deg, #FFD700, #FFA500);
        color: #000;
        padding: 20px 40px;
        border-radius: 20px;
        font-size: 2em;
        font-weight: bold;
        z-index: 1000;
        animation: levelUpAnimation 2s ease-out forwards;
        box-shadow: 0 10px 30px rgba(255, 215, 0, 0.5);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 2000);
}

// Game over function
function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalLevel').textContent = currentLevel;
    
    // Add to leaderboard
    addToLeaderboard(score, currentLevel);
    
    // Show leaderboard
    showLeaderboard();
    
    document.getElementById('gameOver').style.display = 'block';
}

// Restart game function
function restartGame() {
    gameRunning = true;
    score = 0;
    gameSpeed = 2;
    camera = { x: 0 };
    survivalTimer = 0;
    currentLevel = 1;
    levelProgress = 0;
    
    // Reset player
    player.x = 100;
    player.y = 300;
    player.velocityX = 0;
    player.velocityY = 0;
    player.health = 100;
    player.onGround = false;
    player.speedBoost = 0;
    player.jumpBoost = 0;
    player.shield = 0;
    player.doubleJump = 0;
    player.scoreMultiplier = 1;
    player.invincibility = 0;
    player.canDoubleJump = false;
    player.jumpCount = 0;
    player.magnet = 0;
    player.timeSlow = 0;
    player.explosive = 0;
    player.superJump = 0;
    player.coins = 0;
    player.teleport = 0;
    player.multiJump = 0;
    player.freeze = 0;
    player.laser = 0;
    player.ghost = 0;
    player.rocket = 0;
    player.shieldBurst = 0;
    player.megaCoin = 0;
    player.rainbow = 0;
    player.gravity = 0;
    
    // Clear arrays
    platforms = [];
    enemies = [];
    powerups = [];
    particles = [];
    
    // Hide game over screen and leaderboard
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('leaderboard').style.display = 'none';
    
    // Reinitialize
    createInitialPlatforms();
    
    // Restart audio if not muted
    if (!isMuted) {
        initAudio();
    }
}

// Main game loop (optimized for performance)
function gameLoop(currentTime) {
    if (gameRunning) {
        // Frame rate limiting for better performance
        if (currentTime - lastFrameTime >= frameTime) {
            frameCount++;
            
            updatePlayer();
            updatePowerups();
            updateEnemies();
            updateParticles();
            generateNewPlatforms();
            render();
            
            // Increase game speed over time
            gameSpeed += 0.001;
            
            // Add survival bonus score with level scaling
            survivalTimer++;
            if (survivalTimer % 60 === 0) { // Every second (60fps)
                const survivalBonus = Math.floor(2 * currentLevel * player.scoreMultiplier);
                score += survivalBonus;
            }
            
            lastFrameTime = currentTime;
        }
    }
    
    requestAnimationFrame(gameLoop);
}


// Leaderboard functions
function addToLeaderboard(score, level) {
    const entry = {
        score: score,
        level: level,
        date: new Date().toLocaleDateString(),
        timestamp: Date.now(),
        username: currentAccount || 'Guest'
    };
    
    // Add to account-specific leaderboard if logged in
    if (currentAccount && accounts[currentAccount]) {
        const account = accounts[currentAccount];
        
        // Update account stats
        account.gamesPlayed = (account.gamesPlayed || 0) + 1;
        if (score > account.bestScore) {
            account.bestScore = score;
        }
        if (level > account.bestLevel) {
            account.bestLevel = level;
        }
        
        // Add to account leaderboard
        if (!account.leaderboard) {
            account.leaderboard = [];
        }
        account.leaderboard.push(entry);
        account.leaderboard.sort((a, b) => b.score - a.score);
        account.leaderboard = account.leaderboard.slice(0, 10); // Keep top 10
        
        // Save account data
        accounts[currentAccount] = account;
        localStorage.setItem('platformerAccounts', JSON.stringify(accounts));
        
        // Update UI
        updateAccountUI();
        
        // Use account leaderboard
        leaderboard = account.leaderboard;
    } else {
        // Global leaderboard for guests
        leaderboard.push(entry);
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 10); // Keep top 10
        localStorage.setItem('platformerLeaderboard', JSON.stringify(leaderboard));
    }
}

function showLeaderboard() {
    const leaderboardDiv = document.getElementById('leaderboard');
    const leaderboardList = document.getElementById('leaderboardList');
    const leaderboardHeader = document.querySelector('.leaderboard-header h3');
    
    // Update header to show account-specific or global
    if (currentAccount) {
        leaderboardHeader.textContent = `🏆 ${currentAccount}'s Leaderboard`;
    } else {
        leaderboardHeader.textContent = '🏆 Leaderboard';
    }
    
    leaderboardList.innerHTML = '';
    
    if (leaderboard.length === 0) {
        leaderboardList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No scores yet. Play to add your first score!</div>';
        return;
    }
    
    leaderboard.forEach((entry, index) => {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'leaderboard-entry';
        
        // Add rainbow effect for top 3 scores
        let rankClass = '';
        let scoreClass = '';
        let levelClass = '';
        let dateClass = '';
        
        if (index < 3) {
            rankClass = 'rainbow-text';
            scoreClass = 'rainbow-text';
            levelClass = 'rainbow-text';
            dateClass = 'rainbow-text';
        }
        
        entryDiv.innerHTML = `
            <span class="rank ${rankClass}">${index + 1}</span>
            <span class="username">${entry.username || 'Guest'}</span>
            <span class="score ${scoreClass}">${entry.score}</span>
            <span class="level ${levelClass}">Lv.${entry.level}</span>
            <span class="date ${dateClass}">${entry.date}</span>
        `;
        leaderboardList.appendChild(entryDiv);
    });
    
    leaderboardDiv.style.display = 'block';
}

function hideLeaderboard() {
    document.getElementById('leaderboard').style.display = 'none';
}

function resetLeaderboard() {
    if (confirm('Are you sure you want to reset the leaderboard? This action cannot be undone.')) {
        leaderboard = [];
        localStorage.setItem('platformerLeaderboard', JSON.stringify(leaderboard));
        showLeaderboard();
    }
}

// Sound system
function initAudio() {
    backgroundMusic = document.getElementById('backgroundMusic');
    
    // Initialize audio context for sound effects
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log('Web Audio API not supported');
    }
    
    // Load Brazilian Phonk with slowed and reverb effects
    // Create a phonk-inspired melody with heavy bass and atmospheric effects
    createBrazilianPhonkMelody();
}

function playSound(soundType) {
    if (isMuted || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    let frequency = 440;
    let duration = 0.1;
    
    switch(soundType) {
        case 'jump':
            frequency = 523.25; // C5
            duration = 0.1;
            break;
        case 'doubleJump':
            frequency = 659.25; // E5
            duration = 0.15;
            break;
        case 'powerup':
            frequency = 783.99; // G5
            duration = 0.2;
            break;
        case 'health':
            frequency = 880; // A5
            duration = 0.3;
            break;
        case 'shield':
            frequency = 1046.5; // C6
            duration = 0.25;
            break;
        case 'multiplier':
            frequency = 1318.5; // E6
            duration = 0.4;
            break;
        case 'invincibility':
            frequency = 1568; // G6
            duration = 0.5;
            break;
        case 'levelUp':
            frequency = 1760; // A6
            duration = 0.8;
            break;
        case 'damage':
            frequency = 220; // A3
            duration = 0.2;
            break;
        case 'invincibleHit':
            frequency = 1760; // A6
            duration = 0.1;
            break;
        case 'shieldHit':
            frequency = 1046.5; // C6
            duration = 0.15;
            break;
    }
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.3, audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function createBrazilianPhonkMelody() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Taco-themed melody inspired by "It's Raining Tacos"
    const tacoMelody = [
        // Main taco song melody - cheerful and upbeat
        { freq: 523.25, duration: 0.5, start: 0, type: 'sine' },      // C5 - "It's"
        { freq: 587.33, duration: 0.5, start: 0.5, type: 'sine' },   // D5 - "rain"
        { freq: 659.25, duration: 0.5, start: 1.0, type: 'sine' },   // E5 - "ing"
        { freq: 523.25, duration: 0.5, start: 1.5, type: 'sine' },   // C5 - "ta"
        { freq: 587.33, duration: 0.5, start: 2.0, type: 'sine' },   // D5 - "cos"
        { freq: 659.25, duration: 1.0, start: 2.5, type: 'sine' },   // E5 - "from"
        { freq: 523.25, duration: 1.0, start: 3.5, type: 'sine' },   // C5 - "the"
        { freq: 587.33, duration: 1.0, start: 4.5, type: 'sine' },   // D5 - "sky"
        
        // Taco rhythm section
        { freq: 220, duration: 0.25, start: 6.0, type: 'square' },     // A3 - taco beat
        { freq: 246.94, duration: 0.25, start: 6.25, type: 'square' },  // B3
        { freq: 220, duration: 0.25, start: 6.5, type: 'square' },     // A3
        { freq: 196, duration: 0.25, start: 6.75, type: 'square' },    // G3
        { freq: 220, duration: 0.25, start: 7.0, type: 'square' },     // A3
        { freq: 246.94, duration: 0.25, start: 7.25, type: 'square' }, // B3
        { freq: 220, duration: 0.25, start: 7.5, type: 'square' },     // A3
        { freq: 196, duration: 0.25, start: 7.75, type: 'square' },   // G3
        
        // Taco chorus - higher octave
        { freq: 1046.5, duration: 0.4, start: 8.0, type: 'sine' },     // C6 - "It's"
        { freq: 1174.66, duration: 0.4, start: 8.4, type: 'sine' },    // D6 - "rain"
        { freq: 1318.51, duration: 0.4, start: 8.8, type: 'sine' },     // E6 - "ing"
        { freq: 1046.5, duration: 0.4, start: 9.2, type: 'sine' },      // C6 - "ta"
        { freq: 1174.66, duration: 0.4, start: 9.6, type: 'sine' },     // D6 - "cos"
        { freq: 1318.51, duration: 0.8, start: 10.0, type: 'sine' },     // E6 - "from"
        { freq: 1046.5, duration: 0.8, start: 10.8, type: 'sine' },     // C6 - "the"
        { freq: 1174.66, duration: 0.8, start: 11.6, type: 'sine' },     // D6 - "sky"
        
        // Taco percussion - maracas and claves
        { freq: 880, duration: 0.1, start: 12.5, type: 'triangle' },    // High hat
        { freq: 880, duration: 0.1, start: 12.7, type: 'triangle' },
        { freq: 880, duration: 0.1, start: 12.9, type: 'triangle' },
        { freq: 880, duration: 0.1, start: 13.1, type: 'triangle' },
        { freq: 880, duration: 0.1, start: 13.3, type: 'triangle' },
        { freq: 880, duration: 0.1, start: 13.5, type: 'triangle' },
        { freq: 880, duration: 0.1, start: 13.7, type: 'triangle' },
        { freq: 880, duration: 0.1, start: 13.9, type: 'triangle' },
        
        // Taco bass line - funky and bouncy
        { freq: 110, duration: 1.0, start: 14.0, type: 'sawtooth' },     // A2 - taco bass
        { freq: 123.47, duration: 1.0, start: 15.0, type: 'sawtooth' }, // B2
        { freq: 98, duration: 1.0, start: 16.0, type: 'sawtooth' },     // G2
        { freq: 110, duration: 1.0, start: 17.0, type: 'sawtooth' },   // A2
        { freq: 123.47, duration: 1.0, start: 18.0, type: 'sawtooth' }, // B2
        { freq: 98, duration: 1.0, start: 19.0, type: 'sawtooth' },     // G2
        { freq: 110, duration: 2.0, start: 20.0, type: 'sawtooth' },   // A2 - sustained
        
        // Taco celebration - high energy
        { freq: 523.25, duration: 0.3, start: 22.0, type: 'sine' },      // C5
        { freq: 587.33, duration: 0.3, start: 22.3, type: 'sine' },   // D5
        { freq: 659.25, duration: 0.3, start: 22.6, type: 'sine' },     // E5
        { freq: 698.46, duration: 0.3, start: 22.9, type: 'sine' },     // F5
        { freq: 783.99, duration: 0.3, start: 23.2, type: 'sine' },     // G5
        { freq: 880, duration: 0.3, start: 23.5, type: 'sine' },       // A5
        { freq: 987.77, duration: 0.3, start: 23.8, type: 'sine' },     // B5
        { freq: 1046.5, duration: 1.0, start: 24.1, type: 'sine' },   // C6 - taco!
        
        // Taco rhythm breakdown
        { freq: 220, duration: 0.2, start: 25.0, type: 'square' },      // A3
        { freq: 246.94, duration: 0.2, start: 25.2, type: 'square' },  // B3
        { freq: 220, duration: 0.2, start: 25.4, type: 'square' },    // A3
        { freq: 196, duration: 0.2, start: 25.6, type: 'square' },      // G3
        { freq: 220, duration: 0.2, start: 25.8, type: 'square' },     // A3
        { freq: 246.94, duration: 0.2, start: 26.0, type: 'square' },  // B3
        { freq: 220, duration: 0.2, start: 26.2, type: 'square' },      // A3
        { freq: 196, duration: 0.2, start: 26.4, type: 'square' },    // G3
        
        // Final taco chorus
        { freq: 523.25, duration: 0.5, start: 27.0, type: 'sine' },     // C5
        { freq: 587.33, duration: 0.5, start: 27.5, type: 'sine' },     // D5
        { freq: 659.25, duration: 0.5, start: 28.0, type: 'sine' },    // E5
        { freq: 523.25, duration: 0.5, start: 28.5, type: 'sine' },     // C5
        { freq: 587.33, duration: 0.5, start: 29.0, type: 'sine' },    // D5
        { freq: 659.25, duration: 1.0, start: 29.5, type: 'sine' },   // E5
        { freq: 523.25, duration: 1.0, start: 30.5, type: 'sine' },    // C5
        { freq: 587.33, duration: 1.0, start: 31.5, type: 'sine' },    // D5
    ];
    
    function playPhonkMelody() {
        if (isMuted || !gameRunning) return;
        
        const currentTime = audioContext.currentTime;
        
        tacoMelody.forEach(note => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();
            const reverb = audioContext.createConvolver();
            const distortion = audioContext.createWaveShaper();
            
            // Create distortion for that gritty phonk sound
            const distortionAmount = 50;
            const samples = 44100;
            const curve = new Float32Array(samples);
            for (let i = 0; i < samples; i++) {
                const x = (i * 2) / samples - 1;
                curve[i] = ((3 + distortionAmount) * x * 20 * (Math.PI / 180)) / (Math.PI + Math.abs(x) * 20 * (Math.PI / 180));
            }
            distortion.curve = curve;
            distortion.oversample = '4x';
            
            // Create enhanced reverb effect
            const reverbBuffer = audioContext.createBuffer(2, audioContext.sampleRate * 4, audioContext.sampleRate);
            for (let channel = 0; channel < reverbBuffer.numberOfChannels; channel++) {
                const channelData = reverbBuffer.getChannelData(channel);
                for (let i = 0; i < channelData.length; i++) {
                    channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / channelData.length, 3);
                }
            }
            reverb.buffer = reverbBuffer;
            
            // Connect audio nodes
            oscillator.connect(filter);
            filter.connect(distortion);
            distortion.connect(gainNode);
            gainNode.connect(reverb);
            reverb.connect(audioContext.destination);
            
            // Also connect dry signal for mix
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(note.freq, currentTime + note.start);
            oscillator.type = note.type || 'sawtooth';
            
            // Enhanced filtering for that authentic phonk sound
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1200, currentTime + note.start);
            filter.Q.setValueAtTime(8, currentTime + note.start);
            
            // Enhanced gain envelope with more punch
            gainNode.gain.setValueAtTime(0, currentTime + note.start);
            gainNode.gain.linearRampToValueAtTime(volume * 0.6, currentTime + note.start + 0.05);
            gainNode.gain.linearRampToValueAtTime(volume * 0.4, currentTime + note.start + note.duration - 0.1);
            gainNode.gain.linearRampToValueAtTime(0, currentTime + note.start + note.duration);
            
            oscillator.start(currentTime + note.start);
            oscillator.stop(currentTime + note.start + note.duration);
        });
        
        // Loop the taco melody (32 seconds total)
        setTimeout(playPhonkMelody, 32000);
    }
    
    // Start the taco melody immediately
    playPhonkMelody();
}

function toggleMute() {
    isMuted = !isMuted;
    const muteBtn = document.getElementById('muteBtn');
    muteBtn.textContent = isMuted ? '🔇' : '🔊';
}

function setVolume(value) {
    volume = value / 100;
}

function toggleYouTube() {
    const youtubePlayer = document.getElementById('youtubePlayer');
    const youtubeBtn = document.getElementById('youtubeBtn');
    
    if (youtubePlayer.style.display === 'none') {
        youtubePlayer.style.display = 'block';
        youtubeBtn.textContent = '🎵';
        youtubeBtn.style.background = 'rgba(0, 122, 255, 0.2)';
        
        // Set default search for It's Raining Tacos
        document.getElementById('youtubeSearch').value = 'It\'s Raining Tacos 1 Hour';
        
        // Pause the generated music when YouTube is playing
        isMuted = true;
        document.getElementById('muteBtn').textContent = '🔇';
    } else {
        youtubePlayer.style.display = 'none';
        youtubeBtn.style.background = 'none';
    }
}

function searchYouTube() {
    const searchTerm = document.getElementById('youtubeSearch').value;
    if (searchTerm.trim() === '') {
        alert('Please enter a search term');
        return;
    }
    
    // Open YouTube search in a new tab
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerm)}`;
    window.open(searchUrl, '_blank');
}

function handleYouTubeSearch(event) {
    if (event.key === 'Enter') {
        searchYouTube();
    }
}

// Performance mode toggle
function togglePerformanceMode() {
    performanceMode = !performanceMode;
    const performanceBtn = document.getElementById('performanceBtn');
    performanceBtn.textContent = performanceMode ? '⚡' : '🎨';
    performanceBtn.title = performanceMode ? 'Performance Mode: ON' : 'Performance Mode: OFF';
    
    // Clear existing particles when switching modes
    particles = [];
}

// Utility function for color manipulation
function lightenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

function darkenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// Avatar customization functions
function changeHairColor(color) {
    player.hairColor = color;
    updateColorButtons('hair', color);
}

function changeShirtColor(color) {
    player.shirtColor = color;
    updateColorButtons('shirt', color);
}

function changePantsColor(color) {
    player.pantsColor = color;
    updateColorButtons('pants', color);
}

function changeShoesColor(color) {
    player.shoesColor = color;
    updateColorButtons('shoes', color);
}

function updateColorButtons(type, color) {
    // Remove selected class from all buttons of this type
    document.querySelectorAll(`[data-${type}]`).forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Add selected class to the clicked button
    document.querySelector(`[data-${type}="${color}"]`).classList.add('selected');
}

// Menu toggle functions
function toggleAvatarMenu() {
    const avatarMenu = document.getElementById('avatarMenu');
    const levelMenu = document.getElementById('levelMenu');
    
    if (avatarMenu.style.display === 'none') {
        avatarMenu.style.display = 'block';
        levelMenu.style.display = 'none';
    } else {
        avatarMenu.style.display = 'none';
    }
}

function toggleLevelMenu() {
    const levelMenu = document.getElementById('levelMenu');
    const avatarMenu = document.getElementById('avatarMenu');
    
    if (levelMenu.style.display === 'none') {
        levelMenu.style.display = 'block';
        avatarMenu.style.display = 'none';
    } else {
        levelMenu.style.display = 'none';
    }
}

function selectLevel(mode) {
    gameMode = mode;
    
    // Remove selected class from all level buttons
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Add selected class to clicked button
    event.target.closest('.level-btn').classList.add('selected');
    
    // Apply game mode settings
    switch(mode) {
        case 'speed':
            gameSpeed = 3;
            break;
        case 'endless':
            maxLevel = 999;
            break;
        case 'boss':
            // Increase boss spawn rate
            break;
        case 'powerup':
            // Increase powerup spawn rate
            break;
        case 'hardcore':
            player.health = 50;
            break;
        default:
            gameSpeed = 2;
            maxLevel = 10;
            player.health = 100;
    }
}

// Start the game
init();
