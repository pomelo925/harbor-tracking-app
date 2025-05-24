from ultralytics import YOLO

# -----------------------------
# 使用者自訂參數區
# -----------------------------

# 欲使用的模型權重（.pt）
MODEL_WEIGHT_PATH = '/ultralytics/pretrain-weights/yolov12s.pt'

# 驗證或推論用的圖片路徑
TEST_IMAGE_PATH = '/home/datasets/vehicle-human.yolov12/human_2586.jpg'

# 顯示物件框的置信度門檻
CONFIDENCE_THRESHOLD = 0.5

# 推論使用的設備
DEVICE = "0"


# -----------------------------
# 主程式邏輯
# -----------------------------

# 載入模型
model = YOLO(MODEL_WEIGHT_PATH)

# 設定設備
model.to(DEVICE)

# 推論單張圖片
results = model.predict(
    source=TEST_IMAGE_PATH,
    conf=CONFIDENCE_THRESHOLD,
    save=True,       # 儲存圖片到 runs/predict/ 下
    save_txt=False,   # 儲存結果 txt 檔
    imgsz=640,
    device=DEVICE,
    show=True        # 彈出圖片視窗（如在有圖形介面的環境）
)

# 顯示基本資訊
print("推論完成，結果儲存在:", results[0].save_dir)
