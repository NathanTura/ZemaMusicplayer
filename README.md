<p align="center">
  <img src="public/logo.png" alt="Zema Logo" width="180"/>
</p>

# Zema Music Player

Zema is a sleek, cross-platform music player designed to seamlessly sync your local library and offer a stunning, SoundCloud-inspired interface. Zema isn't just a web app—it's a **Progressive Web App (PWA)** that can be installed natively on PC, iOS, and Android. 

It comes packed with intelligent iTunes metadata fetching, a dynamic equalizer, an intuitive queue system, and a **native download backend** that lets you search and download high-quality music from the web straight to your device.

---

## 🌟 Features

- **True Cross-Platform Support**: Install Zema as a standalone app on Windows, macOS, Linux, iOS, and Android.
- **Smart Metadata & Artwork**: Automatically pulls official song names and high-resolution cover art from iTunes by intelligently parsing your local file names and ID3 tags.
- **Online Search & Download**: Search the iTunes catalog natively within the app. Listen to 30-second previews, and with the optional Python Backend, download high-quality tracks directly to your library.
- **Dynamic Queue System**: Effortlessly add songs to your queue, shuffle tracks, or set repeat modes.
- **Equalizer**: Tweak the sound exactly how you like it with a built-in 5-band EQ.
- **Fluid UI & Animations**: Smooth sliding animations between views powered by Framer Motion.
- **Responsive Design**: Flawlessly adapts to both desktop monitors and mobile screens with tailored navigation bars.
- **Dark Mode**: A beautiful, premium dark theme that's easy on the eyes.

---

## 📱 How to Install Zema

Zema is designed to be installed on any device as a PWA, meaning it doesn't need to be downloaded from an App Store. 

### Windows / macOS / Linux
1. Open the [Zema Website](https://zema-musicplayer.vercel.app) in Google Chrome or Microsoft Edge.
2. In the right side of the URL bar, look for the **Install App** icon (it looks like a screen with a down arrow).
3. Click it and select **Install**. Zema will now appear as a desktop application on your computer.

### iOS (iPhone & iPad)
1. Open the [Zema Website](https://zema-musicplayer.vercel.app) in **Safari**.
2. Tap the **Share** button at the bottom of the screen (the square with an arrow pointing up).
3. Scroll down and select **"Add to Home Screen"**.
4. Tap **Add**. Zema is now a full-screen app on your home screen!

### Android
1. Open the [Zema Website](https://zema-musicplayer.vercel.app) in **Google Chrome**.
2. You will see a pop-up at the bottom of the screen asking to **"Add Zema to Home screen"**. Tap it.
*(If you don't see the pop-up, tap the 3 dots in the top right corner and select "Install app")*.

---

## 🛠️ Setting up the Download Backend (Free)

Zema has a built-in download button that lets you fetch songs directly to your device. Because web browsers block websites from silently downloading files, Zema requires a lightweight Python backend server to process the high-quality downloads via `yt-dlp`. 

You can host this backend for **100% free** using Render.com!

### Step 1: Push the Backend to GitHub
1. Locate the `zema-backend` folder (which contains `main.py` and `requirements.txt`).
2. Create a new public repository on your GitHub account (e.g., `zema-backend`).
3. Upload the files from the `zema-backend` folder to this new repository.

### Step 2: Deploy to Render.com
1. Create a free account at [Render.com](https://render.com).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub account and select your `zema-backend` repository.
4. Fill in the details:
   - **Name**: `zema-backend` (or whatever you prefer)
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Select the **Free** instance type.
6. Click **Create Web Service**. 

### Step 3: Connect Zema to your Backend
1. Once Render finishes building, it will give you a live URL (e.g., `https://zema-backend-xyz.onrender.com`).
2. Open the Zema source code and navigate to `src/views/SearchView.jsx` and `src/components/SearchDropdown.jsx`.
3. Find the `handleDownload` function and change the `backendUrl` from `http://localhost:8000` to your new Render URL.
4. Deploy your Zema updates! When you click download, your backend will now process the song and send it straight to your device.

---

## 💻 Local Development

If you want to run Zema locally on your machine for development:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/NathanTura/ZemaMusicplayer.git
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the development server**:
   ```bash
   npm run dev
   ```

To test the backend locally, open a new terminal in the `zema-backend` folder:
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## 🏗️ Tech Stack

- **Frontend**: React 19, Vite, Zustand (State Management)
- **Styling**: Vanilla CSS, Framer Motion
- **Icons**: Google Material Symbols Rounded
- **Backend (Optional)**: Python, FastAPI, yt-dlp
