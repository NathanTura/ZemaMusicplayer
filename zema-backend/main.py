from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import yt_dlp
import os
import uuid
import uvicorn

app = FastAPI()

# Allow all origins so Zema can access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "Zema Backend is Running"}
@app.get("/download")
def download_song(query: str):
    if not query:
        raise HTTPException(status_code=400, detail="Query is required")

    # Generate a unique filename
    filename = f"{uuid.uuid4().hex}.mp3"
    filepath = os.path.join("/tmp" if os.name != "nt" else os.environ.get("TEMP", "C:\\temp"), filename)

    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': filepath.replace('.mp3', ''),
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'noplaylist': True,
        'quiet': True,
        'default_search': 'ytsearch',
        'socket_timeout': 120,
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    }
    
    # Check for cookies file to bypass YouTube bot detection
    if os.path.exists('/etc/secrets/cookies.txt'):
        ydl_opts['cookiefile'] = '/etc/secrets/cookies.txt'
    elif os.path.exists('cookies.txt'):
        ydl_opts['cookiefile'] = 'cookies.txt'

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # We use ytsearch to just find the first YouTube match for the song
            ydl.extract_info(query, download=True)
            
        if os.path.exists(filepath):
            return FileResponse(filepath, media_type="audio/mpeg", filename=f"{query}.mp3")
        else:
            raise HTTPException(status_code=500, detail="Failed to process audio")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)