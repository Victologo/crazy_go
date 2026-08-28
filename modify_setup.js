
import fs from "fs";
let html = fs.readFileSync("src/ui/templates/modal-local-setup.html", "utf8");

const oldStep4Start = `<div class="rogue-hero-panoramic-box setup-hero-panoramic-box">`;
const newStep4Wrapper = `
        <!-- SINGLE VIEW (P1) -->
        <div id="setup-champion-container-single">
          <div class="rogue-hero-panoramic-box setup-hero-panoramic-box">`;

html = html.replace(oldStep4Start, newStep4Wrapper);

let parts = html.split("<!-- STEP 5:");
if(parts.length === 2) {
    let before = parts[0];
    before = before + "</div>\n\n" + `
        <!-- SPLIT VIEW (AI vs AI) -->
        <div id="setup-champion-container-split" class="hidden" style="display: flex; gap: 1rem; width: 100%;">
          <!-- AI 1 (Black) -->
          <div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;">
            <h4 style="text-align:center; color: #f59e0b; margin:0;">⚫ IA Negra (P1)</h4>
            <div class="rogue-hero-panoramic-box" style="padding: 0.5rem; min-height: 220px;">
              <button id="btn-setup-p1-prev" class="btn-hero-nav">◀</button>
              <div class="hero-showcase-card" id="setup-p1-showcase-card" style="gap: 1rem;">
                <div class="hero-portrait-wrapper" style="width: 120px; height: 120px;">
                  <img id="setup-p1-showcase-img" src="./heroes/normal_face.jpg" class="hero-showcase-img" />
                </div>
                <div class="hero-details">
                  <h3 id="setup-p1-showcase-name" class="hero-title" style="font-size: 1.2rem;">Persona Normal</h3>
                </div>
              </div>
              <button id="btn-setup-p1-next" class="btn-hero-nav">▶</button>
            </div>
          </div>
          <!-- AI 2 (White) -->
          <div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;">
            <h4 style="text-align:center; color: #f59e0b; margin:0;">⚪ IA Blanca (P2)</h4>
            <div class="rogue-hero-panoramic-box" style="padding: 0.5rem; min-height: 220px;">
              <button id="btn-setup-p2-prev" class="btn-hero-nav">◀</button>
              <div class="hero-showcase-card" id="setup-p2-showcase-card" style="gap: 1rem;">
                <div class="hero-portrait-wrapper" style="width: 120px; height: 120px;">
                  <img id="setup-p2-showcase-img" src="./heroes/normal_face.jpg" class="hero-showcase-img" />
                </div>
                <div class="hero-details">
                  <h3 id="setup-p2-showcase-name" class="hero-title" style="font-size: 1.2rem;">Persona Normal</h3>
                </div>
              </div>
              <button id="btn-setup-p2-next" class="btn-hero-nav">▶</button>
            </div>
          </div>
        </div>
        `;
    html = before + "        <!-- STEP 5:" + parts[1];
}

fs.writeFileSync("src/ui/templates/modal-local-setup.html", html);
console.log("HTML modified!");

