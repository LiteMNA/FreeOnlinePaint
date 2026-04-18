const wrapper = document.getElementById('canvas-wrapper');
const layersList = document.getElementById('layersList');
const canvasWidthInput = document.getElementById('canvasWidth');
const canvasHeightInput = document.getElementById('canvasHeight');
const zoomHud = document.getElementById('zoom-hud');

let layers = [];
let activeLayerIndex = 0;
let isDrawing = false;
let currentTool = 'pencil';
let scale = 1;
let zoomTimeout; // Для таймера исчезновения текста

function init() {
    createLayer();
    updateCanvasSize();
}

// Изменение размера
function updateCanvasSize() {
    const w = parseInt(canvasWidthInput.value) || 512;
    const h = parseInt(canvasHeightInput.value) || 512;
    wrapper.style.width = w + 'px';
    wrapper.style.height = h + 'px';
    layers.forEach(l => {
        const data = l.ctx.getImageData(0,0, l.canvas.width, l.canvas.height);
        l.canvas.width = w;
        l.canvas.height = h;
        l.ctx.putImageData(data, 0, 0);
    });
}

// ЗУМ С ПОЯВЛЯЮЩИМСЯ ТЕКСТОМ
function updateZoom(delta) {
    scale = Math.min(Math.max(0.1, scale + delta), 5);
    wrapper.style.transform = `scale(${scale})`;

    // Показываем серый текст
    zoomHud.innerText = Math.round(scale * 100) + '%';
    zoomHud.style.opacity = '1';

    // Убираем старый таймер и ставим новый, чтобы текст исчез через 1 сек
    clearTimeout(zoomTimeout);
    zoomTimeout = setTimeout(() => {
        zoomHud.style.opacity = '0';
    }, 1000);
}

function getCoords(e) {
    const rect = wrapper.getBoundingClientRect();
    const x = ((e.clientX || (e.touches && e.touches[0].clientX)) - rect.left) / scale;
    const y = ((e.clientY || (e.touches && e.touches[0].clientY)) - rect.top) / scale;
    return { x, y };
}

// Рисование
function startDrawing(e) {
    if (e.button && e.button !== 0) return;
    isDrawing = true;
    const { x, y } = getCoords(e);
    layers[activeLayerIndex].ctx.beginPath();
    layers[activeLayerIndex].ctx.moveTo(x, y);
}

function draw(e) {
    if (!isDrawing) return;
    const { x, y } = getCoords(e);
    const { ctx } = layers[activeLayerIndex];

    ctx.lineWidth = document.getElementById('sizePicker').value;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = document.getElementById('colorPicker').value;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
}

// Инструменты и слои
function createLayer() {
    const canvas = document.createElement('canvas');
    canvas.width = parseInt(canvasWidthInput.value);
    canvas.height = parseInt(canvasHeightInput.value);
    const ctx = canvas.getContext('2d');
    layers.push({ canvas, ctx });
    wrapper.appendChild(canvas);
    setActiveLayer(layers.length - 1);
}

function setActiveLayer(i) {
    activeLayerIndex = i;
    renderLayersUI();
}

function renderLayersUI() {
    layersList.innerHTML = '';
    layers.slice().reverse().forEach((l, i) => {
        const idx = layers.length - 1 - i;
        const item = document.createElement('div');
        item.className = `layer-item ${idx === activeLayerIndex ? 'active' : ''}`;
        item.innerText = `Слой ${idx + 1}`;
        item.onclick = () => setActiveLayer(idx);
        layersList.appendChild(item);
    });
}

// События
wrapper.addEventListener('mousedown', startDrawing);
window.addEventListener('mousemove', draw);
window.addEventListener('mouseup', () => isDrawing = false);

document.getElementById('zoomInBtn').onclick = () => updateZoom(0.1);
document.getElementById('zoomOutBtn').onclick = () => updateZoom(-0.1);
document.getElementById('addLayerBtn').onclick = createLayer;
document.getElementById('applySizeBtn').onclick = updateCanvasSize;
document.getElementById('pencilBtn').onclick = () => { currentTool = 'pencil'; };
document.getElementById('eraserBtn').onclick = () => { currentTool = 'eraser'; };

// Экспорт
document.getElementById('exportBtn').onclick = () => {
    const final = document.createElement('canvas');
    final.width = parseInt(canvasWidthInput.value);
    final.height = parseInt(canvasHeightInput.value);
    const fCtx = final.getContext('2d');
    fCtx.fillStyle = "white";
    fCtx.fillRect(0,0, final.width, final.height);
    layers.forEach(l => fCtx.drawImage(l.canvas, 0, 0));
    const link = document.createElement('a');
    link.download = 'art.png';
    link.href = final.toDataURL();
    link.click();
};

init();
