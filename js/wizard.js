/**
 * ASISTENTE AVANZADO DUAL
 */
window.APP = window.APP || {};

APP.Wizard = {
    step: 1,
    dragIndex: null,
    teacherSelections: { m: 'working', f: 'working' },
    pendingSummary: null,

    open() {
        const modal = document.getElementById('wizardModal');
        modal.classList.remove('hidden');
        this.step = 1;
        this.pendingSummary = null;
        this.teacherSelections = this.getStoredTeacherSelections();
        this.render();
    },

    close() {
        document.getElementById('wizardModal').classList.add('hidden');
        this.pendingSummary = null;
    },

    getStoredTeacherSelections() {
        return {
            m: APP.State.parents.mom.lactationType === 'natural' ? 'natural' : 'working',
            f: APP.State.parents.dad.lactationType === 'natural' ? 'natural' : 'working'
        };
    },

    render() {
        const container = document.querySelector('#wizardModal > div');
        container.className = 'bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-fade';

        if (this.step === 1) this.renderStep1(container);
        else if (this.step === 2) this.renderStep2(container);
        else this.renderTeacherSummary(container);
    },

    renderStep1(container) {
        const limits = APP.Logic.getPlanLimits();
        const isMono = APP.State.familyType === 'monoparental';
        container.innerHTML = `
            <div class="p-8">
                <h3 class="text-2xl font-bold text-slate-900 mb-6">Configuracion de periodos</h3>

                <div class="grid ${isMono ? 'grid-cols-1 max-w-md mx-auto' : 'grid-cols-2'} gap-8">
                    <div class="space-y-6 p-6 bg-purple-50 rounded-3xl border border-purple-100">
                        <p class="text-[10px] font-black text-purple-400 uppercase tracking-widest">${isMono ? 'Progenitor' : 'Madre'}</p>
                        <div>
                            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Semanas flexibles adicionales (0-8)</label>
                            <p class="text-[9px] text-slate-400 mb-2">Base: ${limits.flexibleWeeks} sem. Añade mas por parto multiple, discapacidad, etc.</p>
                            <input type="range" id="wizMomFlexExtra" min="0" max="8" value="${APP.State.parents.mom.extraWeeks}" class="w-full h-1.5 bg-purple-200 rounded-lg accent-purple-600">
                            <p class="text-center text-[10px] font-bold text-purple-600 mt-2" id="valMomFlexExtra">${APP.State.parents.mom.extraWeeks} sem. adicionales (total flex: ${limits.flexibleWeeks + APP.State.parents.mom.extraWeeks})</p>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Dias vacaciones</label>
                            <input type="number" id="wizMomVac" value="${APP.State.parents.mom.vacations}" class="w-full bg-white border border-purple-100 rounded-xl px-4 py-2 text-sm outline-none">
                        </div>
                        <label class="flex items-center gap-3 text-xs font-semibold text-slate-600">
                            <input type="checkbox" id="wizMomVacNatural" ${APP.State.parents.mom.vacationMode === 'natural' ? 'checked' : ''} class="w-4 h-4 accent-purple-600">
                            <span>Vacaciones en dias naturales</span>
                        </label>
                    </div>

                    ${isMono ? '' : `
                    <div class="space-y-6 p-6 bg-blue-50 rounded-3xl border border-blue-100">
                        <p class="text-[10px] font-black text-blue-400 uppercase tracking-widest">Padre</p>
                        <div>
                            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Semanas flexibles adicionales (0-8)</label>
                            <p class="text-[9px] text-slate-400 mb-2">Base: ${limits.flexibleWeeks} sem. Añade mas por parto multiple, discapacidad, etc.</p>
                            <input type="range" id="wizDadFlexExtra" min="0" max="8" value="${APP.State.parents.dad.extraWeeks}" class="w-full h-1.5 bg-blue-200 rounded-lg accent-blue-600">
                            <p class="text-center text-[10px] font-bold text-blue-600 mt-2" id="valDadFlexExtra">${APP.State.parents.dad.extraWeeks} sem. adicionales (total flex: ${limits.flexibleWeeks + APP.State.parents.dad.extraWeeks})</p>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Dias vacaciones</label>
                            <input type="number" id="wizDadVac" value="${APP.State.parents.dad.vacations}" class="w-full bg-white border border-blue-100 rounded-xl px-4 py-2 text-sm outline-none">
                        </div>
                        <label class="flex items-center gap-3 text-xs font-semibold text-slate-600">
                            <input type="checkbox" id="wizDadVacNatural" ${APP.State.parents.dad.vacationMode === 'natural' ? 'checked' : ''} class="w-4 h-4 accent-blue-600">
                            <span>Vacaciones en dias naturales</span>
                        </label>
                    </div>
                    `}
                </div>

                <div class="mt-8 flex justify-end gap-3">
                    <button onclick="APP.Wizard.close()" class="px-6 py-3 text-xs font-bold text-slate-400 uppercase">Cancelar</button>
                    <button id="btnWizStep2" class="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-bold shadow-lg hover:bg-indigo-700 transition-all uppercase">Siguiente: prioridades</button>
                </div>
            </div>
        `;

        const bindRange = (id, valueId, parentId) => {
            const element = document.getElementById(id);
            if (!element) return;
            element.oninput = (e) => {
                const val = parseInt(e.target.value, 10);
                document.getElementById(valueId).innerText = `${val} sem. adicionales (total flex: ${limits.flexibleWeeks + val})`;
                APP.State.parents[parentId].extraWeeks = val;
                APP.State.save();
            };
        };

        bindRange('wizMomFlexExtra', 'valMomFlexExtra', 'mom');
        bindRange('wizDadFlexExtra', 'valDadFlexExtra', 'dad');

        document.getElementById('btnWizStep2').onclick = () => {
            APP.State.parents.mom.vacations = parseInt(document.getElementById('wizMomVac').value, 10) || 0;
            APP.State.parents.mom.vacationMode = document.getElementById('wizMomVacNatural').checked ? 'natural' : 'working';
            if (!isMono) {
                APP.State.parents.dad.vacations = parseInt(document.getElementById('wizDadVac')?.value, 10) || 0;
                APP.State.parents.dad.vacationMode = document.getElementById('wizDadVacNatural')?.checked ? 'natural' : 'working';
            }
            APP.State.save();
            this.step = 2;
            this.render();
        };
    },

    renderStep2(container) {
        const listHtml = APP.State.settings.priorityOrder.map((item, i) => `
            <div class="priority-item flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-indigo-200 transition-all cursor-grab" draggable="true" data-index="${i}">
                <div class="flex items-center gap-4">
                    <span class="text-slate-200">::</span>
                    <span class="text-xs font-bold text-slate-700">${item.label}</span>
                </div>
                <div class="flex gap-1">
                    <button onclick="APP.Wizard.moveItem(${i}, -1)" class="p-2 hover:bg-slate-50 rounded-lg text-xs">Subir</button>
                    <button onclick="APP.Wizard.moveItem(${i}, 1)" class="p-2 hover:bg-slate-50 rounded-lg text-xs">Bajar</button>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="p-8">
                <h3 class="text-2xl font-bold text-slate-900 mb-4">Secuencia cruzada</h3>
                <p class="text-xs text-slate-500 mb-8">Define el orden de aplicacion para permisos, extras, lactancia y vacaciones.</p>

                <div class="space-y-3 max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">
                    ${listHtml}
                </div>

                <div class="mt-8 flex justify-between">
                    <button onclick="APP.Wizard.step=1; APP.Wizard.render();" class="px-6 py-3 text-xs font-bold text-slate-400 uppercase">Atras</button>
                    <button onclick="APP.Wizard.run()" class="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-bold shadow-lg hover:bg-indigo-700 transition-all uppercase">Generar calendario</button>
                </div>
            </div>
        `;

        this.bindPriorityDragAndDrop();
    },

    renderTeacherSummary(container) {
        const simulation = this.pendingSummary || this.simulatePriorityRun(this.teacherSelections);
        this.pendingSummary = simulation;

        const cards = simulation.teacherPrompts.map((prompt) => `
            <div class="rounded-3xl border border-slate-200 p-6 bg-white shadow-sm space-y-5">
                <div class="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p class="text-[10px] font-black uppercase tracking-widest ${prompt.role === 'm' ? 'text-purple-400' : 'text-blue-400'}">${prompt.name}</p>
                        <h4 class="text-xl font-bold text-slate-900">Decision de lactancia</h4>
                        <p class="text-xs text-slate-500 mt-1">Elige el formato de disfrute para este tramo.</p>
                    </div>
                    <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase ${prompt.recommendedMode === 'natural' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}">
                        Recomendado: ${prompt.recommendedMode === 'natural' ? '28 naturales' : 'dias laborables'}
                    </span>
                </div>

                <div class="grid md:grid-cols-2 gap-4">
                    <label class="block cursor-pointer rounded-2xl border p-4 ${prompt.selectedMode === 'working' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50'}">
                        <div class="flex items-start gap-3">
                            <input type="radio" name="teacherMode_${prompt.role}" ${prompt.selectedMode === 'working' ? 'checked' : ''} onchange="APP.Wizard.setTeacherMode('${prompt.role}', 'working')" class="mt-1">
                            <div>
                                <p class="text-sm font-bold text-slate-900">Dias laborables</p>
                                <p class="text-xs text-slate-500 mt-1">${prompt.working.days} dias</p>
                                <p class="text-xs text-slate-500">Inicio: ${APP.Utils.formatDisplay(prompt.working.startDate)}</p>
                                <p class="text-xs text-slate-500">Fin: ${APP.Utils.formatDisplay(prompt.working.endDate)}</p>
                            </div>
                        </div>
                    </label>

                    <label class="block cursor-pointer rounded-2xl border p-4 ${prompt.selectedMode === 'natural' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50'}">
                        <div class="flex items-start gap-3">
                            <input type="radio" name="teacherMode_${prompt.role}" ${prompt.selectedMode === 'natural' ? 'checked' : ''} onchange="APP.Wizard.setTeacherMode('${prompt.role}', 'natural')" class="mt-1">
                            <div>
                                <p class="text-sm font-bold text-slate-900">28 dias naturales</p>
                                <p class="text-xs text-slate-500 mt-1">${prompt.natural.days} dias</p>
                                <p class="text-xs text-slate-500">Inicio: ${APP.Utils.formatDisplay(prompt.natural.startDate)}</p>
                                <p class="text-xs text-slate-500">Fin: ${APP.Utils.formatDisplay(prompt.natural.endDate)}</p>
                            </div>
                        </div>
                    </label>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="p-8">
                <h3 class="text-2xl font-bold text-slate-900 mb-3">Resumen docentes</h3>
                <p class="text-sm text-slate-500 mb-8">Elige para cada docente si prefieres lactancia por dias laborables o 28 dias naturales. Si cambias una decision anterior, se recalculan las siguientes.</p>

                <div class="space-y-4 max-h-[55vh] overflow-y-auto pr-2 no-scrollbar">
                    ${cards}
                </div>

                <div class="mt-8 flex justify-between">
                    <button onclick="APP.Wizard.step=2; APP.Wizard.render();" class="px-6 py-3 text-xs font-bold text-slate-400 uppercase">Volver</button>
                    <button onclick="APP.Wizard.confirmTeacherSummary()" class="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-bold shadow-lg hover:bg-indigo-700 transition-all uppercase">Confirmar y generar</button>
                </div>
            </div>
        `;
    },

    bindPriorityDragAndDrop() {
        const items = document.querySelectorAll('.priority-item');
        items.forEach((item) => {
            item.addEventListener('dragstart', (e) => {
                this.dragIndex = Number(item.dataset.index);
                item.classList.add('opacity-50');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', item.dataset.index);
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                item.classList.add('ring-2', 'ring-indigo-200');
            });

            item.addEventListener('dragleave', () => {
                item.classList.remove('ring-2', 'ring-indigo-200');
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('ring-2', 'ring-indigo-200');
                const targetIndex = Number(item.dataset.index);
                this.moveDraggedItem(this.dragIndex, targetIndex);
            });

            item.addEventListener('dragend', () => {
                this.dragIndex = null;
                item.classList.remove('opacity-50', 'ring-2', 'ring-indigo-200');
            });
        });
    },

    moveDraggedItem(from, to) {
        if (!Number.isInteger(from) || !Number.isInteger(to) || from === to) return;

        const order = APP.State.settings.priorityOrder;
        const [moved] = order.splice(from, 1);
        order.splice(to, 0, moved);
        APP.State.save();
        this.render();
    },

    moveItem(idx, dir) {
        const order = APP.State.settings.priorityOrder;
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= order.length) return;

        const tmp = order[idx];
        order[idx] = order[newIdx];
        order[newIdx] = tmp;
        APP.State.save();
        this.render();
    },

    getHolidaySnapshot() {
        const currentHolidays = {};
        Object.entries(APP.State.data).forEach(([ds, day]) => {
            const holidays = APP.Utils.normalizeHolidayArray(day.holidays);
            if (holidays.length > 0) currentHolidays[ds] = holidays;
        });
        return currentHolidays;
    },

    createPlanningSeed() {
        const data = {};
        const holidaySnapshot = this.getHolidaySnapshot();

        APP.Holidays.populateBaseData(data, APP.State.birthDate);
        Object.entries(holidaySnapshot).forEach(([ds, holidays]) => {
            if (!data[ds]) data[ds] = {};

            let merged = APP.Utils.normalizeHolidayArray(data[ds].holidays);
            holidays.forEach((holiday) => {
                merged = APP.Utils.upsertHoliday(merged, holiday);
            });
            data[ds].holidays = merged;
        });

        const birth = new Date(APP.State.birthDate);
        for (let i = 0; i < 42; i++) {
            const ds = APP.Utils.formatDate(APP.Utils.addDays(birth, i));
            if (!data[ds]) data[ds] = {};
            data[ds].m = 'mandatory';
            data[ds].f = 'mandatory';
        }

        return data;
    },

    isHolidayForRole(dataSource, ds, resolvedRole, parentObj, cat) {
        const impact = APP.Logic.getHolidayImpact(ds, resolvedRole, dataSource);
        if (impact.isLegalHoliday) return true;
        
        if (parentObj.isTeacher && impact.isSchoolBreak && cat !== 'lac') return true;
        
        return false;
    },

    // Para categorias de dias laborables, el inicio tambien debe caer en un dia valido.
    alignToNextWorkingDay(pointer, resolvedRole, parentObj, dataSource, cat) {
        const current = new Date(pointer);

        while (true) {
            const ds = APP.Utils.formatDate(current);
            const isWeekend = APP.Utils.isWeekend(current);
            const isHoliday = this.isHolidayForRole(dataSource, ds, resolvedRole, parentObj, cat);

            if (!isHoliday && !(parentObj.weekendsAsHolidays && isWeekend)) {
                return current;
            }

            current.setDate(current.getDate() + 1);
        }
    },

    previewPlacement(pointer, days, skipHolidays, resolvedRole, parentObj, dataSource, cat) {
        let current = new Date(pointer);
        if (skipHolidays) {
            current = this.alignToNextWorkingDay(current, resolvedRole, parentObj, dataSource, cat);
        }

        let filled = 0;
        let startDate = null;
        let endDate = null;

        while (filled < days) {
            const ds = APP.Utils.formatDate(current);
            const isWeekend = APP.Utils.isWeekend(current);
            const isHoliday = this.isHolidayForRole(dataSource, ds, resolvedRole, parentObj, cat);

            let skip = false;
            if (skipHolidays) {
                if (isHoliday) skip = true;
                if (parentObj.weekendsAsHolidays && isWeekend) skip = true;
            }

            if (!skip) {
                if (!startDate) startDate = new Date(current);
                endDate = new Date(current);
                filled++;
            }

            current.setDate(current.getDate() + 1);
        }

        return { startDate, endDate, pointerAfter: current };
    },

    fillCategoryCascada(dataSource, itemId, pointer, selections, teacherPrompts) {
        const [role, cat] = itemId.split('_');
        const parentKey = role;
        const resolvedRole = role === 'm' ? 'mom' : 'dad';
        const parentObj = role === 'm' ? APP.State.parents.mom : APP.State.parents.dad;
        const baseLimits = APP.Logic.getPlanLimits();

        let daysToFill = 0;
        let skipHolidays = false;

        if (cat === 'vol') {
            daysToFill = baseLimits.voluntaryWeeks * 7;
        } else if (cat === 'flex') {
            // Las flexibles = base config + extra (parto múltiple, etc.)
            daysToFill = (baseLimits.flexibleWeeks + parentObj.extraWeeks) * 7;
        } else if (cat === 'ex') {
            // Legacy: si alguien tiene ex en la cascada, se trata como flex extra
            daysToFill = 0;
        } else if (cat === 'vac') {
            daysToFill = parentObj.vacations;
            skipHolidays = parentObj.vacationMode !== 'natural';
        } else if (cat === 'lac') {
            const lastVoluntaryDay = APP.Logic.getLastVoluntaryDay(dataSource, resolvedRole);
            if (!lastVoluntaryDay) {
                return pointer;
            }

            const lactation = APP.Logic.calculateLactation(lastVoluntaryDay, parentObj.hours, resolvedRole, dataSource);
            const workingPreview = this.previewPlacement(pointer, lactation.working.days, true, resolvedRole, parentObj, dataSource, 'lac');

            if (parentObj.isTeacher) {
                const naturalPreview = this.previewPlacement(pointer, lactation.natural.days, false, resolvedRole, parentObj, dataSource, 'lac');
                const selectedMode = selections[role] || lactation.recommendedMode;

                teacherPrompts.push({
                    itemId,
                    role,
                    name: parentObj.name,
                    recommendedMode: lactation.recommendedMode,
                    selectedMode,
                    working: {
                        days: lactation.working.days,
                        startDate: workingPreview.startDate,
                        endDate: workingPreview.endDate
                    },
                    natural: {
                        days: lactation.natural.days,
                        startDate: naturalPreview.startDate,
                        endDate: naturalPreview.endDate
                    }
                });

                daysToFill = selectedMode === 'natural' ? lactation.natural.days : lactation.working.days;
                skipHolidays = selectedMode !== 'natural';
            } else {
                daysToFill = lactation.working.days;
                skipHolidays = true;
            }
        }

        let current = new Date(pointer);
        if (skipHolidays) {
            current = this.alignToNextWorkingDay(current, resolvedRole, parentObj, dataSource, cat);
        }

        let filled = 0;
        while (filled < daysToFill) {
            const ds = APP.Utils.formatDate(current);
            const isWeekend = APP.Utils.isWeekend(current);
            const isHoliday = this.isHolidayForRole(dataSource, ds, resolvedRole, parentObj, cat);

            let skip = false;
            if (skipHolidays) {
                if (isHoliday) skip = true;
                if (parentObj.weekendsAsHolidays && isWeekend) skip = true;
            }

            if (!skip) {
                if (!dataSource[ds]) dataSource[ds] = {};
                dataSource[ds][parentKey] = cat;
                filled++;
            }

            current.setDate(current.getDate() + 1);
        }

        return current;
    },

    // Simula toda la cadena sin tocar APP.State para calcular fechas reales antes de generar.
    simulatePriorityRun(selections = this.teacherSelections) {
        const data = this.createPlanningSeed();
        const teacherPrompts = [];
        const birth = new Date(APP.State.birthDate);
        const mandatoryEnd = APP.Utils.addDays(birth, 42);
        let chainPointer = new Date(mandatoryEnd);
        const isMono = APP.State.familyType === 'monoparental';

        APP.State.settings.priorityOrder.forEach((item) => {
            // En modo monoparental, saltar items del segundo progenitor
            if (isMono && item.id.startsWith('f_')) return;
            chainPointer = this.fillCategoryCascada(data, item.id, chainPointer, selections, teacherPrompts);
        });

        return { data, teacherPrompts, pointerAfter: chainPointer };
    },

    applySimulation(simulation) {
        APP.State.data = simulation.data;

        if (simulation.teacherPrompts.some((prompt) => prompt.role === 'm')) {
            APP.State.parents.mom.lactationType = this.teacherSelections.m === 'natural' ? 'natural' : 'working';
        }
        if (simulation.teacherPrompts.some((prompt) => prompt.role === 'f')) {
            APP.State.parents.dad.lactationType = this.teacherSelections.f === 'natural' ? 'natural' : 'working';
        }

        APP.State.save();
        APP.UI.renderCalendar();
        APP.UI.updateDashboard();
        this.close();
    },

    setTeacherMode(role, mode) {
        this.teacherSelections[role] = mode === 'natural' ? 'natural' : 'working';
        this.pendingSummary = this.simulatePriorityRun(this.teacherSelections);
        this.step = 3;
        this.render();
    },

    confirmTeacherSummary() {
        const simulation = this.simulatePriorityRun(this.teacherSelections);
        this.applySimulation(simulation);
    },

    run() {
        if (!APP.State.birthDate) {
            alert('Configura la fecha de nacimiento primero.');
            this.close();
            return;
        }

        const simulation = this.simulatePriorityRun(this.teacherSelections);
        if (simulation.teacherPrompts.length > 0) {
            simulation.teacherPrompts.forEach((prompt) => {
                if (!this.teacherSelections[prompt.role]) {
                    this.teacherSelections[prompt.role] = prompt.recommendedMode;
                }
            });
            this.pendingSummary = this.simulatePriorityRun(this.teacherSelections);
            this.step = 3;
            this.render();
            return;
        }

        this.applySimulation(simulation);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnWizard').onclick = () => APP.Wizard.open();
});
