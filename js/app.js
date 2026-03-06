/* ════════════════════════════════════════
   OposAI — app.js
   ════════════════════════════════════════ */


/* ════════ NAVEGACIÓN ════════ */
function nav(id, el) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('visible'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(id).classList.add('visible');
    el.classList.add('active');
    if (id === 'progreso') renderProgreso();
}


/* ════════ ESTADO ════════ */
let convActual = null;
let QUESTIONS  = [];
let answers    = {};
let corrected  = false;


/* ════════ CONSTRUIR CONVOCATORIAS DESDE EL ARRAY ════════
   Tu archivo tiene todas las preguntas en un array con campo "año".
   Aquí las agrupamos automáticamente por año.
   ════════════════════════════════════════════════════════ */
function buildConvocatorias() {
    const mapa = {};

    PREGUNTAS_POR_CONVOCATORIA.forEach(p => {
        const key = String(p.año);
        if (!mapa[key]) {
            mapa[key] = {
                año:       p.año,
                tipo:      'Turno Libre',
                preguntas: []
            };
        }
        mapa[key].preguntas.push(p);
    });

    // Ordenar de más reciente a más antiguo
    return Object.fromEntries(
        Object.entries(mapa).sort((a, b) => b[0] - a[0])
    );
}


/* ════════ HISTORIAL ════════ */
function getHistorial() {
    const sesion = getSesion();
    if (!sesion) return [];
    return JSON.parse(localStorage.getItem(`oposai_hist_${sesion.id}`) || '[]');
}

function guardarResultado(convId, convNombre, pct, hits, total) {
    const sesion = getSesion();
    if (!sesion) return;
    const hist = getHistorial();
    hist.unshift({ convId, convNombre, pct, hits, total, fecha: new Date().toISOString() });
    localStorage.setItem(`oposai_hist_${sesion.id}`, JSON.stringify(hist.slice(0, 50)));
}


/* ════════ SELECTOR DE CONVOCATORIAS ════════ */
function renderSelector() {
    const convs  = buildConvocatorias();
    const hist   = getHistorial();
    const hechas = new Set(hist.map(h => h.convId));

    document.getElementById('convGrid').innerHTML = Object.entries(convs).map(([convId, conv]) => {
        const hecho = hechas.has(convId);
        const badge = hecho
            ? `<span class="conv-badge hecho">✓ Realizado</span>`
            : `<span class="conv-badge nuevo">Nuevo</span>`;

        return `
            <div class="conv-card" onclick="iniciarTest('${convId}')">
                <div class="conv-year">${conv.año}</div>
                <div class="conv-tipo">${conv.tipo}</div>
                <div class="conv-meta">
                    <span>${conv.preguntas.length} preguntas</span>
                    ${badge}
                </div>
            </div>`;
    }).join('');
}


