# ElevenLabs Voice Studio 🎙️

A modern, high-fidelity AI Text-to-Speech narration studio powered by the **ElevenLabs API**.

![ElevenLabs Voice Studio](https://img.shields.io/badge/ElevenLabs-API%20Integration-7c3aed?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.14-blue?style=for-the-badge)
![Flask](https://img.shields.io/badge/Flask-Proxy%20Backend-black?style=for-the-badge)

---

## ✨ Features

- **Large Text Input Area**: Paste any length of text script or article. Includes live character & word counting and speech duration estimation.
- **Model Selection Dropdown**: Easily toggle between ElevenLabs models:
  - `eleven_multilingual_v2`: Flagship model for expressive, nuanced speech in 29+ languages.
  - `eleven_flash_v2_5`: Ultra-low latency (~75ms) model.
  - `eleven_turbo_v2_5`: High quality with balanced speed.
  - `eleven_monolingual_v1`: Classic conversational English.
- **Hero Play / Synthesize Button**: Prominent action button right below the text editor that triggers real-time audio synthesis and immediate playback.
- **Curated & Account Voices**: Select from top voices like Rachel, Adam, Josh, Antoni, Bella, Arnold, and Elli, or load your custom cloned voices automatically from your account.
- **Advanced Voice Controls**: Fine-tune Stability, Clarity / Similarity Boost, and Style Exaggeration with intuitive sliders.
- **Interactive Audio Visualizer & Player**:
  - HTML5 Canvas frequency wave visualizer that animates synchronously during speech playback.
  - Scrubbable progress bar and timeline.
  - Speed selector (`0.75x`, `1.0x`, `1.25x`, `1.5x`, `2.0x`).
  - One-click **Download MP3** button.
- **API Key Management**:
  - Save your key in `.env` (`ELEVENLABS_API_KEY=...`)
  - **OR** enter it directly in the UI settings drawer (safely stored locally in your browser).
  - Built-in verification & monthly quota display.
- **History Feed**: Recent generations are logged so you can replay or re-download them without expending additional credits.

---

## 🚀 Quick Start

### 1. Launch with Batch Script (Windows)
Simply double-click `run.bat` in this folder. It will install required dependencies if needed and launch `http://127.0.0.1:5000` directly in your browser.

### 2. Manual Command Line
```powershell
# Install dependencies
python -m pip install -r requirements.txt

# Start the server
python app.py
```
Open **[http://127.0.0.1:5000](http://127.0.0.1:5000)** in your browser.

---

## 🔑 Obtaining your ElevenLabs API Key

1. Sign up or log into [ElevenLabs](https://elevenlabs.io).
2. Go to your Profile Settings -> **API Keys**.
3. Create a key and copy it.
4. Enter it in the **API Key** button in the app header, or add it to a `.env` file:
   ```env
   ELEVENLABS_API_KEY=your_key_here
   ```

---

## 📁 Project Structure

```
11LABS TEXT TO VOICE/
├── app.py                 # Backend Flask proxy server (securely proxies ElevenLabs API & CORS)
├── requirements.txt       # Python dependencies (flask, requests, python-dotenv)
├── run.bat                # Windows 1-click launcher
├── .env.example           # Example environment variables
├── README.md              # Project documentation
├── templates/
│   └── index.html         # Modern web interface layout
└── static/
    ├── css/
    │   └── style.css      # Custom styling, dark mode & glassmorphism
    └── js/
        ├── app.js         # Core application logic & API controller
        └── visualizer.js  # Audio frequency visualizer
```
