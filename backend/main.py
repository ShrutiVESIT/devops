from PyPDF2 import PdfReader, PdfWriter
from fastapi import FastAPI, File, Form, HTTPException, Query,  UploadFile
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse
# from pytube import YouTube
# from pytube.exceptions import VideoUnavailable, RegexMatchError
# import yt_dlp
from urllib.parse import urlparse, parse_qs
# from io import BytesIO
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from sklearn.cluster import KMeans
from PIL import Image, ImageOps
import numpy as np
from collections import namedtuple
from typing import List
# from io import BytesIO
# from boto3 import Session
# from botocore.exceptions import BotoCoreError, ClientError
from contextlib import closing
from pathlib import Path
from dotenv import load_dotenv
import os
import yfinance as yf
from pydantic import BaseModel
# from transformers import AutoModelForCausalLM, AutoTokenizer
# from google.generativeai import GenerativeModel
# import google.generativeai as genai
import instaloader
import os
import tempfile
import json
import uuid
import re
import logging
from pathlib import Path
import io
import tempfile
import requests
from typing import List, Optional
from difflib import get_close_matches
from functools import lru_cache
import asyncio
from typing import Dict, List, Set
from cachetools import TTLCache, cached
from time import sleep
from filelock import FileLock
from cache_handler import StockCache
import time

from moviepy.editor import AudioFileClip, VideoFileClip

# Pillow dropped legacy resampling constants; restore them for moviepy compatibility
if not hasattr(Image, "ANTIALIAS"):
    Image.ANTIALIAS = Image.Resampling.LANCZOS  # type: ignore[attr-defined]

# Variables for polly speech synthesis
ResponseStatus = namedtuple("HTTPStatus",
                            ["code", "message"])

ResponseData = namedtuple("ResponseData",
                          ["status", "content_type", "data_stream"])
AUDIO_FORMATS = {"ogg_vorbis": "audio/ogg",
                 "mp3": "audio/mpeg",
                 "pcm": "audio/wave; codecs=1"}
CHUNK_SIZE = 1024
HTTP_STATUS = {"OK": ResponseStatus(code=200, message="OK"),
               "BAD_REQUEST": ResponseStatus(code=400, message="Bad request"),
               "NOT_FOUND": ResponseStatus(code=404, message="Not found"),
               "INTERNAL_SERVER_ERROR": ResponseStatus(code=500, message="Internal server error")}
PROTOCOL = "http"
ROUTE_INDEX = "/"
ROUTE_VOICES = "/voices"
ROUTE_READ = "/read"
ROUTE_COMPRESS = "/compress_image"
MAX_STICKER_DIMENSION = 512
MAX_VIDEO_DURATION_SECONDS = 6
MAX_AUDIO_DURATION_SECONDS = 15
IMAGE_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
}
VIDEO_MIME_TYPES = {
    "video/mp4",
    "video/quicktime",
    "video/webm",
    "video/x-matroska",
}
AUDIO_MIME_TYPES = {
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/ogg",
    "audio/x-m4a",
    "audio/mp4",
}

# COMMON_STOCKS = {
#     "HDFC": ["HDFCBANK.NS", "HDFC.NS"],
#     "TATA": ["TATASTEEL.NS", "TATAMOTORS.NS", "TATAPOWER.NS", "TCS.NS"],
#     "RELIANCE": ["RELIANCE.NS"],
#     "ICICI": ["ICICIBANK.NS"],
#     "SBI": ["SBIN.NS"],
#     "AXIS": ["AXISBANK.NS"],
#     # Add more common mappings
# }

