<p align="center">
  <img src="public/logo.png" alt="Zema Logo" width="180"/>
</p>

# Zema Music Player

Zema is a beautiful, modern music player that lives in your browser but feels like a native app. It syncs with your local music library, automatically fetches high-resolution cover art, and even lets you search and download new songs directly to your device.

## How It Works
Instead of relying on clunky file managers or outdated media players, Zema provides a sleek interface to listen to your offline music. If you want a new song, just search for it—Zema fetches a 30-second preview from iTunes and, if you have the backend set up, downloads the full song straight to your library.

---

## 📱 How to Install

Zema is a **Progressive Web App (PWA)**. This means you don't need to download it from an app store. You just install it directly from your web browser!

### Desktop (Windows / macOS / Linux)
1. Open the [Zema Website](https://zema-musicplayer.vercel.app) in Chrome or Edge.
2. Look at the right side of your address bar for the **Install** icon (a screen with a down arrow).
3. Click it and select **Install**. Zema will now run as a native desktop app.

### iPhone & iPad
1. Open the [Zema Website](https://zema-musicplayer.vercel.app) in **Safari**.
2. Tap the **Share** button at the bottom (the square with an arrow pointing up).
3. Scroll down and tap **"Add to Home Screen"**.

### Android
1. Open the [Zema Website](https://zema-musicplayer.vercel.app) in **Chrome**.
2. A pop-up will appear at the bottom asking to **"Add Zema to Home screen"**. Tap it.
*(If you don't see it, tap the 3 dots in the top right and select "Install app")*.

---

## 📥 Enable Downloading (Backend Setup)

To allow Zema to download songs from the web, you need to connect it to its companion backend service. 

**Important:** We highly recommend running the backend **locally on your computer** rather than deploying it to a cloud service like Render. Cloud servers often get blocked by YouTube's bot protection, whereas your local internet connection will work perfectly without needing complicated cookie setups!

You can find the backend repository and simple 2-step setup instructions here: 
👉 **[Zema Backend Repository](https://github.com/NathanTura/zema-backend)**

Once your local backend is running (which automatically uses `http://localhost:8000`), Zema will automatically connect to it. If you choose to host it elsewhere, you can add `VITE_BACKEND_URL` to your Vercel Environment Variables.
---

## 💻 Local Development

If you'd like to run Zema locally to make changes to the code:

1. Clone this repository.
2. Open a terminal in the project folder and run:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
