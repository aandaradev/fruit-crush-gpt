const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const filas = 8;
const columnas = 8;
const tamañoCelda = 50;
const frutas = ['🍎', '🍌', '🍇', '🍓', '🍊']; // Array de frutas
let tablero = [];
let frutaSeleccionada = null;
let bloqueado = false; // Bloquear la interacción mientras se están ejecutando las animaciones
let puntaje = 0; // Variable global para almacenar el puntaje

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
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpiar el canvas
    for (let fila = 0; fila < filas; fila++) {
        for (let col = 0; col < columnas; col++) {
            const fruta = tablero[fila][col];
            if (fruta) {
                ctx.strokeRect(col * tamañoCelda, fila * tamañoCelda, tamañoCelda, tamañoCelda); // Dibujar celda
                ctx.font = "30px Arial";
                ctx.fillText(fruta.tipo, col * tamañoCelda + 10, fila * tamañoCelda + 35); // Dibujar la fruta
            }
        }
    }
}

// Función para manejar el clic del usuario en el canvas
canvas.addEventListener('click', function(event) {
    if (bloqueado) return; // Evitar interacción durante animación
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const fila = Math.floor(y / tamañoCelda);
    const col = Math.floor(x / tamañoCelda);
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

function verificarCombinacionHorizontal(fila, col) {
    const frutaTipo = tablero[fila][col]?.tipo;
    let contador = 1;

    // Verificar hacia la izquierda
    for (let i = col - 1; i >= 0 && tablero[fila][i]?.tipo === frutaTipo; i--) {
        contador++;
    }

    // Verificar hacia la derecha
    for (let i = col + 1; i < columnas && tablero[fila][i]?.tipo === frutaTipo; i++) {
        contador++;
    }

    return contador >= 3; // Retornar verdadero si hay 3 o más frutas alineadas
}

function verificarCombinacionVertical(fila, col) {
    const frutaTipo = tablero[fila][col]?.tipo;
    let contador = 1;

    // Verificar hacia arriba
    for (let i = fila - 1; i >= 0 && tablero[i][col]?.tipo === frutaTipo; i--) {
        contador++;
    }

    // Verificar hacia abajo
    for (let i = fila + 1; i < filas && tablero[i][col]?.tipo === frutaTipo; i++) {
        contador++;
    }

    return contador >= 3; // Retornar verdadero si hay 3 o más frutas alineadas
}

function hayCombinacionValida(fruta1, fruta2) {
    const combinacionValidaFruta1 =
        verificarCombinacionHorizontal(fruta1.fila, fruta1.col) ||
        verificarCombinacionVertical(fruta1.fila, fruta1.col);

    const combinacionValidaFruta2 =
        verificarCombinacionHorizontal(fruta2.fila, fruta2.col) ||
        verificarCombinacionVertical(fruta2.fila, fruta2.col);

    return combinacionValidaFruta1 || combinacionValidaFruta2;
}

// Intercambiar frutas
function intercambiarFrutas(fila1, col1, fila2, col2) {
    if (validarCoordenadas(fila1, col1, fila2, col2)) {
        const fruta1 = tablero[fila1][col1];
        const fruta2 = tablero[fila2][col2];

        if (fruta1 && fruta2) {
            // Intercambiar frutas
            [tablero[fila1][col1], tablero[fila2][col2]] = [tablero[fila2][col2], tablero[fila1][col1]];

            // Verificar si se formó una combinación válida
            if (hayCombinacionValida(fruta1, fruta2)) {
                procesarCombinaciones(); // Procesar las combinaciones
            } else {
                // Revertir si no es una combinación válida
                console.log("No hay combinación válida. Revirtiendo el intercambio.");
                [tablero[fila1][col1], tablero[fila2][col2]] = [tablero[fila2][col2], tablero[fila1][col1]];
            }

            dibujarTablero(); // Redibujar el tablero después del intercambio
        }
    }
}

// Validar coordenadas
function validarCoordenadas(fila1, col1, fila2, col2) {
    return (
        fila1 >= 0 && fila1 < filas && col1 >= 0 && col1 < columnas &&
        fila2 >= 0 && fila2 < filas && col2 >= 0 && col2 < columnas
    );
}

// Procesar combinaciones
function procesarCombinaciones() {
    let frutasAEliminar = detectarCombinaciones();

    if (frutasAEliminar.length > 0) {
        eliminarFrutas(frutasAEliminar);
        hacerCaerFrutas();
        rellenarTablero();
        dibujarTablero();

        // Procesar nuevamente después de una pausa
        setTimeout(() => {
            procesarCombinaciones();
        }, 300);
    } else {
        bloqueado = false;  // Desbloquear después de procesar
    }
}

// Detectar combinaciones de frutas (3 o más en fila o columna)
function detectarCombinaciones() {
    const frutasAEliminar = [];

    // Verificar combinaciones horizontales
    for (let fila = 0; fila < filas; fila++) {
        let contador = 1;
        for (let col = 1; col < columnas; col++) {
            if (tablero[fila][col]?.tipo === tablero[fila][col - 1]?.tipo) {
                contador++;
            } else {
                if (contador >= 3) {
                    for (let k = 0; k < contador; k++) {
                        frutasAEliminar.push({ fila: fila, col: col - 1 - k });
                    }
                }
                contador = 1;
            }
        }
        if (contador >= 3) {
            for (let k = 0; k < contador; k++) {
                frutasAEliminar.push({ fila: fila, col: columnas - 1 - k });
            }
        }
    }

    // Verificar combinaciones verticales
    for (let col = 0; col < columnas; col++) {
        let contador = 1;
        for (let fila = 1; fila < filas; fila++) {
            if (tablero[fila][col]?.tipo === tablero[fila - 1][col]?.tipo) {
                contador++;
            } else {
                if (contador >= 3) {
                    for (let k = 0; k < contador; k++) {
                        frutasAEliminar.push({ fila: fila - 1 - k, col: col });
                    }
                }
                contador = 1;
            }
        }
        if (contador >= 3) {
            for (let k = 0; k < contador; k++) {
                frutasAEliminar.push({ fila: filas - 1 - k, col: col });
            }
        }
    }

    return frutasAEliminar;
}

// Eliminar frutas del tablero
function eliminarFrutas(frutasAEliminar) {
    let frutasEliminadas = 0; // Contador de frutas eliminadas

    frutasAEliminar.forEach(({ fila, col }) => {
        if (tablero[fila][col] !== null) { // Asegurarnos de que haya una fruta en la celda
            tablero[fila][col] = null; // Eliminar la fruta del tablero
            frutasEliminadas++; // Incrementar el contador
        }
    });

    // Sumar puntos: 10 puntos por cada fruta eliminada
    puntaje += frutasEliminadas * 10;
    mostrarPuntaje(); // Actualizar el puntaje en pantalla
}

function mostrarPuntaje() {
    // Limpiar el área superior del canvas donde se mostrará el puntaje
    ctx.clearRect(0, 0, canvas.width, 50); // Limpiar la parte superior del canvas
    ctx.font = "20px Arial";
    ctx.fillStyle = "black";
    ctx.fillText("Puntaje: " + puntaje, 10, 30); // Mostrar el puntaje en la parte superior
}

// Hacer caer frutas
function hacerCaerFrutas() {
    for (let col = 0; col < columnas; col++) {
        for (let fila = filas - 1; fila >= 0; fila--) {
            if (tablero[fila][col] === null) {
                for (let filaSuperior = fila - 1; filaSuperior >= 0; filaSuperior--) {
                    if (tablero[filaSuperior][col] !== null) {
                        tablero[fila][col] = tablero[filaSuperior][col];
                        tablero[filaSuperior][col] = null;
                        break;
                    }
                }
            }
        }
    }
}

// Rellenar el tablero
function rellenarTablero() {
    for (let col = 0; col < columnas; col++) {
        for (let fila = 0; fila < filas; fila++) {
            if (tablero[fila][col] === null) {
                tablero[fila][col] = crearFruta(frutas[Math.floor(Math.random() * frutas.length)], fila, col);
            }
        }
    }
}

// Inicializar y dibujar el juego
inicializarTablero();