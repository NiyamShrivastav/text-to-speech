import os
import requests
from flask import Flask, render_template, request, jsonify, Response, send_from_directory
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(env_path, override=True)

app = Flask(__name__, static_folder='static', template_folder='templates')

ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1"

def get_api_key(req):
    """Retrieve API key from request header or environment variable."""
    # Check client-sent header first (useful if user entered it in UI)
    client_key = req.headers.get("x-elevenlabs-key")
    if client_key and client_key.strip():
        return client_key.strip()
    # Fallback to .env variable
    return os.getenv("ELEVENLABS_API_KEY", "").strip()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/status', methods=['GET'])
def check_status():
    """Check API key validity and fetch user quota or verify models access."""
    api_key = get_api_key(request)
    if not api_key:
        return jsonify({
            "configured": False,
            "message": "No ElevenLabs API key provided. Please configure it in settings or .env file."
        })

    # Try subscription endpoint
    try:
        resp = requests.get(
            f"{ELEVENLABS_BASE_URL}/user/subscription",
            headers={"xi-api-key": api_key},
            timeout=8
        )
        if resp.status_code == 200:
            data = resp.json()
            return jsonify({
                "configured": True,
                "tier": data.get("tier", "free"),
                "character_count": data.get("character_count", 0),
                "character_limit": data.get("character_limit", 10000),
                "status": data.get("status", "active")
            })
    except Exception:
        pass

    # If subscription endpoint failed (e.g. key lacks user_read permission), test models endpoint
    try:
        resp_models = requests.get(
            f"{ELEVENLABS_BASE_URL}/models",
            headers={"xi-api-key": api_key},
            timeout=8
        )
        if resp_models.status_code == 200:
            return jsonify({
                "configured": True,
                "tier": "Active Key",
                "character_count": 0,
                "character_limit": 10000,
                "status": "active",
                "notice": "Connected via Models API"
            })
        elif resp_models.status_code == 401:
            return jsonify({
                "configured": False,
                "invalid": True,
                "message": "Invalid API key. Please check your credentials."
            }), 401
    except Exception as e:
        return jsonify({"configured": False, "error": str(e)})

    return jsonify({"configured": True, "status": "active"})

@app.route('/api/models', methods=['GET'])
def get_models():
    """Fetch available TTS models from ElevenLabs or return curated defaults."""
    api_key = get_api_key(request)
    headers = {}
    if api_key:
        headers["xi-api-key"] = api_key

    try:
        resp = requests.get(f"{ELEVENLABS_BASE_URL}/models", headers=headers, timeout=10)
        if resp.status_code == 200:
            all_models = resp.json()
            tts_models = [
                {
                    "model_id": m.get("model_id"),
                    "name": m.get("name"),
                    "description": m.get("description", ""),
                    "languages": [l.get("name") for l in m.get("languages", []) if isinstance(l, dict)]
                }
                for m in all_models
                if m.get("can_do_text_to_speech", True)
            ]
            if tts_models:
                return jsonify(tts_models)
    except Exception:
        pass

    default_models = [
        {
            "model_id": "eleven_multilingual_v2",
            "name": "Eleven Multilingual v2 (Premium)",
            "description": "Most lifelike & emotionally rich model. Supports 29 languages.",
            "languages": ["English", "Spanish", "French", "German", "Hindi", "Japanese", "and 23 more"]
        },
        {
            "model_id": "eleven_flash_v2_5",
            "name": "Eleven Flash v2.5 (Fastest ~75ms)",
            "description": "Ultra-low latency (~75ms), optimized for real-time speech and chat.",
            "languages": ["English", "Multilingual"]
        },
        {
            "model_id": "eleven_turbo_v2_5",
            "name": "Eleven Turbo v2.5 (Balanced)",
            "description": "High quality with fast latency, ideal for long narrations.",
            "languages": ["English", "Multilingual"]
        },
        {
            "model_id": "eleven_turbo_v2",
            "name": "Eleven Turbo v2 (Standard Turbo)",
            "description": "Proven high-speed voice synthesis model.",
            "languages": ["English", "Multilingual"]
        }
    ]
    return jsonify(default_models)

