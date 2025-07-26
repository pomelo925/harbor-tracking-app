from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from streamer import VideoStreamer
import cv2
import time
import json
from PIL import Image
from typing import Optional
from predictor import Predictor  # 假設你已有一個 Predictor 類別
from urllib.parse import quote

app = FastAPI()

# ✅ 加入 CORS 中介層
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 若你只從 localhost:3000 呼叫，也可以寫成 ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 串流資訊設定
USERNAME = "administrator"
PASSWORD = "!QAZ%TGB!@#"
IP = "220.130.177.161"
PORT = "55756"
CAMERA_ID = "233576_72ce8b9e-be75-4166-a57c-5f128883e7f1"
QUALITY = "medium"
AUDIO = "0"

# 編碼帳密並產生 URL
url = (
    f"https://{quote(USERNAME)}:{quote(PASSWORD)}@{IP}:{PORT}"
    f"/Acs/Streaming/Video/Live/Mp4/?camera={CAMERA_ID}&quality={QUALITY}&audio={AUDIO}"
)

# 建立 VideoStreamer 實例
streamer = VideoStreamer(url)

# 初始化辨識器
predictor = Predictor(model_path="../yolov12-ws/best.pt")

@app.get("/video_feed")
def video_feed():
    def gen():
        while True:
            frame = streamer.get_frame()
            if frame is None:
                continue
            _, jpeg = cv2.imencode(".jpg", frame)
            yield (b"--frame\r\n"
                   b"Content-Type: image/jpeg\r\n\r\n" + jpeg.tobytes() + b"\r\n")
            time.sleep(0.04)  # 約 25fps
    return StreamingResponse(gen(), media_type="multipart/x-mixed-replace; boundary=frame")


@app.get("/predict/stream")
def predict_stream(
    confidence_threshold: float = 0.25,
    max_det: int = 100,
    classes: Optional[str] = None
):
    frame = streamer.get_frame()
    if frame is None:
        return {"results": [], "error": "No frame available"}

    # 轉為 PIL Image（如有需要）
    img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(img_rgb)

    # 處理類別參數
    parsed_classes = None
    if classes:
        try:
            parsed_classes = json.loads(classes)
        except:
            try:
                parsed_classes = [int(x.strip()) for x in classes.split(",")]
            except:
                parsed_classes = None

    # 執行推論
    results, _ = predictor.predict_image_with_image(
        image_bytes=cv2.imencode('.jpg', frame)[1].tobytes(),
        confidence_threshold=confidence_threshold,
        classes=parsed_classes,
        max_det=max_det
    )
    return {"results": results}
