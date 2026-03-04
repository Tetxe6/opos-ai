/* ════════════════════════════════════════
   OposAI — app.js
   ════════════════════════════════════════ */


/* ════════ NAVEGACIÓN ════════ */
function nav(id, el) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('visible'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(id).classList.add('visible');
    el.classList.add('active');
}


/* ════════ GROQ API ════════
   Función central que llama a la IA
   ──────────────────────────────────────────────── */
async function llamarGroq(mensajeUsuario, prompt_sistema) {
    const respuesta = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: 'llama3-8b-8192',
            messages: [
                { role: 'system', content: prompt_sistema },
                { role: 'user',   content: mensajeUsuario }
            ],
            temperature: 0.5
        })
    });

    if (!respuesta.ok) {
        const error = await respuesta.json();
        throw new Error(error.error?.message || 'Error en la API de Groq');
    }

    const datos = await respuesta.json();
    return datos.choices[0].message.content;
}


/* ════════ ANALIZADOR ════════ */

function updateCounter() {
    const n = document.getElementById('textoInput').value.length;
    document.getElementById('charCount').textContent = n.toLocaleString('es-ES');
}

function limpiar() {
    document.getElementById('textoInput').value = '';
    updateCounter();
    document.getElementById('resultado').innerHTML = `
        <div class="card">
            <div class="empty-state">
                <div class="icon">📄</div>
                <p>El resumen aparecerá aquí cuando analices tu texto</p>
            </div>
        </div>`;
}

async function generarResumen() {
    const texto = document.getElementById('textoInput').value.trim();

    if (!texto) {
        alert('Escribe o pega un texto primero');
        return;
    }

    // Estado de carga
    const btn = document.getElementById('analyzeBtn');
    btn.disabled = true;
    btn.innerHTML = '⏳ Analizando...';

    document.getElementById('resultado').innerHTML = `
        <div class="card">
            <div class="empty-state">
                <div class="icon">🤖</div>
                <p>La IA está procesando tu texto...</p>
            </div>
        </div>`;

    try {
        const resumen = await llamarGroq(
            texto,
            `Eres un asistente experto en preparación de oposiciones españolas.
            Tu tarea es analizar el texto que te proporciona el opositor y generar:
            1. Un resumen claro y estructurado en 3-5 puntos clave
            2. Los conceptos más importantes que debe memorizar
            3. Una pregunta de repaso al final

            Responde en español, en formato HTML simple usando solo: <p>, <strong>, <ul>, <li>, <br>.
            No uses markdown, no uses headers como h1/h2, solo HTML básico.`
        );

        const palabras = texto.split(/\s+/).filter(Boolean).length;

        document.getElementById('resultado').innerHTML = `
            <div class="card" style="animation:fadeUp .25s ease">
                <div class="result-tag">✨ Resumen generado por IA</div>
                <div class="result-body">${resumen}</div>
                <div class="result-meta">
                    <span>📊 <b>${palabras}</b> palabras analizadas</span>
                    <span>⏱ Lectura estimada: <b>${Math.ceil(palabras / 200)} min</b></span>
                </div>
            </div>`;

    } catch (error) {
        document.getElementById('resultado').innerHTML = `
            <div class="card">
                <div class="info-pill" style="background:var(--danger-light); color:var(--danger)">
                    ❌ Error: ${error.message}
                </div>
            </div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '✨ Analizar temario';
    }
}


/* ════════ TEST ════════ */

let QUESTIONS = [];
let answers   = {};
let corrected = false;

// Genera preguntas con IA a partir del texto del analizador
async function generarTestConIA() {
    const texto = document.getElementById('textoInput').value.trim();

    // Si no hay texto en el analizador, usamos preguntas de ejemplo
    if (!texto) {
        return getDefaultQuestions();
    }

    const respuestaIA = await llamarGroq(
        texto,
        `Eres un experto en oposiciones españolas. Genera exactamente 3 preguntas tipo test basadas en el texto proporcionado.

        IMPORTANTE: Responde SOLO con un JSON válido, sin texto adicional, sin markdown, sin explicaciones.
        El formato debe ser exactamente este:
        [
          {
            "text": "Pregunta aquí",
            "opts": ["Opción A", "Opción B", "Opción C", "Opción D"],
            "ok": 0
          }
        ]
        Donde "ok" es el índice (0-3) de la respuesta correcta.`
    );

    // Limpiamos la respuesta por si viene con markdown
    const limpio = respuestaIA.replace(/```json|```/g, '').trim();
    return JSON.parse(limpio);
}

function getDefaultQuestions() {
    return [
        {
            text: '¿Cuál es el órgano legislativo principal en España?',
            opts: ['El Gobierno', 'Las Cortes Generales', 'El Consejo de Estado', 'El Tribunal Constitucional'],
            ok: 1
        },
        {
            text: '¿En qué año entró en vigor la Constitución española vigente?',
            opts: ['1975', '1977', '1978', '1982'],
            ok: 2
        },
        {
            text: '¿Cuántos artículos tiene la Constitución española?',
            opts: ['139', '159', '169', '196'],
            ok: 2
        }
    ];
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
    btn.disabled = true;
    btn.innerHTML = '⏳ Generando preguntas...';

    document.getElementById('questionsWrap').innerHTML = `
        <div class="card">
            <div class="empty-state">
                <div class="icon">🤖</div>
                <p>La IA está generando preguntas personalizadas...</p>
            </div>
        </div>`;

    try {
        QUESTIONS = await generarTestConIA();
        buildTest();
        renderPreguntas();
    } catch (error) {
        // Si falla la IA, usamos preguntas por defecto
        QUESTIONS = getDefaultQuestions();
        buildTest();
        renderPreguntas();
    } finally {
        btn.disabled = false;
        btn.innerHTML = '🔄 Nuevo test';
    }
}

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
        </div>
    `).join('');
}

