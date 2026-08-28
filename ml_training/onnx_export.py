"""
onnx_export.py
==============
Exports a trained CrazyGoNet checkpoint to ONNX format.
Generates two versions:
  - FP32 full precision (~90 MB) for itch.io desktop download
  - FP16 quantized (~45 MB) for web browser via onnxruntime-web

Usage:
  python ml_training/onnx_export.py
  python ml_training/onnx_export.py --checkpoint ml_training/checkpoints/latest.pt
  python ml_training/onnx_export.py --board-size 19
"""

import os
import sys
import argparse
from pathlib import Path

import torch

sys.path.insert(0, str(Path(__file__).parent))
from model import CrazyGoNet, create_model


def export_onnx(
    model:      CrazyGoNet,
    board_size: int,
    output_path: str,
    fp16: bool = False,
):
    """Export model to ONNX format."""
    model.eval()

    if fp16:
        model = model.half()
        dummy_input = torch.randn(1, 16, board_size, board_size, dtype=torch.float16)
    else:
        dummy_input = torch.randn(1, 16, board_size, board_size, dtype=torch.float32)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    print(f'  Exporting to: {output_path}')
    print(f'  Precision:    {"FP16" if fp16 else "FP32"}')
    print(f'  Board size:   {board_size}x{board_size}')

    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=17,
        do_constant_folding=True,
        input_names=['board'],
        output_names=['policy', 'value', 'ownership'],
        # Dynamic board size axes (N can vary for 9/13/19)
        dynamic_axes={
            'board':     {2: 'height', 3: 'width'},
            'policy':    {1: 'num_moves'},
            'ownership': {2: 'height', 3: 'width'},
        },
    )

    size_mb = os.path.getsize(output_path) / 1e6
    print(f'  File size:    {size_mb:.1f} MB')
    print(f'  [OK] Export complete.')


def verify_onnx(model_path: str, board_size: int, fp16: bool = False):
    """Run a quick ONNX inference test to verify the exported model."""
    try:
        import onnxruntime as ort
        import numpy as np

        providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']
        session = ort.InferenceSession(model_path, providers=providers)

        dtype = np.float16 if fp16 else np.float32
        dummy = np.random.randn(1, 16, board_size, board_size).astype(dtype)
        outputs = session.run(None, {'board': dummy})

        print(f'  ONNX verify: policy={outputs[0].shape}, value={outputs[1].shape}, ownership={outputs[2].shape}')
        print(f'  Inference test: OK')

        # Report which provider is running
        used_providers = session.get_providers()
        print(f'  Providers used: {used_providers}')

    except ImportError:
        print('  [SKIP] onnxruntime not installed, skipping inference test.')
    except Exception as e:
        print(f'  [WARNING] ONNX verification failed: {e}')


def main(args: argparse.Namespace):
    print('=' * 60)
    print('  CrazyGoNet — ONNX Export')
    print('=' * 60)

    # Load model
    device = torch.device('cpu')  # Export always on CPU
    model  = create_model(board_size=args.board_size, phase=1).to(device)

    if args.checkpoint:
        print(f'\nLoading checkpoint: {args.checkpoint}')
        ckpt = torch.load(args.checkpoint, map_location='cpu', weights_only=True)
        saved_state = ckpt['model_state_dict']
        current_state = model.state_dict()
        matched = {k: v for k, v in saved_state.items() if k in current_state and v.shape == current_state[k].shape}
        model.load_state_dict(matched, strict=False)
        step = ckpt.get('step', '?')
        print(f'  Checkpoint step: {step} ({len(matched)} layers loaded)')
    else:
        print('\n[WARNING] No checkpoint specified — exporting untrained model.')
        print('          Use --checkpoint ml_training/checkpoints/latest.pt')

    model.eval()

    # ── Export 1: FP32 for itch.io desktop ────────────────────────────────────
    print(f'\n[1/2] Desktop version (FP32, full quality)')
    fp32_path = args.output_desktop
    export_onnx(model, args.board_size, fp32_path, fp16=False)
    verify_onnx(fp32_path, args.board_size, fp16=False)

    # ── Export 2: FP16 for web browser ────────────────────────────────────────
    print(f'\n[2/2] Web version (FP16, compressed for browser)')
    # Reload model and convert to FP16
    model_fp16 = create_model(board_size=args.board_size, phase=1).to(device)
    if args.checkpoint:
        saved_state = ckpt['model_state_dict']
        current_state_fp16 = model_fp16.state_dict()
        matched_fp16 = {k: v for k, v in saved_state.items() if k in current_state_fp16 and v.shape == current_state_fp16[k].shape}
        model_fp16.load_state_dict(matched_fp16, strict=False)
    model_fp16.eval()

    fp16_path = args.output_web
    export_onnx(model_fp16, args.board_size, fp16_path, fp16=True)
    verify_onnx(fp16_path, args.board_size, fp16=True)

    print('\n' + '=' * 60)
    print('  Export Summary')
    print('=' * 60)
    if os.path.exists(fp32_path):
        print(f'  Desktop: {fp32_path}')
        print(f'           {os.path.getsize(fp32_path) / 1e6:.1f} MB — copy to src/ai/models/')
    if os.path.exists(fp16_path):
        print(f'  Web:     {fp16_path}')
        print(f'           {os.path.getsize(fp16_path) / 1e6:.1f} MB — copy to src/ai/models/')
    print()
    print('  Next step: integrate the ONNX model into GoAI.worker.ts')
    print('=' * 60)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Export CrazyGoNet to ONNX')
    parser.add_argument('--checkpoint',     default='ml_training/checkpoints/latest.pt',
                        help='Path to trained model checkpoint (.pt)')
    parser.add_argument('--board-size',     default=9, type=int,
                        help='Board size the model was trained on (9, 13, or 19)')
    parser.add_argument('--output-desktop', default='src/ai/models/crazy_go_brain_fp32.onnx',
                        help='Output path for desktop FP32 model')
    parser.add_argument('--output-web',     default='src/ai/models/crazy_go_brain_web.onnx',
                        help='Output path for web FP16 model')
    args = parser.parse_args()

    main(args)
