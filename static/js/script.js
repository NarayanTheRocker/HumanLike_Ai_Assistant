document.addEventListener('DOMContentLoaded', () => {
    // Existing element selections (with corrections for state and voice gender)
    const chatHistory = document.getElementById('chat-history');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const inputModeSelect = document.getElementById('input-mode');
    // CHANGED: Use the ID from the HTML header for the primary voice gender select
    const voiceGenderSelect = document.getElementById('voice-gender-header');
    const statusDiv = document.getElementById('status');
    const audioPlayer = document.getElementById('audio-player');
    const recordButton = document.getElementById('record-button');
    const introSection = document.getElementById('intro-section');
    const startChatButton = document.getElementById('start-chat-button');
    const inputArea = document.querySelector('.input-area');
    const clearChatButton = document.getElementById('clear-chat-button');
    const muteButton = document.getElementById('mute-button');
    // CHANGED: Use the ID from the HTML header for the primary state select
    const stateSelect = document.getElementById('state-select-header');

    let mediaRecorder;
    let audioChunks = [];
    let isMuted = localStorage.getItem('isMuted') === 'true'; // Mute state persistence

    // ****** START: STATE PERSISTENCE LOGIC (Updated for correct ID and default handling) ******

    // 1. Load saved state on page load
    function loadSelectedState() {
        const savedState = localStorage.getItem('selectedUserState');
        if (stateSelect) { // Check the correct element exists first
            const optionExists = Array.from(stateSelect.options).some(option => option.value === savedState);

            if (savedState && optionExists) {
                // If a valid state is saved, select it
                stateSelect.value = savedState;
                console.log(`Loaded saved state: ${savedState}`);
            } else {
                // If no valid state saved, default to the first option in the list
                if (stateSelect.options.length > 0) {
                    stateSelect.value = stateSelect.options[0].value; // Default to first option
                     if (savedState && !optionExists) {
                       console.warn(`Saved state "${savedState}" not found in dropdown options. Defaulting to first option: ${stateSelect.value}`);
                       localStorage.removeItem('selectedUserState'); // Remove invalid state
                    } else {
                       console.log(`No saved state found or initial load. Defaulting to first option: ${stateSelect.value}`);
                    }
                } else {
                    console.warn("State select dropdown has no options to default to.");
                }
            }
            // Trigger sync after loading (in case intro dropdown needs updating)
            const stateSelectIntro = document.getElementById('state-select-intro');
            if(stateSelectIntro && stateSelectIntro.value !== stateSelect.value) {
                stateSelectIntro.value = stateSelect.value;
            }
        }
    }


    // Call this function early after DOM is ready and stateSelect is available
    if (stateSelect) { // Ensure dropdown exists before trying to load/add listener
        loadSelectedState(); // Load saved state or set default

        // 2. Save state when the header dropdown value changes
        stateSelect.addEventListener('change', () => {
            const currentState = stateSelect.value;
            localStorage.setItem('selectedUserState', currentState);
            console.log(`Saved selected state: ${currentState}`);
            // Note: The inline script in HTML handles synchronizing the intro dropdown
        });
    } else {
        // CHANGED: Updated error message to reflect the ID we are looking for
        console.error("State select dropdown ('state-select-header') not found!");
    }

    // 3. Clear saved state is handled in the clearChatButton listener below

    // ****** END: STATE PERSISTENCE LOGIC ******

    // --- Mute State Management ---
    // (No changes needed here)
    function updateMuteButtonVisuals() {
        if (!muteButton) return; // Check if button exists
        if (isMuted) {
            muteButton.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
            muteButton.classList.add('muted');
            muteButton.title = "Unmute Audio";
            if (audioPlayer) audioPlayer.muted = true;
        } else {
            muteButton.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
            muteButton.classList.remove('muted');
            muteButton.title = "Mute Audio";
            if (audioPlayer) audioPlayer.muted = false;
        }
    }
    updateMuteButtonVisuals();
    if (muteButton) {
        muteButton.addEventListener('click', () => {
            isMuted = !isMuted;
            localStorage.setItem('isMuted', isMuted);
            updateMuteButtonVisuals();
            if (isMuted && audioPlayer && !audioPlayer.paused) console.log("Audio muted while playing.");
            else if (!isMuted && audioPlayer && !audioPlayer.paused) console.log("Audio unmuted while playing.");
        });
    }
    // --- End Mute State Management ---

    // Check if intro has been seen
    const introSeen = localStorage.getItem('introSeen');

    // --- Load chat history from localStorage on page load ---
    // (No changes needed here)
    function loadLocalHistory() {
        if (!chatHistory) return;
        const storedHistory = localStorage.getItem('chatHistory');
        chatHistory.innerHTML = '';
        if (storedHistory) {
            try {
                const history = JSON.parse(storedHistory);
                history.forEach(message => {
                    addMessage(message.content, message.sender, false); // Don't re-save history while loading
                });
            } catch (e) {
                console.error("Error parsing local chat history:", e);
                localStorage.removeItem('chatHistory');
            }
        }
    }

    // --- Initial UI Setup ---
    // (No changes needed here, relies on introSeen)
    if (introSection && chatHistory && inputArea) {
        if (introSeen) {
            introSection.style.display = 'none';
            chatHistory.style.display = 'block';
            inputArea.style.display = 'flex'; // Use flex for the new footer layout
            loadLocalHistory();
            // Clear button visibility handled by separate logic/observer
        } else {
            introSection.style.display = 'block';
            chatHistory.style.display = 'none';
            inputArea.style.display = 'none';
            // Clear button visibility handled by separate logic/observer
        }
    }

    // --- Save chat history to localStorage ---
    // (No changes needed here)
    function saveChatHistory() {
        if (!chatHistory) return;
        let messages = Array.from(chatHistory.querySelectorAll('.message')).map(messageDiv => {
             return {
                 content: messageDiv.textContent,
                 sender: messageDiv.classList.contains('user-message') ? 'user' : 'assistant',
                 timestamp: Date.now() // Add timestamp for potential future use (like trimming)
             };
        });
        try {
             const maxLocalMessages = 50; // Limit local history size
             if (messages.length > maxLocalMessages) {
                 messages = messages.slice(messages.length - maxLocalMessages);
             }
             localStorage.setItem('chatHistory', JSON.stringify(messages));
        } catch (error) {
              if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                  console.warn('Local storage quota likely exceeded while saving chat history.');
              } else {
                  console.error('Error saving chat history to local storage:', error);
              }
        }
    }

    // --- Start Chat Button ---
    // (No changes needed here, assuming startChatButton exists)
    if (startChatButton && introSection && chatHistory && inputArea && statusDiv && sendButton && recordButton && userInput && clearChatButton) {
        startChatButton.addEventListener('click', () => {
            introSection.style.display = 'none';
            chatHistory.style.display = 'block';
            inputArea.style.display = 'flex'; // Ensure footer is flex
            localStorage.setItem('introSeen', 'true');
            addMessage("Hey there! What's up?", 'assistant', false);
            statusDiv.textContent = 'Ready';
            sendButton.disabled = false;
            recordButton.disabled = false;
            userInput.disabled = false;
            setTimeout(() => {
                const clearChatGroup = clearChatButton?.closest('.control-group');
                if (clearChatGroup) clearChatGroup.style.display = 'none';
            }, 50);
        });
    }

    // --- Add Message to UI ---
    // (No changes needed here)
    function addMessage(text, sender, save = true) {
        if (!chatHistory) {
             console.error('Error: chatHistory element not found!');
             return;
        }
        console.log(`Adding message: "${text}" from ${sender}`);
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'assistant-message');
        messageDiv.textContent = text;

        chatHistory.appendChild(messageDiv);
        chatHistory.scrollTo({ top: chatHistory.scrollHeight, behavior: 'smooth' });

        if (save) {
            saveChatHistory(); // Save history AFTER adding message
        }
    }

    // --- UI Mode Switching ---
    // (No changes needed here, assuming inputModeSelect exists)
    function toggleInputMode(mode) {
         if (!userInput || !sendButton || !recordButton || !statusDiv) return; // Check elements
         if (mode === 'voice') {
             userInput.style.display = 'none';
             sendButton.style.display = 'none';
             recordButton.style.display = 'flex'; // Use flex if that's your layout preference
             statusDiv.textContent = 'Voice mode. Click mic to record.';
             console.log("Switched to Voice Mode");
             stopRecording(); // Stop if switching TO voice while recording
         } else { // text mode
             userInput.style.display = 'block'; // Or 'inline-block' depending on layout
             sendButton.style.display = 'flex'; // Use flex if that's your layout preference
             recordButton.style.display = 'none';
             statusDiv.textContent = 'Text mode. Type your message.';
             console.log("Switched to Text Mode");
         }
    }
    if (inputModeSelect) {
         inputModeSelect.addEventListener('change', () => {
             toggleInputMode(inputModeSelect.value);
         });
         // Initial setup based on the dropdown's default value
         toggleInputMode(inputModeSelect.value);
    }


    // --- Sending Text Messages ---
    // (Uses the corrected stateSelect and voiceGenderSelect variables)
    async function sendTextMessage(event, messageOverride = null) {
         if (event) event.preventDefault();
         // Ensure elements exist before proceeding
         if (!userInput || !stateSelect || !voiceGenderSelect || !statusDiv || !sendButton || !recordButton) {
             console.error("Cannot send message: One or more required UI elements not found.");
             if(statusDiv) statusDiv.textContent = 'Error: UI element missing';
             return;
         }

         const text = messageOverride !== null ? messageOverride : userInput.value.trim();
         if (!text) return;

         // Read values from the *correctly selected* elements
         const selectedStateValue = stateSelect.value;
         const selectedVoiceGender = voiceGenderSelect.value;

         if (messageOverride === null) {
             addMessage(text, 'user'); // Adds and saves history
             userInput.value = '';
         }

         statusDiv.textContent = 'Naru is thinking...';
         sendButton.disabled = true;
         userInput.disabled = true;
         recordButton.disabled = true;

         try {
             const response = await fetch('/chat', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                     message: text,
                     input_mode: 'text',
                     voice_gender: selectedVoiceGender, // Use the read value
                     // Check if the selected state is a placeholder/default - adjust if your default isn't "Select State"
                     selected_state: (selectedStateValue && selectedStateValue !== stateSelect.options[0]?.value) ? selectedStateValue : null
                     // Example: Send null if it's the first option (assuming first is placeholder)
                     // Or: selected_state: selectedStateValue // if backend handles any value including default
                 }),
             });
             await handleResponse(response);
         } catch (error) {
             console.error('Error sending message:', error);
             addMessage(`Network Error: ${error.message}.`, 'assistant'); // Adds and saves history
             statusDiv.textContent = 'Error';
         } finally {
             // Re-enable controls even if error occurred
             sendButton.disabled = false;
             userInput.disabled = false;
             recordButton.disabled = false;
         }
    }

    // --- Handle Server Response (Audio or JSON) ---
    // (No changes needed here)
    async function handleResponse(response) {
        if (!statusDiv || !audioPlayer) { // Check required elements for this function
            console.error("Cannot handle response: Status or Audio Player element missing.");
            return;
        }
        const responseTextHeader = response.headers.get('X-Response-Text');
        let displayText = responseTextHeader ? responseTextHeader : '';

        if (!response.ok) {
            statusDiv.textContent = `Error: ${response.status}`;
            let errorMsg = `Server error (${response.status})`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorData.message || errorMsg;
            } catch (e) {
                try { errorMsg = await response.text() || errorMsg; } catch (e2) {}
            }
            addMessage(errorMsg, 'assistant'); // Adds and saves history
            // Ensure controls are re-enabled after error
            if(sendButton) sendButton.disabled = false;
            if(userInput) userInput.disabled = false;
            if(recordButton) recordButton.disabled = false;
            return;
        }

        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("audio/mpeg")) {
            statusDiv.textContent = isMuted ? 'Audio muted' : 'Playing...';
            if (displayText) {
                addMessage(displayText, 'assistant'); // Adds and saves history
            } else {
                console.warn("Received audio but no X-Response-Text header found.");
                addMessage("[Audio response received]", 'assistant'); // Adds and saves history
            }
            try {
                const audioBlob = await response.blob();
                playAudio(audioBlob);
            } catch(blobError){
                console.error("Error getting audio blob:", blobError);
                addMessage("[Error processing audio response]", 'assistant');
                statusDiv.textContent = 'Error';
            }
        } else if (contentType && contentType.includes("application/json")) {
            statusDiv.textContent = 'Ready';
            try {
                const data = await response.json();
                displayText = data.response_text || displayText || data.message;
                if (displayText) {
                    addMessage(displayText, 'assistant'); // Adds and saves history
                } else {
                    addMessage(data.error || "Received unexpected JSON response.", 'assistant'); // Adds and saves history
                }
            } catch(e) {
                console.error("Error parsing JSON response:", e);
                addMessage("[Error processing server JSON response]", 'assistant'); // Adds and saves history
                statusDiv.textContent = 'Error';
            }
        } else { // Handle plain text or other unexpected types
            statusDiv.textContent = 'Ready';
            try {
                const textResponse = await response.text();
                displayText = textResponse || displayText;
                if (displayText) {
                    addMessage(displayText, 'assistant'); // Adds and saves history
                } else {
                    addMessage(`Received unexpected response type: ${contentType || 'Unknown'}`, 'assistant'); // Adds and saves history
                }
            } catch(e) {
                console.error("Error reading unexpected response:", e);
                addMessage("[Error reading server response]", 'assistant'); // Adds and saves history
                statusDiv.textContent = 'Error';
            }
        }
    }


    // --- Play Audio Function ---
    // (No changes needed here)
    function playAudio(audioBlob) {
        if (!audioPlayer || !statusDiv) return; // Check elements
        const audioUrl = URL.createObjectURL(audioBlob);
        audioPlayer.src = audioUrl;
        audioPlayer.muted = isMuted; // Ensure player respects mute state
        console.log(`Attempting to play audio. Player muted: ${audioPlayer.muted}`);

        const playPromise = audioPlayer.play();
        if (playPromise !== undefined) {
             playPromise.catch(error => {
                 console.error("Error attempting to play audio:", error);
                 if (error.name === 'NotAllowedError') {
                     statusDiv.textContent = 'Click page to enable audio.';
                     addMessage("[System: Browser blocked audio playback. Click page or unmute.]", 'assistant', false);
                 } else {
                     if (statusDiv.textContent !== 'Audio muted') statusDiv.textContent = 'Error playing audio.';
                     addMessage(`[System: Couldn't play audio - ${error.name}]`, 'assistant', false);
                 }
                 URL.revokeObjectURL(audioUrl); // Clean up URL on error
             });
        }

        audioPlayer.onended = () => {
             console.log("Audio playback finished.");
             if (statusDiv.textContent !== 'Audio muted' && statusDiv.textContent !== 'Click page to enable audio.') {
                  statusDiv.textContent = 'Ready';
             }
             URL.revokeObjectURL(audioUrl); // Clean up URL when done
        };

        audioPlayer.onerror = (e) => {
             console.error("Audio playback error event:", e);
              if (statusDiv.textContent !== 'Audio muted' && statusDiv.textContent !== 'Click page to enable audio.') {
                   statusDiv.textContent = 'Error playing audio.';
              }
              addMessage("[System: Error during audio playback]", 'assistant', false);
              URL.revokeObjectURL(audioUrl); // Clean up URL on error
        };

        // Update status immediately if muted
        if (audioPlayer.muted && statusDiv.textContent !== 'Click page to enable audio.') {
            statusDiv.textContent = 'Audio muted';
        }
    }
    // --- End Play Audio Function ---

    // Event listeners for text input
    // (No changes needed here)
    if (sendButton && userInput) {
        sendButton.addEventListener('click', sendTextMessage);
        userInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault(); // Prevent form submission/newline
                sendTextMessage(null); // Pass null as event
            }
        });
    }

    // --- Voice Recording ---
    // (Uses the corrected stateSelect and voiceGenderSelect variables)
    async function startRecording() {
        // Check required elements
        if (!recordButton || !statusDiv || !stateSelect || !voiceGenderSelect) {
             console.error("Cannot start recording: One or more required UI elements not found.");
             if(statusDiv) statusDiv.textContent = 'Error: UI element missing';
             return;
         }

         if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
             addMessage("Media Devices API not supported.", "assistant"); statusDiv.textContent = "Error: Mic not supported"; return;
         }

         try {
             const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
             const options = { mimeType: 'audio/webm;codecs=opus' }; // Prefer Opus
              if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                  console.warn(`${options.mimeType} not supported, trying audio/webm.`); options.mimeType = 'audio/webm';
                  if (!MediaRecorder.isTypeSupported(options.mimeType)) { console.warn(`${options.mimeType} not supported. Using browser default.`); delete options.mimeType; }
              }

             mediaRecorder = new MediaRecorder(stream, options);
             console.log(`MediaRecorder using actual mimeType: ${mediaRecorder.mimeType}`);
             audioChunks = [];

             mediaRecorder.ondataavailable = event => { if (event.data.size > 0) audioChunks.push(event.data); };

             mediaRecorder.onstop = async () => {
                  recordButton.classList.remove('recording'); recordButton.innerHTML = '<i class="fa-solid fa-microphone"></i>';
                  recordButton.disabled = true; statusDiv.textContent = 'Processing voice...';
                  stream.getTracks().forEach(track => track.stop()); // Stop mic access

                  if (audioChunks.length === 0) { console.warn("No audio data recorded."); statusDiv.textContent = "No audio detected."; recordButton.disabled = false; return; }

                  const blobType = mediaRecorder.mimeType || 'audio/webm'; // Use actual or fallback
                  const audioBlob = new Blob(audioChunks, { type: blobType });
                  audioChunks = []; // Clear chunks immediately

                  // Read values from the *correctly selected* elements
                  const selectedStateValue = stateSelect.value;
                  const selectedVoiceGender = voiceGenderSelect.value;

                  const formData = new FormData();
                  const filename = `recording_${Date.now()}.${blobType.split('/')[1].split(';')[0] || 'webm'}`;
                  formData.append('audio_data', audioBlob, filename);
                  formData.append('voice_gender', selectedVoiceGender); // Use the read value
                  // Check if the selected state is a placeholder/default - adjust if your default isn't "Select State"
                  formData.append('selected_state', (selectedStateValue && selectedStateValue !== stateSelect.options[0]?.value) ? selectedStateValue : ''); // Send empty string if default/placeholder
                  // Or: formData.append('selected_state', selectedStateValue); // if backend handles any value

                  try {
                      const response = await fetch('/voice_input', { method: 'POST', body: formData });
                      await handleResponse(response); // Reuse response handler
                  } catch (error) {
                      console.error('Error sending voice input:', error);
                      addMessage(`Network Error sending voice: ${error.message}.`, 'assistant'); // Adds and saves history
                      statusDiv.textContent = 'Error';
                  } finally {
                      recordButton.disabled = false; // Re-enable button
                  }
             }; // End of onstop

             mediaRecorder.onerror = (event) => {
                  console.error("MediaRecorder error:", event.error); statusDiv.textContent = "Recording error.";
                  addMessage(`[System: Recording failed: ${event.error.name || 'Unknown error'}]`, 'assistant'); // Adds and saves history
                  recordButton.classList.remove('recording'); recordButton.innerHTML = '<i class="fa-solid fa-microphone"></i>'; recordButton.disabled = false;
                  stream.getTracks().forEach(track => track.stop()); // Ensure mic stops on error
             };

             mediaRecorder.start();
             recordButton.classList.add('recording'); recordButton.innerHTML = '<i class="fa-solid fa-stop"></i>'; recordButton.disabled = false; // Ensure enabled for stopping
             statusDiv.textContent = 'Recording...';

         } catch (err) {
             console.error("Error accessing microphone:", err);
             statusDiv.textContent = 'Mic access error.';
             if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') { addMessage("Mic access denied.", 'assistant'); statusDiv.textContent = 'Mic permission denied.'; }
             else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') { addMessage("No microphone found.", 'assistant'); statusDiv.textContent = 'Mic not found.'; }
             else { addMessage(`Error accessing mic: ${err.name} - ${err.message}`, 'assistant'); }
             recordButton.classList.remove('recording'); recordButton.innerHTML = '<i class="fa-solid fa-microphone"></i>'; recordButton.disabled = false;
         }
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop(); // This triggers the 'onstop' event handler above
            if(recordButton) recordButton.disabled = true; // Briefly disable while stopping
            if(statusDiv) statusDiv.textContent = 'Stopping...';
        }
    }

    if (recordButton) {
        recordButton.addEventListener('click', () => {
            if (mediaRecorder && mediaRecorder.state === "recording") stopRecording();
            else startRecording();
        });
    }

    // --- Clear Chat Functionality ---
    // (Uses corrected stateSelect/voiceGenderSelect, updated state reset logic)
    if (clearChatButton && chatHistory && introSection && inputArea && statusDiv) {
        clearChatButton.addEventListener('click', async () => {
            const confirmClear = confirm("Are you sure you want to clear the chat history and reset settings?");
            if (!confirmClear) {
                return;
            }

            // Clear local storage items
            localStorage.removeItem('chatHistory');
            localStorage.removeItem('introSeen');
            localStorage.removeItem('selectedUserState'); // Clear saved state preference
            // Optional: Clear mute state too? Uncomment if desired
            // localStorage.removeItem('isMuted');
            // isMuted = false; // Reset variable
            // updateMuteButtonVisuals(); // Update UI

            chatHistory.innerHTML = ''; // Clear display

            // Reset dropdowns to defaults using the *correct* elements
            // CHANGED: Reset stateSelect to its first option
            if (stateSelect && stateSelect.options.length > 0) {
                stateSelect.value = stateSelect.options[0].value;
                // Also update the intro dropdown if it exists
                 const stateSelectIntro = document.getElementById('state-select-intro');
                 if(stateSelectIntro) stateSelectIntro.value = stateSelect.value;
            }
            if (inputModeSelect) inputModeSelect.value = 'text';
            // CHANGED: Reset the correct voiceGenderSelect element
            if (voiceGenderSelect) {
                voiceGenderSelect.value = 'female'; // Reset to default
                // Also update the other voice dropdowns if they exist
                const voiceSelectIntro = document.getElementById('voice-gender-intro');
                const voiceSelectDropdown = document.getElementById('voice-gender-dropdown');
                if(voiceSelectIntro) voiceSelectIntro.value = voiceGenderSelect.value;
                if(voiceSelectDropdown) voiceSelectDropdown.value = voiceGenderSelect.value;
            }

            toggleInputMode('text'); // Update UI for text mode

            // Clear server-side history (optional)
            try {
                statusDiv.textContent = 'Clearing server history...';
                const response = await fetch('/clear_history', { method: 'POST' });
                if (!response.ok) {
                    let serverError = `Server error ${response.status}`;
                    try { serverError = (await response.json()).message || serverError } catch {}
                    console.error("Failed to clear server-side history:", serverError);
                    statusDiv.textContent = 'Error clearing server history.';
                } else {
                    const result = await response.json();
                    console.log("Server response for clear:", result.message);
                    statusDiv.textContent = 'History Cleared. Start a new chat!';
                }
            } catch (error) {
                console.error('Network error while clearing server-side history:', error);
                statusDiv.textContent = 'Network error clearing history.';
            }

            // Reset UI to initial state
            introSection.style.display = 'block';
            chatHistory.style.display = 'none';
            inputArea.style.display = 'none';
            // Clear button visibility will be handled by observer/logic on next interaction

            // Close the settings dropdown if it's open
            const dropdownControls = document.getElementById('dropdown-controls');
            const dropdownToggleBtn = document.getElementById('dropdown-toggle-button');
            if (dropdownControls && dropdownToggleBtn && dropdownControls.classList.contains('visible')) {
                dropdownControls.classList.remove('visible');
                 const icon = dropdownToggleBtn.querySelector('i');
                 if (icon) {
                      icon.classList.remove('fa-chevron-up');
                      icon.classList.add('fa-chevron-down');
                 }
                dropdownToggleBtn.setAttribute('title', 'More Settings');
            }
        });
    }

    // --- Initial setup checks ---
    // Add checks for crucial elements
    if (!voiceGenderSelect) console.error("Voice gender select dropdown ('voice-gender-header') not found! Voice selection will fail.");
    if (!inputModeSelect) console.error("Input mode select dropdown ('input-mode') not found! Mode switching will fail.");
    if (!userInput) console.error("User input element ('user-input') not found!");
    if (!sendButton) console.error("Send button element ('send-button') not found!");
    if (!recordButton) console.error("Record button element ('record-button') not found!");


    // NOTE: The logic for showing/hiding the clearChatButton based on history content
    // is assumed to be handled correctly by the MutationObserver in your inline HTML script.

}); // End of DOMContentLoaded