function pick(qi, oi) {
    if (corrected) return;
    QUESTIONS[qi].opts.forEach((_, i) =>
        document.getElementById(`opt-${qi}-${i}`).classList.remove('selected')
    );
    document.getElementById(`opt-${qi}-${oi}`).classList.add('selected');
    answers[qi] = oi;
    updateBar();
    if (Object.keys(answers).length === QUESTIONS.length)
        document.getElementById('checkBtn').style.display = 'inline-flex';
}

function updateBar() {
    const n   = Object.keys(answers).length;
    const tot = QUESTIONS.length || 3;
    const pct = (n / tot) * 100;
    document.getElementById('testBar').style.width   = pct + '%';
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
    const msg = pct >= 70 ? '¡Excelente resultado! Sigue así 🎉'
              : pct >= 40 ? 'Buen intento, sigue practicando 💪'
              : 'Necesitas repasar este tema 📚';

    document.getElementById('scoreArea').innerHTML = `
        <div class="score-banner ${cls}">
            <div class="score-num">${pct}%</div>
            <div>
                <div class="score-msg">${msg}</div>
                <div class="score-sub">${hits} de ${QUESTIONS.length} respuestas correctas</div>
            </div>
        </div>`;

    document.getElementById('checkBtn').style.display = 'none';
}

function resetTest() {
    generarNuevoTest();
}


/* ════════ PROGRESO ════════ */

function buildStreak() {
    const pattern = [1,1,0,1,1,1,0, 1,1,1,1,0,1,1, 1,1,1,1,1,1,0];
    const days    = ['L','M','X','J','V','S','D'];
    const weeks   = [];
    for (let w = 0; w < 3; w++) {
        weeks.push(
            `<div class="week-row">` +
            pattern.slice(w * 7, w * 7 + 7).map((done, i) => {
                const idx     = w * 7 + i;
                const isToday = idx === 20;
                return `<div class="day-cell ${done ? 'done' : ''} ${isToday ? 'today' : ''}"
                    title="Día ${idx + 1}">${done ? '✓' : days[i]}</div>`;
            }).join('') +
            `</div>`
        );
    }
    document.getElementById('streakGrid').innerHTML = weeks.join('');
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

    setTimeout(() => {
        document.querySelectorAll('.subj-fill').forEach(el => {
            el.style.width = el.dataset.pct + '%';
        });
    }, 120);
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
            <span style="font-size:18px">📝</span>
            <div class="hist-info">
                <div class="hist-topic">${r.topic}</div>
                <div class="hist-date">${r.date}</div>
            </div>
            <span class="badge ${r.cls}">${r.label}</span>
            <span class="hist-score" style="color:${scoreColor[r.cls]}">${r.score}%</span>
        </div>`).join('');
}


/* ════════ INIT ════════ */
buildStreak();
buildSubjects();
buildHistory();

// Cargar test con preguntas por defecto al inicio
QUESTIONS = getDefaultQuestions();
buildTest();
renderPreguntas();