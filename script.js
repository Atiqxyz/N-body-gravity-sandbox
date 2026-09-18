const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth; canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    initStars();
});

// UI Sync
const massSlider = document.getElementById('massSlider');
const massNumber = document.getElementById('massNumber');
const statBodies = document.getElementById('statBodies');
const statMass = document.getElementById('statMass');
const statStatus = document.getElementById('statStatus');
let injectType = 'NORMAL'; 

massSlider.addEventListener('input', (e) => massNumber.value = e.target.value);
massNumber.addEventListener('input', (e) => { massSlider.value = Math.max(5, Math.min(75000, e.target.value)); });
massNumber.addEventListener('blur', (e) => { if(!e.target.value) e.target.value = 100; massSlider.value = e.target.value; });

document.getElementById('darkMatterBtn').addEventListener('click', () => { injectType = 'DARK_MATTER'; massNumber.value = 40000; massSlider.value = 40000; });
document.getElementById('spawnBtn').addEventListener('click', (e) => { e.stopPropagation(); injectType = 'NORMAL'; spawnOrbital(); });

// Physics
const G = 1; const SOFTENING = 8; 
let isPaused = false; let supernovaFlash = 0;

let stars = [];
function initStars() {
    stars = [];
    const count = Math.floor((canvas.width * canvas.height) / 2000);
    for (let i = 0; i < count; i++) {
        stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, radius: Math.random() * 1.2, alpha: 0.1 + Math.random() * 0.7 });
    }
}
initStars();

let particles = [];
class Particle {
    constructor(x, y, color, speedMultiplier = 1) {
        this.x = x; this.y = y;
        let angle = Math.random() * Math.PI * 2; let speed = (Math.random() * 4 + 1) * speedMultiplier;
        this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
        this.life = 1.0; this.decay = Math.random() * 0.02 + 0.01;
        this.color = color; this.radius = Math.random() * 2 + 1;
    }
    update() { this.x += this.vx; this.y += this.vy; this.life -= this.decay; }
    draw() {
        ctx.globalAlpha = Math.max(0, this.life); ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
    }
}

function spawnExplosion(x, y, intensity, classColor, speedMultiplier = 1) {
    let count = Math.min(120, Math.floor(intensity / 150));
    for (let i = 0; i < count; i++) particles.push(new Particle(x, y, classColor, speedMultiplier));
}

