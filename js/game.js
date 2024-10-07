const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const filas = 8;
const columnas = 8;
const tamañoCelda = 50;
const frutas = ['🍎', '🍌', '🍇', '🍓', '🍊']; // Array de frutas
let tablero = [];
let frutaSeleccionada = null;
let bloqueado = false; // Bloquear la interacción mientras se están ejecutando las animaciones

// Crear una fruta
function crearFruta(tipo, fila, col) {
    return {
        tipo,
        fila,
        col,
        yActual: fila * tamañoCelda,  // Posición actual (para animación de caída)
        opacidad: 1,  // Opacidad (para animación de desvanecimiento)
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

// Función para manejar el clic del usuario en el canvas
canvas.addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const fila = Math.floor(y / tamanioFruta);
    const col = Math.floor(x / tamanioFruta);

    // Verificamos si las coordenadas están dentro de los límites del tablero antes de continuar
    if (fila >= 0 && fila < filas && col >= 0 && col < columnas) {
        manejarClick(fila, col);
    } else {
        console.error("Las coordenadas del clic están fuera de los límites del tablero.");
    }
});

// Función para manejar la lógica cuando el usuario hace clic en una fruta
function manejarClick(fila, col) {
    const fruta = tablero[fila]?.[col];

    // Si ya hay una fruta seleccionada, intentamos intercambiar
    if (frutaSeleccionada) {
        const { fila: fila1, col: col1 } = frutaSeleccionada;
        const fila2 = fila;
        const col2 = col;

        // Verificamos que ambas frutas estén adyacentes para el intercambio
        const adyacentes = Math.abs(fila1 - fila2) + Math.abs(col1 - col2) === 1;

        if (adyacentes) {
            intercambiarFrutas(fila1, col1, fila2, col2);
            frutaSeleccionada = null;  // Reiniciamos la selección
        } else {
            console.log("Las frutas no son adyacentes.");
            frutaSeleccionada = null;  // Reiniciamos la selección
        }
    } else {
        frutaSeleccionada = fruta;  // Seleccionamos la fruta
    }
}

// Función para intercambiar frutas
function intercambiarFrutas(fila1, col1, fila2, col2) {
    // Verificamos si las coordenadas están dentro del tablero y que ambas frutas existen
    if (
        fila1 >= 0 && fila1 < filas && col1 >= 0 && col1 < columnas &&
        fila2 >= 0 && fila2 < filas && col2 >= 0 && col2 < columnas
    ) {
        const fruta1 = tablero[fila1]?.[col1];
        const fruta2 = tablero[fila2]?.[col2];

        // Verificamos si ambas frutas existen antes de proceder
        if (fruta1 && fruta2) {
            // Intercambiamos las frutas solo si ambas no son null
            [tablero[fila1][col1], tablero[fila2][col2]] = [tablero[fila2][col2], tablero[fila1][col1]];

            // Actualizamos las posiciones en las frutas intercambiadas
            fruta1.fila = fila2;
            fruta1.col = col2;
            fruta2.fila = fila1;
            fruta2.col = col1;
        } else {
            console.error("Una o ambas frutas son nulas al intentar intercambiar.");
        }
    } else {
        console.error("Las coordenadas están fuera de los límites del tablero.");
    }
}

// Detectar combinaciones de frutas (3 o más en fila o columna)
function detectarCombinaciones() {
    let combinaciones = [];

    for (let fila = 0; fila < filas; fila++) {
        for (let col = 0; col < columnas; col++) {
            let fruta = tablero[fila]?.[col];  // Verificar de forma segura si hay una fruta
            if (fruta) {
                // Verificamos combinaciones horizontales (de 3 o más)
                if (col + 2 < columnas &&
                    tablero[fila][col + 1]?.tipo === fruta.tipo &&
                    tablero[fila][col + 2]?.tipo === fruta.tipo) {
                    combinaciones.push({ fila, col });  // Agregar combinación detectada
                }

                // Verificamos combinaciones verticales (de 3 o más)
                if (fila + 2 < filas &&
                    tablero[fila + 1]?.[col]?.tipo === fruta.tipo &&
                    tablero[fila + 2]?.[col]?.tipo === fruta.tipo) {
                    combinaciones.push({ fila, col });
                }
            }
        }
    }
    return combinaciones;
}

