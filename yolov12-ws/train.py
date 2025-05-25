from ultralytics import YOLO

# -----------------------------
# 使用者自訂參數區
# -----------------------------

# 欲使用的模型權重（.pt）
MODEL_WEIGHT_PATH = '/ultralytics/pretrain-weights/yolov12s.pt'

# 資料集配置檔（data.yaml）
DATA_YAML_PATH = '/home/datasets/harbor-objects.yolov12/data.yaml'

# 訓練超參數
EPOCHS = 60
BATCH_SIZE = 16
IMAGE_SIZE = 640
SCALE = 0.9         # S:0.9; M:0.9; L:0.9; X:0.9
MOSAIC = 1.0
MIXUP = 0.05       # S:0.05; M:0.15; L:0.15; X:0.2
COPY_PASTE = 0.15   # S:0.15; M:0.4; L:0.5; X:0.6
DEVICE = "0"


# -----------------------------
# 主程式邏輯
# -----------------------------

# 載入模型
model = YOLO(MODEL_WEIGHT_PATH)

# 開始訓練
results = model.train(
    data=DATA_YAML_PATH,
    epochs=EPOCHS,
    batch=BATCH_SIZE,
    imgsz=IMAGE_SIZE,
    scale=SCALE,
    mosaic=MOSAIC,
    mixup=MIXUP,
    copy_paste=COPY_PASTE,
    device=DEVICE,
)

# 評估驗證集表現
metrics = model.val()