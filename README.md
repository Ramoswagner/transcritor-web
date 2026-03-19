# 🎯 Transcritor 2027 — 100% Client-Side

Transcrição de áudio/vídeo com IA **direto no navegador**. Zero servidor, zero upload, 100% privado.

## ✨ Recursos

- 🔒 **Privacidade Total** — Seus arquivos nunca saem do navegador
- 🧠 **Whisper AI** — Modelos Tiny e Base via Transformers.js
- 🎬 **Vídeo → Áudio** — Extração com FFmpeg.wasm
- 📥 **Multi-formato** — Exporta TXT, PDF, DOCX
- 🌐 **Offline** — Funciona sem internet após carregar modelos
- 📱 **Responsivo** — Desktop e mobile

## ⚠️ Limitações

| Item | Limitação |
|------|-----------|
| Modelos | Tiny (~75MB) e Base (~140MB) apenas |
| Arquivos | Máx 500MB recomendado |
| Velocidade | 5-10x mais lento que servidor |
| Primeira carga | Download de 150-200MB |

## 🚀 Deploy no GitHub Pages

1. Crie repositório no GitHub
2. Faça push dos arquivos (`index.html`, `style.css`, `script.js`)
3. Ative GitHub Pages em **Settings → Pages → main branch**
4. Acesse `https://seu-usuario.github.io/seu-repo/`

## 🛠️ Tecnologias

- [Transformers.js](https://huggingface.co/docs/transformers.js)
- [FFmpeg.wasm](https://ffmpegwasm.netlify.app/)
- [jsPDF](https://parall.ax/products/jspdf)
- [Docx.js](https://docx.js.org/)

## 📄 Licença

MIT License — Use livremente!
