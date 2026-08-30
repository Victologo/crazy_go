import sys

with open("src/ui/modals/CombatLogModalRenderer.ts", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "this.renderStepBoard(entry);" in line:
        new_lines.append(line)
        new_lines.append("        this.renderWinRateBar(entry);\n")
    else:
        new_lines.append(line)

code = """
    private static renderWinRateBar(entry: CombatLogEntry): void {
        const wrapper = document.getElementById('replay-winrate-bar-wrapper');
        if (!wrapper) return;

        const winRates = entry.snapshotDetails?.winRates;
        
        if (!winRates) {
            wrapper.classList.add('hidden');
            return;
        }

        wrapper.classList.remove('hidden');

        const pCount = this.activeReplay?.gameConfig?.playerCount || 2;
        
        const seg1 = document.getElementById('replay-winrate-segment-1');
        const seg2 = document.getElementById('replay-winrate-segment-2');
        const seg3 = document.getElementById('replay-winrate-segment-3');
        const seg4 = document.getElementById('replay-winrate-segment-4');
        
        const lbl1 = document.getElementById('replay-winrate-label-1');
        const lbl2 = document.getElementById('replay-winrate-label-2');
        const lbl3 = document.getElementById('replay-winrate-label-3');
        const lbl4 = document.getElementById('replay-winrate-label-4');

        if (seg1 && lbl1) {
            const v = Math.round(winRates[1] || 0);
            seg1.style.width = `${v}%`;
            lbl1.style.width = `${v}%`;
            lbl1.textContent = v >= 5 ? `${v}%` : '';
            seg1.style.display = v > 0 ? 'block' : 'none';
        }
        if (seg2 && lbl2) {
            const v = Math.round(winRates[2] || 0);
            seg2.style.width = `${v}%`;
            lbl2.style.width = `${v}%`;
            lbl2.textContent = v >= 5 ? `${v}%` : '';
            seg2.style.display = v > 0 ? 'block' : 'none';
        }
        if (pCount === 4) {
            if (seg3 && lbl3) {
                const v = Math.round(winRates[3] || 0);
                seg3.style.width = `${v}%`;
                lbl3.style.width = `${v}%`;
                lbl3.textContent = v >= 5 ? `${v}%` : '';
                seg3.style.display = v > 0 ? 'block' : 'none';
            }
            if (seg4 && lbl4) {
                const v = Math.round(winRates[4] || 0);
                seg4.style.width = `${v}%`;
                lbl4.style.width = `${v}%`;
                lbl4.textContent = v >= 5 ? `${v}%` : '';
                seg4.style.display = v > 0 ? 'block' : 'none';
            }
        } else {
            if (seg3) seg3.style.display = 'none';
            if (lbl3) lbl3.style.display = 'none';
            if (seg4) seg4.style.display = 'none';
            if (lbl4) lbl4.style.display = 'none';
        }
    }
"""

# Insert the code before the last closing brace
last_brace_index = -1
for i in range(len(new_lines)-1, -1, -1):
    if new_lines[i].strip() == "}":
        last_brace_index = i
        break

new_lines.insert(last_brace_index, code)

with open("src/ui/modals/CombatLogModalRenderer.ts", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
