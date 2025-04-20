from ultralytics import YOLO

model = YOLO('/ultralytics/pretrain-weights/yolov12s.pt')

# Train the model
results = model.train(
  data='/ultralytics/datasets/vehicle.yolov12/data.yaml',
  epochs=1200, 
  batch=256, 
  imgsz=640,
  scale=0.9,  # S:0.9; M:0.9; L:0.9; X:0.9
  mosaic=1.0,
  mixup=0.05,  # S:0.05; M:0.15; L:0.15; X:0.2
  copy_paste=0.15,  # S:0.15; M:0.4; L:0.5; X:0.6
  device="0",
)

# Evaluate model performance on the validation set
metrics = model.val()

# Perform object detection on an image
results = model("/ultralytics/datasets/truck.jpg")
results[0].show()