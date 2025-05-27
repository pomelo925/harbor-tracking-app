#  Harbor Tracking App

2025 Spring NTHU Machine Learning Course Final Project.

![](assets/demo_.gif)

## Usage

1. Clone this repo.

```git
git clone https://github.com/pomelo925/harbor-tracking-app.git
```


2. Launch docker container.

```
./run.sh
```

## Folder Hierarchy

```
harbor-tracking-app/
├── .github/workflows/       # GitHub Actions CI/CD 工作流程
├── assets                   # README 素材放置處
├── backend/                 # 後端伺服器與 API 服務
├── docker/                  # Docker 容器配置與部署腳本
├── frontend/                # 前端使用者介面（可能為 React 或類似框架）
├── pretrain-weights/        # 預訓練模型權重（YOLOv12）
├── yolov12-ws/              # YOLOv12 模型推論與 WebSocket 整合
├── run.sh                   # 一鍵啟動腳本
└── README.md                # 專案說明文件

```


## Dataset Collection

### Procedure

Due to the free limit capacity of Roboflow, we work around the issue by creating a local dataset merging system.

1. Fork Multiple Projects on Roboflow Universe 
2. Merge these projects as the same project on Roboflow.
3. Re-classify the class name of the merged project.
4. Download datasets as .zip to local and unzip them.
5. Locally merge them by `yolov12-ws/merge.sh`.

![alt text](/assets/local_merge.png)


### Class statistics (after data augmentation)
- human: 4093 instances
- vehicle: 15017 instances
- vessel: 8798 instances
- bollard: 1795 instances
- mooring-rope: 491 instances

### Dataset Sources

* human:
    - (3K) [person_detection Computer Vision Project](https://universe.roboflow.com/pavan-kalyan-o41rw/person_detection-vak5r)
    - (1.6K) [Human Detection Computer Vision Project](https://universe.roboflow.com/humandetectionv2/human-detection-w3rnj)

* vehicles:
    - (4.4K) [cars Computer Vision Project](https://universe.roboflow.com/sas-qehgd/cars-qtxnb)
    - (1K) [Bus Computer Vision Project](https://universe.roboflow.com/school-sypou/bus-zlyqq)
    - (1K) [Yolo Truck Computer Vision Project](https://universe.roboflow.com/yolo-d3ogg/yolo-truck-mfz12)

* vessels:
    - boat
        - (1.2K) [argumentace Computer Vision Project](https://universe.roboflow.com/boats-hw9ge/argumentace)
        - (238) [SUAS_test Computer Vision Project](https://universe.roboflow.com/suas2-wm5lr/suas_test)
    - ship
        - (3.7k) [ShipsFull Computer Vision Project](https://universe.roboflow.com/betl-ef9gl/shipsfull)
        - (600) [ship Computer Vision Project](https://universe.roboflow.com/gun-ukhnc/ship-f5j8l)
    - freighter:
        - (878) [container Computer Vision Project](https://universe.roboflow.com/yolo-project/container-z5pd0)
        - (571) [VEDIT STD v1 Computer Vision Project](https://universe.roboflow.com/grodval/vedit-std-v1)


* bollards:
    - (351) [Bollards Computer Vision Project](https://universe.roboflow.com/testing-0bbg4/bollards)
    - (322) [bollards_data_set Computer Vision Project](https://universe.roboflow.com/testing-0bbg4/bollards_data_set)

* mooring ropes:
    - self-collected on the Internet


## Training Env

* arch: AMD64
* CPU/GPU: i7-13700F/RTX-4070
* Mem: 32GB
* Windows x Docker Desktop x WSL2 Ubuntu 22.04 LTS

Please check `yolov12-ws/train.py` for the details of hyperparameters.