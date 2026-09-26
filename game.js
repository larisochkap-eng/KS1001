let socket;
let myId;
let myNickname = "Player";
let currentHp = 100;
let kills = 0;
const remotePlayers = {};
const localBullets = [];
const gameWalls = []; // Массив хитбоксов для коллизий

// Элементы меню
const googleLoginBtn = document.getElementById('googleLoginBtn');
const connectBtn = document.getElementById('connectBtn');
const authStatus = document.getElementById('auth-status');
const userInfo = document.getElementById('user-info');
const usernameDisplay = document.getElementById('username-display');

// Google Auth логгер (Firebase)
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider).then((result) => {
            myNickname = result.user.displayName || "User_" + Math.floor(Math.random()*1000);
            localStorage.setItem('cs1001_nick', myNickname);
            updateAuthUI(true);
        }).catch(() => { if(authStatus) authStatus.innerText = "Auth Failed!"; });
    });
}

firebase.auth().onAuthStateChanged((user) => {
    if (user) { myNickname = user.displayName; updateAuthUI(true); }
    else { updateAuthUI(false); }
});

function updateAuthUI(isAuth) {
    if (!authStatus || !connectBtn) return;
    if (isAuth) {
        authStatus.innerText = "Status: Authorized via Google ✔";
        authStatus.style.color = "#5c8e32";
        if (usernameDisplay) usernameDisplay.innerText = myNickname;
        if (userInfo) userInfo.style.display = "block";
        if (googleLoginBtn) googleLoginBtn.style.display = "none";
        connectBtn.disabled = false;
    } else {
        authStatus.innerText = "Status: Not Authorized";
        connectBtn.disabled = true;
    }
}

// 1. Инициализация продвинутой 3D графики
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd6af7b); // Песочное небо в стиле Dust 2
scene.fog = new THREE.FogExp2(0xd6af7b, 0.02);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Реалистичный свет
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
sunLight.position.set(30, 50, 20);
scene.add(sunLight);

// Текстурированная песчаная земля (Плент / Длина)
const floorGeo = new THREE.PlaneGeometry(200, 200);
const floorMat = new THREE.MeshLambertMaterial({ color: 0xc2a678 }); 
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// 2. Механика постройки карты а-ля Dust 2 (Укрытия, Ящики, Зигзаг, Коробка)
function buildCSWall(x, z, w, d, h = 4, color = 0xbda47e) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshLambertMaterial({ color: color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, h / 2, z);
    scene.add(mesh);

    // Добавляем хитбокс в физику игры
    gameWalls.push({
        minX: x - w/2, maxX: x + w/2,
        minZ: z - d/2, maxZ: z + d/2
    });
}

// Длина и Зигзаг (Dust 2 А-Плент Стайл)
buildCSWall(-25, 0, 4, 60, 6);   // Огромная стена Длины (Левая сторона)
buildCSWall(25, -20, 4, 40, 6);  // Правая стена Длины
buildCSWall(0, -40, 50, 4, 6);   // Стена Корнера (Поворот на зиг)
buildCSWall(0, 20, 20, 4, 4);    // Центральный парапет
buildCSWall(15, 30, 4, 20, 4);   // Проход на Зиг

// Легендарные Ящики КС (Укрытия на А-Пленте)
buildCSWall(-5, -5, 3, 3, 3, 0x8a6d45);  // Двойной ящик на длине
buildCSWall(-5, -5, 3, 3, 1.5, 0x8a6d45); 
buildCSWall(8, -15, 2.5, 2.5, 2.5, 0x735c3c); // Ящик на просвете
buildCSWall(-12, 10, 3, 3, 3, 0x8a6d45); // Ящик на гусе

// Ограничительные стены вокруг всей карты
buildCSWall(0, -100, 200, 4, 10);
buildCSWall(0, 100, 200, 4, 10);
buildCSWall(-100, 0, 4, 200, 10);
buildCSWall(100, 0, 4, 200, 10);

// 3. Создание реалистичной 3D-модели автомата в руках (Кастомный автомат)
const gunHolder = new THREE.Group();

// Ствол автомата
const barrelGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.6);
const barrelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
const barrel = new THREE.Mesh(barrelGeo, barrelMat);
barrel.rotation.x = Math.PI / 2;
barrel.position.set(0.2, -0.25, -0.6);
gunHolder.add(barrel);

// Ствольная коробка и приклад (Корпус автомата)
const bodyGeo = new THREE.BoxGeometry(0.07, 0.09, 0.4);
const bodyMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
const gunBody = new THREE.Mesh(bodyGeo, bodyMat);
gunBody.position.set(0.2, -0.25, -0.3);
gunHolder.add(gunBody);

