/**
 * ═══════════════════════════════════════════════════════════════
 * 🎯 TRANSCRITOR 2027 — JavaScript Avançado
 * Upload • Processamento • Download • UI Interativa
 * ═══════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════
// CONFIGURAÇÕES
// ═══════════════════════════════════════════════════════════════

const API_URL = 'http://localhost:5000/api';
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

// ═══════════════════════════════════════════════════════════════
// ELEMENTOS DOM
// ═══════════════════════════════════════════════════════════════

const elements = {
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    fileInfo: document.getElementById('fileInfo'),
    fileName: document.getElementById('fileName'),
    fileSize: document.getElementById('fileSize'),
    btnRemove: document.getElementById('btnRemove'),
    settingsSection: document.getElementById('settingsSection'),
    modelSelect: document.getElementById('modelSelect'),
    languageSelect: document.getElementById('languageSelect'),
    formatSelect: document.getElementById('formatSelect'),
    btnTranscribe: document.getElementById('btnTranscribe'),
    progressSection: document.getElementById('progressSection'),
    progressBar: document.getElementById('progressBar'),
    progressStatus: document.getElementById('progressStatus'),
    resultSection: document.getElementById('resultSection'),
    transcriptionText: document.getElementById('transcriptionText'),
    btnCopy: document.getElementById('btnCopy'),
    btnDownloadTxt: document.getElementById('btnDownloadTxt'),
    btnDownloadDocx: document.getElementById('btnDownloadDocx'),
    btnDownloadPdf: document.getElementById('btnDownloadPdf'),
    btnNew: document.getElementById('btnNew'),
    audioPlayer: document.getElementById('audioPlayer'),
    audioElement: document.getElementById('audioElement'),
    btnDownloadAudio: document.getElementById('btnDownloadAudio'),
    errorSection: document.getElementById('errorSection'),
    errorMessage: document.getElementById('errorMessage'),
    btnRetry: document.getElementById('btnRetry'),
    toastContainer: document.getElementById('toastContainer'),
    // Stats
    statDuration: document.getElementById('statDuration'),
    statLanguage: document.getElementById('statLanguage'),
    statChars: document.getElementById('statChars')
};

// ═══════════════════════════════════════════════════════════════
// ESTADO DA APLICAÇÃO
// ═══════════════════════════════════════════════════════════════

let state = {
    file: null,
    isProcessing: false,
    transcriptionData: null
};

// ═══════════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    console.log('🎯 Transcritor 2027 — Interface carregada');
});

function initializeEventListeners() {
    // Upload
    elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);
    
    // Drag & Drop
    elements.uploadArea.addEventListener('dragover', handleDragOver);
    elements.uploadArea.addEventListener('dragleave', handleDragLeave);
    elements.uploadArea.addEventListener('drop', handleDrop);
    
    // Remove file
    elements.btnRemove.addEventListener('click', removeFile);
    
    // Transcribe
    elements.btnTranscribe.addEventListener('click', startTranscription);
    
    // Actions
    elements.btnCopy.addEventListener('click', copyToClipboard);
    elements.btnDownloadTxt.addEventListener('click', () => downloadFile('txt'));
    elements.btnDownloadDocx.addEventListener('click', () => downloadFile('docx'));
    elements.btnDownloadPdf.addEventListener('click', () => downloadFile('pdf'));
    elements.btnNew.addEventListener('click', resetApp);
    elements.btnRetry.addEventListener('click', resetApp);
}

// ═══════════════════════════════════════════════════════════════
// UPLOAD DE ARQUIVOS
// ═══════════════════════════════════════════════════════════════

function handleDragOver(e) {
    e.preventDefault();
    elements.uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    elements.uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    elements.uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function processFile(file) {
    // Validação
    if (!isValidFileType(file)) {
        showToast('Tipo de arquivo não suportado', 'error');
        return;
    }
    
    if (file.size > MAX_FILE_SIZE) {
        showToast('Arquivo muito grande (máx 2GB)', 'error');
        return;
    }
    
    state.file = file;
    
    // Atualizar UI
    elements.fileName.textContent = file.name;
    elements.fileSize.textContent = formatFileSize(file.size);
    elements.fileInfo.classList.remove('hidden');
    elements.uploadArea.classList.add('hidden');
    elements.settingsSection.classList.remove('hidden');
    
    showToast('Arquivo selecionado com sucesso', 'success');
}

function isValidFileType(file) {
    const validExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.mp3', '.wav', '.m4a', '.webm', '.flac'];
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    return validExtensions.includes(extension);
}

function removeFile() {
    state.file = null;
    elements.fileInput.value = '';
    elements.fileInfo.classList.add('hidden');
    elements.uploadArea.classList.remove('hidden');
    elements.settingsSection.classList.add('hidden');
}

// ═══════════════════════════════════════════════════════════════
// TRANSCRIÇÃO
// ═══════════════════════════════════════════════════════════════

async function startTranscription() {
    if (!state.file || state.isProcessing) return;
    
    state.isProcessing = true;
    
    // Atualizar UI
    elements.settingsSection.classList.add('hidden');
    elements.progressSection.classList.remove('hidden');
    elements.btnTranscribe.disabled = true;
    
    try {
        // Passo 1: Upload
        updateProgress(1, 25, 'Enviando arquivo...');
        const uploadResponse = await uploadFile(state.file);
        
        // Passo 2: Extrair áudio
        updateProgress(2, 50, 'Extraindo áudio...');
        
        // Passo 3: Transcrever
        updateProgress(3, 75, 'Transcrevendo com IA...');
        const transcribeResponse = await transcribeAudio(
            uploadResponse.fileId,
            elements.modelSelect.value,
            elements.languageSelect.value
        );
        
        // Passo 4: Exportar
        updateProgress(4, 100, 'Preparando arquivos...');
        
        // Mostrar resultado
        state.transcriptionData = transcribeResponse;
        showResult(transcribeResponse);
        
    } catch (error) {
        console.error('Erro na transcrição:', error);
        showError(error.message);
    } finally {
        state.isProcessing = false;
        elements.btnTranscribe.disabled = false;
    }
}

async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
    });
    
    if (!response.ok) {
        throw new Error('Falha no upload do arquivo');
    }
    
    return await response.json();
}

async function transcribeAudio(fileId, model, language) {
    const response = await fetch(`${API_URL}/transcribe`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            file_id: fileId,
            model: model,
            language: language === 'auto' ? null : language,
            format: elements.formatSelect.value
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha na transcrição');
    }
    
    return await response.json();
}

function updateProgress(step, percent, status) {
    elements.progressBar.style.width = `${percent}%`;
    elements.progressStatus.textContent = status;
    
    // Atualizar passos
    for (let i = 1; i <= 4; i++) {
        const stepEl = document.getElementById(`step${i}`);
        stepEl.classList.remove('active', 'completed');
        
        if (i < step) {
            stepEl.classList.add('completed');
        } else if (i === step) {
            stepEl.classList.add('active');
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// RESULTADOS
// ═══════════════════════════════════════════════════════════════

function showResult(data) {
    elements.progressSection.classList.add('hidden');
    elements.resultSection.classList.remove('hidden');
    
    // Preencher dados
    elements.transcriptionText.value = data.text;
    elements.statDuration.textContent = formatDuration(data.duration);
    elements.statLanguage.textContent = data.language?.toUpperCase() || 'Auto';
    elements.statChars.textContent = `${data.text.length} caracteres`;
    
    // Áudio
    if (data.audio_url) {
        elements.audioElement.src = data.audio_url;
        elements.btnDownloadAudio.href = data.audio_url;
        elements.audioPlayer.classList.remove('hidden');
    }
    
    // Armazenar URLs de download
    state.downloadUrls = {
        txt: data.download_urls?.txt,
        docx: data.download_urls?.docx,
        pdf: data.download_urls?.pdf
    };
    
    showToast('Transcrição concluída com sucesso!', 'success');
}

function showError(message) {
    elements.progressSection.classList.add('hidden');
    elements.errorSection.classList.remove('hidden');
    elements.errorMessage.textContent = message;
    
    showToast('Erro no processamento', 'error');
}

function resetApp() {
    state = {
        file: null,
        isProcessing: false,
        transcriptionData: null
    };
    
    elements.fileInput.value = '';
    elements.fileInfo.classList.add('hidden');
    elements.uploadArea.classList.remove('hidden');
    elements.settingsSection.classList.add('hidden');
    elements.progressSection.classList.add('hidden');
    elements.resultSection.classList.add('hidden');
    elements.errorSection.classList.add('hidden');
    elements.audioPlayer.classList.add('hidden');
    
    elements.progressBar.style.width = '0%';
    elements.transcriptionText.value = '';
}

// ═══════════════════════════════════════════════════════════════
// AÇÕES
// ═══════════════════════════════════════════════════════════════

async function copyToClipboard() {
    try {
        await navigator.clipboard.writeText(elements.transcriptionText.value);
        showToast('Texto copiado para área de transferência', 'success');
    } catch (err) {
        showToast('Falha ao copiar', 'error');
    }
}

async function downloadFile(format) {
    if (!state.downloadUrls || !state.downloadUrls[format]) {
        // Se não tiver URL, solicitar ao backend
        try {
            const response = await fetch(`${API_URL}/download`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    file_id: state.transcriptionData.file_id,
                    format: format
                })
            });
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transcricao.${format}`;
            a.click();
            window.URL.revokeObjectURL(url);
            
            showToast(`Arquivo ${format.toUpperCase()} baixado`, 'success');
        } catch (err) {
            showToast('Falha ao baixar arquivo', 'error');
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════════════════════════

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
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
// POLLING PARA PROCESSAMENTO LONGO (Opcional)
// ═══════════════════════════════════════════════════════════════

async function checkTranscriptionStatus(fileId) {
    const maxAttempts = 100;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        const response = await fetch(`${API_URL}/status/${fileId}`);
        const data = await response.json();
        
        if (data.status === 'completed') {
            return data;
        } else if (data.status === 'failed') {
            throw new Error(data.error || 'Transcrição falhou');
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
    }
    
    throw new Error('Tempo limite excedido');
}
