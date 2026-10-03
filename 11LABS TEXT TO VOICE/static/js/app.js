/**
 * ElevenLabs Voice Studio - Application Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements - Header & API Key
  const apiStatusBadge = document.getElementById('apiStatusBadge');
  const apiStatusText = document.getElementById('apiStatusText');
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const apiModal = document.getElementById('apiModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const toggleKeyVisibilityBtn = document.getElementById('toggleKeyVisibilityBtn');
  const toggleKeyIcon = document.getElementById('toggleKeyIcon');
  const testApiKeyBtn = document.getElementById('testApiKeyBtn');
  const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
  const apiTestMessage = document.getElementById('apiTestMessage');
  const quotaContainer = document.getElementById('quotaContainer');
  const quotaText = document.getElementById('quotaText');
  const quotaFill = document.getElementById('quotaFill');
  const tierBadge = document.getElementById('tierBadge');

  // Elements - Controls
  const modelSelect = document.getElementById('modelSelect');
  const modelDescription = document.getElementById('modelDescription');
  const voiceSelect = document.getElementById('voiceSelect');
  const voiceDescription = document.getElementById('voiceDescription');
  const previewVoiceBtn = document.getElementById('previewVoiceBtn');
  const stabilitySlider = document.getElementById('stabilitySlider');
  const stabilityVal = document.getElementById('stabilityVal');
  const similaritySlider = document.getElementById('similaritySlider');
  const similarityVal = document.getElementById('similarityVal');
  const styleSlider = document.getElementById('styleSlider');
  const styleVal = document.getElementById('styleVal');

  // Elements - Text Editor
  const textInput = document.getElementById('textInput');
  const charCount = document.getElementById('charCount');
  const wordCount = document.getElementById('wordCount');
  const estDuration = document.getElementById('estDuration');
  const pasteBtn = document.getElementById('pasteBtn');
  const clearBtn = document.getElementById('clearBtn');
  const presetsBtn = document.getElementById('presetsBtn');
  const presetsMenu = document.getElementById('presetsMenu');

  // Elements - Primary Generation Action
  const generatePlayBtn = document.getElementById('generatePlayBtn');
  const playBtnIcon = document.getElementById('playBtnIcon');
  const playBtnText = document.getElementById('playBtnText');
  const playSpinner = document.getElementById('playSpinner');

  // Elements - Player & Visualizer
  const audioPlayerSection = document.getElementById('audioPlayerSection');
  const nativeAudio = document.getElementById('nativeAudio');
  const playerModelBadge = document.getElementById('playerModelBadge');
  const playerVoiceBadge = document.getElementById('playerVoiceBadge');
  const downloadAudioBtn = document.getElementById('downloadAudioBtn');
  const progressWrapper = document.getElementById('progressWrapper');
  const progressBar = document.getElementById('progressBar');
  const progressHandle = document.getElementById('progressHandle');
  const currentTimeEl = document.getElementById('currentTime');
  const totalDurationEl = document.getElementById('totalDuration');
  const playerPlayPauseBtn = document.getElementById('playerPlayPauseBtn');
  const playerPlayPauseIcon = document.getElementById('playerPlayPauseIcon');
  const playerReplayBtn = document.getElementById('playerReplayBtn');
  const playbackSpeed = document.getElementById('playbackSpeed');
  const muteBtn = document.getElementById('muteBtn');
  const volumeIcon = document.getElementById('volumeIcon');
  const volumeSlider = document.getElementById('volumeSlider');

  // Elements - History
  const historyList = document.getElementById('historyList');
  const historyCount = document.getElementById('historyCount');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const toastContainer = document.getElementById('toastContainer');

  // State
  let currentAudioBlob = null;
  let currentAudioUrl = null;
  let voicePreviews = {};
  let previewAudioObj = null;
  let isGenerating = false;
  let generationHistory = [];

  // Initialize Canvas Visualizer
  const visualizer = new AudioVisualizer('visualizerCanvas', nativeAudio);

  // Sample Presets
  const PRESET_SCRIPTS = {
    story: "Deep within the silent redwood forest, an ancient tree began to hum with a subtle luminescence. Elena knelt, touching the moss-covered roots as the whisper of an old civilization echoed through the canopy.",
    tech: "Today, we're introducing the next frontier in artificial intelligence. A seamless, expressive speech engine that understands context, pauses naturally, and delivers cinema-grade vocal realism across every language.",
    meditation: "Take a deep breath in through your nose... and slowly release all tension through your mouth. Allow your shoulders to drop, and feel the calm stillness settle over your mind.",
    multilingual: "ElevenLabs brings stories to life. En français, chaque mot résonne avec élégance. Y en español, la voz transmite calidez y emoción pura. Experience voice without boundaries."
  };

  // ----------------------------------------------------
  // Local Storage & API Key Handling
  // ----------------------------------------------------
  function getSavedApiKey() {
    return localStorage.getItem('elevenlabs_api_key') || '';
  }

  function saveApiKey(key) {
    if (key) {
      localStorage.setItem('elevenlabs_api_key', key.trim());
    } else {
      localStorage.removeItem('elevenlabs_api_key');
    }
  }

  function getApiHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const key = getSavedApiKey();
    if (key) {
      headers['x-elevenlabs-key'] = key;
    }
    return headers;
  }

  async function checkApiStatus() {
    try {
      const resp = await fetch('/api/status', {
        headers: getApiHeaders()
      });
      const data = await resp.json();

      if (data.configured) {
        apiStatusBadge.className = 'status-badge connected';
        apiStatusText.textContent = 'API Connected';
        if (data.character_limit) {
          const used = data.character_count || 0;
          const limit = data.character_limit;
          const pct = Math.min(100, Math.round((used / limit) * 100));
          quotaContainer.classList.remove('hidden');
          quotaText.textContent = `${used.toLocaleString()} / ${limit.toLocaleString()} chars (${pct}%)`;
          quotaFill.style.width = `${pct}%`;
          tierBadge.textContent = `${(data.tier || 'Active').toUpperCase()} TIER`;
        }
      } else {
        apiStatusBadge.className = 'status-badge missing';
        apiStatusText.textContent = 'API Key Required';
        quotaContainer.classList.add('hidden');
      }
    } catch (err) {
      apiStatusBadge.className = 'status-badge missing';
      apiStatusText.textContent = 'Server Offline';
    }
  }

  // ----------------------------------------------------
  // Load Models and Voices from API
  // ----------------------------------------------------
  async function loadModels() {
    try {
      const resp = await fetch('/api/models', { headers: getApiHeaders() });
      if (resp.ok) {
        const models = await resp.json();
        if (models && models.length > 0) {
          modelSelect.innerHTML = '';
          models.forEach((m, idx) => {
            const opt = document.createElement('option');
            opt.value = m.model_id;
            opt.textContent = m.name;
            opt.dataset.desc = m.description || '';
            if (m.model_id === 'eleven_multilingual_v2' || idx === 0) {
              opt.selected = true;
            }
            modelSelect.appendChild(opt);
          });
          updateModelDescription();
        }
      }
    } catch (e) {
      console.warn('Could not refresh models dynamically:', e);
    }
  }

  async function loadVoices() {
    try {
      const resp = await fetch('/api/voices', { headers: getApiHeaders() });
      if (resp.ok) {
        const voices = await resp.json();
        if (voices && voices.length > 0) {
          voiceSelect.innerHTML = '';
          voicePreviews = {};
          voices.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.voice_id;
            const desc = v.labels?.description || v.labels?.accent || v.category || '';
            opt.textContent = `${v.name} ${desc ? `(${desc})` : ''}`;
            opt.dataset.name = v.name;
            opt.dataset.desc = desc;
            if (v.preview_url) {
              voicePreviews[v.voice_id] = v.preview_url;
            }
            if (v.name === 'Adam') {
              opt.selected = true;
            }
            voiceSelect.appendChild(opt);
          });
          updateVoiceDescription();
        }
      }
    } catch (e) {
      console.warn('Could not refresh voices dynamically:', e);
    }
  }

  function updateModelDescription() {
    const selected = modelSelect.options[modelSelect.selectedIndex];
    const desc = selected?.dataset?.desc || 'High-fidelity AI speech synthesis model.';
    modelDescription.innerHTML = `<i class="fa-solid fa-circle-info"></i> <span>${desc}</span>`;
  }

  function updateVoiceDescription() {
    const selected = voiceSelect.options[voiceSelect.selectedIndex];
    const desc = selected?.dataset?.desc || 'Natural vocal tone';
    const name = selected?.dataset?.name || 'Speaker';
    voiceDescription.innerHTML = `<i class="fa-solid fa-tag"></i> <span>${name} &bull; ${desc}</span>`;
  }

  // ----------------------------------------------------
  // Text Editor & Counter Helpers
  // ----------------------------------------------------
  function updateTextStats() {
    const text = textInput.value;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    
    // Average speech rate is ~150 words per minute (~2.5 words per sec)
    const seconds = Math.ceil(words / 2.5);

    charCount.textContent = chars.toLocaleString();
    wordCount.textContent = words.toLocaleString();
    estDuration.textContent = seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }

  // Preset selector
  presetsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    presetsMenu.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    presetsMenu.classList.add('hidden');
  });

  presetsMenu.querySelectorAll('.preset-item').forEach(item => {
    item.addEventListener('click', () => {
      const presetKey = item.dataset.preset;
      if (PRESET_SCRIPTS[presetKey]) {
        textInput.value = PRESET_SCRIPTS[presetKey];
        updateTextStats();
        showToast('Sample script loaded!', 'info');
      }
      presetsMenu.classList.add('hidden');
    });
  });

  // Paste from clipboard
  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        textInput.value = text;
        updateTextStats();
        showToast('Pasted from clipboard!', 'success');
      }
    } catch (err) {
      showToast('Could not access clipboard. Please paste manually.', 'error');
    }
  });

  // Clear text
  clearBtn.addEventListener('click', () => {
    textInput.value = '';
    updateTextStats();
  });

  textInput.addEventListener('input', updateTextStats);

  // Sliders
  stabilitySlider.addEventListener('input', () => {
    stabilityVal.textContent = parseFloat(stabilitySlider.value).toFixed(2);
  });
  similaritySlider.addEventListener('input', () => {
    similarityVal.textContent = parseFloat(similaritySlider.value).toFixed(2);
  });
  styleSlider.addEventListener('input', () => {
    styleVal.textContent = parseFloat(styleSlider.value).toFixed(2);
  });

  modelSelect.addEventListener('change', updateModelDescription);
  voiceSelect.addEventListener('change', updateVoiceDescription);

  // Voice Preview Button
  previewVoiceBtn.addEventListener('click', () => {
    const voiceId = voiceSelect.value;
    const previewUrl = voicePreviews[voiceId];
    if (!previewUrl) {
      showToast('No preview audio available for this voice.', 'info');
      return;
    }

    if (previewAudioObj) {
      previewAudioObj.pause();
      previewAudioObj = null;
      previewVoiceBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
      return;
    }

    previewAudioObj = new Audio(previewUrl);
    previewVoiceBtn.innerHTML = '<i class="fa-solid fa-circle-pause"></i>';
    previewAudioObj.play();

    previewAudioObj.onended = () => {
      previewAudioObj = null;
      previewVoiceBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
    };
  });

  // ----------------------------------------------------
  // Primary Action: Synthesize & Play Narration
  // ----------------------------------------------------
  generatePlayBtn.addEventListener('click', async () => {
    const text = textInput.value.trim();
    if (!text) {
      showToast('Please type or paste some text content to narrate.', 'error');
      textInput.focus();
      return;
    }

    if (isGenerating) return;

    // Check API Key
    const apiKey = getSavedApiKey();
    // If not set in client localStorage, we will still test server-side proxy
    setGeneratingState(true);

    const voiceId = voiceSelect.value;
    const voiceName = voiceSelect.options[voiceSelect.selectedIndex]?.dataset?.name || 'Rachel';
    const modelId = modelSelect.value;
    const modelName = modelSelect.options[modelSelect.selectedIndex]?.text || modelId;

    const payload = {
      text: text,
      voice_id: voiceId,
      model_id: modelId,
      voice_settings: {
        stability: parseFloat(stabilitySlider.value),
        similarity_boost: parseFloat(similaritySlider.value),
        style: parseFloat(styleSlider.value),
        use_speaker_boost: true
      }
    };

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorMsg = 'Failed to generate audio.';
        try {
          const errData = await response.json();
          errorMsg = errData.error || errorMsg;
        } catch (_) {
          errorMsg = await response.text();
        }

        if (response.status === 401) {
          showToast('API Key missing or invalid. Please check your API key.', 'error');
          openSettingsModal();
        } else if (response.status === 402) {
          showToast('This voice is restricted to ElevenLabs paid plans. Please switch to a standard voice (e.g. Adam, Antoni, Arnold, Daniel, George).', 'error');
        } else {
          showToast(errorMsg, 'error');
        }
        setGeneratingState(false);
        return;
      }

      // Convert audio stream response to Blob
      const audioBlob = await response.blob();
      currentAudioBlob = audioBlob;

      if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl);
      }
      currentAudioUrl = URL.createObjectURL(audioBlob);

      // Setup audio player
      nativeAudio.src = currentAudioUrl;
      nativeAudio.playbackRate = parseFloat(playbackSpeed.value);

      playerModelBadge.textContent = modelName.split('(')[0].trim();
      playerVoiceBadge.textContent = voiceName;
      audioPlayerSection.classList.remove('hidden');

      // Scroll smoothly to player
      audioPlayerSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      // Start playing
      await nativeAudio.play();
      visualizer.start();
      updatePlayerPlayIcon(true);
      showToast('Narration generated successfully!', 'success');

      // Add to generation history
      addToHistory({
        id: Date.now(),
        text: text,
        voiceName: voiceName,
        modelName: modelName.split('(')[0].trim(),
        audioBlob: audioBlob,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      // Refresh API usage stats
      checkApiStatus();

    } catch (err) {
      console.error(err);
      showToast('Network error while synthesizing speech: ' + err.message, 'error');
    } finally {
      setGeneratingState(false);
    }
  });

  function setGeneratingState(generating) {
    isGenerating = generating;
    if (generating) {
      generatePlayBtn.disabled = true;
      playSpinner.classList.remove('hidden');
      playBtnIcon.classList.add('hidden');
      playBtnText.textContent = 'Synthesizing with ElevenLabs...';
    } else {
      generatePlayBtn.disabled = false;
      playSpinner.classList.add('hidden');
      playBtnIcon.classList.remove('hidden');
      playBtnText.textContent = 'Synthesize & Play Narration';
    }
  }

  // ----------------------------------------------------
  // Audio Player Controls & Timeline
  // ----------------------------------------------------
  function updatePlayerPlayIcon(playing) {
    playerPlayPauseIcon.className = playing ? 'fa-solid fa-pause' : 'fa-solid fa-play';
  }

  playerPlayPauseBtn.addEventListener('click', () => {
    if (!nativeAudio.src) return;
    if (nativeAudio.paused) {
      nativeAudio.play();
      visualizer.start();
      updatePlayerPlayIcon(true);
    } else {
      nativeAudio.pause();
      visualizer.stop();
      updatePlayerPlayIcon(false);
    }
  });

  playerReplayBtn.addEventListener('click', () => {
    if (!nativeAudio.src) return;
    nativeAudio.currentTime = 0;
    nativeAudio.play();
    visualizer.start();
    updatePlayerPlayIcon(true);
  });

  nativeAudio.addEventListener('timeupdate', () => {
    if (!nativeAudio.duration) return;
    const current = nativeAudio.currentTime;
    const duration = nativeAudio.duration;
    const pct = (current / duration) * 100;

    progressBar.style.width = `${pct}%`;
    progressHandle.style.left = `${pct}%`;
    currentTimeEl.textContent = formatTime(current);
  });

  nativeAudio.addEventListener('loadedmetadata', () => {
    totalDurationEl.textContent = formatTime(nativeAudio.duration);
  });

  nativeAudio.addEventListener('ended', () => {
    updatePlayerPlayIcon(false);
    visualizer.stop();
    progressBar.style.width = '100%';
  });

  // Timeline Scrubbing
  progressWrapper.addEventListener('click', (e) => {
    if (!nativeAudio.duration) return;
    const rect = progressWrapper.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    nativeAudio.currentTime = Math.max(0, Math.min(nativeAudio.duration, pos * nativeAudio.duration));
  });

  // Playback Speed
  playbackSpeed.addEventListener('change', () => {
    nativeAudio.playbackRate = parseFloat(playbackSpeed.value);
  });

  // Volume & Mute
  volumeSlider.addEventListener('input', () => {
    nativeAudio.volume = parseFloat(volumeSlider.value);
    nativeAudio.muted = false;
    updateVolumeIcon(nativeAudio.volume);
  });

  muteBtn.addEventListener('click', () => {
    nativeAudio.muted = !nativeAudio.muted;
    if (nativeAudio.muted) {
      volumeIcon.className = 'fa-solid fa-volume-xmark';
    } else {
      updateVolumeIcon(nativeAudio.volume);
    }
  });

  function updateVolumeIcon(vol) {
    if (vol === 0) {
      volumeIcon.className = 'fa-solid fa-volume-off';
    } else if (vol < 0.5) {
      volumeIcon.className = 'fa-solid fa-volume-low';
    } else {
      volumeIcon.className = 'fa-solid fa-volume-high';
    }
  }

  // Download Generated MP3
  downloadAudioBtn.addEventListener('click', () => {
    if (!currentAudioBlob) return;
    const voiceName = playerVoiceBadge.textContent.trim() || 'Narration';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `ElevenLabs_${voiceName}_${timestamp}.mp3`;

    const a = document.createElement('a');
    a.href = currentAudioUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Downloaded ${filename}`, 'success');
  });

  function formatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // ----------------------------------------------------
  // Generation History
  // ----------------------------------------------------
  function addToHistory(item) {
    generationHistory.unshift(item);
    if (generationHistory.length > 10) generationHistory.pop();
    renderHistory();
  }

  function renderHistory() {
    historyCount.textContent = generationHistory.length;
    if (generationHistory.length === 0) {
      historyList.innerHTML = `
        <div class="history-empty">
          <i class="fa-solid fa-microphone-lines"></i>
          <p>Your generated speech clips will appear here for instant replay and download.</p>
        </div>
      `;
      return;
    }

    historyList.innerHTML = '';
    generationHistory.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'history-card';
      card.innerHTML = `
        <div class="history-card-content">
          <div class="history-card-text">"${escapeHtml(item.text)}"</div>
          <div class="history-card-meta">
            <span><i class="fa-solid fa-user"></i> ${item.voiceName}</span>
            <span><i class="fa-solid fa-microchip"></i> ${item.modelName}</span>
            <span><i class="fa-regular fa-clock"></i> ${item.timestamp}</span>
          </div>
        </div>
        <div class="history-card-actions">
          <button class="btn btn-circle btn-sm history-play-btn" title="Play clip" data-index="${index}">
            <i class="fa-solid fa-play"></i>
          </button>
          <button class="btn btn-icon btn-sm history-dl-btn" title="Download" data-index="${index}">
            <i class="fa-solid fa-download"></i>
          </button>
        </div>
      `;
      historyList.appendChild(card);
    });

    // Attach listeners
    historyList.querySelectorAll('.history-play-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        const item = generationHistory[idx];
        if (item) {
          if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl);
          currentAudioUrl = URL.createObjectURL(item.audioBlob);
          currentAudioBlob = item.audioBlob;
          nativeAudio.src = currentAudioUrl;
          playerModelBadge.textContent = item.modelName;
          playerVoiceBadge.textContent = item.voiceName;
          audioPlayerSection.classList.remove('hidden');
          nativeAudio.play();
          visualizer.start();
          updatePlayerPlayIcon(true);
        }
      });
    });

    historyList.querySelectorAll('.history-dl-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        const item = generationHistory[idx];
        if (item) {
          const url = URL.createObjectURL(item.audioBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `ElevenLabs_${item.voiceName}_${Date.now()}.mp3`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    });
  }

  clearHistoryBtn.addEventListener('click', () => {
    generationHistory = [];
    renderHistory();
    showToast('History cleared', 'info');
  });

  // ----------------------------------------------------
  // API Key Settings Modal
  // ----------------------------------------------------
  function openSettingsModal() {
    apiKeyInput.value = getSavedApiKey();
    apiTestMessage.className = 'alert hidden';
    apiModal.classList.remove('hidden');
  }

  function closeSettingsModal() {
    apiModal.classList.add('hidden');
  }

  openSettingsBtn.addEventListener('click', openSettingsModal);
  closeModalBtn.addEventListener('click', closeSettingsModal);
  apiModal.addEventListener('click', (e) => {
    if (e.target === apiModal) closeSettingsModal();
  });

  toggleKeyVisibilityBtn.addEventListener('click', () => {
    const isPass = apiKeyInput.type === 'password';
    apiKeyInput.type = isPass ? 'text' : 'password';
    toggleKeyIcon.className = isPass ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
  });

  saveApiKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    saveApiKey(key);
    showToast('API Key saved locally!', 'success');
    closeSettingsModal();
    checkApiStatus();
    loadModels();
    loadVoices();
  });

  testApiKeyBtn.addEventListener('click', async () => {
    const testKey = apiKeyInput.value.trim();
    apiTestMessage.className = 'alert';
    apiTestMessage.textContent = 'Verifying key with ElevenLabs...';
    apiTestMessage.classList.remove('hidden');

    try {
      const resp = await fetch('/api/status', {
        headers: {
          'Content-Type': 'application/json',
          'x-elevenlabs-key': testKey
        }
      });
      const data = await resp.json();

      if (data.configured) {
        apiTestMessage.className = 'alert success';
        apiTestMessage.textContent = `✓ Key is valid! Tier: ${data.tier || 'Active'}. Quota: ${(data.character_count || 0).toLocaleString()} / ${(data.character_limit || 10000).toLocaleString()} characters.`;
        saveApiKey(testKey);
        checkApiStatus();
        loadModels();
        loadVoices();
      } else {
        apiTestMessage.className = 'alert error';
        apiTestMessage.textContent = `✗ ${data.message || 'Invalid API Key'}`;
      }
    } catch (err) {
      apiTestMessage.className = 'alert error';
      apiTestMessage.textContent = `Connection error: ${err.message}`;
    }
  });

  // ----------------------------------------------------
  // Toast Notifications
  // ----------------------------------------------------
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ----------------------------------------------------
  // Initial Boot
  // ----------------------------------------------------
  updateTextStats();
  checkApiStatus();
  loadModels();
  loadVoices();
});
