import re

with open('src/ui/templates/modal-local-setup.html', 'r', encoding='utf-8') as f:
    content = f.read()

sage_btn = '''
            <button class="hero-thumb-btn" data-hero="sage" title="Monje Sabio">
              <img src="./enemies/sage_1.png" alt="Monje Sabio" />
              <span>Monje Sabio</span>
            </button>'''

# 1. Add sage to single view
content = re.sub(
    r'(<button class="hero-thumb-btn" data-hero="ryujin"[\s\S]*?</button>)',
    r'\1\n' + sage_btn,
    content,
    count=1
)

# 2. Add sage to split view P1
sage_btn_p1 = sage_btn.replace('class="hero-thumb-btn"', 'class="hero-thumb-btn"')
content = re.sub(
    r'(<button class="hero-thumb-btn" data-hero="ryujin"[\s\S]*?</button>)',
    r'\1\n' + sage_btn_p1,
    content,
    count=1
)

# 3. Add sage to split view P2
content = re.sub(
    r'(<button class="hero-thumb-btn" data-hero="ryujin"[\s\S]*?</button>)',
    r'\1\n' + sage_btn_p1,
    content,
    count=1
)

p34_block = '''
          <!-- AI 3 (Red P3) -->
          <div class="setup-split-ai-col setup-p3-col hidden">
            <div class="setup-split-ai-header">
              <span class="setup-split-badge badge-p3" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1.5px solid rgba(239, 68, 68, 0.4); box-shadow: 0 0 12px rgba(239, 68, 68, 0.2);">🔴 IA Roja (P3)</span>
            </div>
            
            <div class="setup-split-hero-box">
              <button id="btn-setup-p3-prev" class="btn-hero-nav btn-split-nav" title="Previous Champion">◀</button>
              
              <div class="setup-split-hero-card" id="setup-p3-showcase-card">
                <div class="setup-split-portrait-wrapper">
                  <img id="setup-p3-hero-showcase-img" src="./heroes/normal_face.jpg" alt="Persona Normal" class="setup-split-portrait-img" />
                </div>
                <div class="setup-split-hero-details">
                  <h3 id="setup-p3-hero-showcase-name" class="setup-split-hero-title">Persona Normal</h3>
                  
                  <div class="setup-split-skills">
                    <div class="hero-skill-box active-skill-box setup-p3-hero-active-box" style="display: none;">
                      <div class="skill-box-header">
                        <span class="skill-type-tag active-tag" id="setup-p3-hero-active-tag">💥 HABILIDAD ACTIVA</span>
                        <strong id="setup-p3-hero-active-name" class="skill-name">Habilidad Activa</strong>
                      </div>
                      <p id="setup-p3-hero-active-desc" class="skill-desc">Descripción de la habilidad activa.</p>
                    </div>

                    <div class="hero-skill-box passive-skill-box setup-p3-hero-passive-box">
                      <div class="skill-box-header">
                        <span class="skill-type-tag passive-tag" id="setup-p3-hero-passive-tag">📜 REGLAS PURAS</span>
                        <strong id="setup-p3-hero-passive-name" class="skill-name">Reglas Canónicas Japonesas</strong>
                      </div>
                      <p id="setup-p3-hero-passive-desc" class="skill-desc">Estrategia pura de Go.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <button id="btn-setup-p3-next" class="btn-hero-nav btn-split-nav" title="Next Champion">▶</button>
            </div>
          </div>

          <!-- AI 4 (Blue P4) -->
          <div class="setup-split-ai-col setup-p4-col hidden">
            <div class="setup-split-ai-header">
              <span class="setup-split-badge badge-p4" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1.5px solid rgba(59, 130, 246, 0.4); box-shadow: 0 0 12px rgba(59, 130, 246, 0.2);">🔵 IA Azul (P4)</span>
            </div>
            
            <div class="setup-split-hero-box">
              <button id="btn-setup-p4-prev" class="btn-hero-nav btn-split-nav" title="Previous Champion">◀</button>
              
              <div class="setup-split-hero-card" id="setup-p4-showcase-card">
                <div class="setup-split-portrait-wrapper">
                  <img id="setup-p4-hero-showcase-img" src="./heroes/normal_face.jpg" alt="Persona Normal" class="setup-split-portrait-img" />
                </div>
                <div class="setup-split-hero-details">
                  <h3 id="setup-p4-hero-showcase-name" class="setup-split-hero-title">Persona Normal</h3>
                  
                  <div class="setup-split-skills">
                    <div class="hero-skill-box active-skill-box setup-p4-hero-active-box" style="display: none;">
                      <div class="skill-box-header">
                        <span class="skill-type-tag active-tag" id="setup-p4-hero-active-tag">💥 HABILIDAD ACTIVA</span>
                        <strong id="setup-p4-hero-active-name" class="skill-name">Habilidad Activa</strong>
                      </div>
                      <p id="setup-p4-hero-active-desc" class="skill-desc">Descripción de la habilidad activa.</p>
                    </div>

                    <div class="hero-skill-box passive-skill-box setup-p4-hero-passive-box">
                      <div class="skill-box-header">
                        <span class="skill-type-tag passive-tag" id="setup-p4-hero-passive-tag">📜 REGLAS PURAS</span>
                        <strong id="setup-p4-hero-passive-name" class="skill-name">Reglas Canónicas Japonesas</strong>
                      </div>
                      <p id="setup-p4-hero-passive-desc" class="skill-desc">Estrategia pura de Go.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <button id="btn-setup-p4-next" class="btn-hero-nav btn-split-nav" title="Next Champion">▶</button>
            </div>
          </div>
'''

content = content.replace('<!-- STEP 5: SCENERY & ENVIRONMENT WITH LIVE COMBAT DUEL PREVIEW -->', p34_block + '\n        <!-- STEP 5: SCENERY & ENVIRONMENT WITH LIVE COMBAT DUEL PREVIEW -->')

with open('src/ui/templates/modal-local-setup.html', 'w', encoding='utf-8') as f:
    f.write(content)
