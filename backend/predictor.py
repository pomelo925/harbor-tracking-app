from ultralytics import YOLO
import cv2
import numpy as np
from typing import List

# 預設模型權重路徑
model = YOLO("/home/yolov12-ws/app/models/harbor-best.pt")  # 修改成你實際路徑

def predict_image(img_bytes: bytes) -> List[dict]:
    # 讀取圖像
    np_arr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    
    # 推論
    results = model(img)

    # 解析結果
    boxes = results[0].boxes
    output = []
    for box in boxes:
        output.append({
            "class": int(box.cls[0]),
            "label": model.names[int(box.cls[0])],
            "confidence": float(box.conf[0]),
            "bbox": box.xyxy[0].tolist()
        })

    return output