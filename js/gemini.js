/**
 * LANZADOR DE CONSULTAS A SERVICIOS DE IA EXTERNOS
 */
window.APP = window.APP || {};

APP.Gemini = {
    services: {
        gemini: {
            label: 'Gemini Web',
            url: 'https://gemini.google.com/app',
            description: 'Abre Gemini en el navegador. La consulta se copia al portapapeles.'
        },
        perplexity: {
            label: 'Perplexity Web',
            url: 'https://www.perplexity.ai/',
            description: 'Abre Perplexity para pegar la consulta manualmente.'
        },
        perplexityDocs: {
            label: 'Playground Perplexity',
            url: 'https://docs.perplexity.ai/guides/search-guide',
            description: 'Abre la documentacion oficial del Search API, que incluye un playground sin API key.'
        }
    },
    panel: null,
    backdrop: null,
    keyHandler: null,

    ensurePanel() {
        if (this.panel && this.backdrop) return;

        this.backdrop = document.createElement('div');
        this.backdrop.className = 'ai-backdrop';
        this.backdrop.setAttribute('aria-hidden', 'true');

        this.panel = document.createElement('aside');
        this.panel.id = 'geminiPanel';
        this.panel.className = 'ai-panel';
        this.panel.setAttribute('aria-hidden', 'true');

        this.panel.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h3 class="font-black text-slate-900 flex items-center gap-2">
                    <span class="text-indigo-600">IA</span> Lanzador de consultas
                </h3>
                <button id="geminiCloseBtn" type="button" class="text-slate-400 hover:text-slate-600 text-lg leading-none">x</button>
            </div>

            <div class="space-y-4">
                <div class="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <p class="text-[10px] font-bold text-indigo-400 uppercase mb-1">Modo sin tokens</p>
                    <p class="text-xs font-bold text-indigo-900">La app copia la consulta y abre servicios web externos gratuitos.</p>
                </div>

                <div class="space-y-2">
                    <label for="geminiQuery" class="text-[10px] font-bold text-slate-400 uppercase">Consulta</label>
                    <div class="flex gap-2">
                        <input id="geminiQuery" type="text" placeholder="Ej: lactancia docentes aragon" class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100">
                        <button id="geminiCopyBtn" type="button" class="px-3 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest">Copiar</button>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <button type="button" class="gemini-chip text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-600" data-query="6 semanas obligatorias">6 semanas</button>
                        <button type="button" class="gemini-chip text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-600" data-query="lactancia docentes aragon">Lactancia</button>
                        <button type="button" class="gemini-chip text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-600" data-query="festivos domingo lunes aragon">Festivos</button>
                    </div>
                </div>

                <div id="geminiStatus" class="text-[11px] text-slate-500">Escribe tu consulta, pulsa en un servicio y la app la copiara antes de abrirlo.</div>
                <div id="geminiResults" class="space-y-3 overflow-y-auto max-h-[58vh] pr-1 no-scrollbar"></div>
            </div>
        `;

        document.body.appendChild(this.backdrop);
        document.body.appendChild(this.panel);

        this.renderResults();

        this.backdrop.addEventListener('click', () => this.close());
        this.panel.querySelector('#geminiCloseBtn').addEventListener('click', () => this.close());
        this.panel.querySelector('#geminiCopyBtn').addEventListener('click', () => {
            this.copyQuery(this.panel.querySelector('#geminiQuery').value);
        });

        this.panel.querySelector('#geminiQuery').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.copyQuery(e.target.value);
            }
        });

        this.panel.querySelectorAll('.gemini-chip').forEach((chip) => {
            chip.addEventListener('click', () => {
                this.panel.querySelector('#geminiQuery').value = chip.dataset.query || '';
            });
        });

        this.panel.addEventListener('click', (e) => {
            const button = e.target.closest('[data-service]');
            if (!button) return;

            const input = this.panel.querySelector('#geminiQuery');
            this.launchService(button.dataset.service, input.value);
        });

        this.keyHandler = (e) => {
            if (e.key === 'Escape') this.close();
        };
        document.addEventListener('keydown', this.keyHandler);
    },

    open() {
        this.ensurePanel();
        this.backdrop.classList.add('is-open');
        this.panel.classList.add('is-open');
        this.backdrop.setAttribute('aria-hidden', 'false');
        this.panel.setAttribute('aria-hidden', 'false');
        this.panel.querySelector('#geminiQuery').focus();
    },

    close() {
        if (!this.panel || !this.backdrop) return;

        this.backdrop.classList.remove('is-open');
        this.panel.classList.remove('is-open');
        this.backdrop.setAttribute('aria-hidden', 'true');
        this.panel.setAttribute('aria-hidden', 'true');
    },

    renderResults() {
        const container = this.panel.querySelector('#geminiResults');
        container.innerHTML = Object.entries(this.services).map(([key, service]) => `
            <div class="space-y-2 border border-slate-100 rounded-2xl p-4">
                <h4 class="text-sm font-bold text-slate-800">${service.label}</h4>
                <p class="text-xs text-slate-500 leading-relaxed">${service.description}</p>
                <button type="button" data-service="${key}" class="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50">
                    Abrir
                </button>
            </div>
        `).join('');
    },

    // Copia la consulta antes de abrir el servicio para evitar depender de APIs de pago.
    async copyQuery(query) {
        const text = (query || '').trim();
        if (!text) {
            this.showStatus('Escribe una consulta antes de copiar o lanzar la busqueda.');
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            this.showStatus('Consulta copiada al portapapeles.');
        } catch (error) {
            this.showStatus('No se pudo copiar automaticamente. Copiala manualmente.');
        }
    },

    showStatus(message) {
        const status = this.panel?.querySelector('#geminiStatus');
        if (status) status.textContent = message;
    },

    // El flujo es deliberadamente externo: la app prepara la consulta y delega la respuesta al servicio web elegido.
    async launchService(serviceKey, query) {
        const service = this.services[serviceKey];
        if (!service) return;

        const externalWindow = window.open(service.url, '_blank', 'noopener,noreferrer');
        if (!externalWindow) {
            this.showStatus('El navegador ha bloqueado la apertura. Permite ventanas emergentes para este sitio.');
            return;
        }

        this.copyQuery(query);
        this.close();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnGemini').onclick = () => APP.Gemini.open();
});
