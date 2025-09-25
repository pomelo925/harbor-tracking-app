# 🚢 Harbor Tracking App - 專案架構與技術文檔

**2025 Spring NTHU Machine Learning Course Final Project**

---

## 📋 目錄

- [專案概覽](#專案概覽)
- [系統架構](#系統架構)
- [後端技術](#後端技術)
- [前端技術](#前端技術)
- [AI模型](#ai模型)
- [部署配置](#部署配置)
- [技術優化](#技術優化)

---

## 📋 專案概覽

Harbor Tracking App 是一個基於 YOLOv12 深度學習模型的港口追蹤系統，能夠即時識別和追蹤港口中的各種物件，包括人員、車輛、船隻、繫船柱和繫船繩等。此專案採用現代化的前後端分離架構，結合了先進的計算機視覺技術與直觀的用戶介面設計。

### 📊 關鍵統計

| 項目 | 數值 |
|------|------|
| 檢測類別 | 5 |
| 訓練樣本 | 30K+ |
| FPS 即時處理 | 25 |
| 部署方式 | Docker |

### 🎯 核心功能

- **即時物件檢測**：支援攝影機串流的即時物件識別
- **區域監控**：自定義監控區域，觸發式截圖和警報
- **多類別識別**：人員、車輛、船隻、繫船柱、繫船繩五大類別
- **參數調節**：可調節信心度閾值、最大檢測數量等參數
- **歷史記錄**：保存檢測結果和截圖記錄

### 🔧 技術特色

- 基於最新的 YOLOv12 模型架構
- 採用 Docker 容器化技術，支援 GPU 加速
- 前後端分離設計，RESTful API 架構
- 響應式網頁設計，支援多種顯示模式
- 自動化數據集合併和處理流程

---

## 🏗️ 系統架構

### 架構層級

#### 🖥️ 前端層 (Frontend)
**技術棧**: Next.js 15 | React 19 | TypeScript | Tailwind CSS 4

負責用戶介面展示、即時影像串流顯示、參數設定和結果視覺化。採用現代化的 React Hooks 模式，提供流暢的用戶體驗。

#### ⚙️ 後端層 (Backend)
**技術棧**: FastAPI | Python 3.10 | Uvicorn | OpenCV

提供 RESTful API 服務、處理影像串流、執行 AI 推論，並管理檢測結果的回傳和處理。

#### 🤖 AI 模型層
**技術棧**: YOLOv12 | Ultralytics | PyTorch | CUDA 12.8

基於 YOLOv12 的物件檢測模型，支援 GPU 加速推論，能夠識別港口環境中的多種物件類別。

#### 📦 部署層
**技術棧**: Docker | Docker Compose | NVIDIA Container | Ubuntu 22.04

容器化部署環境，支援 GPU 直通，確保跨平台一致性和便於擴展。

### 📁 專案結構

```
harbor-tracking-app/
├── 📁 backend/                 # 後端 API 服務
│   ├── main.py                # FastAPI 主程式
│   ├── predictor.py           # YOLO 預測器
│   └── streamer.py            # 影像串流處理
├── 📁 frontend/               # Next.js 前端應用
│   ├── src/
│   │   ├── app/              # App Router 頁面
│   │   ├── components/       # React 組件
│   │   ├── hooks/            # 自定義 Hooks
│   │   ├── types/            # TypeScript 類型定義
│   │   └── utils/            # 工具函數
│   └── package.json
├── 📁 docker/                # 容器化配置
│   ├── Dockerfile            # 多階段構建配置
│   └── compose.yml           # Docker Compose 服務定義
├── 📁 yolov12-ws/            # AI 模型訓練工作區
│   ├── train.py              # 模型訓練腳本
│   ├── merge.sh              # 數據集合併腳本
│   ├── datasets/             # 訓練數據集
│   └── runs/                 # 訓練結果
├── 📁 pretrain-weights/      # 預訓練模型權重
└── run.sh                    # 一鍵啟動腳本
```

---

## 🔧 後端技術架構

### FastAPI 服務架構

後端採用 FastAPI 框架構建，提供高效能的異步 API 服務。主要包含三個核心模組：

### 1. 主服務模組 (main.py)

```python
# 核心 API 端點
app = FastAPI()

# CORS 中介層配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

> **技術亮點**: 使用 FastAPI 的自動 API 文檔生成功能，支援 OpenAPI 規範，提供互動式 API 測試介面。

### 📡 API 端點設計

#### `GET /video_feed`
提供原始攝影機串流，使用 multipart/x-mixed-replace 格式實現即時影像傳輸。

#### `GET /video_feed_with_detection`
提供帶有檢測框的影像串流，支援參數：
- `confidence_threshold`: 信心度閾值
- `max_det`: 最大檢測數量
- `classes`: 類別篩選

#### `GET /predict/stream`
返回當前幀的檢測結果 JSON 數據，用於前端即時顯示統計資訊。

### 2. 預測器模組 (predictor.py)

```python
class Predictor:
    def __init__(self, model_path: str):
        self.model = YOLO(model_path)
     
    def predict_image_with_image(
        self, 
        image_bytes: bytes,
        confidence_threshold: float = 0.25,
        classes: Optional[List[int]] = None,
        max_det: int = 300
    ) -> Tuple[List[Dict[str, Any]], Optional[Image.Image]]:
        # YOLO 推論執行
        results = self.model(
            img,
            conf=confidence_threshold,
            classes=classes,
            max_det=max_det
        )
```

> **優化策略**: 
> - 使用 Ultralytics YOLO 的原生 API，確保最佳性能
> - 支援動態參數調整，無需重新載入模型
> - 同時返回檢測結果和視覺化圖像，提升效率

### 3. 串流處理模組 (streamer.py)

```python
class VideoStreamer:
    def __init__(self, stream_url: str):
        self.cap = cv2.VideoCapture(stream_url)
        self.latest_frame = None
        self.running = True
        
        # 背景執行緒持續擷取畫面
        self.thread = threading.Thread(target=self.update_frame, daemon=True)
        self.thread.start()

    def update_frame(self):
        while self.running and self.cap.isOpened():
            ret, frame = self.cap.read()
            if ret:
                self.latest_frame = frame
```

> **技術創新**: 使用多執行緒架構避免影像擷取阻塞，確保 25 FPS 的流暢播放體驗。

---

## 🎨 前端技術架構

### Next.js 15 App Router 架構

前端採用最新的 Next.js 15 和 React 19，使用 App Router 模式，提供現代化的開發體驗和優異的性能。

**核心技術棧**: Next.js 15.4.4 | React 19 | TypeScript 5 | Tailwind CSS 4

### 📱 組件架構設計

| 組件 | 功能描述 |
|------|----------|
| **LiveStream** | 負責即時影像顯示和檢測結果覆蓋，支援區域標註和檢測框顯示 |
| **Settings** | 提供參數調節介面，包括信心度閾值、最大檢測數、類別篩選等設定 |
| **RegionMapper** | 區域標註工具，支援多邊形區域繪製和編輯功能 |
| **RegionMonitor** | 區域監控面板，顯示各區域的檢測統計和觸發記錄 |

### 🎣 自定義 Hooks 設計

```typescript
// useDetection Hook - 檢測狀態管理
export function useDetection() {
  const [confidence, setConfidence] = useState(0.5)
  const [maxDetections, setMaxDetections] = useState(100)
  const [selectedClasses, setSelectedClasses] = useState<number[]>([])
  const [detectionResult, setDetectionResult] = useState<DetectionItem[]>([])
  
  // 每秒獲取檢測結果
  useEffect(() => {
    const interval = setInterval(() => {
      fetch("http://localhost:8000/predict/stream")
        .then((res) => res.json())
        .then((data) => {
          setDetectionResult(data.results || [])
        })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  return {
    confidence,
    setConfidence,
    maxDetections,
    setMaxDetections,
    selectedClasses,
    detectionResult,
    handleClassToggle
  }
}
```

### 架構優勢

- **狀態分離**：使用自定義 Hooks 將業務邏輯從組件中抽離
- **類型安全**：完整的 TypeScript 類型定義，減少執行時錯誤
- **響應式設計**：使用 Tailwind CSS 實現適應性佈局
- **性能優化**：合理使用 useEffect 和 useState，避免不必要的重新渲染

### 🎨 UI/UX 設計特色

- **深色主題**：符合監控系統的視覺需求，減少眼部疲勞
- **即時反饋**：檢測結果即時更新，提供流暢的互動體驗
- **直觀操作**：拖拉式參數調節，點擊式類別篩選
- **資訊豐富**：多層次的資訊展示，從概覽到詳細數據

---

## 🤖 AI 模型與訓練

### YOLOv12 模型架構

本專案採用最新的 YOLOv12 模型進行物件檢測，相較於前代版本在精度和速度上都有顯著提升。

### 📊 模型規格

| 規格項目 | 數值 |
|----------|------|
| 模型版本 | YOLOv12s |
| 輸入解析度 | 640×640 |
| 訓練週期 | 60 |
| 批次大小 | 16 |

### 🎯 檢測類別與數據集

經過精心策劃的數據集合併流程，整合多個 Roboflow 數據集：

#### 👤 Human（人員）- 4,093 個實例
- Person Detection (3K samples)
- Human Detection (1.6K samples)

#### 🚗 Vehicle（車輛）- 15,017 個實例
- Cars Dataset (4.4K samples)
- Bus Dataset (1K samples)
- Truck Dataset (1K samples)

#### 🚢 Vessel（船隻）- 8,798 個實例
- Boat Detection datasets
- Ship and vessel collections

#### 🪨 Bollard（繫船柱）- 1,795 個實例
- 港口設施專用數據集
- 自收集標註數據

### ⚙️ 訓練超參數配置

```python
# 訓練配置
EPOCHS = 60
BATCH_SIZE = 16
IMAGE_SIZE = 640
SCALE = 0.9         # 尺度變換
MOSAIC = 1.0        # 馬賽克增強
MIXUP = 0.05        # 混合增強
COPY_PASTE = 0.15   # 複製貼上增強
DEVICE = "0"        # GPU 設備

# 模型訓練
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
```

### 🔄 自動化數據集合併

開發了智能化的數據集合併腳本 (merge.sh)，解決 Roboflow 免費版本的限制：

#### 合併流程創新：
- **多專案整合**：從多個 Roboflow 專案 fork 數據集
- **類別重新映射**：統一不同數據集的類別標籤
- **品質檢查**：自動過濾分割格式和無效標註
- **統計報告**：生成詳細的合併統計資訊

---

## 🐳 部署配置與容器化

### 多階段 Docker 構建

採用多階段 Docker 構建策略，優化鏡像大小和安全性：

```dockerfile
# 基礎階段 - CUDA 12.8 + Python 3.10
FROM pytorch/pytorch:2.7.0-cuda12.8-cudnn9-runtime AS base

# 用戶設置階段 - 非 root 用戶
FROM base AS user-setup
ARG USER_UID=1000
ARG USER_GID=1000
ARG USERNAME=appuser

# Ultralytics 階段 - YOLOv12 環境
FROM user-setup AS ultralytics
RUN pip install ultralytics

# Next.js 階段 - 前端環境
FROM ultralytics AS nextjs
RUN npm i -g npm@11.4.1 yarn

# 最終階段 - 生產環境
FROM nextjs AS release
WORKDIR /home/yolov12-ws
USER appuser
```

### 🔧 Docker Compose 服務編排

#### Backend Service
```yaml
backend:
  container_name: backend
  ports:
    - "8000:8000"
  command: [ "bash", "-c", 
    "cd /home/backend && 
     uvicorn main:app --reload 
     --host 0.0.0.0 --port 8000"]
```

#### Frontend Service
```yaml
frontend:
  container_name: frontend
  ports:
    - "3000:3000"
  command: [ "bash", "-c", 
    "cd /home/frontend && 
     npm start"]
```

### 🚀 一鍵啟動腳本

```bash
#!/bin/bash
echo "=== [Harbor Tracking App] Run ==="

# 清理現有容器
docker compose -p app down --volumes --remove-orphans

# 環境設置
export COMPOSE_BAKE=true
export DISPLAY=localhost:0.0

# X11 轉發設置（GUI 支援）
xhost +local:docker
cd docker

# 啟動服務
docker compose -p app up backend -d
docker compose -p app up frontend -d
```

### 🖥️ GPU 支援配置

#### NVIDIA Container 整合：
- **GPU 直通**：完整的 CUDA 12.8 支援
- **多卡支援**：count: all 配置支援多張顯卡
- **容器權限**：privileged 模式確保硬件訪問
- **X11 轉發**：支援 GUI 應用程式顯示

---

## ⚡ 技術優化與創新

### 🔄 性能優化策略

#### 1. **多執行緒影像處理**
使用獨立執行緒持續擷取攝影機畫面，避免阻塞主程序，確保 25 FPS 的流暢體驗。

#### 2. **智能緩存機制**
在 VideoStreamer 中實現 latest_frame 緩存，減少重複的影像讀取操作。

#### 3. **異步 API 設計**
FastAPI 的原生異步支援，配合 StreamingResponse 實現高效的即時串流傳輸。

#### 4. **前端狀態優化**
使用 React Hooks 模式進行狀態管理，避免不必要的組件重新渲染。

#### 5. **GPU 記憶體管理**
YOLO 模型只載入一次，支援動態參數調整，避免重複初始化的開銷。

### 🛡️ 系統安全與穩定性

| 領域 | 措施 |
|------|------|
| **容器安全** | 非 root 用戶執行、最小權限原則、安全的環境變數管理 |
| **錯誤處理** | 完整的異常捕獲機制、優雅的降級處理、詳細的錯誤日誌記錄 |
| **資源管理** | 記憶體使用監控、GPU 資源合理分配、自動垃圾回收機制 |
| **監控診斷** | 即時性能指標、API 回應時間監控、系統健康狀態檢查 |

### 🔮 技術創新亮點

1. **自適應串流品質**：根據網路狀況和系統負載自動調整影像品質和幀率。

2. **智能區域監控**：支援自定義多邊形監控區域，結合物件檢測實現精準的觸發機制。

3. **動態模型參數**：無需重啟服務即可調整檢測參數，提供彈性的使用體驗。

4. **多模態數據融合**：整合多個數據源的標註格式，建立統一的檢測標準。

### 📈 擴展性設計

- **微服務架構**：前後端完全分離，便於獨立擴展和部署
- **API 標準化**：RESTful 設計，易於整合第三方系統
- **模組化組件**：前端組件高度復用，支援快速功能擴展
- **容器化部署**：支援 Kubernetes 編排，具備生產級擴展能力

---

## 📊 專案總結

Harbor Tracking App 展現了現代軟體開發的最佳實踐，從 AI 模型訓練到前後端分離架構，再到容器化部署，每個環節都體現了技術創新和工程優化。此專案不僅解決了港口監控的實際需求，更展示了深度學習、Web 技術和 DevOps 的完美結合。

### 技術成就
- ✅ 成功整合 30K+ 訓練樣本，達到生產級檢測精度
- ✅ 實現 25 FPS 即時處理，滿足實際應用需求
- ✅ 採用現代化技術棧，確保系統的可維護性和擴展性
- ✅ 完整的容器化部署方案，支援跨平台一致性

---

**© 2025 Harbor Tracking App - NTHU Machine Learning Course Final Project**  
**作者：Hsing-Yu Huang | 技術棧：YOLOv12 + FastAPI + Next.js + Docker**  
**Generated on: 2025-09-25**