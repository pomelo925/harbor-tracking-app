#!/bin/bash

### ----------------------------- ###
# 1. 使用者自訂參數區 
### ----------------------------- ###

# 原始 YOLO 資料夾的路徑
FOLDER_PATH=(
  "/home/yolov12-ws/datasets/human.yolov12"
  "/home/yolov12-ws/datasets/vehicle.yolov12"
  "/home/yolov12-ws/datasets/vessel.yolov12"
  "/home/yolov12-ws/datasets/bollard.yolov12"
  "/home/yolov12-ws/datasets/mooring-rope.yolov12"
)

# 合併類別名稱
MERGED_CLASSES=("human" "vehicle" "vessel" "bollard" "mooring-rope")

# 合併後的資料夾名稱
MERGE_CLASS_NAME="harbor-objects"
# 合併後的資料夾路徑
TARGET_DIR="/home/yolov12-ws/datasets/${MERGE_CLASS_NAME}.yolov12"
# 合併後的 data.yaml 路徑
DATA_YAML_PATH="${TARGET_DIR}/data.yaml"

# 顯示類別統計表格
SHOW_CLASS_TABLE=true

### ----------------------------- ###
# 2. 建立資料夾結構與初始化計數器
### ----------------------------- ###

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}🔧 Starting YOLO dataset merge...${NC}"
echo -e "${BLUE}📁 Target directory: ${WHITE}${TARGET_DIR}${NC}"

# 清理並建立目標資料夾
if [[ -d "$TARGET_DIR" ]]; then
    echo -e "${YELLOW}⚠️  Target directory exists, cleaning up...${NC}"
    rm -rf "$TARGET_DIR"
fi

for SPLIT in train valid test; do
  mkdir -p "${TARGET_DIR}/${SPLIT}/images"
  mkdir -p "${TARGET_DIR}/${SPLIT}/labels"
done

declare -A CLASS_COUNTER
declare -A CLASS_TOTAL_COUNT
for cname in "${MERGED_CLASSES[@]}"; do
  CLASS_COUNTER[$cname]=1
  CLASS_TOTAL_COUNT[$cname]=0
done

declare -A CLASS_MAPPING  # e.g., ["/folder|vehicle"] = 1

