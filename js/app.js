// ================================
//   OposAI — Lógica principal
// ================================

function generarResumen() {
    const texto = document.getElementById("texto").value.trim();

    if (texto.length === 0) {
        alert("✏️ Escribe o pega tu temario primero");
        return;
    }

    // Por ahora: recorte simple. Próximamente: IA real
    const resumen = texto.substring(0, 300) + "...";

    document.getElementById("resultado").innerHTML = `
        <div class="card">
            <h3>📚 Resumen generado</h3>
            <p>${resumen}</p>
        </div>
    `;
}