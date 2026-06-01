from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import yt_dlp
import yt_dlp.utils
import os
import uuid
import threading
import concurrent.futures

app = FastAPI()

# Allow all origins so Zema can access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "/tmp" if os.name != "nt" else os.environ.get("TEMP", "C:\\temp")
JOB_LOCK = threading.Lock()
jobs = {}
executor = concurrent.futures.ThreadPoolExecutor(max_workers=2)


def get_temp_filepath(job_id: str) -> str:
    return os.path.join(TEMP_DIR, f"{job_id}.mp3")


def update_job(job_id: str, **kwargs):
    with JOB_LOCK:
        if job_id in jobs:
            jobs[job_id].update(kwargs)


def progress_hook(job_id: str, progress_data: dict):
    status = progress_data.get('status')
    if not status:
        return

    try:
        updates = {}
        if status == 'downloading':
            updates['status'] = 'downloading'
            downloaded = progress_data.get('downloaded_bytes', jobs[job_id].get('downloaded_bytes', 0))
            total = progress_data.get('total_bytes', jobs[job_id].get('total_bytes', 0))
            updates['downloaded_bytes'] = downloaded
            updates['total_bytes'] = total
            updates['speed'] = progress_data.get('speed', jobs[job_id].get('speed', 0))
            updates['eta'] = progress_data.get('eta', jobs[job_id].get('eta', 0))
            updates['percent'] = round((downloaded / total) * 100, 2) if total and downloaded > 0 else jobs[job_id].get('percent', 0)
        elif status == 'finished':
            updates['status'] = 'processing'
            updates['downloaded_bytes'] = progress_data.get('downloaded_bytes', jobs[job_id].get('downloaded_bytes', 0))
            updates['total_bytes'] = progress_data.get('total_bytes', jobs[job_id].get('total_bytes', 0))
            updates['percent'] = 100
            updates['filename'] = progress_data.get('filename', jobs[job_id].get('filename'))
        elif status == 'error':
            updates['status'] = 'failed'
            updates['error'] = progress_data.get('message', 'Download error')

        if job_id in jobs and jobs[job_id]['cancel_event'].is_set():
            raise yt_dlp.utils.DownloadError('Download canceled by user')

        if job_id in jobs:
            update_job(job_id, **updates)
    except Exception as e:
        if job_id in jobs:
            update_job(job_id, status='failed', error=str(e))


def download_task(job_id: str, query: str):
    filepath = get_temp_filepath(job_id)
    output_template = filepath.replace('.mp3', '')
    update_job(job_id, status='downloading', filepath=filepath, outtmpl=output_template)

    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': output_template,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'noplaylist': True,
        'quiet': True,
        'default_search': 'ytsearch',
        'progress_hooks': [lambda d: progress_hook(job_id, d)],
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([query])

        import time
        time.sleep(0.5)  # Give file system time to finalize the file
        
        if jobs[job_id]['cancel_event'].is_set():
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                except:
                    pass
            update_job(job_id, status='canceled')
        elif os.path.exists(filepath):
            file_size = os.path.getsize(filepath)
            if file_size > 0:
                update_job(job_id, status='completed', percent=100, speed=0, eta=0, downloaded_bytes=file_size, total_bytes=file_size)
            else:
                update_job(job_id, status='failed', error='Output file is empty')
        else:
            update_job(job_id, status='failed', error='Output file was not created')
    except yt_dlp.utils.DownloadError as exc:
        if jobs[job_id]['cancel_event'].is_set():
            update_job(job_id, status='canceled', error=str(exc))
        else:
            update_job(job_id, status='failed', error=str(exc))
    except Exception as exc:
        update_job(job_id, status='failed', error=str(exc))


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
