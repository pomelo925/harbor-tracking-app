#!/bin/bash

### ----------------------------- ###
# 1. 使用者自訂參數區 
### ----------------------------- ###

FOLDER_PATH=(
  "/home/datasets/pedestrian-1688.v1i.yolov12"
  "/home/datasets/vehicle-truck1073-medan4426-bus1000.v1i.yolov12"
)

MERGED_CLASSES=("human" "vehicle")

MERGE_CLASS_NAME="vehicle-human"
TARGET_DIR="/home/datasets/${MERGE_CLASS_NAME}.yolov12"
DATA_YAML_PATH="${TARGET_DIR}/data.yaml"

### ----------------------------- ###
# 2. 建立資料夾結構與初始化計數器
### ----------------------------- ###

echo "🔧 開始合併 YOLO 資料夾..."
echo "📁 目標資料夾：${TARGET_DIR}"

for SPLIT in train valid test; do
  mkdir -p "${TARGET_DIR}/${SPLIT}/images"
  mkdir -p "${TARGET_DIR}/${SPLIT}/labels"
done

declare -A CLASS_COUNTER
declare -A CLASS_TOTAL_COUNT
for cname in "${MERGED_CLASSES[@]}"; do
  CLASS_COUNTER[$cname]=1
  CLASS_TOTAL_COUNT[$cname]=0
  echo "初始化命名計數器：$cname = 1"
done

declare -A CLASS_MAPPING  # e.g., ["/folder|vehicle"] = 1

### ----------------------------- ###
# 3. 建立 Class Mapping
### ----------------------------- ###

echo "📌 建立類別映射 (從 data.yaml 解析)..."
for i in "${!FOLDER_PATH[@]}"; do
  SRC="${FOLDER_PATH[$i]}"
  YAML_FILE="$SRC/data.yaml"
  if [[ ! -f "$YAML_FILE" ]]; then
    echo "❌ 找不到 $YAML_FILE"; exit 1
  fi

  for cname in "${MERGED_CLASSES[@]}"; do
    IDX=$(grep -Po "(?<=names: \[)[^]]*" "$YAML_FILE" | \
      tr -d "'" | tr ',' '\n' | \
      awk -v class="$cname" '{gsub(/^\s+|\s+$/, "", $0); if ($0==class) print NR-1}')
    if [[ "$IDX" == "" ]]; then
      echo "⚠️ 類別 '$cname' 未在 $SRC 的 data.yaml 中出現，將略過"
    else
      CLASS_MAPPING["$SRC|$cname"]="$IDX"
      echo "✅ 類別 '$cname' 在 $SRC 中的 index = $IDX"
    fi
  done
done

### ----------------------------- ###
# 4. 合併資料與標註轉換（含多行即時刷新）
### ----------------------------- ###

SEG_SKIP=0
LINES=6  # 多行輸出行數（調整為實際行數）

for i in "${!FOLDER_PATH[@]}"; do
  SRC="${FOLDER_PATH[$i]}"
  PROJECT_NAME=$(basename "$SRC")

  for cname in "${MERGED_CLASSES[@]}"; do
    SRC_CLASS_IDX="${CLASS_MAPPING["$SRC|$cname"]}"
    [[ "$SRC_CLASS_IDX" == "" ]] && continue

    MERGE_CLASS_IDX="-1"
    for j in "${!MERGED_CLASSES[@]}"; do
      [[ "${MERGED_CLASSES[$j]}" == "$cname" ]] && MERGE_CLASS_IDX="$j"
    done

    for SPLIT in train valid test; do
      IMG_SRC="${SRC}/${SPLIT}/images"
      LABEL_SRC="${SRC}/${SPLIT}/labels"
      IMG_DEST="${TARGET_DIR}/${SPLIT}/images"
      LABEL_DEST="${TARGET_DIR}/${SPLIT}/labels"

      if [[ -d "$IMG_SRC" && -d "$LABEL_SRC" ]]; then
        for IMG_PATH in "$IMG_SRC"/*; do
          [ -e "$IMG_PATH" ] || continue
          FILE_NAME=$(basename "$IMG_PATH")
          BASE="${FILE_NAME%.*}"
          LABEL_PATH="${LABEL_SRC}/${BASE}.txt"

          # 多行刷新輸出（先移動游標回上方）
          tput cuu $LINES
          tput ed

          printf -- "🔍 資料夾: %s/%s\n" "$PROJECT_NAME" "$SPLIT"
          printf -- "📝 檔案: %s\n" "$FILE_NAME"
          for mc in "${MERGED_CLASSES[@]}"; do
            printf -- "🔹 類別 '%s' 已轉換數量：%d\n" "$mc" "${CLASS_TOTAL_COUNT[$mc]}"
          done
          printf -- "------------------------------\n"

          if [[ -f "$LABEL_PATH" ]]; then
            # ➤ 檢查 segmentation（NF > 5）
            if ! awk '{ if (NF > 5) exit 1 }' "$LABEL_PATH"; then
              echo "⚠️ 偵測到 segmentation 格式：$LABEL_PATH，已跳過"
              ((SEG_SKIP++))
              continue
            fi

            if grep -q "^$SRC_CLASS_IDX " "$LABEL_PATH"; then
              IDX="${CLASS_COUNTER[$cname]}"
              NEW_NAME="${cname}_${IDX}"
              cp "$IMG_PATH" "${IMG_DEST}/${NEW_NAME}.jpg"
              awk -v orig_idx="$SRC_CLASS_IDX" -v new_idx="$MERGE_CLASS_IDX" 'BEGIN{OFS=" "} $1==orig_idx {$1=new_idx} {print}' "$LABEL_PATH" > "${LABEL_DEST}/${NEW_NAME}.txt"
              echo "✅ $BASE ➜ $NEW_NAME (轉換 $SRC_CLASS_IDX ➜ $MERGE_CLASS_IDX)"
              ((CLASS_COUNTER[$cname]++))
              ((CLASS_TOTAL_COUNT[$cname]++))
            fi
          else
            echo "⚠️ 無對應標註：$LABEL_PATH"
          fi
        done
      fi
    done
  done
done

### ----------------------------- ###
# 5. 產生 data.yaml
### ----------------------------- ###

echo "📝 產生 data.yaml ..."

cat <<EOF > "$DATA_YAML_PATH"
train: ../train/images
val: ../valid/images
test: ../test/images

nc: ${#MERGED_CLASSES[@]}
names: [$(printf "'%s', " "${MERGED_CLASSES[@]}" | sed 's/, $//')]
EOF

echo "✅ 已產生：$DATA_YAML_PATH"

### ----------------------------- ###
# 6. 結果總結
### ----------------------------- ###

echo ""
echo "📊 結果總結"
echo "-----------------------------"
for cname in "${MERGED_CLASSES[@]}"; do
  echo "🔹 類別 '$cname' 轉換數量：${CLASS_TOTAL_COUNT[$cname]}"
done
echo "🚫 跳過 segmentation 標註數量：$SEG_SKIP"
echo "🎉 合併完成！輸出位置：${TARGET_DIR}"