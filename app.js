function generarResumen(){

    let texto = document.getElementById("texto").value;

    if(texto.length === 0){
        alert("Escribe algo primero");
        return;
    }

    let resumen = texto.substring(0,200) + "...";

    document.getElementById("resultado").innerHTML = `
        <div class="card">
            <h3>📚 Resumen generado</h3>
            <p>${resumen}</p>
        </div>
    `;
}