# COMPANY_MAPPINGS = {
#     # Common name variations -> Ticker symbols
#     "HDFC BANK": ["HDFCBANK.NS", "HDFCBANK.BO"],
#     "HDFC": ["HDFC.NS", "HDFC.BO"],
#     "TATA STEEL": ["TATASTEEL.NS", "TATASTEEL.BO"],
#     "TATA MOTORS": ["TATAMOTORS.NS", "TATAMOTORS.BO"],
#     "RELIANCE": ["RELIANCE.NS", "RELIANCE.BO"],
#     "INFOSYS": ["INFY.NS", "INFY.BO"],
#     "TCS": ["TCS.NS", "TCS.BO"],
#     "STATE BANK": ["SBIN.NS", "SBIN.BO"],
#     "SBI": ["SBIN.NS", "SBIN.BO"],
# }

# session = Session(profile_name="default")
# polly = session.client("polly")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
    
# TICKERS = {
#     "bob": "BANKBARODA.BO",
#     "tata_steel": "TATASTEEL.BO",
#     "reliance": "RELIANCE.BO",
#     "infosys": "INFY.BO",
#     "hdfc": "HDFCBANK.NS",
#     "yes": "YESBANK.NS",
#     "vak": "VAKRANGEE.BO",
#     "cbki": "CENTRALBK.BO",
#     "zom": "ZOMATO.NS",
    
# }

load_dotenv()
# GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
# genai.configure(api_key=GOOGLE_API_KEY)

