/**
 * CONTROLADOR DE EVENTOS
 */
window.APP = window.APP || {};

APP.Events = {
    init() {
        APP.UI.elements.input.addEventListener('change', (e) => this.handleDateChange(e.target.value));

        document.querySelectorAll('.tool-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tool = btn.dataset.tool || btn.id.replace('btn_', '');
                this.setTool(tool);
            });
        });

        document.addEventListener('mouseup', () => this.stopDrag());

        document.getElementById('btnReset').addEventListener('click', () => {
            if (confirm('Borrar todo?')) APP.State.reset();
        });
    },

    handleDateChange(value) {
        if (!value) return;
        const date = new Date(value);
        if (isNaN(date.getTime())) return;

        APP.State.birthDate = date;
        APP.State.data = {};
        this.generateInitialData();
        APP.State.save();
        this.launchApp();
    },

    // Regenera el calendario base: festivos sugeridos + 42 dias obligatorios bloqueados.
    generateInitialData() {
        if (!APP.State.birthDate) return;

        APP.State.data = {};
        APP.Holidays.populateBaseData(APP.State.data, APP.State.birthDate);

        const birth = new Date(APP.State.birthDate);
        for (let i = 0; i < 42; i++) {
            const ds = APP.Utils.formatDate(APP.Utils.addDays(birth, i));
            if (!APP.State.data[ds]) APP.State.data[ds] = {};
            APP.State.data[ds].m = 'mandatory';
            APP.State.data[ds].f = 'mandatory';
        }
    },

    setTool(tool) {
        // Si es herramienta 'other', abrir mini-modal para nombre + color
        if (tool === 'mom_other' || tool === 'dad_other') {
            this._openOtherModal(tool);
            return;
        }

        this._activateTool(tool);
    },

    // Mini-modal para elegir nombre y color del permiso "Otros"
    _openOtherModal(tool) {
        const modal = document.getElementById('wizardModal');
        const container = modal.querySelector('div');
        container.className = 'bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade';

        container.innerHTML = `
            <div class="p-8">
                <h3 class="text-xl font-bold text-slate-900 mb-2">Nuevo permiso</h3>
                <p class="text-slate-500 text-sm mb-6">Indica el tipo de permiso y elige un color para identificarlo.</p>

                <div class="space-y-4">
                    <div>
                        <label for="otherPermitName" class="block text-[10px] font-bold text-slate-500 uppercase mb-2">Nombre del permiso</label>
                        <input type="text" id="otherPermitName" placeholder="Ej: Matrimonio, Mudanza, Excedencia..."
                            class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-300 transition-all">
                    </div>
                    <div>
                        <label for="otherPermitColor" class="block text-[10px] font-bold text-slate-500 uppercase mb-2">Color</label>
                        <div class="flex items-center gap-3">
                            <input type="color" id="otherPermitColor" value="#f43f5e"
                                class="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5">
                            <span id="otherPermitColorHex" class="text-xs font-mono text-slate-400">#f43f5e</span>
                        </div>
                    </div>
                </div>

                <div class="mt-8 flex justify-end gap-3">
                    <button id="otherPermitCancel" class="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-2xl text-sm font-bold transition-all hover:bg-slate-200">Cancelar</button>
                    <button id="otherPermitAccept" class="px-6 py-2.5 bg-rose-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-rose-100 transition-all hover:bg-rose-600">Aceptar</button>
                </div>
            </div>
        `;

        // Actualizar hex al cambiar color
        const colorInput = document.getElementById('otherPermitColor');
        const hexLabel = document.getElementById('otherPermitColorHex');
        colorInput.addEventListener('input', () => {
            hexLabel.textContent = colorInput.value;
        });

        // Cancelar
        document.getElementById('otherPermitCancel').addEventListener('click', () => {
            modal.classList.add('hidden');
        });

        // Aceptar
        document.getElementById('otherPermitAccept').addEventListener('click', () => {
            const name = document.getElementById('otherPermitName').value.trim();
            if (!name) {
                document.getElementById('otherPermitName').focus();
                return;
            }
            APP.State.currentOtherLabel = name;
            APP.State.currentOtherColor = colorInput.value;
            modal.classList.add('hidden');
            this._activateTool(tool);
        });

        // Focus en el input de nombre y Enter para aceptar
        modal.classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('otherPermitName').focus();
            document.getElementById('otherPermitName').addEventListener('keydown', (e) => {
                if (e.key === 'Enter') document.getElementById('otherPermitAccept').click();
            });
        }, 50);
    },

    _activateTool(tool) {
        APP.State.currentTool = APP.State.normalizeCurrentTool(tool);

        document.querySelectorAll('.tool-btn').forEach((button) => {
            button.classList.remove('active', 'ring-2', 'ring-offset-2', 'shadow-lg', 'ring-purple-600', 'ring-blue-600', 'ring-rose-500', 'ring-slate-300');
            button.classList.add('shadow-sm');
        });

        const btn = document.getElementById(`btn_${APP.State.currentTool}`);
        if (btn) {
            btn.classList.add('active', 'ring-2', 'ring-offset-2', 'shadow-lg');
            if (APP.State.currentTool.startsWith('mom')) btn.classList.add('ring-purple-600');
            else if (APP.State.currentTool.startsWith('dad')) btn.classList.add('ring-blue-600');
            else btn.classList.add('ring-slate-300');
        }

        APP.State.save();
    },


    handleDateClick(ds) {
        const tool = APP.State.currentTool;
        if (!tool || tool === 'eraser') {
            this.applyTool(ds, false);
        } else {
            const isActive = this.checkToolActive(ds);
            this.applyTool(ds, !isActive);
        }
        APP.State.save();
        APP.UI.updateDashboard();
    },

    launchApp() {
        APP.UI.elements.empty.classList.add('hidden');
        APP.UI.elements.tools.classList.remove('hidden');
        APP.UI.elements.toolbar.classList.remove('hidden');
        APP.UI.elements.stats.classList.remove('hidden');
        APP.UI.elements.grid.classList.remove('hidden');

        this._activateTool(APP.State.currentTool);
        APP.UI.syncParentLabels();
        APP.UI.renderCalendar();
        APP.UI.updateDashboard();
    },

    // El drag replica la herramienta activa desde la primera celda y mantiene el mismo estado al arrastrar.
    startDrag(ds) {
        if (!APP.State.currentTool) return;
        APP.State.isDragging = true;
        APP.State.dragTargetState = !this.checkToolActive(ds);
        this.applyTool(ds, APP.State.dragTargetState);
    },

    onMouseEnterDate(ds) {
        if (APP.State.isDragging) this.applyTool(ds, APP.State.dragTargetState);
    },

    stopDrag() {
        if (APP.State.isDragging) {
            APP.State.isDragging = false;
            APP.State.save();
            APP.UI.updateDashboard();
        }
    },

    onDoubleClickDate(ds) {
        if (APP.State.settings.holidayEditMode || APP.State.currentTool?.includes('hol')) return;

        const d = new Date(ds);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d);
        monday.setDate(diff);

        const target = !this.checkToolActive(ds);

        for (let i = 0; i < 7; i++) {
            const iter = APP.Utils.addDays(monday, i);
            this.applyTool(APP.Utils.formatDate(iter), target);
        }

        APP.State.save();
        APP.UI.updateDashboard();
    },

    checkToolActive(ds) {
        const d = APP.State.data[ds] || {};
        const t = APP.State.currentTool;
        if (!t || t === 'eraser') return false;

        if (t === 'common_hol') return APP.Utils.hasHolidayType(d.holidays, 'nat');
        if (t.includes('hol')) {
            const type = t === 'mom_hol' ? 'm_loc' : 'f_loc';
            return APP.Utils.hasHolidayType(d.holidays, type) || APP.Utils.hasHolidayType(d.holidays, 'both_loc');
        }

        const role = t.startsWith('mom') ? 'm' : 'f';
        const type = t.split('_')[1];
        return d[role] === type;
    },

    applyTool(ds, turnOn) {
        const t = APP.State.currentTool;
        if (!t) return;

        if (!APP.State.data[ds]) APP.State.data[ds] = {};
        const d = APP.State.data[ds];

        if (d.m === 'mandatory' || d.f === 'mandatory') return;

        if (t === 'eraser') {
            delete d.m;
            delete d.f;
        } else if (t === 'common_hol') {
            d.holidays = turnOn
                ? APP.Utils.upsertHoliday(d.holidays, { type: 'nat', name: APP.Utils.defaultHolidayName('nat') })
                : APP.Utils.removeHolidayType(d.holidays, 'nat');
        } else if (t.includes('hol')) {
            const type = t === 'mom_hol' ? 'm_loc' : 'f_loc';
            if (turnOn) {
                const existingHolidays = APP.Utils.normalizeHolidayArray(d.holidays);
                const hasOtherLocalType = type === 'm_loc'
                    ? APP.Utils.hasHolidayType(existingHolidays, 'f_loc')
                    : APP.Utils.hasHolidayType(existingHolidays, 'm_loc');
                const hasBothLocalType = APP.Utils.hasHolidayType(existingHolidays, 'both_loc');

                if (hasBothLocalType || hasOtherLocalType) {
                    const baseName = existingHolidays.find((holiday) => holiday.type === 'both_loc' || holiday.type === (type === 'm_loc' ? 'f_loc' : 'm_loc'))?.name;
                    d.holidays = APP.Utils.upsertHoliday(existingHolidays, {
                        type: 'both_loc',
                        name: baseName || APP.Utils.defaultHolidayName('both_loc')
                    });
                    d.holidays = APP.Utils.removeHolidayType(d.holidays, 'm_loc');
                    d.holidays = APP.Utils.removeHolidayType(d.holidays, 'f_loc');
                } else {
                    d.holidays = APP.Utils.upsertHoliday(d.holidays, { type, name: APP.Utils.defaultHolidayName(type) });
                }
            } else {
                const existingHolidays = APP.Utils.normalizeHolidayArray(d.holidays);
                if (APP.Utils.hasHolidayType(existingHolidays, 'both_loc')) {
                    const bothName = existingHolidays.find((holiday) => holiday.type === 'both_loc')?.name || APP.Utils.defaultHolidayName('both_loc');
                    const remainingType = type === 'm_loc' ? 'f_loc' : 'm_loc';
                    d.holidays = APP.Utils.removeHolidayType(existingHolidays, 'both_loc');
                    d.holidays = APP.Utils.upsertHoliday(d.holidays, { type: remainingType, name: bothName });
                } else {
                    d.holidays = APP.Utils.removeHolidayType(existingHolidays, type);
                }
            }
        } else {
            const role = t.startsWith('mom') ? 'm' : 'f';
            const type = t.split('_')[1];
            if (turnOn) {
                d[role] = type;
                // Si es 'other', guardar la etiqueta descriptiva y el color
                if (type === 'other' && APP.State.currentOtherLabel) {
                    if (!d.otherLabels) d.otherLabels = {};
                    d.otherLabels[role] = APP.State.currentOtherLabel;
                    if (APP.State.currentOtherColor) {
                        if (!d.otherColors) d.otherColors = {};
                        d.otherColors[role] = APP.State.currentOtherColor;
                    }
                }
            } else if (d[role] === type) {
                delete d[role];
                if (d.otherLabels) {
                    delete d.otherLabels[role];
                    if (Object.keys(d.otherLabels).length === 0) delete d.otherLabels;
                }
                if (d.otherColors) {
                    delete d.otherColors[role];
                    if (Object.keys(d.otherColors).length === 0) delete d.otherColors;
                }
            }
        }

        const holidays = APP.Utils.normalizeHolidayArray(d.holidays);
        if (holidays.length > 0) d.holidays = holidays;
        else delete d.holidays;

        if (!d.m && !d.f && !d.holidays && !d.otherLabels && !d.otherColors) delete APP.State.data[ds];

        const cell = document.getElementById(`c-${ds}`);
        if (cell) APP.UI.applyCellStyles(cell, ds);
    }
};