class Body {
    constructor(x, y, vx, vy, mass, isDarkMatter = false) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.mass = mass; this.trail = []; this.rotation = Math.random() * Math.PI * 2;
        this.rings = []; this.accretionMass = 0; 
        this.isDarkMatter = isDarkMatter;
        this.updateClassification();
    }

    updateClassification() {
        if (this.isDarkMatter) {
            this.radius = 0; this.type = 'DARK_MATTER'; return;
        }
        if (this.mass >= 50000) {
            this.radius = Math.max(4, Math.cbrt(this.mass) * 0.3); this.type = 'BLACK_HOLE';
        } else if (this.mass >= 40000) {
            this.radius = 3.5; this.type = 'NEUTRON_STAR'; this.coreColor = '#ffffff'; this.glowColor = 'rgba(176, 38, 255, 0.6)';
        } else {
            this.radius = Math.max(2, Math.cbrt(this.mass) * 0.85);
            if (this.mass >= 30000) { this.type = 'BLUE_GIANT'; this.coreColor = '#ffffff'; this.glowColor = 'rgba(0, 136, 255, 0.4)'; } 
            else if (this.mass >= 15000) { this.type = 'YELLOW_STAR'; this.coreColor = '#ffffff'; this.glowColor = 'rgba(255, 200, 50, 0.3)'; } 
            else if (this.mass >= 5000) { this.type = 'RED_DWARF'; this.coreColor = '#ffcc00'; this.glowColor = 'rgba(255, 50, 0, 0.4)'; } 
            else if (this.mass >= 3000) { this.type = 'BROWN_DWARF'; this.coreColor = '#ff3333'; this.glowColor = 'rgba(201, 42, 42, 0.2)'; } 
            else if (this.mass >= 1000) { this.type = 'GAS_GIANT'; this.coreColor = '#4a90e2'; this.glowColor = 'rgba(74, 144, 226, 0.2)'; } 
            else { this.type = 'ROCKY'; this.coreColor = '#718096'; this.glowColor = 'rgba(0, 243, 255, 0.15)'; }
        }
    }

    update() {
        if (!isPaused) {
            this.x += this.vx; this.y += this.vy;
            this.rotation += (this.type === 'NEUTRON_STAR' || this.type === 'BLACK_HOLE') ? 0.2 : 0.02; 

            if (this.type === 'BLACK_HOLE') this.mass -= 0.5;

            if (this.x < -this.radius) { this.x = canvas.width + this.radius; this.trail = []; }
            else if (this.x > canvas.width + this.radius) { this.x = -this.radius; this.trail = []; }
            if (this.y < -this.radius) { this.y = canvas.height + this.radius; this.trail = []; }
            else if (this.y > canvas.height + this.radius) { this.y = -this.radius; this.trail = []; }

            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > (this.mass < 1000 ? 150 : 350)) this.trail.shift();
        }
    }

    draw(allBodies) {
        if (this.isDarkMatter) {
            ctx.beginPath(); ctx.arc(this.x, this.y, 20, 0, Math.PI*2);
            let grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 20);
            grad.addColorStop(0, 'rgba(176, 38, 255, 0.1)'); grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad; ctx.fill();
            return;
        }

        if (this.trail.length > 1) {
            ctx.save(); ctx.lineWidth = this.mass < 1000 ? 0.5 : 1;
            ctx.strokeStyle = this.mass < 3000 ? 'rgba(0, 243, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath(); ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) ctx.lineTo(this.trail[i].x, this.trail[i].y); ctx.stroke(); ctx.restore();
        }

        ctx.save();
        if (this.type === 'BLACK_HOLE') {
            if (this.accretionMass > 0) {
                ctx.translate(this.x, this.y); ctx.rotate(this.rotation);
                let diskSize = this.radius * 4 + Math.min(this.accretionMass / 1000, 30);
                ctx.scale(1, 0.4); 
                ctx.globalCompositeOperation = 'lighter';
                let accGrad = ctx.createRadialGradient(0, 0, this.radius, 0, 0, diskSize);
                accGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                accGrad.addColorStop(0.3, 'rgba(255, 100, 0, 0.6)');
                accGrad.addColorStop(1, 'transparent');
                ctx.beginPath(); ctx.arc(0, 0, diskSize, 0, Math.PI*2); ctx.fillStyle = accGrad; ctx.fill();
                ctx.setTransform(1, 0, 0, 1, 0, 0); 
                this.accretionMass *= 0.995; 
            }

            ctx.globalCompositeOperation = 'source-over';
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#000000'; ctx.fill();
            ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.stroke();
            
        } else if (this.mass >= 3000) {
            ctx.globalCompositeOperation = 'lighter';
            let glowGrad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * (this.type === 'NEUTRON_STAR' ? 15 : 5));
            glowGrad.addColorStop(0, this.glowColor); glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 15, 0, Math.PI * 2); ctx.fillStyle = glowGrad; ctx.fill();

            if (this.type === 'NEUTRON_STAR') {
                ctx.translate(this.x, this.y); ctx.rotate(this.rotation);
                let drawBeam = (dist) => {
                    let beam = ctx.createLinearGradient(0, 0, dist, 0);
                    beam.addColorStop(0, 'rgba(255, 255, 255, 0.9)'); beam.addColorStop(1, 'transparent');
                    ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(this.radius, 2); ctx.lineTo(dist, 15); ctx.lineTo(dist, -15); ctx.lineTo(this.radius, -2); ctx.fill();
                }
                drawBeam(150); drawBeam(-150);
                ctx.rotate(-this.rotation); ctx.translate(-this.x, -this.y);
            }
            ctx.globalCompositeOperation = 'source-over';
            let coreGrad = ctx.createRadialGradient(this.x - this.radius*0.2, this.y - this.radius*0.2, 0, this.x, this.y, this.radius);
            coreGrad.addColorStop(0, '#ffffff'); coreGrad.addColorStop(0.5, this.coreColor); coreGrad.addColorStop(1, this.type === 'BLUE_GIANT' ? '#0033ff' : '#ff4500');
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fillStyle = coreGrad; ctx.fill();

        } else {
            let dominantStar = allBodies.reduce((prev, curr) => (curr.mass > prev.mass && !curr.isDarkMatter) ? curr : prev, allBodies[0]);
            if (dominantStar && dominantStar.mass >= 5000) {
                let dx = this.x - dominantStar.x, dy = this.y - dominantStar.y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 500) {
                    let tailLen = (500 - dist) * 0.4;
                    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(Math.atan2(dy, dx));
                    let tailGrad = ctx.createLinearGradient(0, 0, tailLen, 0);
                    tailGrad.addColorStop(0, 'rgba(0, 243, 255, 0.4)'); tailGrad.addColorStop(1, 'transparent');
                    ctx.fillStyle = tailGrad; ctx.beginPath(); ctx.moveTo(0, this.radius); ctx.lineTo(tailLen, this.radius * 3); ctx.lineTo(tailLen, -this.radius * 3); ctx.lineTo(0, -this.radius); ctx.fill();
                    ctx.restore();
                }
            }
            ctx.globalCompositeOperation = 'source-over';
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#1a202c'; ctx.fill();
            ctx.strokeStyle = this.coreColor; ctx.lineWidth = 1; ctx.stroke();
        }

        if (this.rings.length > 0) {
            ctx.translate(this.x, this.y); ctx.rotate(this.rotation); ctx.scale(1, 0.3);
            for (let r of this.rings) {
                ctx.beginPath(); ctx.arc(0, 0, r.distance, 0, Math.PI*2);
                ctx.strokeStyle = r.color; ctx.lineWidth = 2; ctx.globalAlpha = 0.5; ctx.stroke();
            }
            ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1.0;
        }

        ctx.restore();
    }
}

