\# CS 1001 — Multiplayer 3D First-Person Shooter



An autonomous 3D multiplayer shooter built with \*\*JavaScript (Three.js + Electron)\*\* and featuring a \*\*Python Launcher\*\*.



\## ✨ Features

\- 🕹️ \*\*Standalone Desktop App:\*\* Runs in a dedicated native window powered by Electron (no web browser needed).

\- 🌍 \*\*Multiplayer Support:\*\* Play online with friends via local servers or dedicated hosting (powered by Socket.io).

\- 🔫 \*\*Weapon Skins Customization:\*\* Choose your style before entering battle (Default Metal, Golden Asimov, Neon Gradient, Quantum Ice).

\- 👤 \*\*Account System:\*\* Integrated Google Auth via Firebase (secure login and nickname synchronization).

\- 🧭 \*\*Advanced 3D Environment:\*\* 360-degree first-person view, weapon position sync, and server-side hit registration.



\## 🕹️ Controls

\- \*\*W, A, S, D\*\* — Move around the map

\- \*\*Mouse Movement\*\* — Look around (360° view)

\- \*\*Left Click\*\* — Shoot weapons (Locks cursor)

\- \*\*Esc\*\* — Release mouse cursor to access settings



\## 🚀 Installation \& Quick Start



\### Prerequisites

Make sure you have \[Node.js](https://nodejs.org) and \[Python](https://python.org) installed on your machine.



\### Setup Instructions

1\. Clone this repository to your local machine:

&#x20;  ```bash

&#x20;  git clone https://github.com

&#x20;  ```

2\. Navigate into the project folder:

&#x20;  ```bash

&#x20;  cd KS1001

&#x20;  ```

3\. Install all required network and engine dependencies:

&#x20;  ```bash

&#x20;  npm install

&#x20;  ```



\### Running the Game

You can launch the game in \*\*two ways\*\*:

\- \*\*Option A (Python Launcher):\*\* Run `launcher.py` to open the game launcher interface and hit "PLAY".

\- \*\*Option B (One-Click Batch File):\*\* Double-click the `Запуск.bat` file directly inside the project folder.



\## 🛠️ Tech Stack

\- \*\*Client/Engine:\*\* JavaScript (Three.js, WebGL)

\- \*\*App Shell:\*\* Electron.js

\- \*\*Networking:\*\* Socket.io (Real-time WebSockets)

\- \*\*Database/Auth:\*\* Firebase Authentication (Google Provider)



