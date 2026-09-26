let socket;
let myId;
let myNickname = "Guest";
let currentHp = 100;
let kills = 0;
const remotePlayers = {};
const localBullets = [];

// Сетевые селекторы меню
const googleLoginBtn = document.getElementById('googleLoginBtn');
const connectBtn = document.getElementById('connectBtn');
const authStatus = document.getElementById('auth-status');
const userInfo = document.getElementById('user-info');
const usernameDisplay = document.getElementById('username-display');

// Логика работы с аккаунтом Google (Firebase)
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider)
            .then((result) => {
                const user = result.user;
                myNickname = user.displayName || "User_" + Math.floor(Math.random()*1000);
                localStorage.setItem('cs1001_nick', myNickname);
                updateAuthUI(true);
            })
            .catch((error) => {
                console.error("Auth Error: ", error);
                authStatus.innerText = "Auth Failed!";
            });
    });
}

// Проверка сохраненного входа при старте
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        myNickname = user.displayName;
        localStorage.setItem('cs1001_nick', myNickname);
        updateAuthUI(true);
    } else {
        updateAuthUI(false);
    }
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

// Инициализация 3D сцены Three.js
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f0f14);
scene.fog = new THREE.FogExp2(0x0f0f14, 0.04);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const light = new THREE.DirectionalLight(0xffffff, 0.8);
light.position.set(20, 40, 20);
scene.add(light);

// Арена (Пол)
const floorGeo = new THREE.PlaneGeometry(120, 120);
const floorMat = new THREE.MeshLambertMaterial({ color: 0x252525 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// --- Функция создания 3D-стен (Майнкрафт-стиль) ---
function createWall(x, z, width, depth, height = 3) {
    const wallGeo = new THREE.BoxGeometry(width, height, depth);
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x555566 }); // Серый бетон
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(x, height / 2, z);
    scene.add(wall);
}

// Постройка препятствий и укрытий на карте
createWall(-10, 0, 2, 15);  // Длинная стена слева
createWall(10, 5, 2, 10);   // Стена справа
createWall(0, -15, 20, 2);  // Заднее укрытие
createWall(0, 15, 12, 2);   // Центральный блок
createWall(-20, -20, 4, 4); // Квадратный блок 1
createWall(20, 20, 4, 4);   // Квадратный block 2

// Защитный забор по периметру карты (чтобы не выпасть во вселенную)
createWall(0, -60, 120, 2, 5); // Север
createWall(0, 60, 120, 2, 5);  // Юг
createWall(-60, 0, 2, 120, 5); // Запад
createWall(60, 0, 2, 120, 5);  // Восток

// Модель оружия игрока
const gunHolder = new THREE.Group();
const gunBarrel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.7), new THREE.MeshLambertMaterial({ color: 0x777777 }));
gunBarrel.position.set(0.2, -0.25, -0.4);
gunHolder.add(gunBarrel);
scene.add(gunHolder);

camera.position.set(Math.random() * 20 - 10, 1.6, Math.random() * 20 - 10);

// Подключение к игровому матчу
if (connectBtn) {
    connectBtn.addEventListener('click', () => {
        const serverUrl = document.getElementById('serverSelect').value;
        const skinColor = parseInt(document.getElementById('weaponSkin').value);
        
        gunBarrel.material.color.setHex(skinColor);

        document.getElementById('menu').style.display = 'none';
        document.getElementById('crosshair').style.display = 'block';
        document.getElementById('hud').style.display = 'block';
        document.getElementById('hud-name').innerText = myNickname;

        document.body.requestPointerLock();
        initNetwork(serverUrl);
    });
}

// Управление камерой (Мышь) и WASD
let yaw = 0, pitch = 0;
let move = { forward: false, backward: false, left: false, right: false };

