const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const filas = 8;
const columnas = 8;
const tamañoCelda = 50;
const frutas = ['🍎', '🍌', '🍇', '🍓', '🍊']; // Array de frutas
let tablero = [];
let frutaSeleccionada = null;
let eliminacionesCompletadas = false;

// Crear una fruta
function crearFruta(tipo, fila, col) {
    return {
        tipo,
        fila,
        col,
        yActual: fila * tamañoCelda,  // Posición actual (para animación de caída)
        opacidad: 1,  // Opacidad (para animación de desvanecimiento)
        eliminar: false, // Indicador para marcar frutas que deben ser eliminadas
    };
}

// Inicializar el tablero con frutas aleatorias
function inicializarTablero() {
    tablero = [];
    for (let fila = 0; fila < filas; fila++) {
        let filaTablero = [];
        for (let col = 0; col < columnas; col++) {
            const frutaAleatoria = frutas[Math.floor(Math.random() * frutas.length)];
            filaTablero.push(crearFruta(frutaAleatoria, fila, col));
        }
        tablero.push(filaTablero);
    }
    dibujarTablero();
}

// Dibujar el tablero
function dibujarTablero() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpiar el canvas antes de dibujar
    for (let fila = 0; fila < filas; fila++) {
        for (let col = 0; col < columnas; col++) {
            const fruta = tablero[fila][col];
            if (fruta) {
                ctx.globalAlpha = fruta.opacidad;  // Aplicar opacidad
                ctx.strokeRect(col * tamañoCelda, fruta.yActual, tamañoCelda, tamañoCelda);
                ctx.font = "30px Arial";
                ctx.fillText(fruta.tipo, col * tamañoCelda + 10, fruta.yActual + 35);
                ctx.globalAlpha = 1; // Restablecer opacidad
            }
        }
    }
}

// Manejar clic del usuario
canvas.addEventListener('click', (event) => {
    const x = event.offsetX;
    const y = event.offsetY;

    const fila = Math.floor(y / tamañoCelda);
    const col = Math.floor(x / tamañoCelda);

    if (frutaSeleccionada) {
        intercambiarFrutas(frutaSeleccionada, { fila, col });
        frutaSeleccionada = null;

        // Detectar combinaciones después del intercambio
        const combinaciones = detectarCombinaciones();
        if (combinaciones.length > 0) {
            eliminarCombinaciones(combinaciones, () => {
                aplicarGravedad(() => {
                    rellenarTablero();
                });
            });
        } else {
            dibujarTablero();  // Redibujar si no hubo combinación
        }
    } else {
        frutaSeleccionada = { fila, col };
    }
    dibujarTablero();
});

// Intercambiar dos frutas
function intercambiarFrutas(f1, f2) {
    const temp = tablero[f1.fila][f1.col];
    tablero[f1.fila][f1.col] = tablero[f2.fila][f2.col];
    tablero[f2.fila][f2.col] = temp;
}

// Detectar combinaciones de frutas (3 o más en fila o columna)
function detectarCombinaciones() {
    let combinaciones = [];

    // Revisar filas
    for (let fila = 0; fila < filas; fila++) {
        for (let col = 0; col < columnas - 2; col++) {
            const fruta = tablero[fila][col];
            if (fruta.tipo === tablero[fila][col + 1].tipo && fruta.tipo === tablero[fila][col + 2].tipo) {
                combinaciones.push({ fila, col });
            }
        }
    }

    // Revisar columnas
    for (let col = 0; col < columnas; col++) {
        for (let fila = 0; fila < filas - 2; fila++) {
            const fruta = tablero[fila][col];
            if (fruta.tipo === tablero[fila + 1][col].tipo && fruta.tipo === tablero[fila + 2][col].tipo) {
                combinaciones.push({ fila, col });
            }
        }
    }

    return combinaciones;
}

// Eliminar combinaciones con animación
function eliminarCombinaciones(combinaciones, callback) {
    let frutasAEliminar = [];
    
    combinaciones.forEach(({ fila, col }) => {
        for (let i = 0; i < 3; i++) {  // Añadir las tres frutas en la combinación
            const fruta = tablero[fila][col + i];
            fruta.eliminar = true;
            frutasAEliminar.push(fruta);
            animarDesvanecimiento(fruta);
        }
    });

    setTimeout(() => {
        frutasAEliminar.forEach(fruta => {
            tablero[fruta.fila][fruta.col] = null;  // Eliminar del tablero
        });
        callback();  // Llamar al callback cuando termine la eliminación
    }, 500);  // Esperar 500ms para la animación de desvanecimiento
}

// Animar desvanecimiento de frutas
function animarDesvanecimiento(fruta) {
    const duracion = 500; // 500ms de duración de la animación
    const frameRate = 60;  // 60 frames por segundo
    const framesTotales = duracion / (1000 / frameRate);
    let frameActual = 0;

    function animar() {
        if (frameActual < framesTotales) {
            fruta.opacidad -= 1 / framesTotales;  // Reducir opacidad
            frameActual++;
            requestAnimationFrame(animar);  // Continuar la animación
        } else {
            fruta.opacidad = 0;
        }
        dibujarTablero();  // Actualizar la pantalla
    }
    animar();
}

// Aplicar gravedad para las frutas que caen
function aplicarGravedad(callback) {
    let frutasCaidas = 0;

    for (let col = 0; col < columnas; col++) {
        for (let fila = filas - 1; fila >= 0; fila--) {
            if (!tablero[fila][col]) {
                for (let filaArriba = fila - 1; filaArriba >= 0; filaArriba--) {
                    if (tablero[filaArriba][col]) {
                        tablero[fila][col] = tablero[filaArriba][col];
                        tablero[filaArriba][col] = null;
                        tablero[fila][col].fila = fila;  // Actualizar la fila de la fruta que cae
                        frutasCaidas++;
                        animarCaida(tablero[fila][col], () => {
                            frutasCaidas--;
                            if (frutasCaidas === 0) {
                                callback();  // Llamar a callback cuando todas las frutas hayan caído
                            }
                        });
                        break;
                    }
                }
            }
        }
    }
}

// Animar caída de frutas
function animarCaida(fruta, callback) {
    const yInicial = fruta.yActual;
    const yFinal = fruta.fila * tamañoCelda;
    const duracion = 500;  // 500ms de duración de la animación
    const frameRate = 60;  // 60 frames por segundo
    const framesTotales = duracion / (1000 / frameRate);
    let frameActual = 0;

    function animar() {
        if (frameActual < framesTotales) {
            fruta.yActual += (yFinal - yInicial) / framesTotales;  // Actualizar posición Y
            frameActual++;
            requestAnimationFrame(animar);  // Continuar la animación
        } else {
            fruta.yActual = yFinal;  // Asegurarse de que termine exactamente en la posición final
            callback();  // Llamar al callback cuando termine
        }
        dibujarTablero();  // Actualizar pantalla
    }
    animar();
}

// Rellenar el tablero con nuevas frutas
function rellenarTablero() {
    for (let fila = 0; fila < filas; fila++) {
        for (let col = 0; col < columnas; col++) {
            if (!tablero[fila][col]) {
                const nuevaFruta = crearFruta(frutas[Math.floor(Math.random() * frutas.length)], fila, col);
                tablero[fila][col] = nuevaFruta;
                animarCaida(nuevaFruta, () => {});
            }
        }
    }
}

// Inicializar y dibujar el juego
inicializarTablero();