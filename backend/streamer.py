import cv2
import threading

class VideoStreamer:
    def __init__(self, stream_url: str):
        self.cap = cv2.VideoCapture(stream_url)
        self.latest_frame = None
        self.running = True

        # 開啟背景執行緒持續擷取畫面
        self.thread = threading.Thread(target=self.update_frame, daemon=True)
        self.thread.start()

    def update_frame(self):
        while self.running and self.cap.isOpened():
            ret, frame = self.cap.read()
            if ret:
                self.latest_frame = frame

    def get_frame(self):
        return self.latest_frame

    def stop(self):
        self.running = False
        self.cap.release()