document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === document.body) {
        yaw -= e.movementX * 0.002;
        pitch -= e.movementY * 0.002;
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

// Клик ЛКМ — СТРЕЛЬБА
window.addEventListener('mousedown', (e) => {
    if (document.pointerLockElement !== document.body || currentHp <= 0) return;
    if (e.button === 0) { // Левая кнопка мыши
        shootWeapon();
    }
});

function shootWeapon() {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const origin = camera.position.clone();

    // Создаем визуальный патрон локально (Желтый)
    createVisualBullet(origin, dir, 0xffff00);

    // Отправляем выстрел на сервер
    if (socket && socket.connected) {
        socket.emit('playerShoot', {
            origin: { x: origin.x, y: origin.y, z: origin.z },
            dir: { x: dir.x, y: dir.y, z: dir.z }
        });
    }
}

function createVisualBullet(origin, dir, colorHex) {
    const geo = new THREE.SphereGeometry(0.08, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(origin);
    scene.add(mesh);
    localBullets.push({ mesh: mesh, dir: dir.clone(), life: 60 });
}

// Сетевая синхронизация Socket.io
function initNetwork(url) {
    socket = io(url);

    socket.on('connect', () => {
        myId = socket.id;
        socket.emit('joinGame', { name: myNickname, x: camera.position.x, z: camera.position.z, ry: camera.rotation.y });
    });

    // Отрисовка трейсеров от других игроков (Красные патроны)
    socket.on('enemyShoot', (data) => {
        if (data.id === myId) return;
        const origin = new THREE.Vector3(data.origin.x, data.origin.y, data.origin.z);
        const dir = new THREE.Vector3(data.dir.x, data.dir.y, data.dir.z);
        createVisualBullet(origin, dir, 0xff0055);
    });

    // Обновление состояния всех игроков с сервера
    socket.on('serverUpdate', (serverPlayers) => {
        for (let id in serverPlayers) {
            if (id === myId) {
                currentHp = serverPlayers[id].hp;
                kills = serverPlayers[id].kills;
                document.getElementById('hud-hp').innerText = currentHp;
                document.getElementById('hud-kills').innerText = kills;

                if (currentHp <= 0) {
                    camera.position.set(Math.random() * 40 - 20, 1.6, Math.random() * 40 - 20);
                    socket.emit('respawn');
                }
                continue;
            }

            const pData = serverPlayers[id];

            if (!remotePlayers[id]) {
                const group = new THREE.Group();
                const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.7, 8), new THREE.MeshLambertMaterial({ color: 0x0066ff }));
                body.position.y = 0.85;
                group.add(body);
                scene.add(group);
                remotePlayers[id] = group;
            }

            remotePlayers[id].position.set(pData.x, 0, pData.z);
            remotePlayers[id].rotation.y = pData.ry;
        }

        for (let id in remotePlayers) {
            if (!serverPlayers[id]) {
                scene.remove(remotePlayers[id]);
                delete remotePlayers[id];
            }
        }
    });
}

const speed = 0.12;
function animate() {
    requestAnimationFrame(animate);

    if (document.pointerLockElement === document.body && currentHp > 0) {
        const front = new THREE.Vector3(); camera.getWorldDirection(front); front.y = 0; front.normalize();
        const side = new THREE.Vector3(-front.z, 0, front.x);

        if (move.forward) camera.position.addScaledVector(front, speed);
        if (move.backward) camera.position.addScaledVector(front, -speed);
        if (move.left) camera.position.addScaledVector(side, -speed);
        if (move.right) camera.position.addScaledVector(side, speed);

        // Ограничение карты
        camera.position.x = Math.max(-58, Math.min(58, camera.position.x));
        camera.position.z = Math.max(-58, Math.min(58, camera.position.z));
    }

    gunHolder.position.copy(camera.position);
    gunHolder.rotation.copy(camera.rotation);

    // Полет патронов
    for (let i = localBullets.length - 1; i >= 0; i--) {
        const b = localBullets[i];
        b.mesh.position.addScaledVector(b.dir, 0.9);
        b.life--;
        if (b.life <= 0) {
