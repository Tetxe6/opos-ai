/* ════════════════════════════════════════
   OposAI — app.js  v2.0
   ════════════════════════════════════════ */

/* ════════ GUARDIA: config.js ════════
   Si no existe config.js, mostramos aviso en lugar de romper */
if (typeof CONFIG === 'undefined') {
    window.CONFIG = { GROQ_API_KEY: null };
}

/* ════════ GUARDIA: preguntas.js ════════
   Si no existe la base de datos, usamos preguntas de ejemplo */
if (typeof PREGUNTAS_OFICIALES === 'undefined') {
    window.PREGUNTAS_OFICIALES = [
        {
            texto: "¿En qué año se aprobó la Constitución Española vigente?",
            opciones: ["1975", "1977", "1978", "1981"],
            correcta: 2
        },
        {
            texto: "¿Cuántos artículos tiene la Constitución Española de 1978?",
            opciones: ["139", "169", "178", "200"],
            correcta: 2
        },
        {
            texto: "¿Cuál es la forma política del Estado español según la Constitución?",
            opciones: ["República democrática", "Monarquía parlamentaria", "Monarquía constitucional", "Estado federal"],
            correcta: 1
        },
        {
            texto: "¿Qué órgano tiene la iniciativa legislativa según la Constitución?",
            opciones: ["Solo el Gobierno", "Solo el Congreso", "El Gobierno, el Congreso y el Senado", "Solo el Senado"],
            correcta: 2
        },
        {
            texto: "¿Cuál es el título primero de la Constitución Española?",
            opciones: ["De la Corona", "De los derechos y deberes fundamentales", "Del Gobierno", "De las Cortes Generales"],
            correcta: 1
        },
        {
            texto: "¿Quién promulga las leyes en España?",
            opciones: ["El Presidente del Gobierno", "El Rey", "El Congreso de los Diputados", "El Tribunal Constitucional"],
            correcta: 1
        },
        {
            texto: "¿Qué es el BOE?",
            opciones: ["Banco Oficial Español", "Boletín Oficial del Estado", "Boletín de Operaciones del Estado", "Banco de Operaciones Exteriores"],
            correcta: 1
        },
        {
            texto: "¿Cuántos diputados componen el Congreso?",
            opciones: ["250", "300", "350", "400"],
            correcta: 2
        }
    ];
}

/* ════════ NAVEGACIÓN ════════ */
function nav(id, el) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('visible'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(id)?.classList.add('visible');
    el.classList.add('active');
}

/* ════════ GROQ API ════════ */
async function llamarGroq(mensajeUsuario, prompt_sistema) {
    if (!CONFIG.GROQ_API_KEY) {
        throw new Error('No hay API key configurada. Crea config.js con tu clave de Groq.');
    }

    const respuesta = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: prompt_sistema },
                { role: 'user',   content: mensajeUsuario }
            ],
            temperature: 0.5
        })
    });

    if (!respuesta.ok) {
        const error = await respuesta.json().catch(() => ({}));
        throw new Error(error.error?.message || `Error ${respuesta.status} en la API de Groq`);
    }

    const datos = await respuesta.json();
    return datos.choices[0].message.content;
}

/* ════════ ANALIZADOR ════════ */

function updateCounter() {
    const n = document.getElementById('textoInput')?.value.length || 0;
    document.getElementById('charCount').textContent = n.toLocaleString('es-ES');
}

function limpiar() {
    const input = document.getElementById('textoInput');
    if (input) input.value = '';
    updateCounter();
    setResultadoVacio();
}

function setResultadoVacio() {
    document.getElementById('resultado').innerHTML = `
        <div class="card">
            <div class="empty-state">
                <div class="es-icon">📄</div>
                <div class="es-title">Todavía no hay resumen</div>
                <div class="es-sub">Pega tu texto arriba y pulsa "Analizar temario"</div>
            </div>
        </div>`;
}

