# HumanLike_Ai_Assistant (Naru) 🤖💬

Meet **Naru**, your not-so-average AI Assistant! Naru is designed to be a human-like chatbot that you can chat with for general talk, get assistance with day-to-day queries, and enjoy a touch of witty, filmy personality. Think of Naru as that fun, smart friend who's always ready with a quirky reply or helpful advice.

Naru isn't just about information; it's about the *vibe*! Developed with a unique Hinglish persona by "N. Narayan's dimaag," Naru aims to make your interactions engaging and entertaining.

## ✨ Key Features

* 🧠 **Human-like Conversational AI:** Powered by Groq's Llama3-70b model for natural and intelligent responses.
* 🗣️🎙️ **Text & Voice Interaction:** Chat via text or use your voice! Naru can understand your speech and reply with a synthesized voice.
* Dynamic Voice Gender: Choose between a male (`en-IN-PrabhatNeural`) or female (`en-IN-NeerjaNeural`) voice for Naru's responses.
* 🌍 **Location-Aware Context:**
    * Select your state in India to get relevant information.
    * 🌦️ **Real-time Weather Updates:** Get current temperature, weather conditions (clear sky, cloudy, rain, etc.), chance of precipitation, and daily max/min temperatures for your chosen location (using Open-Meteo API).
* ⏰ **Time-Aware:** Naru always knows the current date and time.
* 👗👕 **Fashion Sense (Implied):** While not explicitly a fashion model, Naru's persona can offer stylish suggestions based on context (like season/weather).
* 🎬 **Movie Buff:** Ask for movie recommendations (powered by TMDB API). Naru will give you a curated list!
* 😜 **Witty & Emotional Persona:**
    * Speaks in **Hinglish** (a mix of Hindi and English) with a casual, friendly, and sometimes mischievous tone.
    * Designed to give short, spicy, and engaging replies. Forget boring, robotic answers!
* 💾 **Session-based Memory:** Naru remembers the context of your current conversation (for up to 20 exchanges) to provide more relevant responses. You can also clear the history.
* 🛠️ **Day-to-Day Assistance:** From casual chat to specific queries, Naru tries to help with a touch of humor.

## ⚙️ How It Works: A Brief Code Overview

Naru is a web application built with Python and Flask, integrating several APIs and libraries to bring its features to life:

* **Backend Framework:** Flask handles web requests, routes, and session management.
* **Core AI Logic:**
    * **Groq API (Llama3-70b):** The primary engine for generating Naru's conversational responses. The `get_character_profile()` function provides a detailed system prompt to Groq, defining Naru's personality, language style (Hinglish), response length preferences, and how to handle various user interactions.
    * **Contextual Information:** Before sending a query to Groq, the system gathers current time, selected location's weather data (temperature, conditions), and recent conversation history. This context helps Naru provide more relevant and dynamic responses.
* **Speech Capabilities:**
    * **Text-to-Speech (TTS):** `edge-tts` (Microsoft Edge's online TTS service) is used to convert Naru's text replies into natural-sounding speech (male or female Indian English voices).
    * **Speech-to-Text (STT):** `speech_recognition` library (with Google Speech Recognition API) processes user's voice input (uploaded as a WebM file, then converted to WAV using Pydub).
* **External APIs:**
    * **Open-Meteo API:** Used by `get_weather(latitude, longitude)` to fetch detailed weather forecasts. Location is determined by a dropdown list of Indian states, mapped to `STATE_COORDINATES`.
    * **TMDB API:** The `get_movies(query, platform)` function searches for movies based on user queries.
* **Data Handling & Configuration:**
    * **JSON:** Used for API request/response parsing.
    * **`.env` file:** Stores sensitive API keys (`GROQ_API_KEY`, `TMDB_API_KEY`) and `FLASK_SECRET_KEY` for session security. `python-dotenv` loads these variables.
    * **Session Management:** Flask's `session` object stores conversation history (`conversation_history`) and the user's selected state (`selected_state`) to maintain context across interactions.
* **Audio Processing:**
    * `pydub`: Used in `recognize_audio_data` to convert WebM audio recordings from the browser into WAV format, which is required by the `speech_recognition` library. **Requires ffmpeg to be installed and accessible in the system's PATH.**
* **Key Python Modules:**
    * `flask`: Web framework.
    * `requests`: For making HTTP requests to external APIs.
    * `groq`: Python client for GroqCloud API.
    * `datetime`: To get current time.
    * `os`, `secrets`, `dotenv`: For environment management and security.
    * `speech_recognition`: For STT.
    * `edge_tts`, `asyncio`: For TTS.
    * `pydub`: For audio format conversion.
    * `functools`: For decorators.

## 🚀 Setup & Running the Assistant

1.  **Prerequisites:**
    * Python 3.7+
    * `pip` (Python package installer)
    * **ffmpeg:** Essential for voice input. Download it from [ffmpeg.org](https://ffmpeg.org/download.html) and ensure it's added to your system's PATH.

2.  **Clone the Repository (if applicable):**
    ```bash
    git clone <repository_url>
    cd HumanLike_Ai_Assistant
    ```

3.  **Create a Virtual Environment (Recommended):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

4.  **Install Dependencies:**
    Create a `requirements.txt` file with the following content:
    ```
    Flask
    requests
    groq
    python-dotenv
    SpeechRecognition
    edge-tts
    pydub
    asyncio
    ```
    Then run:
    ```bash
    pip install -r requirements.txt
    ```

5.  **Set up API Keys:**
    Create a `.env` file in the root project directory with your API keys:
    ```env
    GROQ_API_KEY="your_groq_api_key_here"
    TMDB_API_KEY="your_tmdb_api_key_here"
    FLASK_SECRET_KEY="your_strong_random_secret_key_here" # Important for sessions
    ```
    * Get your Groq API key from [GroqCloud](https://console.groq.com/keys).
    * Get your TMDB API key from [The Movie Database (TMDB)](https://www.themoviedb.org/settings/api).
    * Generate a strong secret key for `FLASK_SECRET_KEY` (e.g., using `python -c 'import secrets; print(secrets.token_hex(16))'`).

6.  **Run the Application:**
    ```bash
    python app.py
    ```

7.  **Access Naru:**
    Open your web browser and go to `http://localhost:5000` or `http://0.0.0.0:5000`.

## 🛠️ Tech Stack

* **Programming Language:** Python
* **Web Framework:** Flask
* **AI Language Model:** Llama3-70b (via Groq API)
* **Weather API:** Open-Meteo
* **Movie API:** TMDB API
* **Text-to-Speech:** Microsoft Edge TTS (`edge-tts`)
* **Speech-to-Text:** Google Speech Recognition (via `SpeechRecognition` library)
* **Audio Processing:** Pydub (requires ffmpeg)
* **Frontend:** HTML, CSS, JavaScript (implied by `render_template('index.html')`)

## 📝 Important Notes

* **ffmpeg is crucial:** Voice input will **not** work if ffmpeg is not correctly installed and accessible in your system's PATH. The application attempts a check on startup.
* **API Keys:** The application relies heavily on the Groq and TMDB API keys. Ensure they are correctly set in your `.env` file.
* **Internet Connection:** Required for API calls (Groq, TMDB, Open-Meteo, Google STT, Edge TTS).
* **Persona:** Naru's responses are intentionally witty, sometimes sarcastic, and use Hinglish. This is defined in the `get_character_profile()` function.

---

Enjoy chatting with Naru! 🎉
