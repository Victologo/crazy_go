"""
verify_setup.py
---------------
Verifies that GPU, PyTorch, ONNX and NumPy are correctly installed
for CrazyGoNet ML training. Run this after setup_ml_env.bat.
"""

import sys
import os

print("=" * 60)
print("  CrazyGoNet — ML Setup Verification")
print("=" * 60)

# Python
print(f"\nPython: {sys.version.split()[0]}")
if sys.version_info < (3, 10):
    print("[WARNING] Python 3.10+ recommended.")

# PyTorch + CUDA
try:
    import torch
    print(f"PyTorch: {torch.__version__}")

    cuda_ok = torch.cuda.is_available()
    print(f"CUDA available: {cuda_ok}")

    if cuda_ok:
        device_name = torch.cuda.get_device_name(0)
        props = torch.cuda.get_device_properties(0)
        vram_gb = props.total_memory / 1024 ** 3
        print(f"GPU: {device_name}")
        print(f"VRAM: {vram_gb:.1f} GB")

        # Quick forward pass test
        x = torch.randn(1, 16, 9, 9).cuda()
        conv = torch.nn.Conv2d(16, 32, 3, padding=1).cuda()
        y = conv(x)
        print(f"Forward pass test: OK (output shape {tuple(y.shape)})")

        if vram_gb >= 12:
            print("\n[OK] VRAM sufficient for ResNet-12 training (batch_size=512).")
        elif vram_gb >= 8:
            print("\n[OK] VRAM sufficient for ResNet-8 training (reduce batch_size to 256).")
        else:
            print("\n[WARNING] Low VRAM. Consider ResNet-6 with batch_size=128.")
    else:
        print("[WARNING] No GPU detected. Training will run on CPU (very slow).")
        print("         Make sure NVIDIA drivers are installed and CUDA is available.")

except ImportError:
    print("[ERROR] PyTorch not installed. Run setup_ml_env.bat first.")
    sys.exit(1)

# ONNX
try:
    import onnx
    print(f"\nONNX: {onnx.__version__}")
except ImportError:
    print("\n[ERROR] ONNX not installed.")

# onnxruntime-gpu
try:
    import onnxruntime as ort
    providers = ort.get_available_providers()
    print(f"ONNXRuntime: {ort.__version__}")
    print(f"Providers: {providers}")
    if 'CUDAExecutionProvider' in providers:
        print("[OK] ONNX GPU inference available.")
    else:
        print("[WARNING] ONNX GPU inference not available. CPU only.")
except ImportError:
    print("[ERROR] onnxruntime-gpu not installed.")

# NumPy
try:
    import numpy as np
    print(f"\nNumPy: {np.__version__}")
except ImportError:
    print("[ERROR] NumPy not installed.")

# tqdm
try:
    import tqdm
    print(f"tqdm: {tqdm.__version__}")
except ImportError:
    print("[ERROR] tqdm not installed.")

# Node.js / tsx check
print("\nChecking Node.js / tsx...")
ret = os.system("node --version >nul 2>&1")
if ret == 0:
    print("[OK] Node.js available.")
else:
    print("[ERROR] Node.js not found.")

print("\n" + "=" * 60)
print("  Verification complete. Ready to train CrazyGoNet!")
print("=" * 60)
