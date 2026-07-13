/**
 * EXPORTACION A PDF MEDIANTE PAGINAS DE IMPRESION A4
 */
window.APP = window.APP || {};

APP.PDF = {
    getPageProfile() {
        const userAgent = navigator.userAgent || '';
        const isAndroid = /Android/i.test(userAgent);

        // Chrome Android suele ignorar A4 y renderizar sobre carta; nos alineamos a ese tamano.
        if (isAndroid) {
            return {
                paper: 'letter',
                width: '210mm',
                height: '297mm',
                paddingX: '9mm',
                paddingY: '9mm'
            };
        }

        return {
            paper: 'a4',
            width: '210mm',
            height: '297mm',
            paddingX: '9mm',
            paddingY: '9mm'
        };
    },

    applyPageProfile(profile) {
        document.documentElement.dataset.printPaper = profile.paper;
        document.documentElement.style.setProperty('--print-page-width', profile.width);
        document.documentElement.style.setProperty('--print-page-height', profile.height);
        document.documentElement.style.setProperty('--print-page-padding-x', profile.paddingX);
        document.documentElement.style.setProperty('--print-page-padding-y', profile.paddingY);
    },

    resetPageProfile() {
        document.documentElement.dataset.printPaper = '';
        document.documentElement.style.removeProperty('--print-page-width');
        document.documentElement.style.removeProperty('--print-page-height');
        document.documentElement.style.removeProperty('--print-page-padding-x');
        document.documentElement.style.removeProperty('--print-page-padding-y');
    },

    createMonthSheet(withLegend = false) {
        const sheet = document.createElement('section');
        sheet.className = 'pdf-sheet pdf-sheet--months';

        if (withLegend) {
            const legend = document.createElement('div');
            legend.className = 'print-legend-compact-wrap';
            legend.innerHTML = this.buildLegendBlockHtml();
            sheet.appendChild(legend);
        }

        const stack = document.createElement('div');
        stack.className = 'pdf-month-stack';
        sheet.appendChild(stack);

        return { sheet, stack };
    },

    createMeasureRoot() {
        const root = document.createElement('div');
        root.className = 'pdf-measure-root';
        document.body.appendChild(root);
        return root;
    },

    // Mide si un mes adicional cabe realmente en la hoja actual usando el mismo CSS de impresion.
    canAppendMonthToSheet(sheet, block, measureRoot) {
        const probeSheet = sheet.cloneNode(true);
        probeSheet.classList.add('pdf-sheet--measure');
        const probeStack = probeSheet.querySelector('.pdf-month-stack');
        probeStack.appendChild(block.cloneNode(true));

        measureRoot.innerHTML = '';
        measureRoot.appendChild(probeSheet);

        return probeSheet.scrollHeight <= probeSheet.clientHeight + 1;
    },

    collectInvolvedMonths() {
        if (!APP.State.birthDate) return [];

        const birth = new Date(APP.State.birthDate);
        const start = new Date(birth.getFullYear(), birth.getMonth(), 1);
        let lastRelevant = new Date(APP.State.birthDate);

        Object.entries(APP.State.data).forEach(([ds, day]) => {
            if (!day?.m && !day?.f) return;

            const date = new Date(ds);
            if (date > lastRelevant) lastRelevant = date;
        });

        const end = new Date(lastRelevant.getFullYear(), lastRelevant.getMonth(), 1);
        const months = [];
        const cursor = new Date(start);

        while (cursor <= end) {
            months.push(new Date(cursor));
            cursor.setMonth(cursor.getMonth() + 1, 1);
        }

        return months;
    },

    collectHolidayRows(months) {
        const monthKeys = new Set(months.map((month) => `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`));
        const rows = [];

        Object.entries(APP.State.data).forEach(([ds, day]) => {
            if (!monthKeys.has(ds.slice(0, 7))) return;

            APP.Utils.normalizeHolidayArray(day.holidays).forEach((holiday) => {
                rows.push({ ds, holiday });
            });
        });

        rows.sort((a, b) => {
            const byDate = a.ds.localeCompare(b.ds);
            if (byDate !== 0) return byDate;

            const byType = APP.Utils.getHolidayLabel(a.holiday.type).localeCompare(APP.Utils.getHolidayLabel(b.holiday.type), 'es');
            if (byType !== 0) return byType;

            return (a.holiday.name || '').localeCompare(b.holiday.name || '', 'es');
        });

        return rows;
    },

    getWeekendSummary() {
        const mom = APP.State.parents.mom.weekendsAsHolidays;
        const dad = APP.State.parents.dad.weekendsAsHolidays;

        if (mom && dad) return 'Fines de semana tratados como no laborables para ambos.';
        if (mom) return `Fines de semana tratados como no laborables para ${APP.State.parents.mom.name}.`;
        if (dad) return `Fines de semana tratados como no laborables para ${APP.State.parents.dad.name}.`;
        return 'Los fines de semana no cuentan como festivos extra.';
    },

    buildSheet(innerHtml) {
        const sheet = document.createElement('section');
        sheet.className = 'pdf-sheet';
        sheet.innerHTML = innerHtml;
        return sheet;
    },

    // Recopila los tipos unicos de 'Otros' usados en el calendario (nombre + color)
    collectOtherTypes() {
        const seen = new Map(); // key = label, value = color
        Object.values(APP.State.data).forEach((day) => {
            if (!day) return;
            ['m', 'f'].forEach((role) => {
                if (day[role] === 'other') {
                    const label = day.otherLabels?.[role] || 'Otro permiso';
                    const color = day.otherColors?.[role] || '#f43f5e';
                    if (!seen.has(label)) seen.set(label, color);
                }
            });
        });
        return seen;
    },

    buildLegendBlockHtml() {
        // Generar entradas dinamicas de 'Otros'
        const otherTypes = this.collectOtherTypes();
        let otherLegendHtml = '';
        if (otherTypes.size > 0) {
            otherTypes.forEach((color, label) => {
                otherLegendHtml += `<li class="print-legend-inline-item"><span class="print-swatch" style="background:${color};border-radius:4px;"></span><span>${label}</span></li>`;
            });
        }

        return `
            <div class="print-legend-header">
                <div>
                    <h1 class="text-xl font-black text-slate-900 mb-1">Calendario de permisos</h1>
                    <p class="text-xs text-slate-500">Exportado el ${APP.Utils.formatDisplay(new Date())}</p>
                </div>
                <div class="text-[11px] text-slate-500 max-w-xs text-right">${this.getWeekendSummary()}</div>
            </div>

            <div class="print-section-title">Leyenda</div>
            <ul class="print-legend-compact">
                <li class="print-legend-inline-item"><span class="print-swatch print-swatch--mandatory"></span><span>6 semanas obligatorias</span></li>
                <li class="print-legend-inline-item"><span class="print-swatch print-band-bottom print-band-mom"></span><span>Semanas madre</span></li>
                <li class="print-legend-inline-item"><span class="print-swatch print-band-top print-band-dad"></span><span>Semanas padre</span></li>
                <li class="print-legend-inline-item"><span class="print-swatch" style="background:#f59e0b;border-radius:4px;"></span><span>Semanas flexibles (hasta 8 anos)</span></li>
                <li class="print-legend-inline-item"><span class="print-swatch print-band-bottom print-band-lactation"></span><span>Lactancia</span></li>
                <li class="print-legend-inline-item"><span class="print-swatch print-band-bottom print-band-vac-bottom"></span><span>Vacaciones madre</span></li>
                <li class="print-legend-inline-item"><span class="print-swatch print-band-top print-band-vac-top"></span><span>Vacaciones padre</span></li>
                ${otherLegendHtml}
                <li class="print-legend-inline-item"><span class="print-swatch print-swatch--nat"></span><span>Festivo nacional/autonomico</span></li>
                <li class="print-legend-inline-item"><span class="print-swatch print-swatch--mom-local"></span><span>Festivo local madre</span></li>
                <li class="print-legend-inline-item"><span class="print-swatch print-swatch--dad-local"></span><span>Festivo local padre</span></li>
                <li class="print-legend-inline-item"><span class="print-swatch print-swatch--school"></span><span>Periodo no lectivo</span></li>
                <li class="print-legend-inline-item"><span class="print-swatch print-swatch--weekend"></span><span>Fin de semana</span></li>
            </ul>
        `;
    },

    // Limpia ids y marcas interactivas para que los clones no interfieran con la pagina real.
    sanitizeMonthClone(monthNode) {
        monthNode.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
        monthNode.querySelectorAll('[title]').forEach((node) => node.removeAttribute('title'));
        monthNode.querySelectorAll('.calendar-day').forEach((cell) => {
            cell.classList.add('pdf-calendar-day');
        });

        monthNode.classList.add('pdf-month-card');
        if (monthNode.firstElementChild) {
            monthNode.firstElementChild.classList.add('pdf-month-header');
        }

        const monthGrid = monthNode.querySelector('.grid.grid-cols-7');
        if (monthGrid) {
            monthGrid.classList.add('pdf-month-grid');
        }

        return monthNode;
    },

    buildMonthBlock(month) {
        const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
        const liveMonth = document.querySelector(`#calendarGrid [data-month="${monthKey}"]`);
        const block = document.createElement('article');
        block.className = 'print-month-block';

        const wrapper = document.createElement('div');
        wrapper.className = 'print-month';

        if (liveMonth) {
            wrapper.appendChild(this.sanitizeMonthClone(liveMonth.cloneNode(true)));
        } else {
            wrapper.appendChild(this.sanitizeMonthClone(APP.UI.buildMonthCard(month, false)));
        }

        block.appendChild(wrapper);
        return block;
    },

    buildMonthSheets(months) {
        const measureRoot = this.createMeasureRoot();
        const sheets = [];
        let currentSheet = this.createMonthSheet(true);

        months.forEach((month) => {
            const block = this.buildMonthBlock(month);

            if (currentSheet.stack.children.length === 0 || this.canAppendMonthToSheet(currentSheet.sheet, block, measureRoot)) {
                currentSheet.stack.appendChild(block);
                return;
            }

            sheets.push(currentSheet.sheet);
            currentSheet = this.createMonthSheet(false);
            currentSheet.stack.appendChild(block);
        });

        if (currentSheet.stack.children.length > 0) {
            sheets.push(currentSheet.sheet);
        }

        measureRoot.remove();

        return sheets;
    },

    buildHolidaySheets(months) {
        const rows = this.collectHolidayRows(months);
        if (rows.length === 0) {
            return [this.buildSheet(`
                <div class="print-section-title">Festivos incluidos</div>
                <p class="text-sm text-slate-500">No hay festivos configurados dentro del periodo exportado.</p>
            `)];
        }

        const chunkSize = 60;
        const sheets = [];

        for (let i = 0; i < rows.length; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize);
            const listHtml = chunk.map(({ ds, holiday }) => `
                <li class="print-holiday-item">
                    <span class="font-bold text-slate-700">${APP.Utils.formatDisplay(ds)}</span>
                    <span class="text-slate-700">${holiday.name || 'Festivo'}</span>
                    <span class="text-slate-500">(${APP.Utils.getHolidayLabel(holiday.type)})</span>
                </li>
            `).join('');

            sheets.push(this.buildSheet(`
                <div class="print-section-title">Festivos incluidos</div>
                <ul class="print-holidays-compact">${listHtml}</ul>
            `));
        }

        return sheets;
    },

    buildDocument() {
        const months = this.collectInvolvedMonths();
        const root = document.createElement('div');
        root.className = 'print-root';

        this.buildMonthSheets(months).forEach((sheet) => {
            root.appendChild(sheet);
        });
        this.buildHolidaySheets(months).forEach((sheet) => {
            root.appendChild(sheet);
        });

        return root;
    },

    export() {
        if (!APP.State.birthDate) {
            alert('Configura la fecha de nacimiento antes de exportar el PDF.');
            return;
        }

        if (APP.UI.elements.grid.classList.contains('hidden')) {
            APP.Events.launchApp();
        }

        if (!APP.UI.elements.grid || APP.UI.elements.grid.children.length === 0) {
            APP.UI.renderCalendar();
        }

        const printRoot = document.getElementById('printRoot');
        if (!printRoot) return;
        const pageProfile = this.getPageProfile();

        const cleanup = () => {
            document.body.classList.remove('print-mode');
            document.documentElement.classList.remove('print-mode');
            this.resetPageProfile();
            printRoot.innerHTML = '';
            window.removeEventListener('afterprint', cleanup);
        };

        this.applyPageProfile(pageProfile);
        printRoot.innerHTML = '';
        printRoot.appendChild(this.buildDocument());
        
        document.body.classList.add('print-mode');
        document.documentElement.classList.add('print-mode');
        
        window.addEventListener('afterprint', cleanup);
        
        // Aumentamos el tiempo a 500ms para asegurar que el layout se estabilice en moviles
        setTimeout(() => {
            window.print();
        }, 500);
    }
};
