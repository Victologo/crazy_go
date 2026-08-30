"""
model.py
========
CrazyGoNet: AlphaZero-style neural network for Crazy Go.
Architecture: ResNet-12 with 3 output heads.

Heads:
  - Policy Head:    Distribution over N*N+1 moves (N*N cells + pass)
  - Value Head:     Win probability per player [p_black, p_white]
  - Ownership Head: Territory ownership per cell [-1, +1] (black/white)

Input tensor: [batch, 16, N, N]
  Channel 0:    Current player's stones
  Channel 1:    Opponent's stones
  Channel 2:    Topology mask (1 = playable, 0 = void)
  Channel 3:    Current player's chain liberty count (normalized 0-1)
  Channel 4:    Opponent's chain liberty count (normalized 0-1)
  Channel 5:    Current player's chains in Atari (1 = 1 liberty)
  Channel 6:    Opponent's chains in Atari
  Channel 7:    Last move position
  Channel 8:    Ko position (0 in Phase 1)
  Channels 9-14: Reserved (future: influence, champion abilities)
  Channel 15:   Turn progress (0.0 to 1.0)

Compatible with board sizes: 9x9, 13x13, 19x19 (and any NxN).
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class ResBlock(nn.Module):
    """Standard residual block with two 3x3 convolutions + skip connection."""

    def __init__(self, filters: int):
        super().__init__()
        self.conv1 = nn.Conv2d(filters, filters, 3, padding=1, bias=False)
        self.bn1   = nn.BatchNorm2d(filters)
        self.conv2 = nn.Conv2d(filters, filters, 3, padding=1, bias=False)
        self.bn2   = nn.BatchNorm2d(filters)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        residual = x
        out = F.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        return F.relu(out + residual)


class CrazyGoNet(nn.Module):
    """
    CrazyGoNet: ResNet-12 with Fully Convolutional Policy, Value and Ownership heads.
    This architecture is completely independent of the board size (N).
    
    Args:
        board_size:  Ignored (kept for backwards compatibility with scripts).
        in_channels: Number of input feature channels. Defaults to 16.
        res_blocks:  Number of residual blocks. Defaults to 12.
        filters:     Convolutional filter count. Defaults to 128.
        n_players:   Number of players (2 for 2P, 4 for 4P). Defaults to 2.
    """

    def __init__(
        self,
        board_size:  int = 9,
        in_channels: int = 16,
        res_blocks:  int = 16,
        filters:     int = 192,
        n_players:   int = 2,
    ):
        super().__init__()
        self.board_size = board_size # Kept only as metadata
        self.n_players  = n_players

        # ── Input block ────────────────────────────────────────────────────────
        self.input_block = nn.Sequential(
            nn.Conv2d(in_channels, filters, 3, padding=1, bias=False),
            nn.BatchNorm2d(filters),
            nn.ReLU(inplace=True),
        )

        # ── Residual tower ─────────────────────────────────────────────────────
        self.res_tower = nn.Sequential(*[ResBlock(filters) for _ in range(res_blocks)])

        # ── Policy head (Fully Convolutional) ──────────────────────────────────
        # Outputs logits for each cell independently of board size
        self.policy_conv = nn.Sequential(
            nn.Conv2d(filters, 2, 1, bias=False),
            nn.BatchNorm2d(2),
            nn.ReLU(inplace=True),
            nn.Conv2d(2, 1, 1, bias=True) # 1 logit per cell
        )
        
        # Pass action head (Global Pooling)
        self.pass_conv = nn.Sequential(
            nn.Conv2d(filters, 2, 1, bias=False),
            nn.BatchNorm2d(2),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d(1), # [batch, 2, 1, 1]
            nn.Flatten(1),
            nn.Linear(2, 1) # 1 pass logit
        )

        # ── Value head (Global Pooling) ────────────────────────────────────────
        self.value_conv = nn.Sequential(
            nn.Conv2d(filters, 8, 1, bias=False),
            nn.BatchNorm2d(8),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d(1), # [batch, 8, 1, 1]
            nn.Flatten(1),           # [batch, 8]
            nn.Linear(8, 256),
            nn.ReLU(inplace=True),
            nn.Linear(256, n_players),
        )

        # ── Ownership head ─────────────────────────────────────────────────────
        # Per-cell ownership in [-1, +1] via Tanh (black=+1, white=-1)
        self.ownership_head = nn.Sequential(
            nn.Conv2d(filters, 1, 1, bias=False),
            nn.Tanh(),
        )

        # ── Weight initialization ──────────────────────────────────────────────
        self._init_weights()

    def _init_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='relu')
            elif isinstance(m, nn.BatchNorm2d):
                nn.init.constant_(m.weight, 1)
                nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.Linear):
                nn.init.xavier_uniform_(m.weight)
                if m.bias is not None:
                    nn.init.zeros_(m.bias)

    def forward(self, x: torch.Tensor) -> dict[str, torch.Tensor]:
        """
        Forward pass.

        Args:
            x: Input tensor [batch, 16, N, N]

        Returns:
            dict with:
              'policy':    [batch, N*N+1]  — raw logits
              'value':     [batch, n_players] — win probabilities
              'ownership': [batch, 1, N, N]  — ownership map
        """
        batch_size = x.size(0)
        
        # Shared trunk
        h = self.input_block(x)
        h = self.res_tower(h)

        # Policy head
        p_board = self.policy_conv(h).view(batch_size, -1) # [batch, N*N]
        p_pass  = self.pass_conv(h)                        # [batch, 1]
        policy_logits = torch.cat([p_board, p_pass], dim=1) # [batch, N*N+1]

        # Value head
        value_logits = self.value_conv(h)                  # [batch, n_players]
        value_probs  = F.softmax(value_logits, dim=-1)

        # Ownership head
        ownership = self.ownership_head(h)                 # [batch, 1, N, N]

        return {
            'policy':    policy_logits,
            'value':     value_probs,
            'ownership': ownership,
        }

    def predict_move(self, tensor: torch.Tensor, legal_mask: torch.Tensor) -> torch.Tensor:
        """
        Get masked policy probabilities for legal moves only.

        Args:
            tensor:     [1, 16, N, N] — single board state
            legal_mask: [1, N*N+1]   — 1 for legal moves, 0 for illegal

        Returns:
            [1, N*N+1] — probability distribution over legal moves
        """
        self.eval()
        with torch.no_grad():
            out = self.forward(tensor)
            logits = out['policy']
            # Mask illegal moves with large negative value before softmax
            logits = logits + (1 - legal_mask) * (-1e9)
            return F.softmax(logits, dim=-1)


def create_model(board_size: int = 9, phase: int = 1) -> CrazyGoNet:
    """
    Factory function to create a CrazyGoNet for the given phase.

    Phase 1: ResNet-12, 128 filters, 2 players (pure Go)
    Phase 2: ResNet-12, 128 filters, 2 players (larger boards)
    Phase 3: ResNet-12, 192 filters, 4 players (with champions)
    """
    configs = {
        1: dict(board_size=board_size, res_blocks=12, filters=128, n_players=2),
        2: dict(board_size=board_size, res_blocks=12, filters=128, n_players=2),
        3: dict(board_size=board_size, res_blocks=12, filters=192, n_players=4),
    }
    return CrazyGoNet(**configs.get(phase, configs[1]))


if __name__ == '__main__':
    # Quick model sanity check
    model = create_model(board_size=9, phase=1)
    x = torch.randn(4, 16, 9, 9)  # batch of 4
    out = model(x)

    print('CrazyGoNet — Model Summary')
    print(f'  Input:         {tuple(x.shape)}')
    print(f'  Policy logits: {tuple(out["policy"].shape)}')
    print(f'  Value probs:   {tuple(out["value"].shape)}')
    print(f'  Ownership:     {tuple(out["ownership"].shape)}')

    total_params = sum(p.numel() for p in model.parameters())
    trainable    = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f'  Total params:  {total_params:,}  ({total_params / 1e6:.1f}M)')
    print(f'  Trainable:     {trainable:,}')
    print(f'  Approx size:   ~{total_params * 4 / 1e6:.0f} MB (FP32)')