async function generarResumen() {
    const texto = document.getElementById('textoInput')?.value.trim();

    if (!texto) {
        mostrarAlertaInput('Escribe o pega un texto primero.');
        return;
    }
    if (texto.length < 50) {
        mostrarAlertaInput('El texto es demasiado corto. Añade más contenido para obtener un buen resumen.');
        return;
    }

    const btn = document.getElementById('analyzeBtn');
    setBotonCargando(btn, 'Analizando...');

    document.getElementById('resultado').innerHTML = `
        <div class="card">
            <div class="empty-state">
                <div class="es-icon" style="animation:pulse 1.4s ease infinite">🤖</div>
                <div class="es-title">La IA está procesando tu texto…</div>
                <div class="es-sub">Puede tardar unos segundos</div>
            </div>
        </div>`;

    try {
        const resumen = await llamarGroq(
            texto,
            `Eres un asistente experto en preparación de oposiciones españolas.
Analiza el texto del opositor y genera:
1. Un resumen claro en 3-5 puntos clave
2. Los conceptos más importantes que debe memorizar
3. Una pregunta de repaso al final

Responde en español con HTML simple: <p>, <strong>, <ul>, <li>, <br>.
No uses markdown, no uses h1/h2/h3. Solo HTML básico y limpio.`
        );

        const palabras = texto.split(/\s+/).filter(Boolean).length;
        const minutos  = Math.max(1, Math.ceil(palabras / 200));

        document.getElementById('resultado').innerHTML = `
            <div class="card" style="animation:fadeUp .22s ease">
                <div class="result-tag">✨ Resumen generado por IA</div>
                <div class="result-body">${resumen}</div>
                <div class="result-meta">
                    <span>📊 <b>${palabras.toLocaleString('es-ES')}</b> palabras analizadas</span>
                    <span>⏱ Lectura: <b>${minutos} min</b></span>
                    <span>🤖 Modelo: Llama 3.3 70B</span>
                </div>
            </div>`;

    } catch (err) {
        document.getElementById('resultado').innerHTML = `
            <div class="card">
                <div class="alert alert-warn">
                    ❌ <span><strong>Error:</strong> ${err.message}</span>
                </div>
                <p style="font-size:13px;color:var(--text-2)">
                    Comprueba que <code>config.js</code> existe y tiene una API key válida de 
                    <a href="https://console.groq.com" target="_blank" style="color:var(--accent)">Groq</a>.
                </p>
            </div>`;
    } finally {
        resetBoton(btn, '✨ Analizar temario');
    }
}

function mostrarAlertaInput(msg) {
    const el = document.getElementById('inputAlert');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'flex';
    setTimeout(() => { el.style.display = 'none'; }, 3500);
}

/* ════════ TEST ════════ */

let QUESTIONS = [];
let answers   = {};
let corrected = false;

async function generarTestConIA() {
    const tema = document.getElementById('temaInput')?.value.trim();
    const textoAnalizador = document.getElementById('textoInput')?.value.trim();

    let contenido = '';
    if (tema) {
        contenido = `Genera preguntas de oposición sobre: ${tema}`;
    } else if (textoAnalizador && textoAnalizador.length > 50) {
        contenido = `Genera preguntas basadas en este texto:\n\n${textoAnalizador.slice(0, 2000)}`;
    } else {
        return getDefaultQuestions();
    }

    const respuestaIA = await llamarGroq(
        contenido,
        `Eres un experto en oposiciones españolas. Genera exactamente 5 preguntas tipo test.

IMPORTANTE: Responde SOLO con un array JSON válido. Sin texto extra, sin markdown, sin bloques de código.

Formato exacto (respeta las comillas y la estructura):
[
  {
    "text": "Texto de la pregunta aquí",
    "opts": ["Opción A", "Opción B", "Opción C", "Opción D"],
    "ok": 0
  }
]

Donde "ok" es el índice 0-3 de la opción correcta.
Genera preguntas variadas, claras y sin ambigüedad.`
    );

    // Limpiar posibles bloques markdown ```json ... ```
    const limpio = respuestaIA
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

    return JSON.parse(limpio);
}

function getDefaultQuestions() {
    const mezcladas = [...PREGUNTAS_OFICIALES].sort(() => Math.random() - 0.5);
    return mezcladas.slice(0, Math.min(5, mezcladas.length)).map(p => ({
        text: p.texto,
        opts: p.opciones,
        ok:   p.correcta
    }));
}

