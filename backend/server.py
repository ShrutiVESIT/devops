"""
Clean server.py - Contains only endpoints actively used by the frontend.

Active endpoints:
- POST /compress_image/ - Image compression using KMeans clustering
- POST /convert-ico/ - Convert PNG/JPG to ICO format
- POST /convert-to-pdf/ - Convert images to PDF
- POST /edit-pdf/ - Remove pages from PDF
- POST /stickers/whatsapp - Create WhatsApp stickers from images/videos/audio
- GET /voices - Get available AWS Polly voices
- GET/POST /read - Text-to-speech using AWS Polly

Note: Some frontend features reference endpoints not implemented here:
- /convert/webp-to-png (ConvertCardWtP.tsx)
- /download_pinterest_video/ (PinDownload.tsx)
- /download_reel/ (ReelCard.tsx)
- /download_youtube_short/ (YoutubeCard.tsx) - requires pytube
- /companies, /analyze_stock, /watchlist/* (StockAnalysis.tsx) - requires yfinance + Gemini
"""

from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from PyPDF2 import PdfReader, PdfWriter
from PIL import Image, ImageOps
from sklearn.cluster import KMeans
from typing import List, Optional
from contextlib import closing
from pathlib import Path
from dotenv import load_dotenv
from collections import namedtuple
from pydantic import BaseModel
# from boto3 import Session # aws functionalities removed 
# from botocore.exceptions import BotoCoreError, ClientError  # aws functionalities removed 
from moviepy.editor import AudioFileClip, VideoFileClip
import numpy as np
import tempfile
import logging
import os
import re
import io

# Pillow dropped legacy resampling constants; restore them for moviepy compatibility
if not hasattr(Image, "ANTIALIAS"):
    Image.ANTIALIAS = Image.Resampling.LANCZOS

# ─────────────────────────────────────────────────────────────────────────────
# Configuration & Constants
# ─────────────────────────────────────────────────────────────────────────────

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# AWS Polly configuration
AUDIO_FORMATS = {
    "ogg_vorbis": "audio/ogg",
    "mp3": "audio/mpeg",
    "pcm": "audio/wave; codecs=1"
}
CHUNK_SIZE = 1024

# Sticker configuration
MAX_STICKER_DIMENSION = 512
MAX_VIDEO_DURATION_SECONDS = 6
MAX_AUDIO_DURATION_SECONDS = 15

IMAGE_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
VIDEO_MIME_TYPES = {"video/mp4", "video/quicktime", "video/webm", "video/x-matroska"}
AUDIO_MIME_TYPES = {"audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg", "audio/x-m4a", "audio/mp4"}

# AWS Polly client
# session = Session(profile_name="default")
# polly = session.client("polly")

