from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from predictor import Predictor
from io import BytesIO
import base64
from PIL import Image
import json
from typing import Optional, List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = Predictor("/home/yolov12-ws/best.pt")

@app.post("/predict/image")
async def predict_image(
    file: UploadFile = File(...),
    confidence_threshold: float = Form(0.25),
    max_det: int = Form(300),
    classes: Optional[str] = Form(None)
):
    image_bytes = await file.read()
    
    # Parse classes if provided
    parsed_classes = None
    if classes:
        try:
            parsed_classes = json.loads(classes)
        except json.JSONDecodeError:
            # If JSON parsing fails, try to parse as comma-separated values
            try:
                parsed_classes = [int(x.strip()) for x in classes.split(',') if x.strip()]
            except ValueError:
                parsed_classes = None
    
    # Call predictor with additional parameters
    detection_results, plot_pil = predictor.predict_image_with_image(
        image_bytes,
        confidence_threshold=confidence_threshold,
        classes=parsed_classes,
        max_det=max_det
    )

    # Convert PIL image to base64 string
    buffered = BytesIO()
    plot_pil.save(buffered, format="JPEG")
    img_str = base64.b64encode(buffered.getvalue()).decode()

    return {
        "results": detection_results,
        "image_base64": img_str,
        "settings_used": {
            "confidence_threshold": confidence_threshold,
            "max_det": max_det,
            "classes": parsed_classes
        }
    }