@app.route('/api/voices', methods=['GET'])
def get_voices():
    """Fetch voices from ElevenLabs or return verified working voices."""
    api_key = get_api_key(request)
    headers = {}
    if api_key:
        headers["xi-api-key"] = api_key
        try:
            resp = requests.get(f"{ELEVENLABS_BASE_URL}/voices", headers=headers, timeout=8)
            if resp.status_code == 200:
                voices_data = resp.json().get("voices", [])
                formatted = [
                    {
                        "voice_id": v.get("voice_id"),
                        "name": v.get("name"),
                        "category": v.get("category", "premade"),
                        "preview_url": v.get("preview_url", ""),
                        "labels": v.get("labels", {})
                    }
                    for v in voices_data
                ]
                if formatted:
                    return jsonify(formatted)
        except Exception:
            pass

    # Guaranteed working voices for all tiers (including Free API tier)
    verified_voices = [
        {"voice_id": "pNInz6obpgDQGcFmaJgB", "name": "Adam", "category": "premade", "labels": {"accent": "American", "description": "Deep, narration"}},
        {"voice_id": "ErXwobaYiN019PkySvjV", "name": "Antoni", "category": "premade", "labels": {"accent": "American", "description": "Well-rounded, warm"}},
        {"voice_id": "VR6AewLTigWG4xSOukaG", "name": "Arnold", "category": "premade", "labels": {"accent": "American", "description": "Crisp, narrational"}},
        {"voice_id": "onwK4e9ZLuTAKqWW03F9", "name": "Daniel", "category": "premade", "labels": {"accent": "British", "description": "Authoritative, news anchor"}},
        {"voice_id": "JBFqnCBsd6RMkjVDRZzb", "name": "George", "category": "premade", "labels": {"accent": "British", "description": "Warm, captivating storyteller"}},
        {"voice_id": "IKne3meq5aSn9XLyUdCD", "name": "Charlie", "category": "premade", "labels": {"accent": "Australian", "description": "Casual, conversational"}},
        {"voice_id": "N2lVS1w4EtoT3dr4eOWO", "name": "Callum", "category": "premade", "labels": {"accent": "American", "description": "Intense, character narration"}},
        {"voice_id": "SOYHLrjzK2X1ezoPC6cr", "name": "Harry", "category": "premade", "labels": {"accent": "American", "description": "Dramatic, anxious energy"}}
    ]
    return jsonify(verified_voices)

@app.route('/api/tts', methods=['POST'])
def text_to_speech():
    """Proxy text-to-speech request to ElevenLabs."""
    api_key = get_api_key(request)
    if not api_key:
        return jsonify({"error": "ElevenLabs API Key is missing. Please enter your API key."}), 401

    data = request.get_json() or {}
    text = data.get("text", "").strip()
    voice_id = data.get("voice_id", "21m00Tcm4TlvDq8ikWAM")  # Rachel default
    model_id = data.get("model_id", "eleven_multilingual_v2")
    voice_settings = data.get("voice_settings", {
        "stability": 0.5,
        "similarity_boost": 0.75,
        "style": 0.0,
        "use_speaker_boost": True
    })

    if not text:
        return jsonify({"error": "Text content cannot be empty."}), 400

    payload = {
        "text": text,
        "model_id": model_id,
        "voice_settings": voice_settings
    }

    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
    }

    url = f"{ELEVENLABS_BASE_URL}/text-to-speech/{voice_id}"

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=60, stream=True)
        if response.status_code == 200:
            return Response(
                response.iter_content(chunk_size=4096),
                content_type="audio/mpeg",
                headers={
                    "Content-Disposition": "inline; filename=speech.mp3",
                    "Cache-Control": "no-cache"
                }
            )
        else:
            try:
                err_json = response.json()
                err_msg = err_json.get("detail", {}).get("message") or err_json.get("message") or response.text
            except Exception:
                err_msg = response.text
            return jsonify({"error": f"ElevenLabs API Error ({response.status_code}): {err_msg}"}), response.status_code

    except requests.exceptions.Timeout:
        return jsonify({"error": "Request to ElevenLabs timed out. Please try again."}), 504
    except Exception as e:
        return jsonify({"error": f"Failed to generate speech: {str(e)}"}), 500

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    print(f"ElevenLabs TTS Studio running on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