### ----------------------------- ###
# 3. 解析 YAML 的函數
### ----------------------------- ###
parse_yaml_names() {
    local yaml_file="$1"
    # 使用 python 來解析 YAML（更可靠的方法）
    if command -v python3 &> /dev/null; then
        python3 -c "
import yaml
import sys
try:
    with open('$yaml_file', 'r') as f:
        data = yaml.safe_load(f)
    names = data.get('names', [])
    for i, name in enumerate(names):
        print(f'{i}:{name}')
except Exception as e:
    print(f'ERROR:{e}', file=sys.stderr)
    exit(1)
" 2>/dev/null
    else
        # 備用方法：使用 awk 解析
        awk '
        /^names:/ {
            in_names = 1
            # 檢查是否為單行格式 names: [...]
            if ($0 ~ /\[.*\]/) {
                # 單行格式
                match($0, /\[(.*)\]/, arr)
                names_str = arr[1]
                gsub(/['\''"]/, "", names_str)  # 移除引號
                gsub(/[[:space:]]*,[[:space:]]*/, ",", names_str)  # 標準化逗號
                split(names_str, names_array, ",")
                for (i in names_array) {
                    gsub(/^[[:space:]]+|[[:space:]]+$/, "", names_array[i])  # trim
                    if (names_array[i] != "") {
                        printf "%d:%s\n", i-1, names_array[i]
                    }
                }
                in_names = 0
            }
            next
        }
        in_names && /^[[:space:]]*-/ {
            # 多行格式中的項目
            gsub(/^[[:space:]]*-[[:space:]]*/, "")  # 移除 "- "
            gsub(/['\''"]/, "")  # 移除引號
            gsub(/^[[:space:]]+|[[:space:]]+$/, "")  # trim
            if ($0 != "") {
                printf "%d:%s\n", NR_count++, $0
            }
        }
        in_names && !/^[[:space:]]*-/ && !/^[[:space:]]*$/ {
            # 非清單項目，結束 names 區段
            in_names = 0
        }
        BEGIN { NR_count = 0 }
        ' "$yaml_file"
    fi
}

### ----------------------------- ###
# 4. 建立 Class Mapping
### ----------------------------- ###

echo -e "${PURPLE}📌 Building class mapping (parsing from data.yaml)...${NC}"
for i in "${!FOLDER_PATH[@]}"; do
  SRC="${FOLDER_PATH[$i]}"
  YAML_FILE="$SRC/data.yaml"
  if [[ ! -f "$YAML_FILE" ]]; then
    echo -e "${RED}❌ Cannot find $YAML_FILE${NC}"; exit 1
  fi

  echo -e "${CYAN}🔍 Parsing ${WHITE}$YAML_FILE${NC}..."
  
  # 解析 YAML 中的 names
  NAMES_OUTPUT=$(parse_yaml_names "$YAML_FILE")
  
  if [[ $? -ne 0 ]] || [[ -z "$NAMES_OUTPUT" ]]; then
    echo -e "${RED}❌ Failed to parse names field in $YAML_FILE${NC}"
    exit 1
  fi
  
  # 建立映射
  while IFS=':' read -r idx class_name; do
    # 檢查這個類別是否在我們要合併的類別中
    for target_class in "${MERGED_CLASSES[@]}"; do
      if [[ "$class_name" == "$target_class" ]]; then
        CLASS_MAPPING["$SRC|$target_class"]="$idx"
        echo -e "${GREEN}✅ Class '${WHITE}$target_class${GREEN}' in $SRC has index = ${WHITE}$idx${NC}"
        break
      fi
    done
  done <<< "$NAMES_OUTPUT"
done

### ----------------------------- ###
# 5. 合併資料與標註轉換（含多行即時刷新）
### ----------------------------- ###

SEG_SKIP=0
TABLE_DISPLAYED=false  # 標記表格是否已顯示
DYNAMIC_LINES=4  # 動態內容行數（文件信息部分）

echo -e "${BLUE}🔄 Starting file merge...${NC}"

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
          if [[ -t 1 ]]; then  # 只在終端機中使用 tput
            tput cuu $LINES
            tput ed
          fi

          printf -- "${CYAN}🔍 FOLDER: ${WHITE}%s/%s${NC}\n" "$PROJECT_NAME" "$SPLIT"
          printf -- "${BLUE}📝 Source FILENAME: ${WHITE}%s${NC}\n" "$FILE_NAME"

          if [[ -f "$LABEL_PATH" ]]; then
            # ➤ 檢查 segmentation（NF > 5）
            if ! awk '{ if (NF > 5) exit 1 }' "$LABEL_PATH"; then
              echo -e "${YELLOW}⚠️ Detected segmentation format: ${WHITE}$LABEL_PATH${YELLOW} skipped!${NC}"
              ((SEG_SKIP++))
              continue
            fi

            if grep -q "^$SRC_CLASS_IDX " "$LABEL_PATH"; then
              IDX="${CLASS_COUNTER[$cname]}"
              NEW_NAME="${cname}_${IDX}"
              
              # 複製圖片檔案，保持原始副檔名
              FILE_EXT="${FILE_NAME##*.}"
              cp "$IMG_PATH" "${IMG_DEST}/${NEW_NAME}.${FILE_EXT}"
              
              # 轉換標籤檔案
              awk -v orig_idx="$SRC_CLASS_IDX" -v new_idx="$MERGE_CLASS_IDX" 'BEGIN{OFS=" "} $1==orig_idx {$1=new_idx} {print}' "$LABEL_PATH" > "${LABEL_DEST}/${NEW_NAME}.txt"
              
              printf -- "${GREEN}🎯 Converted FILENAME: ${WHITE}%s.%s${NC}\n" "$NEW_NAME" "$FILE_EXT"
              printf -- "${PURPLE}📋 Class Mapping: ${WHITE}%s ${PURPLE}➜ ${WHITE}%s${NC}\n" "$SRC_CLASS_IDX" "$MERGE_CLASS_IDX"
              ((CLASS_COUNTER[$cname]++))
              ((CLASS_TOTAL_COUNT[$cname]++))
            fi
          else
            echo -e "${YELLOW}⚠️ No corresponding annotation: ${WHITE}$LABEL_PATH${NC}"
          fi

          printf -- "${WHITE}────────────────────────────────────────${NC}\n"
          if [[ "$SHOW_CLASS_TABLE" == true ]]; then
            printf -- "${PURPLE}📊 Classes converted so far:${NC}\n"
            for mc in "${MERGED_CLASSES[@]}"; do
              printf -- "${WHITE}- ${YELLOW}%-12s${WHITE}: ${GREEN}%d${NC}\n" "$mc" "${CLASS_TOTAL_COUNT[$mc]}"
            done
          fi
        done
      fi
    done
  done
done

### ----------------------------- ###
# 6. 產生 data.yaml
### ----------------------------- ###

echo ""
echo -e "${BLUE}📝 Generating data.yaml...${NC}"

cat <<EOF > "$DATA_YAML_PATH"
train: train/images
val: valid/images
test: test/images

nc: ${#MERGED_CLASSES[@]}
names: [$(printf "'%s', " "${MERGED_CLASSES[@]}" | sed 's/, $//')]

# Class statistics:
EOF

for class_name in "${MERGED_CLASSES[@]}"; do
  echo "# - $class_name: ${CLASS_TOTAL_COUNT[$class_name]} instances" >> "$DATA_YAML_PATH"
done

echo -e "${GREEN}✅ data.yaml path: ${WHITE}$DATA_YAML_PATH${NC}"

### ----------------------------- ###
# 7. 總結報告
### ----------------------------- ###

echo ""
echo -e "${GREEN}🎉 Merge completed successfully!${NC}"
echo -e "${CYAN}📊 Statistics:${NC}"
echo -e "  ${WHITE}📁 Target directory: ${BLUE}$TARGET_DIR${NC}"
echo -e "  ${WHITE}🏷️  Merged classes: ${PURPLE}${#MERGED_CLASSES[@]}${NC}"

total_instances=0
for class_name in "${MERGED_CLASSES[@]}"; do
  count=${CLASS_TOTAL_COUNT[$class_name]}
  echo -e "    ${YELLOW}- ${WHITE}$class_name${YELLOW}: ${GREEN}$count${YELLOW} instances${NC}"
  total_instances=$((total_instances + count))
done

echo -e "  ${WHITE}📈 Total instances: ${GREEN}$total_instances${NC}"
if [[ $SEG_SKIP -gt 0 ]]; then
  echo -e "  ${YELLOW}⚠️  Skipped segmentation files: ${RED}$SEG_SKIP${NC}"
fi
echo -e "  ${WHITE}📄 Config file: ${BLUE}$DATA_YAML_PATH${NC}"
echo ""
echo -e "${GREEN}✅ Dataset merge successful! Ready for training.${NC}"