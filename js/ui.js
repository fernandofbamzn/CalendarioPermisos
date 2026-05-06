/**
 * INTERFAZ DE USUARIO (RENDER Y DOM)
 */
window.APP = window.APP || {};

APP.UI = {
    elements: {},

    init() {
        this.elements = {
            input: document.getElementById('birthDateInput'),
            grid: document.getElementById('calendarGrid'),
            empty: document.getElementById('emptyState'),
            tools: document.getElementById('toolsPanel'),
            toolbar: document.getElementById('stickyToolbar'),
            stats: document.getElementById('statsDashboard'),
            labels: {
                mom: document.getElementById('label_mom_name'),
                dad: document.getElementById('label_dad_name')
            },
            metrics: {
                coverage: document.getElementById('metric_coverage_date'),
                weeks: document.getElementById('metric_coverage_weeks'),
                mom: document.getElementById('metric_mom_return'),
                dad: document.getElementById('metric_dad_return'),
                overlap: document.getElementById('metric_overlap')
            },
            counts: {
                m_vol: document.getElementById('count_mom_vol'),
                m_flex: document.getElementById('count_mom_flex'),
                m_lac: document.getElementById('count_mom_lac'),
                m_vac: document.getElementById('count_mom_vac'),
                m_other: document.getElementById('count_mom_other'),
                f_vol: document.getElementById('count_dad_vol'),
                f_flex: document.getElementById('count_dad_flex'),
                f_lac: document.getElementById('count_dad_lac'),
                f_vac: document.getElementById('count_dad_vac'),
                f_other: document.getElementById('count_dad_other')
            }
        };

        this.syncParentLabels();
    },

    syncParentLabels() {
        if (!this.elements.labels?.mom || !this.elements.labels?.dad) return;
        this.elements.labels.mom.textContent = APP.State.parents.mom.name || 'Madre';
        this.elements.labels.dad.textContent = APP.State.parents.dad.name || 'Padre';
    },

    switchTab(tabId) {
        const tabs = ['mom', 'dad', 'common'];
        tabs.forEach(t => {
            const btn = document.getElementById('tabBtn_' + t);
            const content = document.getElementById('tabContent_' + t);
            if (!btn || !content) return;
            
            if (t === tabId) {
                btn.classList.remove('text-slate-400', 'border-transparent');
                if (t === 'mom') btn.classList.add('text-purple-600', 'border-purple-600');
                if (t === 'dad') btn.classList.add('text-blue-600', 'border-blue-600');
                if (t === 'common') btn.classList.add('text-red-600', 'border-red-600');
                content.classList.remove('hidden');
                content.classList.add('flex');
            } else {
                btn.classList.add('text-slate-400', 'border-transparent');
                btn.classList.remove('text-purple-600', 'border-purple-600', 'text-blue-600', 'border-blue-600', 'text-red-600', 'border-red-600');
                content.classList.add('hidden');
                content.classList.remove('flex');
            }
        });
    },

    renderCalendar() {
        if (!APP.State.birthDate) return;

        const grid = this.elements.grid;
        grid.innerHTML = '';
        grid.className = 'calendar-grid animate-fade';

        let d = new Date(APP.State.birthDate);
        d.setDate(1);

        for (let i = 0; i < 18; i++) {
            grid.appendChild(this.buildMonthCard(d, true));
            d.setMonth(d.getMonth() + 1, 1);
        }
    },

    // Reutiliza la misma fabrica de meses para la vista interactiva y la impresion PDF.
    buildMonthCard(monthDate, interactive = true) {
        const monthStart = new Date(monthDate);
        monthStart.setDate(1);

        const monthCard = document.createElement('div');
        monthCard.className = interactive ? 'glass rounded-2xl overflow-hidden' : 'print-month glass rounded-2xl overflow-hidden';
        monthCard.dataset.month = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;

        const monthName = monthStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        monthCard.innerHTML = `<div class="bg-indigo-50/50 px-4 py-3 border-b border-indigo-100/50 font-bold text-slate-700 capitalize text-sm flex justify-between"><span>${monthName}</span></div>`;

        const daysGrid = document.createElement('div');
        daysGrid.className = 'grid grid-cols-7 p-2';

        ['L', 'M', 'X', 'J', 'V', 'S', 'D'].forEach((label) => {
            daysGrid.innerHTML += `<div class="text-center text-[10px] text-slate-400 font-bold py-1">${label}</div>`;
        });

        const cursor = new Date(monthStart);
        const firstDay = (cursor.getDay() + 6) % 7;
        for (let j = 0; j < firstDay; j++) daysGrid.innerHTML += '<div></div>';

        const currentMonth = cursor.getMonth();
        while (cursor.getMonth() === currentMonth) {
            const ds = APP.Utils.formatDate(cursor);
            const cell = document.createElement('div');
            cell.className = 'calendar-day h-9 flex items-center justify-center cursor-pointer m-0.5 rounded-lg text-xs transition-all relative';
            if (interactive) cell.id = `c-${ds}`;

            if (interactive) {
                cell.addEventListener('mousedown', (e) => {
                    if (e.button === 2) return;

                    e.preventDefault();
                    if (e.button !== 0) return;

                    if (APP.State.settings.holidayEditMode) {
                        APP.HolidayManager.open(ds);
                        return;
                    }

                    APP.Events.startDrag(ds);
                });

                cell.addEventListener('mouseenter', () => {
                    if (!APP.State.settings.holidayEditMode) APP.Events.onMouseEnterDate(ds);
                });

                cell.addEventListener('dblclick', () => {
                    APP.Events.onDoubleClickDate(ds);
                });

                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    APP.HolidayManager.open(ds);
                });
            }

            this.applyCellStyles(cell, ds);
            daysGrid.appendChild(cell);
            cursor.setDate(cursor.getDate() + 1);
        }

        monthCard.appendChild(daysGrid);
        return monthCard;
    },

    resetCellContent(el, ds) {
        const day = Number(ds.slice(-2));
        el.innerHTML = `<span class="z-10 relative pointer-events-none font-bold">${day}</span>`;
    },

    appendLayer(el, className) {
        const layer = document.createElement('div');
        layer.className = className;
        el.appendChild(layer);
    },

    setCellTooltip(el, ds) {
        const d = APP.State.data[ds] || {};
        const holidays = APP.Utils.normalizeHolidayArray(d.holidays);
        const info = [];

        holidays.forEach((holiday) => {
            info.push(`${holiday.name} (${APP.Utils.getHolidayLabel(holiday.type)})`);
        });

        const m = d.m;
        const f = d.f;

        if (m === 'mandatory' || f === 'mandatory') {
            info.push('Permiso obligatorio (ambos)');
        } else {
            if (m === 'vol') info.push(`Permiso voluntario ${APP.State.parents.mom.name}`);
            if (m === 'flex') info.push(`Semanas flexibles ${APP.State.parents.mom.name}`);
            if (m === 'ex') info.push(`Semanas extra ${APP.State.parents.mom.name}`);
            if (m === 'vac') info.push(`Vacaciones ${APP.State.parents.mom.name}`);
            if (m === 'lac') info.push(`Lactancia ${APP.State.parents.mom.name}`);
            if (m === 'other') info.push(`${d.otherLabels?.m || 'Otro permiso'} ${APP.State.parents.mom.name}`);

            if (f === 'vol') info.push(`Permiso voluntario ${APP.State.parents.dad.name}`);
            if (f === 'flex') info.push(`Semanas flexibles ${APP.State.parents.dad.name}`);
            if (f === 'ex') info.push(`Semanas extra ${APP.State.parents.dad.name}`);
            if (f === 'vac') info.push(`Vacaciones ${APP.State.parents.dad.name}`);
            if (f === 'lac') info.push(`Lactancia ${APP.State.parents.dad.name}`);
            if (f === 'other') info.push(`${d.otherLabels?.f || 'Otro permiso'} ${APP.State.parents.dad.name}`);
        }

        if (info.length > 0) {
            el.title = info.join(' | ');
            return;
        }

        if (APP.Utils.isWeekend(new Date(ds))) {
            el.title = 'Fin de semana';
        } else {
            el.removeAttribute('title');
        }
    },

    applyCellStyles(el, ds) {
        const d = APP.State.data[ds] || {};
        const holidays = APP.Utils.normalizeHolidayArray(d.holidays);
        const isWeekend = APP.Utils.isWeekend(new Date(ds));
        const isEdit = APP.State.settings.holidayEditMode;
        const birth = APP.State.birthDate ? new Date(APP.State.birthDate) : null;
        const mandatoryEnd = birth ? APP.Utils.addDays(birth, 42) : null;

        el.className = 'calendar-day h-9 flex items-center justify-center cursor-pointer m-0.5 rounded-lg text-xs relative font-semibold transition-all';
        this.resetCellContent(el, ds);

        if (isEdit) el.classList.add('hover:ring-2', 'hover:ring-green-400');

        if (isWeekend) {
            el.classList.add('bg-slate-50', 'text-slate-400');
            if (APP.State.parents.mom.weekendsAsHolidays || APP.State.parents.dad.weekendsAsHolidays) {
                el.classList.add('border-dashed', 'border', 'border-slate-200');
            }
        } else {
            el.classList.add('bg-white', 'text-slate-700');
        }

        const showHolidays = !mandatoryEnd || new Date(ds) >= mandatoryEnd;
        const hasSharedLocalHoliday = showHolidays && holidays.some((holiday) => holiday.type === 'both_loc');
        const hasMomLocalHoliday = showHolidays && holidays.some((holiday) => holiday.type === 'm_loc');
        const hasDadLocalHoliday = showHolidays && holidays.some((holiday) => holiday.type === 'f_loc');
        const holidayType = showHolidays ? APP.Utils.getHolidayPrimaryType(holidays) : null;

        if (hasSharedLocalHoliday || (hasMomLocalHoliday && hasDadLocalHoliday)) {
            el.classList.add('h-local-split', 'ring-1', 'ring-indigo-200');
        } else {
            if (holidayType === 'nat') el.classList.add('bg-red-100', 'text-red-700', 'ring-1', 'ring-red-200');
            if (holidayType === 'm_loc') el.classList.add('bg-purple-100', 'text-purple-700', 'ring-1', 'ring-purple-200');
            if (holidayType === 'both_loc') el.classList.add('h-local-split', 'ring-1', 'ring-indigo-200');
            if (holidayType === 'f_loc') el.classList.add('bg-blue-100', 'text-blue-700', 'ring-1', 'ring-blue-200');
            if (holidayType === 'school') el.classList.add('bg-amber-100', 'text-amber-700', 'ring-1', 'ring-amber-200');
        }

        const m = d.m;
        const f = d.f;
        if (m === 'mandatory' || f === 'mandatory') {
            el.classList.add('p-mandatory-split', 'text-white', 'shadow-sm');
            this.setCellTooltip(el, ds);
            return;
        }

        if (!isEdit) {
            if (m === 'vol' || m === 'ex') this.appendLayer(el, 'absolute inset-x-0 bottom-0 h-1.5 bg-purple-600 rounded-b-lg');
            if (m === 'flex') this.appendLayer(el, 'absolute inset-x-0 bottom-0 h-1.5 bg-amber-500 rounded-b-lg');
            if (m === 'vac') this.appendLayer(el, 'absolute inset-x-0 bottom-0 h-1.5 bg-purple-400 rounded-b-lg opacity-40');
            if (m === 'lac') this.appendLayer(el, 'absolute inset-x-0 bottom-0 h-1.5 bg-green-500 rounded-b-lg');
            if (m === 'other') this.appendLayer(el, 'absolute inset-x-0 bottom-0 h-1.5 bg-teal-500 rounded-b-lg');

            if (f === 'vol' || f === 'ex') this.appendLayer(el, 'absolute inset-x-0 top-0 h-1.5 bg-blue-600 rounded-t-lg');
            if (f === 'flex') this.appendLayer(el, 'absolute inset-x-0 top-0 h-1.5 bg-amber-500 rounded-t-lg');
            if (f === 'vac') this.appendLayer(el, 'absolute inset-x-0 top-0 h-1.5 bg-cyan-400 rounded-t-lg opacity-40');
            if (f === 'lac') this.appendLayer(el, 'absolute inset-x-0 top-0 h-1.5 bg-green-500 rounded-t-lg');
            if (f === 'other') this.appendLayer(el, 'absolute inset-x-0 top-0 h-1.5 bg-teal-500 rounded-t-lg');
        }

        this.setCellTooltip(el, ds);
    },

    openLactationCalc(role) {
        const lastDay = APP.Logic.getLastVoluntaryDay(APP.State.data, role);

        if (!lastDay) {
            alert('Primero marca las semanas voluntarias para calcular la lactancia.');
            return;
        }

        const parent = role === 'mom' ? APP.State.parents.mom : APP.State.parents.dad;
        const res = APP.Logic.calculateLactation(lastDay, parent.hours, role);
        const lactationWindowText = parent.isTeacher ? '12 meses (docente)' : '9 meses';
        const includedRows = res.breakdown.includedDates.map((item) => `
            <div class="flex justify-between gap-4 py-2 border-b border-slate-100 last:border-b-0">
                <span class="font-medium text-slate-700">${APP.Utils.formatDisplay(item.ds)}</span>
                <span class="text-slate-500 text-right">${item.reason}</span>
            </div>
        `).join('');
        const excludedRows = res.breakdown.excludedDates.map((item) => `
            <div class="flex justify-between gap-4 py-2 border-b border-slate-100 last:border-b-0">
                <span class="font-medium text-slate-700">${APP.Utils.formatDisplay(item.ds)}</span>
                <span class="text-slate-500 text-right">${item.reasons.join(', ') || 'Excluido'}${item.schoolBreak ? ' · Con vacaciones escolares (informativo)' : ''}</span>
            </div>
        `).join('');

        const modal = document.getElementById('wizardModal');
        const container = modal.querySelector('div');
        container.className = 'bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden animate-fade';

        container.innerHTML = `
            <div class="p-8 max-h-[90vh] overflow-y-auto no-scrollbar">
                <h3 class="text-2xl font-bold text-slate-900 mb-2">Calculadora de lactancia</h3>
                <p class="text-slate-500 mb-8 font-medium">Calculo basado en 1h/dia hasta los ${lactationWindowText}, empezando el dia siguiente al ultimo dia marcado como semanas voluntarias.</p>

                <div class="space-y-6">
                    <div class="grid md:grid-cols-2 xl:grid-cols-6 gap-4">
                        <div class="p-5 bg-white rounded-2xl border border-slate-200">
                            <p class="text-[10px] font-bold text-slate-400 uppercase">Ultimo dia voluntario</p>
                            <p class="text-sm font-bold text-slate-900 mt-2">${APP.Utils.formatDisplay(lastDay)}</p>
                        </div>
                        <div class="p-5 bg-white rounded-2xl border border-slate-200">
                            <p class="text-[10px] font-bold text-slate-400 uppercase">Inicio del computo</p>
                            <p class="text-sm font-bold text-slate-900 mt-2">${APP.Utils.formatDisplay(res.breakdown.rangeStart)}</p>
                        </div>
                        <div class="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                            <p class="text-[10px] font-bold text-slate-400 uppercase">Rango analizado</p>
                            <p class="text-sm font-bold text-slate-900 mt-2">${APP.Utils.formatDisplay(res.breakdown.rangeStart)} - ${APP.Utils.formatDisplay(res.breakdown.rangeEnd)}</p>
                        </div>
                        <div class="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <p class="text-[10px] font-bold text-emerald-500 uppercase">Dias incluidos</p>
                            <p class="text-3xl font-black text-emerald-900 mt-2">${res.breakdown.includedDays}</p>
                        </div>
                        <div class="p-5 bg-rose-50 rounded-2xl border border-rose-100">
                            <p class="text-[10px] font-bold text-rose-500 uppercase">Dias excluidos</p>
                            <p class="text-3xl font-black text-rose-900 mt-2">${res.breakdown.excludedDays}</p>
                        </div>
                        <div class="p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                            <p class="text-[10px] font-bold text-indigo-400 uppercase">Resultado actual</p>
                            <p class="text-3xl font-black text-indigo-900 mt-2">${res.working.days} dias</p>
                        </div>
                    </div>

                    <div class="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center text-center gap-4">
                        <div>
                            <p class="text-[10px] font-bold text-indigo-400 uppercase">Dias laborables</p>
                            <p class="text-3xl font-black text-indigo-900">${res.workingDays}</p>
                        </div>
                        <div class="text-2xl text-indigo-200">x</div>
                        <div>
                            <p class="text-[10px] font-bold text-indigo-400 uppercase">Lactancia laborable</p>
                            <p class="text-3xl font-black text-indigo-900">${res.working.days}</p>
                        </div>
                    </div>

                    <div class="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                            <p class="text-[10px] font-bold text-slate-400 uppercase">Fines de semana excluidos</p>
                            <p class="text-2xl font-black text-slate-900 mt-2">${res.breakdown.counts.weekend}</p>
                        </div>
                        <div class="p-4 bg-red-50 rounded-2xl border border-red-100">
                            <p class="text-[10px] font-bold text-red-400 uppercase">Festivos nacionales</p>
                            <p class="text-2xl font-black text-red-900 mt-2">${res.breakdown.counts.national}</p>
                        </div>
                        <div class="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                            <p class="text-[10px] font-bold text-purple-400 uppercase">Festivos locales</p>
                            <p class="text-2xl font-black text-purple-900 mt-2">${res.breakdown.counts.local}</p>
                        </div>
                        <div class="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                            <p class="text-[10px] font-bold text-amber-500 uppercase">Vacaciones escolares (informativo)</p>
                            <p class="text-2xl font-black text-amber-900 mt-2">${res.breakdown.counts.school}</p>
                        </div>
                    </div>

                    ${res.natural ? `
                    <div class="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                        <p class="text-xs font-bold text-purple-900">Opcion 28 dias naturales</p>
                        <p class="text-[10px] text-purple-600 mt-1">Tambien puedes optar por <span class="font-black">${res.natural.days} dias naturales</span>. Recomendado ahora: <span class="font-black">${res.recommendedMode === 'natural' ? '28 dias naturales' : 'dias laborables'}</span>.</p>
                    </div>
                    ` : ''}

                    <div class="grid lg:grid-cols-2 gap-6">
                        <details class="rounded-2xl border border-slate-200 p-5 bg-white" open>
                            <summary class="cursor-pointer text-sm font-bold text-slate-900">Dias incluidos en el computo (${res.breakdown.includedDates.length})</summary>
                            <div class="mt-4 max-h-72 overflow-y-auto pr-2 no-scrollbar text-xs">
                                ${includedRows || '<p class="text-slate-500">No hay dias incluidos.</p>'}
                            </div>
                        </details>

                        <details class="rounded-2xl border border-slate-200 p-5 bg-white" open>
                            <summary class="cursor-pointer text-sm font-bold text-slate-900">Dias excluidos y motivo (${res.breakdown.excludedDates.length})</summary>
                            <div class="mt-4 max-h-72 overflow-y-auto pr-2 no-scrollbar text-xs">
                                ${excludedRows || '<p class="text-slate-500">No hay dias excluidos.</p>'}
                            </div>
                        </details>
                    </div>

                    <p class="text-[11px] text-slate-400">Nota: las vacaciones escolares se muestran solo de forma informativa y no excluyen dias en la modalidad laborable.</p>
                </div>

                <div class="mt-8 flex justify-end">
                    <button onclick="APP.Wizard.close()" class="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold uppercase shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700">Entendido</button>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    },

    updateDashboard() {
        const metrics = APP.Logic.updateMetrics();
        const limits = APP.Logic.getPlanLimits();
        const isMono = APP.State.familyType === 'monoparental';
        const momFlexExtra = APP.State.parents.mom.extraWeeks || 0;
        const dadFlexExtra = APP.State.parents.dad.extraWeeks || 0;

        // Avisar si se exceden limites (sin bloquear)
        const volLimitDays = limits.voluntaryWeeks * 7;
        const momFlexLimit = limits.flexibleWeeks + momFlexExtra;
        const dadFlexLimit = limits.flexibleWeeks + dadFlexExtra;

        this.elements.counts.m_vol.innerText = `${(metrics.counts.m_vol / 7).toFixed(1)}/${limits.voluntaryWeeks} sem`;
        this.elements.counts.m_vol.className = metrics.counts.m_vol > volLimitDays ? 'text-[9px] text-red-600 font-bold' : 'text-[9px] text-slate-500';
        if (this.elements.counts.m_flex) {
            this.elements.counts.m_flex.innerText = `${(metrics.counts.m_flex / 7).toFixed(1)}/${momFlexLimit} sem`;
            this.elements.counts.m_flex.className = metrics.counts.m_flex > momFlexLimit * 7 ? 'text-[9px] text-red-600 font-bold' : 'text-[9px] text-slate-500';
        }
        this.elements.counts.m_lac.innerText = `${metrics.counts.m_lac} d`;
        this.elements.counts.m_vac.innerText = `${metrics.counts.m_vac} d`;
        if (this.elements.counts.m_other) {
            this.elements.counts.m_other.innerText = `${metrics.counts.m_other} d`;
        }

        if (!isMono) {
            this.elements.counts.f_vol.innerText = `${(metrics.counts.f_vol / 7).toFixed(1)}/${limits.voluntaryWeeks} sem`;
            this.elements.counts.f_vol.className = metrics.counts.f_vol > volLimitDays ? 'text-[9px] text-red-600 font-bold' : 'text-[9px] text-slate-500';
            if (this.elements.counts.f_flex) {
                this.elements.counts.f_flex.innerText = `${(metrics.counts.f_flex / 7).toFixed(1)}/${dadFlexLimit} sem`;
                this.elements.counts.f_flex.className = metrics.counts.f_flex > dadFlexLimit * 7 ? 'text-[9px] text-red-600 font-bold' : 'text-[9px] text-slate-500';
            }
            this.elements.counts.f_lac.innerText = `${metrics.counts.f_lac} d`;
            this.elements.counts.f_vac.innerText = `${metrics.counts.f_vac} d`;
            if (this.elements.counts.f_other) {
                this.elements.counts.f_other.innerText = `${metrics.counts.f_other} d`;
            }
        }

        if (metrics.lastDate > 0) {
            this.elements.metrics.coverage.innerText = APP.Utils.formatDisplay(metrics.lastDate);
            const totalWeeks = Math.ceil(APP.Utils.getDiffDays(metrics.lastDate, APP.State.birthDate) / 7);
            this.elements.metrics.weeks.innerText = `${totalWeeks} sem cubiertas`;
        } else {
            this.elements.metrics.coverage.innerText = '--';
            this.elements.metrics.weeks.innerText = '0 sem cubiertas';
        }

        this.elements.metrics.mom.innerText = metrics.mReturn ? APP.Utils.formatDisplay(APP.Utils.addDays(metrics.mReturn, 1)) : '--';
        if (!isMono) {
            this.elements.metrics.dad.innerText = metrics.fReturn ? APP.Utils.formatDisplay(APP.Utils.addDays(metrics.fReturn, 1)) : '--';
        }
        this.elements.metrics.overlap.innerText = `${metrics.counts.overlap} dias solapados`;

        // Mostrar avisos de limites excedidos
        const warningBox = document.getElementById('warningBox');
        const warnings = APP.Logic.getWarnings();
        if (warningBox) {
            if (warnings.length > 0) {
                warningBox.innerHTML = warnings.map((w) => `<p class="text-xs text-amber-700">${w}</p>`).join('');
                warningBox.classList.remove('hidden');
            } else {
                warningBox.classList.add('hidden');
            }
        }

        // Ocultar/mostrar secciones segun tipo de familia
        const dadTab = document.getElementById('tabBtn_dad');
        const dadDashboard = document.getElementById('dadDashboardCard');
        if (dadTab) {
            dadTab.classList.toggle('hidden', isMono);
            if (isMono && !document.getElementById('tabContent_dad').classList.contains('hidden')) {
                APP.UI.switchTab('mom');
            }
        }
        if (dadDashboard) dadDashboard.classList.toggle('hidden', isMono);
    },

    sendSummaryEmail() {
        if (!APP.State.birthDate) {
            alert('Primero introduce una fecha de nacimiento.');
            return;
        }

        const metrics = APP.Logic.updateMetrics();
        const momName = APP.State.parents.mom.name || 'Madre';
        const dadName = APP.State.parents.dad.name || 'Padre';
        const birthStr = APP.Utils.formatDisplay(APP.State.birthDate);
        const coverageStr = metrics.lastDate ? APP.Utils.formatDisplay(metrics.lastDate) : '--';
        
        const mReturn = metrics.mReturn ? APP.Utils.formatDisplay(APP.Utils.addDays(metrics.mReturn, 1)) : '--';
        const fReturn = metrics.fReturn ? APP.Utils.formatDisplay(APP.Utils.addDays(metrics.fReturn, 1)) : '--';

        const subject = `Resumen Planificacion Familiar - Nacimiento ${birthStr}`;
        let body = `Hola,\n\nAquí tienes el resumen de la planificación familiar:\n\n`;
        body += `📅 Fecha de nacimiento: ${birthStr}\n`;
        body += `🛡️ Cobertura total hasta: ${coverageStr}\n\n`;
        
        body += `👩‍🏫 ${momName}:\n`;
        body += `   - Vuelta al trabajo: ${mReturn}\n`;
        body += `   - Semanas voluntarias: ${(metrics.counts.m_vol / 7).toFixed(1)}\n`;
        body += `   - Días de lactancia: ${metrics.counts.m_lac}\n`;
        body += `   - Días de vacaciones: ${metrics.counts.m_vac}\n\n`;

        body += `👨‍🏫 ${dadName}:\n`;
        body += `   - Vuelta al trabajo: ${fReturn}\n`;
        body += `   - Semanas voluntarias: ${(metrics.counts.f_vol / 7).toFixed(1)}\n`;
        body += `   - Días de lactancia: ${metrics.counts.f_lac}\n`;
        body += `   - Días de vacaciones: ${metrics.counts.f_vac}\n\n`;

        body += `⚠️ Días de solape: ${metrics.counts.overlap}\n\n`;
        body += `Generado con el Planificador Familiar Premium.`;

        const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
    },

    sendBackupEmail() {
        if (!APP.State.birthDate) {
            alert('Primero introduce una fecha de nacimiento.');
            return;
        }

        const data = APP.State.serialize(); // Obtenemos el objeto de estado actual
        const jsonStr = JSON.stringify(data);
        const birthStr = APP.Utils.formatDisplay(APP.State.birthDate);

        const subject = `Backup Planificacion Familiar - ${birthStr}`;
        let body = `Hola,\n\nEste correo contiene una copia de seguridad de tu planificación familiar en formato JSON. Puedes importarla de nuevo en la aplicación.\n\n`;
        body += `Copia y pega el siguiente código en un archivo .json o úsalo directamente en la opción de importar:\n\n`;
        body += `--- INICIO BACKUP ---\n`;
        body += jsonStr;
        body += `\n--- FIN BACKUP ---\n\n`;
        body += `Generado con el Planificador Familiar Premium.`;

        const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
    }
};