let bodies = [];
function initSystem() { bodies = []; particles = []; supernovaFlash = 0; bodies.push(new Body(canvas.width / 2, canvas.height / 2, 0, 0, 10000)); }
initSystem();

function drawSpacetimeGrid() {
    ctx.save(); ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'; ctx.lineWidth = 1;
    let step = 60, res = 30; let massiveBodies = bodies.filter(b => b.mass >= 15000 || b.isDarkMatter);
    for (let y = 0; y <= canvas.height + step; y += step) {
        ctx.beginPath();
        for (let x = 0; x <= canvas.width + res; x += res) {
            let px = x, py = y;
            for (let b of massiveBodies) {
                let dist = Math.max(Math.sqrt((x-b.x)**2 + (y-b.y)**2), b.radius||10);
                if (dist < 600) { let pull = (b.mass / 20000) * (600 - dist) * 0.1; px -= ((x-b.x) / dist) * pull; py -= ((y-b.y) / dist) * pull; }
            }
            if (x === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
    }
    for (let x = 0; x <= canvas.width + step; x += step) {
        ctx.beginPath();
        for (let y = 0; y <= canvas.height + res; y += res) {
            let px = x, py = y;
            for (let b of massiveBodies) {
                let dist = Math.max(Math.sqrt((x-b.x)**2 + (y-b.y)**2), b.radius||10);
                if (dist < 600) { let pull = (b.mass / 20000) * (600 - dist) * 0.1; px -= ((x-b.x) / dist) * pull; py -= ((y-b.y) / dist) * pull; }
            }
            if (y === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
    }
    ctx.restore();
}

document.getElementById('pauseBtn').addEventListener('click', () => {
    isPaused = !isPaused; document.getElementById('pauseBtn').textContent = isPaused ? "▶ PLAY" : "⏸ PAUSE";
    statStatus.textContent = isPaused ? "PAUSED" : "ACTIVE"; statStatus.style.color = isPaused ? "#ffaa00" : "#fff";
});
document.getElementById('resetBtn').addEventListener('click', initSystem);
document.getElementById('binaryBtn').addEventListener('click', () => {
    bodies = []; let m = 25000, dist = 350, cx = canvas.width / 2, cy = canvas.height / 2;
    let v = Math.sqrt((G * m) / dist) * 0.7; 
    bodies.push(new Body(cx - dist/2, cy, 0, v, m)); bodies.push(new Body(cx + dist/2, cy, 0, -v, m));
});

function spawnOrbital() {
    let sun = bodies.reduce((prev, curr) => (curr.mass > prev.mass) ? curr : prev, bodies[0]);
    if (!sun) return;
    let dist = 180 + Math.random() * 260, angle = Math.random() * Math.PI * 2;
    let speed = Math.sqrt((G * sun.mass) / dist);
    bodies.push(new Body(sun.x + Math.cos(angle)*dist, sun.y + Math.sin(angle)*dist, -Math.sin(angle)*speed + (sun.vx||0), Math.cos(angle)*speed + (sun.vy||0), parseFloat(massNumber.value)));
}

let isDragging = false, dragStart = {x:0, y:0}, currentMouse = {x:0, y:0};
function getClientCoords(e) { return e.touches ? {x: e.touches[0].clientX, y: e.touches[0].clientY} : {x: e.clientX, y: e.clientY}; }
window.addEventListener('mousedown', (e) => { if(!e.target.closest('#ui')) { isDragging = true; dragStart = currentMouse = getClientCoords(e); }});
window.addEventListener('mousemove', (e) => { if(isDragging) currentMouse = getClientCoords(e); });
window.addEventListener('mouseup', (e) => {
    if(isDragging) {
        isDragging = false;
        bodies.push(new Body(dragStart.x, dragStart.y, (currentMouse.x - dragStart.x)*0.035, (currentMouse.y - dragStart.y)*0.035, parseFloat(massNumber.value), injectType === 'DARK_MATTER'));
        injectType = 'NORMAL'; 
    }
});

function animate() {
    ctx.fillStyle = '#010103'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawSpacetimeGrid();

    ctx.fillStyle = '#ffffff';
    let blackHoles = bodies.filter(b => b.type === 'BLACK_HOLE');
    for (let star of stars) {
        let drawX = star.x, drawY = star.y;
        for (let bh of blackHoles) {
            let dx = star.x - bh.x, dy = star.y - bh.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < bh.radius * 15 && dist > bh.radius) {
                let shift = (bh.radius * 15 - dist) * 0.3; 
                drawX += (dx/dist) * shift; drawY += (dy/dist) * shift;
            }
        }
        ctx.globalAlpha = star.alpha; ctx.fillRect(drawX, drawY, star.radius, star.radius);
    }
    ctx.globalAlpha = 1.0;

    if (!isPaused) {
        for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) {
                let dx = bodies[j].x - bodies[i].x, dy = bodies[j].y - bodies[i].y;
                if (Math.abs(dx) > canvas.width / 2) dx -= Math.sign(dx) * canvas.width;
                if (Math.abs(dy) > canvas.height / 2) dy -= Math.sign(dy) * canvas.height;
                let distSq = dx * dx + dy * dy + SOFTENING * SOFTENING; let dist = Math.sqrt(distSq);
                let force = (G * bodies[i].mass * bodies[j].mass) / distSq;
                bodies[i].vx += (force * (dx / dist)) / bodies[i].mass; bodies[i].vy += (force * (dy / dist)) / bodies[i].mass;
                bodies[j].vx -= (force * (dx / dist)) / bodies[j].mass; bodies[j].vy -= (force * (dy / dist)) / bodies[j].mass;
            }
        }

        let removeIndices = new Set();
        for (let i = 0; i < bodies.length; i++) {
            if (removeIndices.has(i)) continue;
            for (let j = i + 1; j < bodies.length; j++) {
                if (removeIndices.has(j)) continue;
                let b1 = bodies[i], b2 = bodies[j];
                let dx = b2.x - b1.x, dy = b2.y - b1.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                let heavier = b1.mass >= b2.mass ? b1 : b2; let lighter = b1.mass >= b2.mass ? b2 : b1;
                let lighterIdx = b1.mass >= b2.mass ? j : i;

                if (b1.isDarkMatter || b2.isDarkMatter) continue; 

                if (dist < heavier.radius * 3.5 && lighter.mass < 1500 && heavier.mass > 3000) {
                    if (heavier.type === 'BLACK_HOLE') { heavier.accretionMass += lighter.mass * 2; } 
                    else { heavier.rings.push({ distance: heavier.radius * 1.5 + Math.random() * heavier.radius, color: lighter.coreColor }); }
                    spawnExplosion(lighter.x, lighter.y, lighter.mass * 2, lighter.coreColor);
                    heavier.mass += lighter.mass * 0.5; heavier.updateClassification();
                    removeIndices.add(lighterIdx); continue;
                }

                if (dist < b1.radius + b2.radius) {
                    let preMass = heavier.mass, totalMass = heavier.mass + lighter.mass;
                    heavier.vx = (heavier.vx * heavier.mass + lighter.vx * lighter.mass) / totalMass; heavier.vy = (heavier.vy * heavier.mass + lighter.vy * lighter.mass) / totalMass;
                    heavier.x = (heavier.x * heavier.mass + (heavier.x + dx) * lighter.mass) / totalMass; heavier.y = (heavier.y * heavier.mass + (heavier.y + dy) * lighter.mass) / totalMass;
                    heavier.mass = totalMass; heavier.updateClassification();
                    
                    if (preMass < 50000 && heavier.mass >= 50000) {
                        supernovaFlash = 1.0; spawnExplosion(heavier.x, heavier.y, 80000, '#ffffff', 5);
                    } else { spawnExplosion(heavier.x, heavier.y, lighter.mass, '#ffffff'); }
                    if (heavier.type === 'BLACK_HOLE') heavier.accretionMass += lighter.mass;
                    removeIndices.add(lighterIdx);
                }
            }
        }
        if (removeIndices.size > 0) bodies = bodies.filter((_, idx) => !removeIndices.has(idx));
        for (let i = particles.length - 1; i >= 0; i--) { particles[i].update(); if (particles[i].life <= 0) particles.splice(i, 1); }
        ctx.globalAlpha = 1.0;
    }

    statBodies.textContent = bodies.length;
    statMass.textContent = Math.round(bodies.reduce((acc, b) => acc + b.mass, 0)).toLocaleString();

    for (let p of particles) p.draw();
    for (let body of bodies) { body.update(); body.draw(bodies); }

    // Trajectory Aiming Line & Orbit Check
    if (isDragging) {
        let nearestSun = bodies.reduce((prev, curr) => {
            let dPrev = Math.hypot(dragStart.x - prev.x, dragStart.y - prev.y);
            let dCurr = Math.hypot(dragStart.x - curr.x, dragStart.y - curr.y);
            return dCurr < dPrev ? curr : prev;
        }, bodies[0]);

        let isOrbiting = false;
        if (nearestSun && !nearestSun.isDarkMatter) {
            let distToSun = Math.hypot(dragStart.x - nearestSun.x, dragStart.y - nearestSun.y);
            let targetSpeed = Math.sqrt((G * nearestSun.mass) / Math.max(distToSun, 10));
            let launchVx = (currentMouse.x - dragStart.x) * 0.035;
            let launchVy = (currentMouse.y - dragStart.y) * 0.035;
            let launchSpeed = Math.hypot(launchVx, launchVy);
            
            // Turns green if velocity is close to ideal stable circular orbital velocity range
            if (launchSpeed >= targetSpeed * 0.6 && launchSpeed <= targetSpeed * 1.5) {
                isOrbiting = true;
            }
        }

        let lineColor = injectType === 'DARK_MATTER' ? '#b026ff' : (isOrbiting ? '#00ff66' : '#00f3ff');

        ctx.save(); 
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 1.5; 
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); 
        ctx.moveTo(dragStart.x, dragStart.y); 
        ctx.lineTo(currentMouse.x, currentMouse.y); 
        ctx.stroke();

        let previewRadius = injectType === 'DARK_MATTER' ? 20 : (parseFloat(massNumber.value) >= 50000 ? Math.max(4, Math.cbrt(parseFloat(massNumber.value)) * 0.3) : Math.max(2, Math.cbrt(parseFloat(massNumber.value)) * 0.85));
        ctx.beginPath(); 
        ctx.arc(dragStart.x, dragStart.y, previewRadius, 0, Math.PI * 2);
        ctx.fillStyle = injectType === 'DARK_MATTER' ? 'rgba(176, 38, 255, 0.2)' : (isOrbiting ? 'rgba(0, 255, 102, 0.3)' : 'rgba(0, 243, 255, 0.4)'); 
        ctx.fill(); 
        ctx.stroke();
        ctx.restore();
    }

    if (supernovaFlash > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${supernovaFlash})`; ctx.fillRect(0, 0, canvas.width, canvas.height);
        supernovaFlash -= 0.02;
    }

    requestAnimationFrame(animate);
}
animate();