# def list_available_models():
#     try:
#         models = genai.list_models()
#         for model in models:
#             print(f"Model Name: {model.name}, Generation Methods: {model.supported_generation_methods}")
#     except Exception as e:
#         print(f"Error listing models: {str(e)}")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)
def extract_shortcode(url: str) -> str:
    """Extract the shortcode from an Instagram URL."""
    # Pattern to match various Instagram URL formats, including URLs with query parameters
    patterns = [
        r'instagram.com/reel/([A-Za-z0-9_-]+)',
        r'instagram.com/reels/([A-Za-z0-9_-]+)',
        r'instagram.com/p/([A-Za-z0-9_-]+)',
        r'instagram.com/tv/([A-Za-z0-9_-]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            # Extract the shortcode and remove any query parameters
            shortcode = match.group(1).split("/")[0].split("?")[0]
            return shortcode
    
    raise ValueError("Could not extract shortcode from URL")


def get_video_url(shortcode: str) -> str:
    """Get the direct video URL from an Instagram post shortcode."""
    try:
        # Initialize instaloader
        L = instaloader.Instaloader(
            download_videos=False,  # Don't download, just get URL
            download_video_thumbnails=False,
            download_geotags=False,
            download_comments=False,
            save_metadata=False,
            compress_json=False,
            post_metadata_txt_pattern=""
        )
        
        # Get the post
        post = instaloader.Post.from_shortcode(L.context, shortcode)
        
        # Check if post has video
        if not post.is_video:
            raise ValueError("This Instagram post does not contain a video")
            
        # Get video URL
        return post.video_url
    
    except instaloader.exceptions.InstaloaderException as e:
        logger.error(f"Instaloader error: {str(e)}")
        raise ValueError(f"Instagram error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise ValueError(f"Failed to get video URL: {str(e)}")

# @app.post("/download_reel/")
# async def download_reel(reel_url: str = Form(...)):
#     """
#     Download and stream an Instagram reel from the provided URL.
    
#     Parameters:
#     - reel_url: URL of the Instagram reel to download
    
#     Returns:
#     - StreamingResponse with the video file
#     """
#     try:
#         # Validate URL
#         if not re.match(r'https?://(www\.)?instagram\.com/(p|reels|tv)/', reel_url):
#             logger.warning(f"Invalid URL format: {reel_url}")
#             raise HTTPException(status_code=400, detail="Invalid Instagram URL format")
        
#         logger.info(f"Processing download request for: {reel_url}")
        
#         # Extract shortcode
#         shortcode = extract_shortcode(reel_url)
#         logger.info(f"Extracted shortcode: {shortcode}")
        
#         # Get direct video URL
#         video_url = get_video_url(shortcode)
#         logger.info(f"Retrieved video URL for shortcode: {shortcode}")
        
#         # Request the video content
#         response = requests.get(video_url, stream=True)
#         if response.status_code != 200:
#             logger.error(f"Failed to download video, status code: {response.status_code}")
#             raise HTTPException(status_code=500, detail="Failed to download video from Instagram")
        
#         # Generate a filename
#         filename = f"instagram_reel_{shortcode}.mp4"
        
#         # Create an iterator for the content
#         def iterfile():
#             yield from response.iter_content(chunk_size=10240)
        
#         # Return a streaming response
#         return StreamingResponse(
#             iterfile(),
#             media_type="video/mp4",
#             headers={
#                 "Content-Disposition": f'attachment; filename="{filename}"'
#             }
#         )
    
#     except ValueError as e:
#         logger.error(f"Value error: {str(e)}")
#         raise HTTPException(status_code=400, detail=str(e))
#     except Exception as e:
#         logger.error(f"Unexpected error in endpoint: {str(e)}", exc_info=True)
#         raise HTTPException(status_code=500, detail=f"Error downloading reel: {str(e)}")



# youtube downloader code
# 1
# logger = logging.getLogger(__name__)
# logging.basicConfig(level=logging.INFO)

def validate_youtube_short_url(url: str) -> bool:
    """Validate if the URL is a YouTube Shorts link."""
    return re.match(r'https?://(www\.)?youtube\.com/shorts/[A-Za-z0-9_-]+', url) is not None

def normalize_youtube_url(url: str) -> str:
    """Convert shorts URL to watch format for pytube compatibility."""
    match = re.match(r'https?://(www\.)?youtube\.com/shorts/([A-Za-z0-9_-]+)', url)
    if match:
        video_id = match.group(2)
        return f"https://www.youtube.com/watch?v={video_id}"
    return url

def extract_youtube_video(url: str):
    """Extract video stream from YouTube Shorts URL and write to BytesIO buffer."""
    try:
        normalized_url = normalize_youtube_url(url)
        yt = YouTube(normalized_url)

        stream = yt.streams.filter(progressive=True, file_extension='mp4').order_by('resolution').desc().first()
        if not stream:
            raise ValueError("No suitable video stream found.")

        logger.info(f"Selected stream: {stream.resolution}, {stream.mime_type}")

        buffer = io.BytesIO()
        stream.stream_to_buffer(buffer)
        buffer.seek(0)

        return buffer, yt.title
    except Exception as e:
        logger.error(f"Error extracting video: {str(e)}")
        raise

@app.get("/download_youtube_short/")
async def download_youtube_short(video_url: str = Query(...)):
    """
    Download and stream a YouTube Shorts video.
    """
    try:
        if not validate_youtube_short_url(video_url):
            logger.warning(f"Invalid YouTube Shorts URL format: {video_url}")
            raise HTTPException(status_code=400, detail="Invalid YouTube Shorts URL")

        logger.info(f"Processing YouTube Shorts download request: {video_url}")
        buffer, title = extract_youtube_video(video_url)

        safe_title = re.sub(r'[\\/*?:"<>|]', "", title)
        filename = f"{safe_title or 'youtube_short'}.mp4"

        return StreamingResponse(
            buffer,
            media_type="video/mp4",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )

    except Exception as e:
        logger.error(f"Error in YouTube Shorts endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error downloading YouTube Shorts: {str(e)}")

def parse_page_ranges(page_numbers: str, total_pages: int) -> List[int]:
    pages = set()
    ranges = page_numbers.replace(" ", "").split(",")
    
    for r in ranges:
        if '-' in r:
            start, end = map(int, r.split('-'))
            if start > end or end > total_pages:
                raise HTTPException(400, "Invalid page range")
            pages.update(range(start, end+1))
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
    try:
        # Validate file type
        if file.content_type != "application/pdf":
            raise HTTPException(400, "Only PDF files allowed")

        # Process PDF
        contents = await file.read()
        reader = PdfReader(io.BytesIO(contents))
        total = len(reader.pages)
        
        # Parse page numbers with range support
        pages_to_remove = parse_page_ranges(page_numbers, total)
        
        # Create modified PDF
        writer = PdfWriter()
        for i in range(total):
            if (i+1) not in pages_to_remove:
                writer.add_page(reader.pages[i])

        # Streaming response
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


@app.post("/convert-to-pdf/")
async def convert_images_to_pdf(images: List[UploadFile] = File(...)):
    # Check if any images were uploaded
    if not images:
        raise HTTPException(status_code=400, detail="No images uploaded")
    
    # Check if the number of images exceeds the maximum allowed
    if len(images) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 images allowed")
    
    try:
        # Load all images
        pil_images = []
        for img_file in images:
            # Read the image content
            content = await img_file.read()
            
            # Open the image with PIL
            try:
                img = Image.open(io.BytesIO(content))
                # Convert to RGB if image is in RGBA mode (e.g., PNGs with transparency)
                if img.mode == 'RGBA':
                    img = img.convert('RGB')
                pil_images.append(img)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid image format: {str(e)}")
        
        # Check if we have any valid images
        if not pil_images:
            raise HTTPException(status_code=400, detail="No valid images found")
        
        # Create a BytesIO object to store the PDF in memory
        pdf_buffer = io.BytesIO()
        
        # Get the first image
        first_img = pil_images[0]
        
        # Save the first image and append the rest to create a PDF
        if len(pil_images) == 1:
            first_img.save(pdf_buffer, "PDF")
        else:
            first_img.save(pdf_buffer, "PDF", save_all=True, append_images=pil_images[1:])
        
        # Reset the buffer position to the start
        pdf_buffer.seek(0)
        
        # Return the PDF as a streaming response
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=converted_images.pdf"
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating PDF: {str(e)}")
    
# @app.post("/analyze_stock")
# async def analyze_stock(company_data: dict):
#     try:
#         num_stocks = company_data.get("num_stocks", 1)
#         model = GenerativeModel('models/gemini-2.0-flash')
        
#         prompt = f"""
#         Analyze this stock data as a financial expert. Provide clear, concise insights aimed to help assist make decisions.:
        
#         Company: {company_data.get('name', 'N/A')}
#         Sector: {company_data.get('sector', 'N/A')}
#         Current Price: {company_data.get('current_price', 'N/A')}
#         Market Cap: {company_data.get('market_cap', 'N/A')}
#         P/E Ratio: {company_data.get('pe_ratio', 'N/A')}
#         EPS: {company_data.get('eps', 'N/A')}
#         52-Week Range: {company_data.get('52_week_low', 'N/A')} - {company_data.get('52_week_high', 'N/A')}
#         Beta: {company_data.get('beta', 'N/A')}
#         Volume: {company_data.get('volume', 'N/A')}
#         Number of stocks to invest: {num_stocks}
        
#         Based on the number of stocks ({num_stocks}) and the current price, predict the potential impact on the user's investment and include this in your analysis.
        
#         Format your response in these sections:
#         1. Valuation Analysis
#         2. Technical Indicators
#         3. Risk Assessment
#         4. Investment Recommendation
#         do's:
#         1: Be concise and clear.
#         2. Provide actionable insights.
#         3. use logical and abstract reasoning.
#         dont's:
#         1. start with formal greetings.
#         2. Use more than 5000 characters.
#         3. Provide generic information.
#         """

#         response = model.generate_content(prompt)
#         return {"analysis": response.text}

#     except Exception as e:
#         print(f"Analysis error: {str(e)}")  # Add logging for debugging
#         raise HTTPException(status_code=500, detail=str(e))

# # @app.get("/companies")
# # async def get_company():
# #     details = []
# #     try:
# #         watchlist = load_watchlist()   
# #         # for name, ticker in TICKERS.items():
# #         for name, ticker in watchlist["tickers"].items():
# #             try:
# #                 stock = yf.Ticker(ticker)
# #                 info  = stock.info
# #                 if not info:
# #                     details.append({
# #                         "name": name,
# #                         "symbol": ticker,
# #                         "sector": "Unknown",
# #                         "website": "N/A",
# #                     })
# #                     continue
                
# #                 stock_details = {
# #                     "name": info.get("longName", name),
# #                     "symbol": ticker,
# #                     "sector": info.get("sector", "Unknown"),
# #                     "industry": info.get("industry", "Unknown"),
# #                     "website": info.get("website", "N/A"),
# #                     "market_cap": format_market_cap(info.get("marketCap", 0)),
# #                     "current_price": info.get("currentPrice", "N/A"),
# #                     "day_high": info.get("dayHigh", "N/A"),
# #                     "day_low": info.get("dayLow", "N/A"),
# #                     "52_week_high": info.get("fiftyTwoWeekHigh", "N/A"),
# #                     "52_week_low": info.get("fiftyTwoWeekLow", "N/A"),
# #                     "volume": info.get("volume", "N/A"),
# #                     "avg_volume": info.get("averageVolume", "N/A"),
# #                     "pe_ratio": info.get("trailingPE", "N/A"),
# #                     "eps": info.get("trailingEps", "N/A"),
# #                     "dividend_yield": info.get("dividendYield", "N/A"),
# #                     "beta": info.get("beta", "N/A"),
# #                     "previous_close": info.get("previousClose", "N/A"),
# #                     "open": info.get("open", "N/A"),
# #                     "currency": info.get("currency", "INR")
# #                 }
# #                 details.append(stock_details)
# #             except Exception as stock_error:
# #                 print(f"error fetching data for {name}: {str(stock_error)}")
# #                 details.append({
# #                     "name": name,
# #                     "symbol": ticker,
# #                     "sector": "Unknown",
# #                     "website": "N/A",
# #                 })
        
# #         return {"companies": details}
# #     except Exception as e:
# #         raise HTTPException(status_code=500, detail=f"Error fetching company data: {str(e)}")

# # def format_market_cap(value):
# #     if value >= 1_000_000_000_000:
# #         return f"${value/1_000_000_000_000:.1f}T"
# #     elif value >= 1_000_000_000:
# #         return f"${value/1_000_000_000:.1f}B"
# #     elif value >= 1_000_000:
# #         return f"${value/1_000_000:.1f}M"
# #     return f"${value:,}"

# # WATCHLIST_FILE = Path(__file__).parent / "watchlist.json"
# # WATCHLIST_LOCK = FileLock(str(WATCHLIST_FILE) + ".lock")

# # def load_watchlist():
# #     with WATCHLIST_LOCK:
# #         if not WATCHLIST_FILE.exists():
# #             default_watchlist = {"tickers": {}}
# #             with open(WATCHLIST_FILE, 'w') as f:
# #                 json.dump(default_watchlist, f)
# #             return default_watchlist
# #         try:
# #             with open(WATCHLIST_FILE, 'r') as f:
# #                 return json.load(f)
# #         except json.JSONDecodeError:
# #             logger.error("Corrupted watchlist file, creating new one")
# #             default_watchlist = {"tickers": {}}
# #             with open(WATCHLIST_FILE, 'w') as f:
# #                 json.dump(default_watchlist, f)
# #             return default_watchlist

# # def save_watchlist(watchlist):
# #     with WATCHLIST_LOCK:
# #         with open(WATCHLIST_FILE, 'w') as f:
# #             json.dump(watchlist, f, indent=4)

# # @app.post("/watchlist/add")
# # async def add_to_watchlist(symbol: str = Query(...), nickname: str = Query(...)):
# #     try:
# #         # Validate the stock symbol exists
# #         stock = yf.Ticker(symbol)
# #         info = stock.info
# #         if not info:
# #             raise HTTPException(status_code=400, detail="Invalid stock symbol")
        
# #         # Load current watchlist
# #         watchlist = load_watchlist()
        
# #         # Add new ticker
# #         watchlist["tickers"][nickname] = symbol
        
# #         # Save updated watchlist
# #         save_watchlist(watchlist)
        
#         return {"message": f"Added {symbol} to watchlist as {nickname}"}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @app.delete("/watchlist/remove/{nickname}")
# async def remove_from_watchlist(nickname: str):
#     try:
#         watchlist = load_watchlist()
#         if nickname in watchlist["tickers"]:
#             del watchlist["tickers"][nickname]
#             save_watchlist(watchlist)
#             return {"message": f"Removed {nickname} from watchlist"}
#         raise HTTPException(status_code=404, detail="Stock not found in watchlist")
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @app.get("/watchlist/search")
# async def search_stocks(query: str = Query(...)):
#     logger.info(f"Received search query: {query}")
#     try:
#         matches = []
#         query = query.upper()

#         if len(query) < 2:
#             return {"results": []}

#         # Batch process to avoid rate limits
#         symbols_to_check = [
#             f"{query}{suffix}" 
#             for suffix in ['.NS', '.BO']
#         ]

#         for symbol in symbols_to_check:
#             try:
#                 info = get_stock_info(symbol)
#                 if info and info.get("longName"):
#                     matches.append({
#                         "symbol": symbol,
#                         "name": info.get("longName"),
#                         "exchange": "NSE" if symbol.endswith(".NS") else "BSE",
#                         "current_price": info.get("currentPrice"),
#                         "currency": info.get("currency", "INR")
#                     })
#             except Exception as e:
#                 logger.warning(f"Error looking up {symbol}: {str(e)}")
#                 continue

#         return {"results": matches}

#     except Exception as e:
#         logger.error(f"Search error: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))

# @app.get("/watchlist")
# async def get_watchlist():
#     try:
#         watchlist = load_watchlist()
#         watchlist_items = []
        
#         for nickname, symbol in watchlist["tickers"].items():
#             try:
#                 stock = yf.Ticker(symbol)
#                 info = stock.info
#                 watchlist_items.append({
#                     "nickname": nickname,
#                     "symbol": symbol,
#                     "name": info.get("longName", symbol) if info else symbol
#                 })
#             except Exception as e:
#                 logger.error(f"Error fetching stock info for {symbol}: {str(e)}")
#                 watchlist_items.append({
#                     "nickname": nickname,
#                     "symbol": symbol,
#                     "name": symbol
#                 })
        
#         return {"watchlist": watchlist_items}
#     except Exception as e:
#         logger.error(f"Error fetching watchlist: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))

def compress_image(image: Image.Image, n_colors: int) -> Image.Image:
    # Convert image to numpy array
    img_np = np.array(image)
    if len(img_np.shape) == 2:
        # Convert grayscale to RGB by duplicating the channel 3 times
        img_np = np.stack((img_np,) * 3, axis=-1)
    elif len(img_np.shape) != 3:
        # Reject the image if it's neither 2D nor 3D
        raise ValueError("Image format not supported. Please upload an RGB or grayscale image.")  
    w, h, d = img_np.shape
    # Reshape the image into a 2D array of pixels
    img_reshaped = img_np.reshape(w * h, d)
    # Apply KMeans to find n_colors clusters
    kmeans = KMeans(n_clusters=n_colors)
    kmeans.fit(img_reshaped)
    # Replace each pixel value with the nearest cluster center
    compressed_img = kmeans.cluster_centers_[kmeans.labels_].reshape(w, h, d).astype('uint8')
    # Convert the compressed image back to PIL format
    compressed_image = Image.fromarray(compressed_img)
    return compressed_image

@app.post("/compress_image/")
async def compress_image_api(n_colors: str = Form(...), file: UploadFile = File(...)):
    # Convert n_colors to integer
    n_colors = int(n_colors)
    # Open the image file
    image = Image.open(io.BytesIO(await file.read()))
    # Perform image compression
    compressed_image = compress_image(image, n_colors)
    # Save the compressed image to a byte stream
    img_byte_arr = io.BytesIO()
    compressed_image.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    # Return the image as a streaming response with the proper header for file download
    return StreamingResponse(img_byte_arr, media_type="image/png", headers={
        "Content-Disposition": "attachment; filename=compressed_image.png"
    })

@app.post("/convert-ico/")
async def convert_to_ico(file: UploadFile = File(...)):
    # Accept more MIME type variations that browsers might send
    allowed_types = ['image/jpeg', 'image/png', 'image/jpg']
    content_type = (file.content_type or "").lower()
    
    # Also check file extension as fallback
    filename = file.filename or ""
    valid_extension = filename.lower().endswith(('.png', '.jpg', '.jpeg'))
    
    if content_type not in allowed_types and not valid_extension:
        raise HTTPException(status_code=400, detail=f"Only PNG/JPG files are allowed. Received: {content_type}")
    try:
        image = Image.open(io.BytesIO(await file.read()))
        ico_buffer =  io.BytesIO()
        image.save(ico_buffer, format="ICO")
        ico_buffer.seek(0)
        
        return StreamingResponse(ico_buffer, media_type="image/x-icon", headers={
        "Content-Disposition":  "attachment; filename=converted.ico"
    })
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Failed to convert image: {str(e)}")


def _sanitize_filename(original_name: Optional[str], extension: str) -> str:
    base_name = Path(original_name or "sticker").stem
    safe_base = re.sub(r"[^A-Za-z0-9._-]", "_", base_name) or "sticker"
    return f"{safe_base}{extension}"


def _resolve_media_kind(upload: UploadFile) -> str:
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
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image supplied: {exc}")

    sticker = ImageOps.fit(
        image,
        (MAX_STICKER_DIMENSION, MAX_STICKER_DIMENSION),
        Image.LANCZOS,
    )
    buffer = io.BytesIO()
    sticker.save(buffer, format="WEBP", lossless=True, quality=100, method=6)
    buffer.seek(0)
    return buffer


def _generate_video_sticker(temp_path: str) -> io.BytesIO:
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

@app.get("/voices")
async def get_voices():
    params = {}
    voices = []
    
    while True:
        try:
            response = polly.describe_voices(**params)
            voices.extend(response.get("Voices", []))
            if "NextToken" not in response:
                break
            params["NextToken"] = response["NextToken"]
        except (BotoCoreError, ClientError) as e:
            raise HTTPException(status_code=500, detail=f"Error fetching voices: {str(e)}")
    
    return JSONResponse(content=voices)

# Add this class before the /read endpoint
# Run the server with: uvicorn backend.main:app --reload


# copilot code for read endpoint
# Keep the existing TextToSpeechRequest class

# POST endpoint for text-to-speech
class TextToSpeechRequest(BaseModel):
    text: str
    voiceId: str = "Brian"  # Default to Brian British English
    outputFormat: str = "mp3"

@app.post("/read")
async def read_text_post(request: TextToSpeechRequest):
    print("DEBUG: Received POST request with text:")
    if request.outputFormat not in AUDIO_FORMATS:
        raise HTTPException(status_code=400, detail="Invalid output format")
    try:
        # Wrap the text in SSML to control speaking rate (115% faster)
        ssml_text = f"<speak><prosody rate='115%'>{request.text}</prosody></speak>"
        response = polly.synthesize_speech(
            Text=ssml_text,
            TextType="ssml",
            VoiceId=request.voiceId,
            OutputFormat=request.outputFormat,
            Engine="neural"
        )
        print("DEBUG: Polly response keys:", response.keys())
        audio_stream = response.get("AudioStream")

        if not audio_stream:
            raise HTTPException(
                status_code=500,
                detail="Error generating speech no AudioStream returned"
            )

        def iterfile():
            with closing(audio_stream) as stream:
                while True:
                    data = stream.read(CHUNK_SIZE)
                    if not data:
                        break
                    yield data

        return StreamingResponse(
            iterfile(),
            media_type=AUDIO_FORMATS[request.outputFormat],
            headers={
                "Content-Disposition": f"attachment; filename=speech.{request.outputFormat}"
            }
        )

    except (BotoCoreError, ClientError) as e:
        print("DEBUG: Polly error:", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Error synthesizing speech: {str(e)}"
        )
    except Exception as e:
        print("DEBUG: Unexpected error:", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )

# GET endpoint for text-to-speech


@app.get("/read")
async def read_text_get(
    text: str = Query(..., description="Text to convert to speech"),
    voiceId: str = Query("Brian", description="Voice ID from /voices endpoint"),
    outputFormat: str = Query("mp3", enum=list(AUDIO_FORMATS.keys()))
):
    try:
        if outputFormat not in AUDIO_FORMATS:
            raise HTTPException(status_code=400, detail="Invalid output format")

        # Wrap text in SSML prosody tag to increase speed (e.g. 115%)
        ssml_text = f"<speak><prosody rate='115%'>{text}</prosody></speak>"

        response = polly.synthesize_speech(
            Text=ssml_text,
            TextType="ssml",
            VoiceId=voiceId,
            OutputFormat=outputFormat,
            Engine="neural"
        )
        audio_stream = response.get("AudioStream")

        if not audio_stream:
            raise HTTPException(
                status_code=500,
                detail="Error generating speech"
            )

        def iterfile():
            with closing(audio_stream) as stream:
                while True:
                    data = stream.read(CHUNK_SIZE)
                    if not data:
                        break
                    yield data

        return StreamingResponse(
            iterfile(), 
            media_type=AUDIO_FORMATS[outputFormat],
            headers={
                "Content-Disposition": f"attachment; filename=speech.{outputFormat}"
            }
        )

    except (BotoCoreError, ClientError) as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error synthesizing speech: {str(e)}"
        )

class FollowupRequest(BaseModel):
    question: str
    company: dict

# @app.post("/followup")
# async def followup(request: FollowupRequest):
#     try:
#         # model = GenerativeModel('models/gemini-2.0-flash')
#         prompt = (
#             f"You are a financial expert. Given this company data:\n"
#             f"{json.dumps(request.company, indent=2)}\n"
#             f"Answer this follow-up question in a concise, actionable way:\n"
#             f"{request.question}\n"
#             f"Do not exceed 1000 characters."
#         )
#         response = model.generate_content(prompt)
#         return {"answer": response.text}
#     except Exception as e:
#         logger.error(f"Follow-up error: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))


# Add cache for stock info
stock_cache = StockCache()
RATE_LIMIT_DELAY = 0.5  # 500ms between requests

# @lru_cache(maxsize=1000)
# def get_stock_info(symbol: str) -> dict:
#     """Get stock info with caching and rate limiting"""
#     # Check Redis cache first
#     cached_data = stock_cache.get_stock_info(symbol)
#     if cached_data:
#         return cached_data

#     # Rate limiting
#     time.sleep(RATE_LIMIT_DELAY)

#     try:
#         stock = yf.Ticker(symbol)
#         info = stock.info
#         if info:
#             # Cache the result
#             stock_cache.set_stock_info(symbol, info)
#             return info
#     except Exception as e:
#         logger.error(f"Failed to fetch stock info for {symbol}: {str(e)}")
#         raise
#     return {}

# if __name__ == "__main__":
#     import uvicorn
#     api_host = os.getenv("API_HOST", "0.0.0.0")
#     api_port = int(os.getenv("API_PORT", "8000"))
#     uvicorn.run(app, host=api_host, port=api_port)