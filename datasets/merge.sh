#!/bin/bash

# -----------------------------
# 使用者自訂參數區
# -----------------------------

# 要合併的 YOLO 資料夾（請填入完整或相對路徑）
FOLDER_PATH=(
  "./vehicle-bus-1000.v1i.yolov12"
  "./vehicle-medan-4426.v1i.yolov12"
  "./vehicle-truck-1073.v3i.yolov12"
)

# 合併後的 class name（最終資料夾將會命名為 vehicle.yolov12）
MERGE_CLASS_NAME="vehicle"

# -----------------------------
# 主程式邏輯
# -----------------------------

TARGET_DIR="${MERGE_CLASS_NAME}.yolov12"

echo "🔧 開始合併 YOLO 資料夾..."
echo "📂 資料來源：${FOLDER_PATH[*]}"
echo "📁 目標資料夾：${TARGET_DIR}"

# 建立資料夾結構
for SPLIT in train valid test; do
  mkdir -p "${TARGET_DIR}/${SPLIT}/images"
  mkdir -p "${TARGET_DIR}/${SPLIT}/labels"
  echo "📁 建立資料夾：${TARGET_DIR}/${SPLIT}/{images,labels}"
done

# 檢查並避免重複檔名的函數
copy_with_unique_name() {
  src_file="$1"
  dest_dir="$2"
  base_name=$(basename "$src_file")
  name="${base_name%.*}"
  ext="${base_name##*.}"
  dest_file="${dest_dir}/${base_name}"
  counter=1

  while [ -e "$dest_file" ]; do
    dest_file="${dest_dir}/${name}_${counter}.${ext}"
    ((counter++))
  done

  cp "$src_file" "$dest_file"
  echo "✅ 複製 $(basename "$src_file") ➜ $(basename "$dest_file")"
}

# 開始合併資料
for SRC in "${FOLDER_PATH[@]}"; do
  echo "🔍 處理資料夾：$SRC"

  for SPLIT in train valid test; do
    IMG_SRC="${SRC}/${SPLIT}/images"
    LABEL_SRC="${SRC}/${SPLIT}/labels"
    IMG_DEST="${TARGET_DIR}/${SPLIT}/images"
    LABEL_DEST="${TARGET_DIR}/${SPLIT}/labels"

    if [ -d "$IMG_SRC" ]; then
      echo "📸 複製圖片：$IMG_SRC"
      for FILE in "$IMG_SRC"/*; do
        [ -e "$FILE" ] && copy_with_unique_name "$FILE" "$IMG_DEST"
      done
    else
      echo "⚠️ 找不到圖片資料夾：$IMG_SRC"
    fi

    if [ -d "$LABEL_SRC" ]; then
      echo "📝 複製標註：$LABEL_SRC"
      for FILE in "$LABEL_SRC"/*; do
        [ -e "$FILE" ] && copy_with_unique_name "$FILE" "$LABEL_DEST"
      done
    else
      echo "⚠️ 找不到標註資料夾：$LABEL_SRC"
    fi
  done
done

echo "🎉 合併完成！輸出位置：${TARGET_DIR}"