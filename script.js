const container = document.getElementById('canvas-container');
const layersList = document.getElementById('layersList');
const addLayerBtn = document.getElementById('addLayerBtn');
const colorPicker = document.getElementById('colorPicker');
const sizePicker = document.getElementById('sizePicker');
const pencilBtn = document.getElementById('pencilBtn');
const eraserBtn = document.getElementById('eraserBtn');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const fileInput = document.getElementById('fileInput');
const addImageBtn = document.getElementById('addImageBtn');

let layers = [];
let activeLayerIndex = 0;
let isDrawing = false;
let currentTool = 'pencil';

// Инициализация первого слоя
function init() {
    addLayer();
    resizeCanvases();
}

function addLayer() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Устанавливаем размер холста
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    const layer = { canvas, ctx, id: Date.now() };
    layers.push(layer);
    container.appendChild(canvas);
    
    setActiveLayer(layers.length - 1);
    renderLayersList();
}

function renderLayersList() {
    layersList.innerHTML = '';
    layers.slice().reverse().forEach((layer, index) => {
        const actualIndex = layers.length - 1 - index;
        const div = document.createElement('div');
        div.className = `layer-item ${actualIndex === activeLayerIndex ? 'active' : ''}`;
        div.innerText = `Слой ${actualIndex + 1}`;
        div.onclick = () => setActiveLayer(actualIndex);
        layersList.appendChild(div);
    });
}

function setActiveLayer(index) {
    activeLayerIndex = index;
    renderLayersList();
}

// Рисование
function startDrawing(e) {
    isDrawing = true;
    draw(e);
}

function stopDrawing() {
    isDrawing = false;
    layers[activeLayerIndex].ctx.beginPath();
}

function draw(e) {
    if (!isDrawing) return;
    const { ctx } = layers[activeLayerIndex];
    const rect = container.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.lineWidth = sizePicker.value;
    ctx.lineCap = 'round';

    if (currentTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = colorPicker.value;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

// Слушатели событий
container.addEventListener('mousedown', startDrawing);
container.addEventListener('mousemove', draw);
window.addEventListener('mouseup', stopDrawing);

// Тач-события для мобильных
container.addEventListener('touchstart', (e) => { e.preventDefault(); startDrawing(e); });
container.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e); });
container.addEventListener('touchend', stopDrawing);

// Инструменты
pencilBtn.onclick = () => { currentTool = 'pencil'; pencilBtn.classList.add('active'); eraserBtn.classList.remove('active'); };
eraserBtn.onclick = () => { currentTool = 'eraser'; eraserBtn.classList.add('active'); pencilBtn.classList.remove('active'); };

clearBtn.onclick = () => {
    if(confirm('Очистить текущий слой?')) {
        layers[activeLayerIndex].ctx.clearRect(0, 0, container.clientWidth, container.clientHeight);
    }
};

addLayerBtn.onclick = addLayer;

// Добавление изображения
addImageBtn.onclick = () => fileInput.click();
fileInput.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            layers[activeLayerIndex].ctx.drawImage(img, 0, 0, container.clientWidth, container.clientHeight);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
};

// Экспорт (склеивание всех слоев)
exportBtn.onclick = () => {
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = container.clientWidth;
    finalCanvas.height = container.clientHeight;
    const finalCtx = finalCanvas.getContext('2d');

    // Белый фон
    finalCtx.fillStyle = '#ffffff';
    finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    // Рисуем все слои по порядку
    layers.forEach(layer => {
        finalCtx.drawImage(layer.canvas, 0, 0);
    });

    const link = document.createElement('a');
    link.download = 'art.png';
    link.href = finalCanvas.toDataURL();
    link.click();
};

// Адаптивность размера
function resizeCanvases() {
    // В реальном приложении здесь нужно сохранять данные канваса перед ресайзом, 
    // так как изменение ширины/высоты очищает холст.
}

window.onload = init;