/* ════════ INICIAR TEST ════════ */
function iniciarTest(convId) {
    const convs = buildConvocatorias();
    convActual  = convId;
    const conv  = convs[convId];

    QUESTIONS = conv.preguntas.map(p => ({
        text: p.texto,
        opts: p.opciones,
        ok:   p.correcta
    }));

    answers   = {};
    corrected = false;

    document.getElementById('testTitulo').textContent    = `Convocatoria ${conv.año}`;
    document.getElementById('testSubtitulo').textContent = `${conv.tipo} · ${conv.preguntas.length} preguntas`;
    document.getElementById('scoreArea').innerHTML       = '';
    document.getElementById('checkBtn').style.display    = 'none';
    document.getElementById('vistaSelector').style.display = 'none';
    document.getElementById('vistaTest').style.display     = 'block';

    updateBar();
    renderPreguntas();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function volverSelector() {
    document.getElementById('vistaTest').style.display     = 'none';
    document.getElementById('vistaSelector').style.display = 'block';
    convActual = null;
}


/* ════════ PREGUNTAS ════════ */
function renderPreguntas() {
    document.getElementById('questionsWrap').innerHTML = QUESTIONS.map((q, qi) => `
        <div class="q-card">
            <div class="q-num">Pregunta ${qi + 1} de ${QUESTIONS.length}</div>
            <div class="q-text">${q.text}</div>
            <ul class="opts">
                ${q.opts.map((op, oi) => `
                    <li class="opt" id="opt-${qi}-${oi}" onclick="pick(${qi}, ${oi})">
                        <span class="opt-letter">${['A','B','C','D'][oi]}</span>
                        ${op}
                    </li>`).join('')}
            </ul>
        </div>`).join('');
}

function pick(qi, oi) {
    if (corrected) return;
    QUESTIONS[qi].opts.forEach((_, i) =>
        document.getElementById(`opt-${qi}-${i}`).classList.remove('selected')
    );
    document.getElementById(`opt-${qi}-${oi}`).classList.add('selected');
    answers[qi] = oi;
    updateBar();
    if (Object.keys(answers).length === QUESTIONS.length) {
        document.getElementById('checkBtn').style.display = 'inline-flex';
    }
}

function updateBar() {
    const n   = Object.keys(answers).length;
    const tot = QUESTIONS.length || 1;
    document.getElementById('testBar').style.width   = (n / tot * 100) + '%';
    document.getElementById('testLabel').textContent = `${n} / ${tot} respondidas`;
}

function comprobar() {
    corrected = true;
    let hits  = 0;

    QUESTIONS.forEach((q, qi) => {
        const sel = answers[qi];
        document.getElementById(`opt-${qi}-${q.ok}`).classList.remove('selected');
        document.getElementById(`opt-${qi}-${q.ok}`).classList.add('correct');
        if (sel !== undefined && sel !== q.ok) {
            document.getElementById(`opt-${qi}-${sel}`).classList.add('wrong');
        } else if (sel === q.ok) {
            hits++;
        }
    });

    const pct = Math.round((hits / QUESTIONS.length) * 100);
    const cls = pct >= 70 ? 'good' : pct >= 40 ? 'ok' : 'bad';
    const msg = pct >= 70 ? '¡Excelente! Estás por encima del aprobado 🎉'
              : pct >= 40 ? 'Buen intento, sigue practicando 💪'
              : 'Necesitas repasar más este examen 📚';

    document.getElementById('scoreArea').innerHTML = `
        <div class="score-banner ${cls}">
            <div class="score-num">${pct}%</div>
            <div>
                <div class="score-msg">${msg}</div>
                <div class="score-sub">${hits} de ${QUESTIONS.length} respuestas correctas</div>
            </div>
        </div>`;

    document.getElementById('checkBtn').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const convs = buildConvocatorias();
    const conv  = convs[convActual];
    guardarResultado(convActual, `Convocatoria ${conv.año}`, pct, hits, QUESTIONS.length);
}

function repetirTest() {
    if (!convActual) return;
    iniciarTest(convActual);
}


/* ════════ PROGRESO ════════ */
function renderProgreso() {
    const hist       = getHistorial();
    const total      = hist.length;
    const media      = total ? Math.round(hist.reduce((a, h) => a + h.pct, 0) / total) : null;
    const mejor      = total ? Math.max(...hist.map(h => h.pct)) : null;
    const convHechas = new Set(hist.map(h => h.convId)).size;

    document.getElementById('statTests').textContent = total;
    document.getElementById('statMedia').textContent = media !== null ? media + '%' : '—';
    document.getElementById('statMejor').textContent = mejor !== null ? mejor + '%' : '—';
    document.getElementById('statConvs').textContent = convHechas;

    if (hist.length === 0) {
        document.getElementById('testHistory').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <p>Aún no has completado ningún test</p>
            </div>`;
        return;
    }

    const scoreColor = (pct) => pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warn)' : 'var(--danger)';
    const scoreCls   = (pct) => pct >= 70 ? 'green' : pct >= 40 ? 'orange' : 'red';
    const scoreLabel = (pct) => pct >= 70 ? 'Aprobado' : pct >= 40 ? 'Regular' : 'Suspendido';

    document.getElementById('testHistory').innerHTML = hist.slice(0, 20).map(r => {
        const fecha = new Date(r.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        return `
        <div class="hist-row">
            <span style="font-size:18px">📝</span>
            <div class="hist-info">
                <div class="hist-topic">${r.convNombre}</div>
                <div class="hist-date">${fecha}</div>
            </div>
            <span class="badge ${scoreCls(r.pct)}">${scoreLabel(r.pct)}</span>
            <span class="hist-score" style="color:${scoreColor(r.pct)}">${r.pct}%</span>
        </div>`;
    }).join('');
}


/* ════════ INIT ════════ */
document.addEventListener('DOMContentLoaded', () => {
    renderSelector();
});