/**
 * VISOR DE DOCUMENTACION LOCAL
 */
window.APP = window.APP || {};

APP.Docs = {
    sourcePath: 'GUIA_USO_Y_REFERENCIAS.md',
    fallbackMarkdown: `# Guia de uso y referencias

## Normativa vigente de los permisos
- BOE RDL 9/2025: https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-15741
- Seguridad Social, Nacimiento y cuidado de menor: https://www.seg-social.es/wps/portal/wss/internet/InformacionUtil/44539/de513c99-5885-48bd-8c66-45d2c97ad947/41021nycm

## Calendario de festivos nacionales y de Aragon
- BOE, relacion oficial de fiestas laborales 2026: https://www.boe.es/boe/dias/2025/10/31/pdfs/BOE-A-2025-21667.pdf
- Gobierno de Aragon, calendario laboral: https://www.aragon.es/trabajo-y-relaciones-laborales/calendario-laboral

## Calendario de festivos locales
- Gobierno de Aragon: consulta el enlace al BOA con fiestas locales por municipios desde el calendario laboral.
- Como comprobacion adicional, revisa la web o el bando del ayuntamiento correspondiente.

## Instrucciones de uso
- Introduce la fecha de nacimiento para generar las 6 semanas obligatorias y los festivos sugeridos.
- Usa la leyenda superior para marcar semanas, lactancia y vacaciones.
- Activa el modo de edicion visual de festivos desde Configuracion para editar festivos con clic izquierdo.
- El Asistente permite autogenerar el calendario y reordenar prioridades por arrastrar y soltar.
- El boton IA abre servicios externos para lanzar consultas sin integrar APIs de pago.
`,

    // Intenta cargar la guia editable del proyecto y usa un fallback si se abre desde local sin servidor.
    async loadMarkdown() {
        if (window.location.protocol === 'file:') {
            return this.fallbackMarkdown;
        }

        try {
            const response = await fetch(this.sourcePath);
            if (!response.ok) throw new Error('markdown not available');
            return await response.text();
        } catch (error) {
            return this.fallbackMarkdown;
        }
    },

    renderMarkdown(markdown) {
        return markdown
            .split('\n')
            .map((line) => {
                if (line.startsWith('# ')) return `<h3 class="text-2xl font-bold text-slate-900 mb-4">${line.slice(2)}</h3>`;
                if (line.startsWith('## ')) return `<h4 class="text-sm font-black uppercase tracking-widest text-indigo-500 mt-6 mb-2">${line.slice(3)}</h4>`;
                if (line.startsWith('- ')) return `<li class="text-sm text-slate-600 leading-relaxed ml-5 list-disc">${this.linkify(line.slice(2))}</li>`;
                if (!line.trim()) return '<div class="h-2"></div>';
                return `<p class="text-sm text-slate-600 leading-relaxed">${this.linkify(line)}</p>`;
            })
            .join('');
    },

    linkify(text) {
        return text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-indigo-600 underline">$1</a>');
    },

    // Reutiliza el modal principal para no introducir otra capa de UI independiente.
    async open() {
        const modal = document.getElementById('wizardModal');
        const container = modal.querySelector('div');
        const markdown = await this.loadMarkdown();

        container.innerHTML = `
            <div class="p-8 max-h-[90vh] overflow-y-auto no-scrollbar">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-2xl font-bold text-slate-900">Guia y referencias</h3>
                    <button onclick="APP.Wizard.close()" class="text-slate-400 hover:text-slate-600 text-lg leading-none">x</button>
                </div>
                <div class="space-y-1">${this.renderMarkdown(markdown)}</div>
            </div>
        `;

        modal.classList.remove('hidden');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnDocs').onclick = () => APP.Docs.open();
});
