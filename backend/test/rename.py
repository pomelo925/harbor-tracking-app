import os
import glob
from pathlib import Path

# 設置變數: FOLDER_PATH
FOLDER_PATH = "/home/pomelo/workspace/harbor-tracking-app/backend/datasets"

def rename_images_in_folder(folder_path):
    """
    將指定資料夾內的圖片檔案重新命名為 1.png, 2.png, ...
    
    Args:
        folder_path (str): 包含圖片的資料夾路徑
    """
    # 支援的圖片格式
    image_extensions = ['*.png', '*.jpg', '*.jpeg', '*.gif', '*.bmp', '*.tiff']
    
    # 獲取所有圖片檔案
    image_files = []
    for extension in image_extensions:
        image_files.extend(glob.glob(os.path.join(folder_path, extension)))
        image_files.extend(glob.glob(os.path.join(folder_path, extension.upper())))
    
    # 按檔案名稱排序
    image_files.sort()
    
    print(f"在 {folder_path} 中找到 {len(image_files)} 個圖片檔案")
    
    if not image_files:
        print("沒有找到圖片檔案！")
        return
    
    # 建立臨時重新命名清單，避免命名衝突
    temp_renames = []
    
    # 第一步：將所有檔案重新命名為臨時名稱
    for i, old_file in enumerate(image_files):
        temp_name = os.path.join(folder_path, f"temp_{i}.png")
        temp_renames.append((old_file, temp_name))
    
    # 執行臨時重新命名
    for old_file, temp_name in temp_renames:
        try:
            os.rename(old_file, temp_name)
            # print(f"臨時重新命名: {os.path.basename(old_file)} -> {os.path.basename(temp_name)}")
        except OSError as e:
            print(f"錯誤：無法重新命名 {old_file}: {e}")
            return
    
    # 第二步：將臨時檔案重新命名為最終名稱
    for i, (_, temp_name) in enumerate(temp_renames):
        final_name = os.path.join(folder_path, f"{i+1}.png")
        try:
            os.rename(temp_name, final_name)
            # print(f"最終重新命名: {os.path.basename(temp_name)} -> {os.path.basename(final_name)}")
        except OSError as e:
            print(f"錯誤：無法重新命名 {temp_name}: {e}")

def main():
    """主函數"""
    # 檢查資料夾是否存在
    if not os.path.exists(FOLDER_PATH):
        print(f"錯誤：資料夾 {FOLDER_PATH} 不存在！")
        return
    
    if not os.path.isdir(FOLDER_PATH):
        print(f"錯誤：{FOLDER_PATH} 不是一個資料夾！")
        return
    
    print(f"開始重新命名 {FOLDER_PATH} 中的圖片檔案...")
    
    # 詢問使用者確認
    response = input(f"確定要重新命名 {FOLDER_PATH} 中的所有圖片檔案嗎？(y/N): ")
    if response.lower() != 'y':
        print("操作已取消。")
        return
    
    # 執行重新命名
    rename_images_in_folder(FOLDER_PATH)
    print("重新命名完成！")

if __name__ == "__main__":
    main()