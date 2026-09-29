import cv2
import numpy as np
import os
from typing import Tuple, Dict

def denoise_image(image: np.ndarray) -> np.ndarray:
    """Khử nhiễu ảnh bằng Gaussian Blur."""
    return cv2.GaussianBlur(image, (5, 5), 0)

def enhance_contrast(image: np.ndarray) -> np.ndarray:
    """Tăng cường tương phản bằng CLAHE (tiêu chuẩn X-quang)."""
    # Chuyển sang ảnh xám nếu là ảnh màu
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
        
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(gray)

def detect_edges(image: np.ndarray) -> np.ndarray:
    """Phát hiện cạnh bằng Canny."""
    # Cần ảnh xám
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
        
    return cv2.Canny(gray, 100, 200)

def segment_otsu(image: np.ndarray) -> np.ndarray:
    """Phân đoạn ảnh (segmentation) bằng thuật toán Otsu."""
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
        
    _, mask = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return mask

def process_medical_image(input_path: str, output_folder: str) -> Dict[str, str]:
    """Quy trình xử lý ảnh y tế đầy đủ."""
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
        
    # 1. Đọc ảnh
    img = cv2.imread(input_path)
    if img is None:
        raise ValueError(f"Không thể đọc ảnh từ: {input_path}")
        
    # Lấy tên file gốc
    base_name = os.path.basename(input_path)
    name, ext = os.path.splitext(base_name)
    
    # 2. Thực hiện các bước xử lý
    # Bước a: Khử nhiễu & Tăng tương phản (Ảnh chính)
    denoised = denoise_image(img)
    enhanced = enhance_contrast(denoised)
    processed_path = os.path.join(output_folder, f"{name}_processed{ext}")
    cv2.imwrite(processed_path, enhanced)
    
    # Bước b: Phát hiện cạnh
    edges = detect_edges(enhanced)
    edge_path = os.path.join(output_folder, f"{name}_edge{ext}")
    cv2.imwrite(edge_path, edges)
    
    # Bước c: Phân đoạn (Mask)
    mask = segment_otsu(enhanced)
    mask_path = os.path.join(output_folder, f"{name}_mask{ext}")
    cv2.imwrite(mask_path, mask)
    
    return {
        "processed": processed_path,
        "edge": edge_path,
        "mask": mask_path
    }