function buildTest() {
    corrected = false;
    answers   = {};
    document.getElementById('scoreArea').innerHTML    = '';
    document.getElementById('checkBtn').style.display = 'none';
    updateBar();
    document.getElementById('questionsWrap').innerHTML = '';
}

async function generarNuevoTest() {
    const btn = document.getElementById('newTestBtn');
    setBotonCargando(btn, 'Generando…');

    document.getElementById('questionsWrap').innerHTML = `
        <div class="card">
            <div class="empty-state">
                <div class="es-icon" style="animation:pulse 1.4s ease infinite">🤖</div>
                <div class="es-title">Generando preguntas personalizadas…</div>
                <div class="es-sub">La IA está preparando tu test</div>
            </div>
        </div>`;
    document.getElementById('scoreArea').innerHTML = '';

    try {
        QUESTIONS = await generarTestConIA();
    } catch (err) {
        console.warn('Fallback a preguntas por defecto:', err.message);
        QUESTIONS = getDefaultQuestions();
    }

    buildTest();
    renderPreguntas();
    resetBoton(btn, '🧠 Generar test');
}

function renderPreguntas() {
    if (!QUESTIONS.length) {
        document.getElementById('questionsWrap').innerHTML = `
            <div class="card">
                <div class="empty-state">
                    <div class="es-icon">🧪</div>
                    <div class="es-title">Escribe un tema y genera tu test</div>
                    <div class="es-sub">O pulsa "Generar test" para usar preguntas de ejemplo</div>
                </div>
            </div>`;
        return;
    }

    document.getElementById('questionsWrap').innerHTML = QUESTIONS.map((q, qi) => `
        <div class="q-card">
            <div class="q-num">Pregunta ${qi + 1} de ${QUESTIONS.length}</div>
            <div class="q-text">${escapeHtml(q.text)}</div>
            <ul class="opts">
                ${q.opts.map((op, oi) => `
                    <li class="opt" id="opt-${qi}-${oi}" onclick="pick(${qi}, ${oi})">
                        <span class="opt-letter">${['A','B','C','D'][oi] || oi+1}</span>
                        ${escapeHtml(op)}
                    </li>`).join('')}
            </ul>
        </div>
    `).join('');
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function pick(qi, oi) {
    if (corrected) return;
    QUESTIONS[qi].opts.forEach((_, i) =>
        document.getElementById(`opt-${qi}-${i}`)?.classList.remove('selected')
    );
    document.getElementById(`opt-${qi}-${oi}`)?.classList.add('selected');
    answers[qi] = oi;
    updateBar();
    const respondidas = Object.keys(answers).length;
    if (respondidas === QUESTIONS.length) {
        document.getElementById('checkBtn').style.display = 'inline-flex';
        document.getElementById('checkBtn').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function updateBar() {
    const n   = Object.keys(answers).length;
    const tot = QUESTIONS.length || 1;
    const pct = (n / tot) * 100;
    document.getElementById('testBar').style.width   = pct + '%';
    document.getElementById('testLabel').textContent = `${n} / ${tot} respondidas`;
}

function comprobar() {
    if (!QUESTIONS.length) return;
    corrected = true;
    let hits = 0;

    QUESTIONS.forEach((q, qi) => {
        const sel = answers[qi];
        const okEl = document.getElementById(`opt-${qi}-${q.ok}`);
        if (okEl) {
            okEl.classList.remove('selected');
            okEl.classList.add('correct');
        }
        if (sel !== undefined && sel !== q.ok) {
            document.getElementById(`opt-${qi}-${sel}`)?.classList.add('wrong');
        } else if (sel === q.ok) {
            hits++;
        }
    });

    const pct = Math.round((hits / QUESTIONS.length) * 100);
    const cls = pct >= 70 ? 'good' : pct >= 40 ? 'ok' : 'bad';
    const msg = pct >= 70 ? '¡Excelente resultado! Sigue así 🎉'
              : pct >= 40 ? 'Buen intento, sigue practicando 💪'
              : 'Necesitas repasar más este tema 📚';

    document.getElementById('scoreArea').innerHTML = `
        <div class="score-banner ${cls}">
            <div class="score-num">${pct}%</div>
            <div>
                <div class="score-msg">${msg}</div>
                <div class="score-sub">${hits} de ${QUESTIONS.length} respuestas correctas</div>
            </div>
        </div>`;

    document.getElementById('checkBtn').style.display = 'none';
    document.getElementById('scoreArea').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ════════ UTILIDADES ════════ */
function setBotonCargando(btn, texto) {
    if (!btn) return;
    btn.disabled = true;
    btn.dataset.original = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span>${texto}`;
}

function resetBoton(btn, texto) {
    if (!btn) return;
    btn.disabled = false;
    btn.innerHTML = texto;
}

/* ════════ PROGRESO ════════ */

function buildStreak() {
    const pattern = [1,1,0,1,1,1,0, 1,1,1,1,0,1,1, 1,1,1,1,1,1,0];
    const days    = ['L','M','X','J','V','S','D'];

    // Cabecera de días
    const labels = `<div class="streak-labels">
        ${days.map(d => `<span>${d}</span>`).join('')}
    </div>`;

    const semanas = [];
    for (let w = 0; w < 3; w++) {
        semanas.push(
            `<div class="week-row">` +
            pattern.slice(w * 7, w * 7 + 7).map((done, i) => {
                const idx     = w * 7 + i;
                const isToday = idx === 20;
                const cls     = done ? 'done' : '';
                const todayCls = isToday ? 'today' : '';
                return `<div class="day-cell ${cls} ${todayCls}" title="Día ${idx + 1}">
                    ${done && !isToday ? '✓' : isToday ? '●' : days[i]}
                </div>`;
            }).join('') +
            `</div>`
        );
    }
    document.getElementById('streakGrid').innerHTML = labels + semanas.join('');
}

function buildSubjects() {
    const subjects = [
        { name: 'Derecho Constitucional',    pct: 68 },
        { name: 'Administración del Estado', pct: 45 },
        { name: 'Derecho Administrativo',    pct: 82 },
        { name: 'Informática básica',         pct: 91 },
        { name: 'Ofimática',                  pct: 33 },
    ];
    document.getElementById('subjectBars').innerHTML = subjects.map(s => `
        <div class="subj-row">
            <div class="subj-head">
                <span class="subj-name">${s.name}</span>
                <span class="subj-pct">${s.pct}%</span>
            </div>
            <div class="subj-track">
                <div class="subj-fill" style="width:0%" data-pct="${s.pct}"></div>
            </div>
        </div>`).join('');

    // Animación de entrada con delay
    setTimeout(() => {
        document.querySelectorAll('.subj-fill').forEach(el => {
            el.style.width = el.dataset.pct + '%';
        });
    }, 150);
}

function buildHistory() {
    const rows = [
        { topic: 'Derecho Constitucional',    date: 'Hoy, 10:30',   score: 90, cls: 'green',  label: 'Aprobado'   },
        { topic: 'Administración del Estado', date: 'Ayer, 18:45',  score: 70, cls: 'green',  label: 'Aprobado'   },
        { topic: 'Derecho Administrativo',    date: 'Hace 2 días',  score: 50, cls: 'orange', label: 'Regular'    },
        { topic: 'Informática básica',         date: 'Hace 3 días',  score: 30, cls: 'red',    label: 'Suspendido' },
        { topic: 'Ofimática',                  date: 'Hace 4 días',  score: 80, cls: 'green',  label: 'Aprobado'   },
    ];
    const scoreColor = { green: 'var(--success)', orange: 'var(--warn)', red: 'var(--danger)' };

    document.getElementById('testHistory').innerHTML = rows.map(r => `
        <div class="hist-row">
            <div class="hist-icon">📝</div>
            <div class="hist-info">
                <div class="hist-topic">${r.topic}</div>
                <div class="hist-date">${r.date}</div>
            </div>
            <span class="badge ${r.cls}">${r.label}</span>
            <span class="hist-score" style="color:${scoreColor[r.cls]}">${r.score}%</span>
        </div>`).join('');
}

/* ════════ INIT ════════ */
document.addEventListener('DOMContentLoaded', () => {
    buildStreak();
    buildSubjects();
    buildHistory();
    setResultadoVacio();

    // Test inicial con preguntas de ejemplo
    QUESTIONS = getDefaultQuestions();
    buildTest();
    // No renderizar preguntas al inicio — esperamos a que el usuario genere el test
});