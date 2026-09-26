let socket;
let myId;
const remotePlayers = {};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshLambertMaterial({ color: 0x333333 }));
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const gunHolder = new THREE.Group();
const gunBarrel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.6), new THREE.MeshLambertMaterial({ color: 0x777777 }));
gunBarrel.position.set(0.2, -0.2, -0.5);
gunHolder.add(gunBarrel);
scene.add(gunHolder);

camera.position.set(0, 1.6, 0);

document.getElementById('connectBtn').addEventListener('click', () => {
    const nick = document.getElementById('nickname').value;
    const serverUrl = document.getElementById('serverSelect').value;
    const skinColor = parseInt(document.getElementById('weaponSkin').value);

    gunBarrel.material.color.setHex(skinColor);

    document.getElementById('menu').style.display = 'none';
    document.getElementById('crosshair').style.display = 'block';
    document.getElementById('hud').style.display = 'block';
    document.getElementById('hud-name').innerText = nick;

    document.body.requestPointerLock();
    initNetwork(serverUrl, nick);
});

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

function initNetwork(url, nickname) {
    socket = io(url);

    socket.on('connect', () => {
        myId = socket.id;
        socket.emit('joinGame', { name: nickname, x: camera.position.x, z: camera.position.z, ry: camera.rotation.y });
    });

    socket.on('serverUpdate', (serverPlayers) => {
        document.getElementById('hud-online').innerText = Object.keys(serverPlayers).length;

        for (let id in serverPlayers) {
            if (id === myId) continue;
            const pData = serverPlayers[id];

            if (!remotePlayers[id]) {
                const group = new THREE.Group();
                const body = new THREE.Mesh(new THREE.BoxGeometry(1, 1.6, 0.5), new THREE.MeshLambertMaterial({ color: 0x0000ff }));
                body.position.y = 0.8;
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

const speed = 0.1;
function animate() {
    requestAnimationFrame(animate);

    const front = new THREE.Vector3(); camera.getWorldDirection(front); front.y = 0; front.normalize();
    const side = new THREE.Vector3(-front.z, 0, front.x);

    if (move.forward) camera.position.addScaledVector(front, speed);
    if (move.backward) camera.position.addScaledVector(front, -speed);
    if (move.left) camera.position.addScaledVector(side, -speed);
    if (move.right) camera.position.addScaledVector(side, speed);

    gunHolder.position.copy(camera.position);
    gunHolder.rotation.copy(camera.rotation);

    if (socket && socket.connected) {
        socket.emit('playerMove', { x: camera.position.x, z: camera.position.z, ry: camera.rotation.y });
    }

    renderer.render(scene, camera);
}
animate();
