const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const energyBar = document.getElementById('energyBar');
const screenOverlay = document.getElementById('screenOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const actionBtn = document.getElementById('actionBtn');

// Game Configuration
let player = { x: 200, y: 300, size: 12, speed: 4.5 };
let target = { x: 600, y: 300, radius: 15, baseSpeed: 2.2 };
let mouse = { x: 200, y: 300 };
let obstacles = [];
let energy = 100;
let survivalTime = 0;
let isRunning = false;
let isGameOver = false;

const thoughts = [
    "Maybe if I try harder...",
    "Why are they moving away?",
    "Just a little closer...",
    "Are they ignoring me?",
    "So near, yet completely out of reach."
];
let activeThought = "";
let thoughtTimer = 0;

function initObstacles() {
    obstacles = [];
    for (let i = 0; i < 5; i++) {
        obstacles.push({
            x: 250 + Math.random() * 350,
            y: 50 + Math.random() * 500,
            radius: 15 + Math.random() * 15,
            speed: 2 + Math.random() * 3,
            dirY: Math.random() > 0.5 ? 1 : -1
        });
    }
}

// Input tracking
function updateInput(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
        mouse.x = e.touches[0].clientX - rect.left;
        mouse.y = e.touches[0].clientY - rect.top;
    } else if (e.clientX !== undefined) {
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    }
}

window.addEventListener('mousemove', updateInput);
window.addEventListener('touchmove', updateInput, { passive: true });
window.addEventListener('touchstart', updateInput, { passive: true });

function drawHeart(x, y, size) {
    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.arc(x - size / 2, y - size / 2, size, 0, Math.PI * 2);
    ctx.arc(x + size / 2, y - size / 2, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - size, y - size / 3);
    ctx.lineTo(x + size, y - size / 3);
    ctx.lineTo(x, y + size * 1.2);
    ctx.closePath();
    ctx.fill();
}

function startGame() {
    energy = 100;
    survivalTime = 0;
    player.x = 200;
    player.y = 300;
    target.x = 600;
    target.y = 300;
    mouse.x = 200;
    mouse.y = 300;
    activeThought = "";
    thoughtTimer = 0;
    initObstacles();

    isGameOver = false;
    isRunning = true;
    screenOverlay.style.display = 'none';
    loop();
}

function triggerGameOver(reason) {
    isRunning = false;
    isGameOver = true;
    screenOverlay.style.display = 'flex';
    overlayTitle.innerText = "GAME OVER";
    overlayText.innerText = reason;
    actionBtn.innerText = "Try Again";
}

function loop() {
    if (!isRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update Player Movement
    let pDx = mouse.x - player.x;
    let pDy = mouse.y - player.y;
    let pDist = Math.hypot(pDx, pDy);
    if (pDist > 5) {
        player.x += (pDx / pDist) * player.speed;
        player.y += (pDy / pDist) * player.speed;
    }

    // Update Target Evading Mechanics
    let tDx = target.x - player.x;
    let tDy = target.y - player.y;
    let targetDist = Math.hypot(tDx, tDy);

    let evasionMultiplier = 1.0;
    if (targetDist < 280) {
        evasionMultiplier = 1.0 + (280 - targetDist) / 32;

        if (thoughtTimer <= 0) {
            activeThought = thoughts[Math.floor(Math.random() * thoughts.length)];
            thoughtTimer = 110;
        }
    }

    if (targetDist > 0) {
        target.x += (tDx / targetDist) * target.baseSpeed * evasionMultiplier;
        target.y += (tDy / targetDist) * target.baseSpeed * evasionMultiplier;
    }

    target.x = Math.max(30, Math.min(canvas.width - 30, target.x));
    target.y = Math.max(30, Math.min(canvas.height - 30, target.y));

    // Handle Obstacles & Collisions
    obstacles.forEach(obs => {
        obs.y += obs.speed * obs.dirY;
        if (obs.y <= obs.radius || obs.y >= canvas.height - obs.radius) {
            obs.dirY *= -1;
        }

        // Draw Obstacles
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#457b9d';
        ctx.fill();

        // Check Obstacle Collision
        let obsDist = Math.hypot(player.x - obs.x, player.y - obs.y);
        if (obsDist < (obs.radius + player.size)) {
            energy -= 0.8;
        }
    });

    // Deplete Energy Over Time
    energy -= 0.08;
    energyBar.style.width = Math.max(0, energy) + '%';

    if (energy <= 0) {
        triggerGameOver("You exhausted all your emotional energy.");
        return;
    }

    // Draw Target
    ctx.beginPath();
    ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#64dfdf';
    ctx.fill();

    // Draw Player Heart
    drawHeart(player.x, player.y, player.size);

    // Draw Thought Text
    if (thoughtTimer > 0) {
        ctx.fillStyle = '#a8da4c';
        ctx.font = '14px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText(activeThought, player.x, player.y - 25);
        thoughtTimer--;
    }

    requestAnimationFrame(loop);
}