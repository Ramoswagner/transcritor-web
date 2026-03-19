/**
 * ═══════════════════════════════════════════════════════════════
 * 🎯 TRANSCRITOR 2027 — JavaScript 100% Client-Side
 * Transformers.js + FFmpeg.wasm + Whisper AI
 * ═══════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════
// CONFIGURAÇÕES GLOBAIS
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
    maxFileSize: 500 * 1024 * 1024, // 500MB
    models: {
        tiny: 'Xenova/whisper-tiny',
        base: 'Xenova/whisper-base'
    },
    supportedFormats: ['mp3', 'wav', 'm4a', 'webm', 'flac', 'mp4', 'mov', 'avi', 'mkv']
};

// ═══════════════════════════════════════════════════════════════
// ESTADO DA APLICAÇÃO
// ═══════════════════════════════════════════════════════════════

const state = {
    file: null,
    model: 'tiny',
    language: 'pt',
    formats: { txt: true, pdf: true, docx: false },
    options: { vadFilter: true, extractAudio: true },
    transcription: null,
    audioBlob: null,
    startTime: null,
    pipeline: null
};

// ═══════════════════════════════════════════════════════════════
// ELEMENTOS DOM
// ═══════════════════════════════════════════════════════════════

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const elements = {
    // Upload
    uploadZone: $('#uploadZone'),
    fileInput: $('#fileInput'),
    fileSelected: $('#fileSelected'),
    selectedFileName: $('#selectedFileName'),
    selectedFileSize: $('#selectedFileSize'),
    selectedFileType: $('#selectedFileType'),
    btnRemoveFile: $('#btnRemoveFile'),
    
    // Steps
    stepUpload: $('#stepUpload'),
    stepSettings: $('#stepSettings'),
    stepProcessing: $('#stepProcessing'),
    stepResults: $('#stepResults'),
    stepError: $('#stepError'),
    
    // Settings
    modelCards: $$('.model-card'),
    languageSelect: $('#languageSelect'),
    formatTxt: $('#formatTxt'),
    formatPdf: $('#formatPdf'),
    formatDocx: $('#formatDocx'),
    vadFilter: $('#vadFilter'),
    extractAudio: $('#extractAudio'),
    btnBackUpload: $('#btnBackUpload'),
    btnStartTranscribe: $('#btnStartTranscribe'),
    
    // Processing
    processLoadModel: $('#processLoadModel'),
    processExtractAudio: $('#processExtractAudio'),
    processTranscribe: $('#processTranscribe'),
    loadModelProgress: $('#loadModelProgress'),
    extractAudioProgress: $('#extractAudioProgress'),
    transcribeProgress: $('#transcribeProgress'),
    overallProgress: $('#overallProgress'),
    overallPercent: $('#overallPercent'),
    processEta: $('#processEta'),
    
    // Results
    statDuration: $('#statDuration'),
    statLanguage: $('#statLanguage'),
    statChars: $('#statChars'),
    statTime: $('#statTime'),
    transcriptionText: $('#transcriptionText'),
    audioContainer: $('#audioContainer'),
    audioPlayer: $('#audioPlayer'),
    btnCopyText: $('#btnCopyText'),
    btnExpandText: $('#btnExpandText'),
    btnDownloadTxt: $('#btnDownloadTxt'),
    btnDownloadPdf: $('#btnDownloadPdf'),
    btnDownloadDocx: $('#btnDownloadDocx'),
    btnDownloadAudio: $('#btnDownloadAudio'),
    btnNewTranscription: $('#btnNewTranscription'),
    
    // Error
    errorMessage: $('#errorMessage'),
    btnRetry: $('#btnRetry'),
    btnReset: $('#btnReset'),
    
    // UI
    toastContainer: $('#toastContainer'),
    loadingOverlay: $('#loadingOverlay'),
    loadingText: $('#loadingText')
};

// ═══════════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Transcritor 2027 — Inicializando...');
    initializeEventListeners();
    checkBrowserSupport();
});

function initializeEventListeners() {
    // Upload
    elements.uploadZone.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));
    elements.uploadZone.addEventListener('dragover', handleDragOver);
    elements.uploadZone.addEventListener('dragleave', handleDragLeave);
    elements.uploadZone.addEventListener('drop', handleDrop);
    elements.btnRemoveFile.addEventListener('click', removeFile);
    
    // Settings
    elements.modelCards.forEach(card => {
        card.addEventListener('click', () => selectModel(card.dataset.model));
    });
    elements.languageSelect.addEventListener('change', (e) => state.language = e.target.value);
    elements.formatTxt.addEventListener('change', (e) => state.formats.txt = e.target.checked);
    elements.formatPdf.addEventListener('change', (e) => state.formats.pdf = e.target.checked);
    elements.formatDocx.addEventListener('change', (e) => state.formats.docx = e.target.checked);
    elements.vadFilter.addEventListener('change', (e) => state.options.vadFilter = e.target.checked);
    elements.extractAudio.addEventListener('change', (e) => state.options.extractAudio = e.target.checked);
    elements.btnBackUpload.addEventListener('click', () => goToStep('upload'));
    elements.btnStartTranscribe.addEventListener('click', startTranscription);
    
    // Results
    elements.btnCopyText.addEventListener('click', copyToClipboard);
    elements.btnExpandText.addEventListener('click', expandText);
    elements.btnDownloadTxt.addEventListener('click', () => downloadFile('txt'));
    elements.btnDownloadPdf.addEventListener('click', () => downloadFile('pdf'));
    elements.btnDownloadDocx.addEventListener('click', () => downloadFile('docx'));
    elements.btnDownloadAudio.addEventListener('click', downloadAudio);
    elements.btnNewTranscription.addEventListener('click', resetApp);
    
    // Error
    elements.btnRetry.addEventListener('click', retryTranscription);
    elements.btnReset.addEventListener('click', resetApp);
}

function checkBrowserSupport() {
    if (!window.Worker) {
        showToast('Web Workers não suportados', 'error');
    }
    if (!navigator.clipboard) {
        elements.btnCopyText.disabled = true;
    }
}

// ═══════════════════════════════════════════════════════════════
// UPLOAD DE ARQUIVOS
// ═══════════════════════════════════════════════════════════════

function handleDragOver(e) {
    e.preventDefault();
    elements.uploadZone.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    elements.uploadZone.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    elements.uploadZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileSelect(files[0]);
}

function handleFileSelect(file) {
    if (!file) return;
    
    // Validação
    const extension = file.name.split('.').pop().toLowerCase();
    if (!CONFIG.supportedFormats.includes(extension)) {
        showToast('Formato não suportado', 'error');
        return;
    }
    
    if (file.size > CONFIG.maxFileSize) {
        showToast('Arquivo muito grande (máx 500MB)', 'error');
        return;
    }
    
    state.file = file;
    
    // Atualizar UI
    elements.selectedFileName.textContent = file.name;
    elements.selectedFileSize.textContent = formatFileSize(file.size);
    elements.selectedFileType.textContent = extension.toUpperCase();
    elements.fileSelected.classList.remove('hidden');
    elements.uploadZone.classList.add('hidden');
    
    goToStep('settings');
    showToast('Arquivo selecionado', 'success');
}

function removeFile() {
    state.file = null;
    elements.fileInput.value = '';
    elements.fileSelected.classList.add('hidden');
    elements.uploadZone.classList.remove('hidden');
}

// ═══════════════════════════════════════════════════════════════
// NAVEGAÇÃO ENTRE STEPS
// ═══════════════════════════════════════════════════════════════

function goToStep(stepName) {
    $$('.step-section').forEach(section => section.classList.add('hidden'));
    
    switch(stepName) {
        case 'upload':
            elements.stepUpload.classList.remove('hidden');
            break;
        case 'settings':
            elements.stepSettings.classList.remove('hidden');
            break;
        case 'processing':
            elements.stepProcessing.classList.remove('hidden');
            break;
        case 'results':
            elements.stepResults.classList.remove('hidden');
            break;
        case 'error':
            elements.stepError.classList.remove('hidden');
            break;
    }
}

function selectModel(model) {
    state.model = model;
    elements.modelCards.forEach(card => {
        card.classList.toggle('selected', card.dataset.model === model);
    });
}

// ═══════════════════════════════════════════════════════════════
// TRANSCRIÇÃO PRINCIPAL
// ═══════════════════════════════════════════════════════════════

async function startTranscription() {
    if (!state.file) return;
    
    state.startTime = Date.now();
    goToStep('processing');
    resetProgress();
    
    try {
        // 1. Carregar Modelo
        updateStep('loadModel', 'active', 'Inicializando...');
        await loadWhisperModel();
        updateStep('loadModel', 'completed', 'Carregado!');
        setProgress('loadModel', 100);
        
        // 2. Extrair Áudio (se for vídeo)
        updateStep('extractAudio', 'active', 'Preparando...');
        const audioFile = await extractAudioIfNeeded(state.file);
        updateStep('extractAudio', 'completed', 'Extraído!');
        setProgress('extractAudio', 100);
        
        // 3. Transcrever
        updateStep('transcribe', 'active', 'Transcrevendo...');
        const result = await transcribeAudio(audioFile);
        updateStep('transcribe', 'completed', 'Concluído!');
        setProgress('transcribe', 100);
        
        // 4. Mostrar Resultados
        state.transcription = result;
        showResults(result);
        
    } catch (error) {
        console.error('Erro na transcrição:', error);
        showError(error.message);
    }
}

async function loadWhisperModel() {
    const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.14.0');
    
    state.pipeline = await pipeline(
        'automatic-speech-recognition',
        CONFIG.models[state.model],
        {
            progress_callback: (data) => {
                if (data.status === 'progress') {
                    const percent = Math.round((data.loaded / data.total) * 100);
                    setProgress('loadModel', percent);
                    updateStep('loadModel', 'active', `Carregando ${percent}%`);
                }
            }
        }
    );
}

async function extractAudioIfNeeded(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    const audioFormats = ['mp3', 'wav', 'm4a', 'webm', 'flac'];
    
    if (audioFormats.includes(extension) || !state.options.extractAudio) {
        setProgress('extractAudio', 100);
        return file;
    }
    
    // Usar FFmpeg.wasm para extrair áudio
    const { createFFmpeg, fetchFile } = FFmpeg;
    const ffmpeg = createFFmpeg({ log: false });
    
    await ffmpeg.load();
    ffmpeg.FS('writeFile', 'input', await fetchFile(file));
    
    await ffmpeg.run(
        '-i', 'input',
        '-vn',
        '-acodec', 'pcm_s16le',
        '-ar', '16000',
        '-ac', '1',
        'output.wav'
    );
    
    const data = ffmpeg.FS('readFile', 'output.wav');
    const audioBlob = new Blob([data.buffer], { type: 'audio/wav' });
    
    state.audioBlob = audioBlob;
    setProgress('extractAudio', 100);
    
    return new File([audioBlob], 'audio.wav', { type: 'audio/wav' });
}

async function transcribeAudio(audioFile) {
    const startTime = Date.now();
    
    const result = await state.pipeline(audioFile, {
        language: state.language === 'auto' ? null : state.language,
        task: 'transcribe',
        vad_filter: state.options.vadFilter,
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: false,
        progress_callback: (data) => {
            if (data.status === 'progress') {
                const elapsed = Date.now() - startTime;
                const progress = data.progress || 0;
                setProgress('transcribe', Math.round(progress * 100));
                setOverallProgress(60 + (progress * 40));
                
                // ETA estimate
                if (progress > 0.1) {
                    const eta = Math.round((elapsed / progress) - elapsed);
                    elements.processEta.textContent = `Tempo restante: ~${formatDuration(eta)}`;
                }
            }
        }
    });
    
    const elapsed = Date.now() - startTime;
    
    return {
        text: result.text.trim(),
        language: result.language || state.language,
        duration: elapsed,
        chunks: result.chunks || []
    };
}

// ═══════════════════════════════════════════════════════════════
// PROGRESSO
// ═══════════════════════════════════════════════════════════════

function resetProgress() {
    ['loadModel', 'extractAudio', 'transcribe'].forEach(step => {
        updateStep(step, '', 'Aguardando...');
        setProgress(step, 0);
    });
    setOverallProgress(0);
    elements.processEta.textContent = '';
}

function updateStep(stepId, status, text) {
    const step = $(`#process${stepId.charAt(0).toUpperCase() + stepId.slice(1)}`);
    step.classList.remove('active', 'completed');
    if (status) step.classList.add(status);
    step.querySelector('.process-status').textContent = text;
}

function setProgress(stepId, percent) {
    const progress = $(`#${stepId}Progress`);
    if (progress) progress.style.width = `${percent}%`;
}

function setOverallProgress(percent) {
    elements.overallProgress.style.width = `${percent}%`;
    elements.overallPercent.textContent = `${Math.round(percent)}%`;
}

// ═══════════════════════════════════════════════════════════════
// RESULTADOS
// ═══════════════════════════════════════════════════════════════

function showResults(result) {
    goToStep('results');
    
    // Stats
    elements.statDuration.textContent = formatDuration(result.duration / 1000);
    elements.statLanguage.textContent = (result.language || 'auto').toUpperCase();
    elements.statChars.textContent = result.text.length.toLocaleString();
    elements.statTime.textContent = formatDuration((Date.now() - state.startTime) / 1000);
    
    // Texto
    elements.transcriptionText.value = result.text;
    
    // Áudio
    if (state.audioBlob) {
        const url = URL.createObjectURL(state.audioBlob);
        elements.audioPlayer.src = url;
        elements.audioContainer.classList.remove('hidden');
    }
    
    showToast('Transcrição concluída!', 'success');
}

function showError(message) {
    goToStep('error');
    elements.errorMessage.textContent = message;
    showToast('Erro no processamento', 'error');
}

function resetApp() {
    state.file = null;
    state.transcription = null;
    state.audioBlob = null;
    elements.fileInput.value = '';
    elements.fileSelected.classList.add('hidden');
    elements.uploadZone.classList.remove('hidden');
    elements.audioContainer.classList.add('hidden');
    elements.transcriptionText.value = '';
    goToStep('upload');
}

function retryTranscription() {
    if (state.file) {
        startTranscription();
    } else {
        resetApp();
    }
}

// ═══════════════════════════════════════════════════════════════
// AÇÕES
// ═══════════════════════════════════════════════════════════════

async function copyToClipboard() {
    try {
        await navigator.clipboard.writeText(elements.transcriptionText.value);
        showToast('Texto copiado!', 'success');
    } catch (err) {
        showToast('Falha ao copiar', 'error');
    }
}

function expandText() {
    elements.transcriptionText.classList.toggle('expanded');
    elements.btnExpandText.querySelector('i').classList.toggle('fa-expand');
    elements.btnExpandText.querySelector('i').classList.toggle('fa-compress');
}

function downloadFile(format) {
    if (!state.transcription) return;
    
    const filename = `transcricao_${Date.now()}.${format}`;
    const text = state.transcription.text;
    
    switch(format) {
        case 'txt':
            const txtBlob = new Blob([text], { type: 'text/plain' });
            saveAs(txtBlob, filename);
            break;
            
        case 'pdf':
            generatePDF(text, filename);
            break;
            
        case 'docx':
            generateDOCX(text, filename);
            break;
    }
    
    showToast(`${format.toUpperCase()} baixado!`, 'success');
}

function generatePDF(text, filename) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Transcrição da Reunião', 20, 20);
    
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 30);
    doc.text(`Modelo: ${state.model} | Idioma: ${state.language}`, 20, 36);
    
    doc.line(20, 40, 190, 40);
    
    const splitText = doc.splitTextToSize(text, 170);
    doc.setFontSize(11);
    doc.text(splitText, 20, 50);
    
    doc.save(filename);
}

function generateDOCX(text, filename) {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;
    
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    text: 'Transcrição da Reunião',
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                    text: `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
                }),
                new Paragraph({
                    text: `Modelo: ${state.model} | Idioma: ${state.language}`,
                }),
                new Paragraph({ text: '' }),
                new Paragraph({
                    children: [new TextRun(text)],
                }),
            ],
        }],
    });
    
    Packer.toBlob(doc).then(blob => {
        saveAs(blob, filename);
    });
}

function downloadAudio() {
    if (!state.audioBlob) {
        showToast('Áudio não disponível', 'warning');
        return;
    }
    
    saveAs(state.audioBlob, `audio_${Date.now()}.wav`);
    showToast('Áudio baixado!', 'success');
}

// ═══════════════════════════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════════════════════════

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(seconds) {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ═══════════════════════════════════════════════════════════════
// SERVICE WORKER (PWA - Opcional)
// ═══════════════════════════════════════════════════════════════

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            console.log('Service Worker não registrado');
        });
    });
}
