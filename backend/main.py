from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from app.predictor import predict_image

app = FastAPI(title="Harbor Tracking API")

# 若需跨域支援前端 React 呼叫
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 可限制成你的前端網址
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict/image")
async def predict_image_api(file: UploadFile = File(...)):
    contents = await file.read()
    results = predict_image(contents)
    return {"results": results}