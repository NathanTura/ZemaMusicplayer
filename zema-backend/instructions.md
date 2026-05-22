# Zema Backend Deployment Instructions

Zema uses a Python backend to download high-quality audio files from the internet completely natively, without needing a Telegram bot.

To get this backend running for free so you can download music anywhere (PC, iOS, Android), follow these steps:

## Step 1: Upload to GitHub
1. Create a new repository on your GitHub account called `zema-backend`.
2. Upload the `main.py` and `requirements.txt` files from this folder into that repository.

## Step 2: Deploy to Render.com (100% Free)
1. Go to [Render.com](https://render.com/) and create a free account.
2. Click **New +** -> **Web Service**.
3. Connect your GitHub account and select your `zema-backend` repository.
4. Fill in the deployment details:
   - **Name**: `zema-backend`
   - **Region**: (Any)
   - **Branch**: `main`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Select the **Free Tier**.
6. Click **Create Web Service**.

## Step 3: Connect Zema
Once Render finishes building your server, it will give you a URL that looks like `https://zema-backend-xxxxx.onrender.com`.

Inside the Zema React App code, look for the download function (I have already set this up in `SearchView.jsx` and `SearchDropdown.jsx`). Update the URL in those files to point to your new Render URL!

Now, whenever you click download in Zema, it will fetch the song from your server and save it straight to your device!
