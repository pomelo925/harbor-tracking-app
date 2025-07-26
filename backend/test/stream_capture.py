import cv2
import urllib.parse

# 原始資訊
username = "administrator"
password = "!QAZ%TGB!@#"
ip = "220.130.177.161"
port = "55756"
camera_id = "233576_72ce8b9e-be75-4166-a57c-5f128883e7f1"
quality = "medium"
audio = "0"

# 對帳號密碼進行 URL 編碼
encoded_username = urllib.parse.quote(username)
encoded_password = urllib.parse.quote(password)

# 串流 URL 組合
url = (
    f"https://{encoded_username}:{encoded_password}@{ip}:{port}"
    f"/Acs/Streaming/Video/Live/Mp4/?camera={camera_id}&quality={quality}&audio={audio}"
)

print(f"測試串流 URL:\n{url}")

# 使用 OpenCV 嘗試讀取影像串流
cap = cv2.VideoCapture(url)

if not cap.isOpened():
    print("❌ 無法開啟串流，請確認 IP、帳密與串流參數")
else:
    print("✅ 串流開啟成功，正在顯示畫面")
    while True:
        ret, frame = cap.read()
        if not ret:
            print("⚠️ 無法讀取畫面，串流中斷或格式不支援")
            break
        cv2.imshow("Camera Stream", frame)
        if cv2.waitKey(1) & 0xFF == 27:  # 按下 ESC 鍵離開
            break

cap.release()
cv2.destroyAllWindows()
