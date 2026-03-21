import os
import cv2
import numpy as np
import logging
import time
import uuid
import tempfile
import contextlib
from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from ultralytics import YOLO
from huggingface_hub import hf_hub_download
from dotenv import load_dotenv
from pydantic import BaseModel

# ------------------ Logging & Setup ------------------
# We use standard logging for production-ready debugging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ParkingAI")

# Disable ultra-verbose output from YOLO and CV2 to keep logs clean
logging.getLogger("ultralytics").setLevel(logging.ERROR)
os.environ["YOLO_VERBOSE"] = "false"

load_dotenv()

# Pre-create static folder for processed assets
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)

# ------------------ Model Helper ------------------
def load_yolo_model():
    """Heavy model loader with error protection"""
    local_path = os.path.join(os.path.dirname(__file__), "model", "best.pt")
    
    try:
        logger.info("🔄 Attempting to load YOLO model from Hugging Face...")
        path = hf_hub_download(
            repo_id="FGArmy/Parking_AI",
            filename="best.pt",
            token=os.getenv("HF_TOKEN")
        )
        model = YOLO(path)
        logger.info(f"✅ Model loaded successfully from HF: {path}")
        return model
    except Exception as e:
        logger.error(f"❌ Hugging Face model load failed: {e}")
        
        # Fallback to local file if HF fails
        if os.path.exists(local_path):
            logger.info(f"✅ Falling back to local model at: {local_path}")
            try:
                return YOLO(local_path)
            except Exception as e2:
                logger.error(f"❌ Local model load also failed: {e2}")
        
        logger.error("⚠️ CRITICAL: No model available. API will start but inference will fail.")
        return None

# ------------------ Lifespan (Modern Startup/Shutdown) ------------------
# We use Lifespan instead of the older @app.on_event to ensure 
# the model is loaded exactly once and the state is held correctly.
@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup Sequence
    logger.info("🚀 Starting Parking AI Backend Engine...")
    app.state.model = load_yolo_model()
    
    if app.state.model:
        logger.info("📡 YOLO inference engine is ONLINE.")
    else:
        logger.warning("🚫 YOLO inference engine is OFFLINE.")
        
    yield
    
    # Shutdown Sequence
    logger.info("🛑 Shutting down Parking AI Backend Engine...")

# ------------------ App Initialization ------------------
app = FastAPI(
    title="Parking AI API",
    description="Scalable parking detection backend",
    version="1.1.0",
    lifespan=lifespan
)

# Serve static files (processed videos)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Enable CORS for frontend connectivity
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------ API Endpoints ------------------

@app.get("/health")
async def health(request: Request):
    """Confirm server and model availability"""
    model_ready = hasattr(request.app.state, "model") and request.app.state.model is not None
    return {
        "status": "online",
        "model_loaded": model_ready,
        "timestamp": int(time.time()),
        "info": "ParkAI v1.1.0"
    }

@app.post("/detect/upload")
async def detect_upload(request: Request, media: UploadFile = File(...)):
    """Inference endpoint for images and videos"""
    try:
        # Access the singleton model from app state
        model = request.app.state.model
        if model is None:
            return {"error": "AI model is not loaded on the server. Contact administrator."}

        contents = await media.read()
        if not contents:
            return {"error": "Empty file received"}

        # --- 🎥 Handle Video Uploads ---
        if media.content_type and media.content_type.startswith("video/"):
            logger.info(f"🎥 Processing video: {media.filename}")
            temp_id = str(uuid.uuid4())
            out_filename = f"out_{temp_id}.webm"
            out_path = os.path.join(static_dir, out_filename)
            
            # Use a secure temp file to avoid OneDrive sync conflicts
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
                tmp.write(contents)
                temp_path = tmp.name
                
            cap = cv2.VideoCapture(temp_path)
            fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            # VP8 codec for standard browser playback
            fourcc = cv2.VideoWriter_fourcc(*'vp80')
            out = cv2.VideoWriter(out_path, fourcc, fps, (width, height))
            
            total_frames = 0
            empty_sum = 0
            occupied_sum = 0
            
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret: break
                    
                # Run inference on frame
                frame_results = model(frame, verbose=False)[0]
                total_frames += 1
                
                f_empty = 0
                f_occupied = 0
                for box, cls in zip(frame_results.boxes.xyxy, frame_results.boxes.cls):
                    cls = int(cls)
                    x1, y1, x2, y2 = [int(v) for v in box]
                    color = (0, 255, 0) if cls == 0 else (0, 0, 255)
                    if cls == 0: f_empty += 1
                    else: f_occupied += 1
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 3)
                    
                empty_sum += f_empty
                occupied_sum += f_occupied
                out.write(frame)
                
            cap.release()
            out.release()
            
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
            return {
                "empty": empty_sum // max(1, total_frames),
                "occupied": occupied_sum // max(1, total_frames),
                "total": (empty_sum + occupied_sum) // max(1, total_frames),
                "videoUrl": f"http://127.0.0.1:3001/static/{out_filename}"
            }

        # --- 🖼️ Handle Image Uploads ---
        logger.info(f"🖼️ Processing image: {media.filename}")
        npimg = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        if img is None:
            return {"error": "Invalid image format"}

        results = model(img)[0]

        empty = 0
        occupied = 0
        boxes = []
        classes = []

        for box, cls in zip(results.boxes.xyxy, results.boxes.cls):
            cls = int(cls)
            if cls == 0: empty += 1
            else: occupied += 1
            boxes.append([float(x) for x in box])
            classes.append(cls)

        return {
            "empty": empty,
            "occupied": occupied,
            "total": empty + occupied,
            "boxes": boxes,
            "classes": classes
        }

    except Exception as e:
        logger.error(f"❌ SERVER ERROR during detection: {str(e)}")
        return {"error": f"Internal Server Error: {str(e)}"}

# ------------------ Secondary Endpoints ------------------

@app.get("/api/stats")
async def get_stats():
    return {
        "avgOccupancy": 78,
        "peakHours": "10:00 AM - 2:00 PM",
        "busiestDay": "Thursday",
        "totalSlots": 150,
        "currentOccupied": 108,
        "currentAvailable": 42,
        "weeklyTrend": [
            {"day": "Mon", "value": 65}, {"day": "Tue", "value": 80}, {"day": "Wed", "value": 75},
            {"day": "Thu", "value": 95}, {"day": "Fri", "value": 90}, {"day": "Sat", "value": 40}, {"day": "Sun", "value": 30},
        ],
        "systemHealth": [
            {"name": "Camera 1", "status": "online", "uptime": 99.9},
            {"name": "Camera 2", "status": "online", "uptime": 99.8},
            {"name": "API Service", "status": "online", "uptime": 100.0},
        ]
    }

@app.get("/api/logs")
async def get_logs(page: int = 1, limit: int = 10):
    logs = []
    for i in range(15):
        logs.append({
            "id": f"log-{int(time.time()*1000)-i*1000}",
            "timestamp": "2026-03-21T10:00:00Z",
            "status": "success",
            "detectedCount": 42,
            "available": 12,
        })
    start = (page - 1) * limit
    end = page * limit
    return {"data": logs[start:end], "total": len(logs)}

# ------------------ Main Server Entry Point ------------------
if __name__ == "__main__":
    import uvicorn
    # FOR PRODUCTION/STABILITY: 
    # Use direct instance loading instead of string format to bypass re-import loops.
    # We also disable reload here, or recommend running CLI with --reload-exclude "static"
    logger.info("🚀 Launching ParkAI server on http://127.0.0.1:3001")
    uvicorn.run(app, host="127.0.0.1", port=3001)