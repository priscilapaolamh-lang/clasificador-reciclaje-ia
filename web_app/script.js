// ============================================
// CLASIFICADOR DE RECICLAJE - APP WEB
// ============================================

// --- CONFIGURACIÓN ---
const video = document.getElementById('webcam');
const labelElement = document.getElementById('label');
const confidenceElement = document.getElementById('confidence');
const progressFill = document.getElementById('progress-fill');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');

// Nombres de clases (deben coincidir con el entrenamiento)
const CLASS_NAMES_ES = ['Cartón', 'Vidrio', 'Metal', 'Papel', 'Plástico', 'Basura'];
const CLASS_EMOJIS = ['📦', '🍾', '🥫', '📄', '🧴', '🗑️'];

// --- VARIABLES ---
let model = null;
let isPredicting = false;
let stream = null;

// --- CARGAR MODELO ---
async function loadModel() {
    try {
        labelElement.textContent = 'Cargando modelo...';
        console.log('🔄 Cargando modelo...');
        
        model = await tf.loadLayersModel('tfjs_model/model.json');
        console.log('✅ Modelo cargado correctamente');
        
        labelElement.textContent = '✅ Listo';
        confidenceElement.textContent = 'Presiona Iniciar';
    } catch (error) {
        console.error('❌ Error al cargar modelo:', error);
        labelElement.textContent = 'Error al cargar modelo';
        alert('No se pudo cargar el modelo. Asegúrate de tener la carpeta tfjs_model/');
    }
}

// --- PREDECIR FRAME ---
async function predictFrame() {
    if (!model || !isPredicting) {
        return;
    }

    try {
        // Capturar frame del video
        let tensor = tf.browser.fromPixels(video)
            .resizeNearestNeighbor([224, 224])
            .toFloat()
            .expandDims();

        // Normalizar (0-1)
        tensor = tensor.div(255.0);

        // Predecir
        const predictions = await model.predict(tensor).data();
        tensor.dispose();

        // Interpretar resultados
        const maxProbability = Math.max(...predictions);
        const predictedIndex = predictions.indexOf(maxProbability);
        const confidence = maxProbability * 100;

        // Actualizar UI
        if (confidence > 40) {
            const nombre = CLASS_NAMES_ES[predictedIndex];
            const emoji = CLASS_EMOJIS[predictedIndex];
            labelElement.textContent = `${emoji} ${nombre}`;
            labelElement.style.color = '#4CAF50';
        } else {
            labelElement.textContent = '🔍 Sin objeto detectado';
            labelElement.style.color = '#FFC107';
        }

        confidenceElement.textContent = `${confidence.toFixed(1)}%`;
        progressFill.style.width = `${Math.min(confidence, 100)}%`;

    } catch (error) {
        console.error('Error en predicción:', error);
    }

    // Continuar ciclo
    if (isPredicting) {
        requestAnimationFrame(predictFrame);
    }
}

// --- INICIAR CÁMARA ---
async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: 640, height: 480 }
        });
        
        video.srcObject = stream;
        await new Promise((resolve) => { video.onloadeddata = resolve; });

        isPredicting = true;
        startBtn.disabled = true;
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';
        labelElement.textContent = '🔍 Detectando...';
        
        predictFrame();
    } catch (error) {
        console.error('Error al acceder a cámara:', error);
        alert('No se puede acceder a la cámara. Permite el acceso en tu navegador.');
    }
}

// --- DETENER CÁMARA ---
function stopCamera() {
    isPredicting = false;
    
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    video.srcObject = null;
    startBtn.disabled = false;
    startBtn.style.display = 'inline-block';
    stopBtn.style.display = 'none';
    labelElement.textContent = 'Detenido';
    confidenceElement.textContent = '0%';
    progressFill.style.width = '0%';
}

// --- EVENTOS ---
startBtn.addEventListener('click', startCamera);
stopBtn.addEventListener('click', stopCamera);

// --- INICIAR ---
loadModel();
console.log('♻️ Clasificador de Reciclaje - Listo para usar');