# ─────────────────────────────────────────────────────────────────────────────
# FastAPI App Setup
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(title="Tool-Kit API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# Image Compression
# ─────────────────────────────────────────────────────────────────────────────

def compress_image(image: Image.Image, n_colors: int) -> Image.Image:
    """Compress image using KMeans color clustering."""
    img_np = np.array(image)
    
    if len(img_np.shape) == 2:
        img_np = np.stack((img_np,) * 3, axis=-1)
    elif len(img_np.shape) != 3:
        raise ValueError("Image format not supported. Please upload an RGB or grayscale image.")
    
    w, h, d = img_np.shape
    img_reshaped = img_np.reshape(w * h, d)
    
    kmeans = KMeans(n_clusters=n_colors)
    kmeans.fit(img_reshaped)
    
    compressed_img = kmeans.cluster_centers_[kmeans.labels_].reshape(w, h, d).astype('uint8')
    return Image.fromarray(compressed_img)


@app.post("/compress_image/")
async def compress_image_api(n_colors: str = Form(...), file: UploadFile = File(...)):
    """Compress image by reducing color palette using KMeans clustering."""
    n_colors = int(n_colors)
    image = Image.open(io.BytesIO(await file.read()))
    compressed_image = compress_image(image, n_colors)
    
    img_byte_arr = io.BytesIO()
    compressed_image.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    
    return StreamingResponse(
        img_byte_arr,
        media_type="image/png",
        headers={"Content-Disposition": "attachment; filename=compressed_image.png"}
    )

# ─────────────────────────────────────────────────────────────────────────────
# Image to ICO Conversion
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/convert-ico/")
async def convert_to_ico(file: UploadFile = File(...)):
    """Convert PNG/JPG image to ICO format."""
    allowed_types = ['image/jpeg', 'image/png', 'image/jpg']
    content_type = (file.content_type or "").lower()
    filename = file.filename or ""
    valid_extension = filename.lower().endswith(('.png', '.jpg', '.jpeg'))
    
    if content_type not in allowed_types and not valid_extension:
        raise HTTPException(status_code=400, detail=f"Only PNG/JPG files are allowed. Received: {content_type}")
    
    try:
        image = Image.open(io.BytesIO(await file.read()))
        ico_buffer = io.BytesIO()
        image.save(ico_buffer, format="ICO")
        ico_buffer.seek(0)
        
        return StreamingResponse(
            ico_buffer,
            media_type="image/x-icon",
            headers={"Content-Disposition": "attachment; filename=converted.ico"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to convert image: {str(e)}")

# ─────────────────────────────────────────────────────────────────────────────
# Images to PDF Conversion
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/convert-to-pdf/")
async def convert_images_to_pdf(images: List[UploadFile] = File(...)):
    """Convert multiple images to a single PDF file."""
    if not images:
        raise HTTPException(status_code=400, detail="No images uploaded")
    
    if len(images) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 images allowed")
    
    try:
        pil_images = []
        for img_file in images:
            content = await img_file.read()
            try:
                img = Image.open(io.BytesIO(content))
                if img.mode == 'RGBA':
                    img = img.convert('RGB')
                pil_images.append(img)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid image format: {str(e)}")
        
        if not pil_images:
            raise HTTPException(status_code=400, detail="No valid images found")
        
        pdf_buffer = io.BytesIO()
        first_img = pil_images[0]
        
        if len(pil_images) == 1:
            first_img.save(pdf_buffer, "PDF")
        else:
            first_img.save(pdf_buffer, "PDF", save_all=True, append_images=pil_images[1:])
        
        pdf_buffer.seek(0)
        
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=converted_images.pdf"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating PDF: {str(e)}")

# ─────────────────────────────────────────────────────────────────────────────
# PDF Editing (Page Removal)
# ─────────────────────────────────────────────────────────────────────────────

def parse_page_ranges(page_numbers: str, total_pages: int) -> List[int]:
    """Parse page range string like '1,3-5,7' into list of page numbers."""
    pages = set()
    ranges = page_numbers.replace(" ", "").split(",")
    
    for r in ranges:
        if '-' in r:
            start, end = map(int, r.split('-'))
            if start > end or end > total_pages:
                raise HTTPException(400, "Invalid page range")
            pages.update(range(start, end + 1))
        else:
            page = int(r)
            if page < 1 or page > total_pages:
                raise HTTPException(400, f"Invalid page: {page}")
            pages.add(page)
    
    return sorted(pages)


@app.post("/edit-pdf/")
async def edit_pdf(
    file: UploadFile = File(...),
    page_numbers: str = Query(..., description="Pages/ranges to remove (e.g., 1,3-5,7)")
):
    """Remove specified pages from a PDF file."""
    try:
        if file.content_type != "application/pdf":
            raise HTTPException(400, "Only PDF files allowed")
        
        contents = await file.read()
        reader = PdfReader(io.BytesIO(contents))
        total = len(reader.pages)
        
        pages_to_remove = parse_page_ranges(page_numbers, total)
        
        writer = PdfWriter()
        for i in range(total):
            if (i + 1) not in pages_to_remove:
                writer.add_page(reader.pages[i])
        
        buffer = io.BytesIO()
        writer.write(buffer)
        buffer.seek(0)
        
        return StreamingResponse(
            iter(lambda: buffer.read(4096), b''),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="modified_{file.filename}"'}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Processing error: {str(e)}")

@app.post("/pdf-password/")
async def pdf_password(
    file: UploadFile = File(...),
    action: str = Form(..., description="Action: 'add' or 'remove'"),
    password: str = Form(..., description="Password to add or existing password to remove"),
    new_password: str = Form(None, description="New password (only for 'add' action)")
):
    """
    Add or remove password protection from a PDF file.
    - action='add': Encrypts PDF with the provided password
    - action='remove': Decrypts PDF using the provided password
    """
    try:

        if file.content_type != "application/pdf":
            raise HTTPException(400, "Only PDF files allowed")

        if action not in ["add", "remove"]:
            raise HTTPException(400, "Action must be 'add' or 'remove'")
        
        contents = await file.read()
        reader = PdfReader(io.BytesIO(contents))
        writer = PdfWriter()
        
        if action == "remove":
            # Check if PDF is encrypted
            if reader.is_encrypted:
                try:
                    # Try to decrypt with provided password
                    if not reader.decrypt(password):
                        raise HTTPException(400, "Incorrect password")
                except Exception as decrypt_error:
                    raise HTTPException(400, f"Failed to decrypt PDF: {str(decrypt_error)}")
            else:
                raise HTTPException(400, "PDF is not password protected")
            
            # Copy all pages to writer (unencrypted)
            for page in reader.pages:
                writer.add_page(page)
                
        elif action == "add":
            # If PDF is encrypted, decrypt it first
            if reader.is_encrypted:
                try:
                    if not reader.decrypt(password if new_password else ""):
                        raise HTTPException(400, "PDF is already encrypted. Provide current password.")
                except:
                    raise HTTPException(400, "PDF is already encrypted and could not be decrypted")
            
            # Copy all pages
            for page in reader.pages:
                writer.add_page(page)
            
            # Encrypt with the provided password
            encrypt_password = new_password if new_password else password
            writer.encrypt(encrypt_password)
        
        # Write to buffer
        buffer = io.BytesIO()
        writer.write(buffer)
        buffer.seek(0)
        
        action_prefix = "protected" if action == "add" else "unprotected"
        filename = f"{action_prefix}_{file.filename}"
        
        return StreamingResponse(
            iter(lambda: buffer.read(4096), b''),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Processing error: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# WhatsApp Sticker Generation
# ─────────────────────────────────────────────────────────────────────────────

def _sanitize_filename(original_name: Optional[str], extension: str) -> str:
    """Create a safe filename from original name."""
    base_name = Path(original_name or "sticker").stem
    safe_base = re.sub(r"[^A-Za-z0-9._-]", "_", base_name) or "sticker"
    return f"{safe_base}{extension}"


def _resolve_media_kind(upload: UploadFile) -> str:
    """Determine if upload is image, video, or audio."""
    content_type = (upload.content_type or "").split(";")[0].lower()
    suffix = (Path(upload.filename or "").suffix or "").lower()
    
    if content_type in IMAGE_MIME_TYPES or suffix in {".png", ".jpg", ".jpeg", ".webp"}:
        return "image"
    if content_type in VIDEO_MIME_TYPES or suffix in {".mp4", ".mov", ".mkv", ".webm"}:
        return "video"
    if content_type in AUDIO_MIME_TYPES or suffix in {".mp3", ".wav", ".m4a", ".ogg"}:
        return "audio"
    
    raise HTTPException(
        status_code=400,
        detail="Unsupported media type. Please upload an image, video, or audio file.",
    )


async def _persist_upload_to_temp(upload: UploadFile) -> str:
    """Save upload to temporary file and return path."""
    suffix = Path(upload.filename or "").suffix or ""
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
        while True:
            chunk = await upload.read(1024 * 1024)
            if not chunk:
                break
            tmp_file.write(chunk)
        temp_path = tmp_file.name
    
    if os.path.getsize(temp_path) == 0:
        os.remove(temp_path)
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    
    return temp_path


def _generate_static_sticker(image_bytes: bytes) -> io.BytesIO:
    """Generate static WebP sticker from image."""
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image supplied: {exc}")
    
    sticker = ImageOps.fit(image, (MAX_STICKER_DIMENSION, MAX_STICKER_DIMENSION), Image.LANCZOS)
    buffer = io.BytesIO()
    sticker.save(buffer, format="WEBP", lossless=True, quality=100, method=6)
    buffer.seek(0)
    return buffer


def _generate_video_sticker(temp_path: str) -> io.BytesIO:
    """Generate animated WebP sticker from video."""
    clip_trimmed = clip_square = clip_resized = None
    frames: List[Image.Image] = []
    fps = 15
    
    with VideoFileClip(temp_path) as clip:
        duration = clip.duration or 0
        if duration <= 0:
            raise HTTPException(status_code=400, detail="Video duration is too short to convert.")
        if duration > MAX_VIDEO_DURATION_SECONDS:
            raise HTTPException(status_code=400, detail="Video must be 6 seconds or shorter.")
        
        end_time = min(duration, MAX_VIDEO_DURATION_SECONDS)
        clip_trimmed = clip.subclip(0, end_time)
        min_edge = min(clip_trimmed.w, clip_trimmed.h)
        clip_square = clip_trimmed.crop(
            x1=(clip_trimmed.w - min_edge) / 2,
            y1=(clip_trimmed.h - min_edge) / 2,
            width=min_edge,
            height=min_edge,
        )
        clip_resized = clip_square.resize(newsize=(MAX_STICKER_DIMENSION, MAX_STICKER_DIMENSION))
        fps = min(int(clip_resized.fps or 15), 15) or 15
        
        for frame in clip_resized.iter_frames(fps=fps, dtype="uint8"):
            frames.append(Image.fromarray(frame).convert("RGBA"))
    
    for partial_clip in [clip_resized, clip_square, clip_trimmed]:
        if partial_clip:
            partial_clip.close()
    
    if not frames:
        raise HTTPException(status_code=400, detail="Unable to read frames from video.")
    
    buffer = io.BytesIO()
    frame_duration = max(int(1000 / fps), 1)
    frames[0].save(
        buffer,
        format="WEBP",
        save_all=True,
        append_images=frames[1:],
        duration=frame_duration,
        loop=0,
        lossless=True,
        quality=100,
        method=6,
    )
    buffer.seek(0)
    return buffer


def _generate_audio_preview(temp_path: str) -> bytes:
    """Generate trimmed MP3 preview from audio file."""
    trimmed_clip = None
    output_file = None
    
    try:
        with AudioFileClip(temp_path) as audio_clip:
            duration = audio_clip.duration or 0
            if duration <= 0:
                raise HTTPException(status_code=400, detail="Audio duration is too short to convert.")
            end_time = min(duration, MAX_AUDIO_DURATION_SECONDS)
            trimmed_clip = audio_clip.subclip(0, end_time)
            output_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
            output_file.close()
            trimmed_clip.write_audiofile(
                output_file.name,
                codec="libmp3lame",
                fps=44100,
                bitrate="128k",
                logger=None,
            )
        audio_bytes = Path(output_file.name).read_bytes()
        return audio_bytes
    finally:
        if trimmed_clip:
            trimmed_clip.close()
        if output_file and os.path.exists(output_file.name):
            os.remove(output_file.name)

@app.post("/stickers/whatsapp")
async def create_whatsapp_sticker(media: UploadFile = File(...)):
    """Create WhatsApp-compatible sticker from image, video, or audio."""
    if not media:
        raise HTTPException(status_code=400, detail="A media file is required.")
    
    media_kind = _resolve_media_kind(media)
    original_name = media.filename or media.content_type or "sticker"
    
    try:
        if media_kind == "image":
            image_bytes = await media.read()
            if not image_bytes:
                raise HTTPException(status_code=400, detail="Uploaded image is empty.")
            sticker_buffer = _generate_static_sticker(image_bytes)
            download_name = _sanitize_filename(original_name, ".webp")
            return StreamingResponse(
                sticker_buffer,
                media_type="image/webp",
                headers={"Content-Disposition": f'attachment; filename="{download_name}"'},
            )
        
        temp_path: Optional[str] = None
        try:
            temp_path = await _persist_upload_to_temp(media)
            
            if media_kind == "video":
                sticker_buffer = _generate_video_sticker(temp_path)
                download_name = _sanitize_filename(original_name, ".webp")
                return StreamingResponse(
                    sticker_buffer,
                    media_type="image/webp",
                    headers={"Content-Disposition": f'attachment; filename="{download_name}"'},
                )
            
            if media_kind == "audio":
                audio_bytes = _generate_audio_preview(temp_path)
                download_name = _sanitize_filename(original_name, ".mp3")
                audio_buffer = io.BytesIO(audio_bytes)
                audio_buffer.seek(0)
                return StreamingResponse(
                    audio_buffer,
                    media_type="audio/mpeg",
                    headers={"Content-Disposition": f'attachment; filename="{download_name}"'},
                )
        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
        
        raise HTTPException(status_code=400, detail="Unable to determine media type for processing.")
    
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error generating WhatsApp sticker: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create WhatsApp sticker.")

# ─────────────────────────────────────────────────────────────────────────────
# AWS Polly Text-to-Speech
# ─────────────────────────────────────────────────────────────────────────────

# @app.get("/voices")
# async def get_voices():
#     """Get list of available AWS Polly voices."""
#     params = {}
#     voices = []
    
#     while True:
#         try:
#             response = polly.describe_voices(**params)
#             voices.extend(response.get("Voices", []))
#             if "NextToken" not in response:
#                 break
#             params["NextToken"] = response["NextToken"]
#         except (BotoCoreError, ClientError) as e:
#             raise HTTPException(status_code=500, detail=f"Error fetching voices: {str(e)}")
    
#     return JSONResponse(content=voices)


# class TextToSpeechRequest(BaseModel):
#     text: str
#     voiceId: str = "Brian"
#     outputFormat: str = "mp3"


# @app.post("/read")
# async def read_text_post(request: TextToSpeechRequest):
#     """Convert text to speech using AWS Polly (POST)."""
#     if request.outputFormat not in AUDIO_FORMATS:
#         raise HTTPException(status_code=400, detail="Invalid output format")
    
#     try:
#         ssml_text = f"<speak><prosody rate='115%'>{request.text}</prosody></speak>"
#         response = polly.synthesize_speech(
#             Text=ssml_text,
#             TextType="ssml",
#             VoiceId=request.voiceId,
#             OutputFormat=request.outputFormat,
#             Engine="neural"
#         )
#         audio_stream = response.get("AudioStream")
        
#         if not audio_stream:
#             raise HTTPException(status_code=500, detail="Error generating speech - no AudioStream returned")
        
#         def iterfile():
#             with closing(audio_stream) as stream:
#                 while True:
#                     data = stream.read(CHUNK_SIZE)
#                     if not data:
#                         break
#                     yield data
        
#         return StreamingResponse(
#             iterfile(),
#             media_type=AUDIO_FORMATS[request.outputFormat],
#             headers={"Content-Disposition": f"attachment; filename=speech.{request.outputFormat}"}
#         )
#     except (BotoCoreError, ClientError) as e:
#         raise HTTPException(status_code=500, detail=f"Error synthesizing speech: {str(e)}")
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


# @app.get("/read")
# async def read_text_get(
#     text: str = Query(..., description="Text to convert to speech"),
#     voiceId: str = Query("Brian", description="Voice ID from /voices endpoint"),
#     outputFormat: str = Query("mp3", enum=list(AUDIO_FORMATS.keys()))
# ):
#     """Convert text to speech using AWS Polly (GET)."""
#     try:
#         if outputFormat not in AUDIO_FORMATS:
#             raise HTTPException(status_code=400, detail="Invalid output format")
        
#         ssml_text = f"<speak><prosody rate='115%'>{text}</prosody></speak>"
#         response = polly.synthesize_speech(
#             Text=ssml_text,
#             TextType="ssml",
#             VoiceId=voiceId,
#             OutputFormat=outputFormat,
#             Engine="neural"
#         )
#         audio_stream = response.get("AudioStream")
        
#         if not audio_stream:
#             raise HTTPException(status_code=500, detail="Error generating speech")
        
#         def iterfile():
#             with closing(audio_stream) as stream:
#                 while True:
#                     data = stream.read(CHUNK_SIZE)
#                     if not data:
#                         break
#                     yield data
        
#         return StreamingResponse(
#             iterfile(),
#             media_type=AUDIO_FORMATS[outputFormat],
#             headers={"Content-Disposition": f"attachment; filename=speech.{outputFormat}"}
#         )
#     except (BotoCoreError, ClientError) as e:
#         raise HTTPException(status_code=500, detail=f"Error synthesizing speech: {str(e)}")

# ─────────────────────────────────────────────────────────────────────────────
# Entry Point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    api_host = os.getenv("API_HOST", "0.0.0.0")
    api_port = int(os.getenv("API_PORT", "8000"))
    uvicorn.run(app, host=api_host, port=api_port)
