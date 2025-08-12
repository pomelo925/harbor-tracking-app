from ultralytics import YOLO
from PIL import Image
import io
from typing import List, Optional, Tuple, Dict, Any


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
        """
        Predict objects in an image with additional filtering parameters.
        
        Args:
            image_bytes: Image data in bytes format
            confidence_threshold: Minimum confidence score for detections (default: 0.25)
            classes: List of class IDs to filter for (default: None - all classes)
            max_det: Maximum number of detections to return (default: 300)
            
        Returns:
            Tuple of (detection_results, plot_image)
        """
        try:
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception:
            return [{"label": "InvalidImage", "confidence": 0.0}], None

        # Run YOLO prediction with parameters
        results = self.model(
            img,
            conf=confidence_threshold,
            classes=classes,
            max_det=max_det
        )

        detection_results = []
        plot_pil = None

        for r in results:
            boxes = r.boxes
            if boxes is not None:
                for box in boxes:
                    cls_id = int(box.cls[0])
                    label = self.model.names[cls_id]
                    confidence = float(box.conf[0])
                    
                    # 取得 bounding box 座標 (x1, y1, x2, y2)
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    
                    detection_results.append({
                        "label": label, 
                        "confidence": confidence,
                        "class_id": cls_id,
                        "bbox": {
                            "x1": x1,
                            "y1": y1,
                            "x2": x2,
                            "y2": y2
                        }
                    })

            # Generate plot image with bounding boxes
            plot_img = r.plot()  # numpy array (BGR)
            plot_pil = Image.fromarray(plot_img[..., ::-1])  # convert BGR to RGB

        return detection_results, plot_pil