// Магазин (Рожок автомата)
const magGeo = new THREE.BoxGeometry(0.04, 0.18, 0.08);
const magMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
const clip = new THREE.Mesh(magGeo, magMat);
clip.position.set(0.2, -0.35, -0.35);
clip.rotation.x = 0.2;
gunHolder.add(clip);

scene.add(gunHolder);

camera.position.set(0, 1.8, 40); // Спавн в конце Длины

// Кнопка В БОЙ
if (connectBtn) {
    connectBtn.addEventListener('click', () => {
        const serverUrl = document.getElementById('serverSelect').value;
        const skinColor = parseInt(document.getElementById('weaponSkin').value);
        barrel.material.color.setHex(skinColor); // Красим ствол в выбранный скин!

        document.getElementById('menu').style.display = 'none';
        document.getElementById('crosshair').style.display = 'block';
        document.getElementById('hud').style.display = 'block';
        document.getElementById('hud-name').innerText = myNickname;

        document.body.requestPointerLock();
        initNetwork(serverUrl);
    });
}

// 4. Управление и обзоры (Pointer Lock)
let yaw = 0, pitch = 0;
let move = { forward: false, backward: false, left: false, right: false };

document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === document.body) {
        yaw -= e.movementX * 0.0025;
        pitch -= e.movementY * 0.0025;
        pitch = Math.max(-Math.PI/2.2, Math.min(Math.PI/2.2, pitch));
        camera.rotation.order = "YXZ";
        camera.rotation.y = yaw; camera.rotation.x = pitch;
    }
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyW') move.forward = true;
    if (e.code === 'KeyS') move.backward = true;
    if (e.code === 'KeyA') move.left = true;
    if (e.code === 'KeyD') move.right = true;
});
window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW') move.forward = false;
    if (e.code === 'KeyS') move.backward = false;
    if (e.code === 'KeyA') move.left = false;
    if (e.code === 'KeyD') move.right = false;
});

// Стрельба (ЛКМ) + Синхронный Неоновый Трейсер
window.addEventListener('mousedown', (e) => {
    if (document.pointerLockElement !== document.body || currentHp <= 0) return;
    if (e.button === 0) shootCSWeapon();
});

function shootCSWeapon() {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);

    // Добавляем легкий разброс патронов (как в КС при спрее)
    dir.x += (Math.random() - 0.5) * 0.015;
    dir.y += (Math.random() - 0.5) * 0.015;

    const origin = camera.position.clone();
    origin.y -= 0.2; // Вылет пули на уровне оружия

    // Локальный трассирующий лазерный патрон
    createVisualBullet(origin, dir, 0x00ffff);

    // Звуковой эффект выстрела с помощью встроенного синтезатора частот
    playShootSound();

    if (socket && socket.connected) {
        socket.emit('playerShoot', {
            origin: { x: origin.x, y: origin.y, z: origin.z },
            dir: { x: dir.x, y: dir.y, z: dir.z }
        });
    }
}

function createVisualBullet(origin, dir, colorHex) {
    const geo = new THREE.CylinderGeometry(0.015, 0.015, 0.6);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });
    const mesh = new THREE.Mesh(geo, mat);
    
    mesh.position.copy(origin);
    mesh.lookAt(origin.clone().add(dir));
    mesh.rotation.x += Math.PI / 2;
    
    scene.add(mesh);
    localBullets.push({ mesh: mesh, dir: dir.clone(), life: 40 });
}

function playShootSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(350, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } catch(e) {}
}

// 5. Сетевой движок Socket.io
function initNetwork(url) {
    socket = io(url);
    socket.on('connect', () => {
        myId = socket.id;
        socket.emit('joinGame', { name: myNickname, x: camera.position.x, z: camera.position.z, ry: camera.rotation.y });
    });

    socket.on('enemyShoot', (data) => {
        if (data.id === myId) return;
        const origin = new THREE.Vector3(data.origin.x, data.origin.y, data.origin.z);
        const dir = new THREE.Vector3(data.dir.x, data.dir.y, data.dir.z);
        createVisualBullet(origin, dir, 0xff3300); // Пули врагов — красные трейсеры
    });

    socket.on('serverUpdate', (serverPlayers) => {
        for (let id in serverPlayers) {
            if (id === myId) {
                currentHp = serverPlayers[id].hp;
                kills = serverPlayers[id].kills;
                document.getElementById('hud-hp').innerText = currentHp;
                document.getElementById('hud-kills').innerText = kills;

                if (currentHp <= 0) {
                    camera.position.set(Math.random() * 20 - 10, 1.8, 40);
                    socket.emit('respawn');
                }
                continue;
            }

