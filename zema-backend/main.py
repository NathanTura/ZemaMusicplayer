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


@app.post("/download/start")
def start_download(query: str):
    if not query:
        raise HTTPException(status_code=400, detail="Query is required")

    job_id = uuid.uuid4().hex
    with JOB_LOCK:
        jobs[job_id] = {
            'job_id': job_id,
            'query': query,
            'status': 'queued',
            'downloaded_bytes': 0,
            'total_bytes': 0,
            'percent': 0,
            'speed': 0,
            'eta': 0,
            'filename': None,
            'filepath': None,
            'error': None,
            'cancel_event': threading.Event()
        }

    executor.submit(download_task, job_id, query)
    return {'jobId': job_id}


@app.get("/download/status/{job_id}")
def download_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail='Job not found')

    job = jobs[job_id]
    return {
        'jobId': job_id,
        'query': job['query'],
        'status': job['status'],
        'downloaded_bytes': job['downloaded_bytes'],
        'total_bytes': job['total_bytes'],
        'percent': job['percent'],
        'speed': job['speed'],
        'eta': job['eta'],
        'filename': job['filename'],
        'error': job['error']
    }


@app.get("/download/file/{job_id}")
def download_file(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail='Job not found')

    job = jobs[job_id]
    if job['status'] != 'completed':
        raise HTTPException(status_code=400, detail=f"Download status is {job['status']}")

    if not job['filepath'] or not os.path.exists(job['filepath']):
        raise HTTPException(status_code=500, detail='Downloaded file not found')

    return FileResponse(job['filepath'], media_type='audio/mpeg', filename=f"{job['query']}.mp3")


@app.post("/download/cancel/{job_id}")
def cancel_download(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail='Job not found')

    job = jobs[job_id]
    if job['status'] in ('completed', 'failed', 'canceled'):
        return {'status': job['status']}

    job['cancel_event'].set()
    update_job(job_id, status='canceling')
    return {'status': 'canceling'}
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
        'socket_timeout': 30,
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