// Eliminar combinaciones con animación
function eliminarCombinaciones(combinaciones, callback) {
    bloqueado = true;  // Bloquear interacción durante la eliminación
    let frutasAEliminar = [];

    combinaciones.forEach(({ fila, col }) => {
        // Comprobamos que las coordenadas están dentro de los límites del tablero
        if (fila >= 0 && fila < filas && col >= 0 && col < columnas) {
            let fruta = tablero[fila]?.[col];  // Verificamos que exista la fruta en la posición
            if (fruta) {
                frutasAEliminar.push(fruta);  // Guardar la fruta para eliminar
                animarDesvanecimiento(fruta); // Añadir animación de desvanecimiento
            }
        }
    });

    // Esperar a que termine la animación antes de eliminar las frutas
    setTimeout(() => {
        frutasAEliminar.forEach(fruta => {
            if (tablero[fruta.fila] && tablero[fruta.fila][fruta.col]) {
                tablero[fruta.fila][fruta.col] = null;  // Eliminar la fruta del tablero
            }
        });
        callback();  // Llamar al callback cuando todas las frutas hayan sido eliminadas
    }, 500);  // Esperamos 500ms para permitir que la animación se complete
}

// Animar desvanecimiento de frutas
function animarDesvanecimiento(fruta) {
    const duracion = 500;  // 500ms de duración de la animación
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
    bloqueado = true;  // Bloquear la interacción mientras las frutas caen
    let frutasCaidas = 0;

    for (let col = 0; col < columnas; col++) {
        for (let fila = filas - 1; fila >= 0; fila--) {
            if (!tablero[fila][col]) {  // Si la posición está vacía
                // Buscar la fruta más cercana por encima para que caiga
                for (let filaArriba = fila - 1; filaArriba >= 0; filaArriba--) {
                    if (tablero[filaArriba][col]) {
                        // Mover fruta hacia abajo
                        tablero[fila][col] = tablero[filaArriba][col];
                        tablero[filaArriba][col] = null;  // Vaciar la posición anterior
                        tablero[fila][col].fila = fila;  // Actualizar la fila de la fruta que cae
                        frutasCaidas++;
                        animarCaida(tablero[fila][col], () => {
                            frutasCaidas--;
                            if (frutasCaidas === 0) {
                                callback();  // Llamar al callback cuando todas las frutas hayan caído
                            }
                        });
                        break;
                    }
                }
            }
        }
    }

    // Si no hubo frutas que caer, continuar con el callback
    if (frutasCaidas === 0) {
        callback();
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
function rellenarTablero(callback) {
    let nuevasFrutas = 0;

    for (let col = 0; col < columnas; col++) {
        for (let fila = 0; fila < filas; fila++) {
            if (!tablero[fila][col]) {
                // Crear una nueva fruta en la parte superior y hacerla caer
                const nuevaFruta = crearFruta(frutas[Math.floor(Math.random() * frutas.length)], fila, col);
                tablero[fila][col] = nuevaFruta;
                nuevasFrutas++;
                animarCaida(nuevaFruta, () => {
                    nuevasFrutas--;
                    if (nuevasFrutas === 0) {
                        callback();  // Llamar al callback cuando todas las nuevas frutas hayan caído
                    }
                });
            }
        }
    }

    // Si no hubo nuevas frutas, continuar con el callback
    if (nuevasFrutas === 0) {
        callback();
    }
}

// Verificar combinaciones automáticas después de rellenar el tablero
function verificarCombinacionesAutomaticas() {
    const nuevasCombinaciones = detectarCombinaciones();
    if (nuevasCombinaciones.length > 0) {
        eliminarCombinaciones(nuevasCombinaciones, () => {
            aplicarGravedad(() => {
                rellenarTablero(verificarCombinacionesAutomaticas);  // Continuar el ciclo si se detectan nuevas combinaciones
            });
        });
    } else {
        bloqueado = false;  // Desbloquear la interacción si no hay más combinaciones
    }
}

// Inicializar y dibujar el juego
inicializarTablero();