/* ════════════════════════════════════════
   OposAI — app.js
   Toda la lógica JavaScript de la aplicación
   ════════════════════════════════════════ */


/* ════════ NAVEGACIÓN ════════
   Muestra la sección activa y marca el item del menú
   ──────────────────────────────────────────────── */
function nav(id, el) {
    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(s => s.classList.remove('visible'));
    // Quitar "active" de todos los items del menú
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    // Mostrar la sección seleccionada
    document.getElementById(id).classList.add('visible');
    // Marcar el item del menú como activo
    el.classList.add('active');
}


/* ════════ ANALIZADOR ════════
   Lógica del área de texto y generación de resumen
   ──────────────────────────────────────────────── */

// Actualiza el contador de caracteres en tiempo real
function updateCounter() {
    const n = document.getElementById('textoInput').value.length;
    document.getElementById('charCount').textContent = n.toLocaleString('es-ES');
}

// Limpia el textarea y el resultado
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

// Genera el resumen del texto pegado
// TODO: Conectar con Claude API para resúmenes inteligentes reales
function generarResumen() {
    const texto = document.getElementById('textoInput').value.trim();

    if (!texto) {
        alert('Escribe o pega un texto primero');
        return;
    }

    // Mostrar estado de carga
    const btn = document.getElementById('analyzeBtn');
    btn.disabled = true;
    btn.innerHTML = '⏳ Analizando...';

    // Simulamos un tiempo de espera (se eliminará cuando conectemos la IA real)
    setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = '✨ Analizar temario';

        const palabras = texto.split(/\s+/).filter(Boolean).length;
        const preview  = texto.length > 350 ? texto.substring(0, 350) + '…' : texto;

        document.getElementById('resultado').innerHTML = `
            <div class="card" style="animation:fadeUp .25s ease">
                <div class="result-tag">Resumen generado</div>
                <p class="result-body">${preview}</p>
                <div class="result-meta">
                    <span>📊 <b>${palabras}</b> palabras</span>
                    <span>⏱ Lectura estimada: <b>${Math.ceil(palabras / 200)} min</b></span>
                </div>
                <div class="info-pill">
                    💡 <b>Próximamente:</b> Conectaremos IA real (Claude API) para generar resúmenes inteligentes automáticos
                </div>
            </div>`;
    }, 1100);
}


/* ════════ TEST ════════
   Lógica del generador de preguntas tipo test
   ──────────────────────────────────────────────── */

// Banco de preguntas
// TODO: Generar estas preguntas dinámicamente con IA a partir del temario
const QUESTIONS = [
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

// Estado del test
let answers   = {};
let corrected = false;

// Construye el HTML del test
function buildTest() {
    corrected = false;
    answers   = {};
    document.getElementById('scoreArea').innerHTML    = '';
    document.getElementById('checkBtn').style.display = 'none';
    updateBar();

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

// Gestiona la selección de una opción
function pick(qi, oi) {
    if (corrected) return;

    // Quitar selección previa de esa pregunta
    QUESTIONS[qi].opts.forEach((_, i) =>
        document.getElementById(`opt-${qi}-${i}`).classList.remove('selected')
    );

    // Marcar la nueva opción como seleccionada
    document.getElementById(`opt-${qi}-${oi}`).classList.add('selected');
    answers[qi] = oi;

    updateBar();

    // Mostrar botón de comprobar cuando todas estén respondidas
    if (Object.keys(answers).length === QUESTIONS.length)
        document.getElementById('checkBtn').style.display = 'inline-flex';
}

// Actualiza la barra de progreso del test
function updateBar() {
    const n   = Object.keys(answers).length;
    const pct = (n / QUESTIONS.length) * 100;
    document.getElementById('testBar').style.width      = pct + '%';
    document.getElementById('testLabel').textContent    = `${n} / ${QUESTIONS.length} respondidas`;
}

// Comprueba las respuestas y muestra la puntuación
function comprobar() {
    corrected = true;
    let hits  = 0;

    QUESTIONS.forEach((q, qi) => {
        const sel = answers[qi];

        // Marcar la respuesta correcta en verde
        document.getElementById(`opt-${qi}-${q.ok}`).classList.remove('selected');
        document.getElementById(`opt-${qi}-${q.ok}`).classList.add('correct');

        // Si eligió una incorrecta, marcarla en rojo
        if (sel !== undefined && sel !== q.ok) {
            document.getElementById(`opt-${qi}-${sel}`).classList.add('wrong');
        } else if (sel === q.ok) {
            hits++;
        }
    });

    // Calcular y mostrar el banner de puntuación
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

// Reinicia el test desde cero
function resetTest() {
    buildTest();
}


/* ════════ PROGRESO ════════
   Genera los elementos visuales de la sección de progreso
   ──────────────────────────────────────────────── */

// Construye la cuadrícula de racha de estudio (últimas 3 semanas)
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

// Construye las barras de progreso por tema
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

    // Animamos las barras tras renderizar
    setTimeout(() => {
        document.querySelectorAll('.subj-fill').forEach(el => {
            el.style.width = el.dataset.pct + '%';
        });
    }, 120);
}

// Construye el historial de tests recientes
function buildHistory() {
    const rows = [
        { topic: 'Derecho Constitucional',    date: 'Hoy, 10:30',   score: 90, cls: 'green',  label: 'Aprobado'   },
        { topic: 'Administración del Estado', date: 'Ayer, 18:45',  score: 70, cls: 'green',  label: 'Aprobado'   },
        { topic: 'Derecho Administrativo',    date: 'Hace 2 días',  score: 50, cls: 'orange', label: 'Regular'    },
        { topic: 'Informática básica',         date: 'Hace 3 días',  score: 30, cls: 'red',    label: 'Suspendido' },
        { topic: 'Ofimática',                  date: 'Hace 4 días',  score: 80, cls: 'green',  label: 'Aprobado'   },
    ];

    const scoreColor = {
        green:  'var(--success)',
        orange: 'var(--warn)',
        red:    'var(--danger)'
    };

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


/* ════════ INIT ════════
   Se ejecuta al cargar la página
   ──────────────────────────────────────────────── */
buildTest();
buildStreak();
buildSubjects();
buildHistory();