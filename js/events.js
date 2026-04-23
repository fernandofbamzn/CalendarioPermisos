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
        APP.State.currentTool = APP.State.normalizeCurrentTool(tool);

        document.querySelectorAll('.tool-btn').forEach((button) => {
            button.classList.remove('active', 'ring-2', 'ring-offset-2', 'shadow-lg', 'ring-purple-600', 'ring-blue-600', 'ring-slate-300');
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

        this.setTool(APP.State.currentTool);
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
            return APP.Utils.hasHolidayType(d.holidays, type);
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
            d.holidays = turnOn
                ? APP.Utils.upsertHoliday(d.holidays, { type, name: APP.Utils.defaultHolidayName(type) })
                : APP.Utils.removeHolidayType(d.holidays, type);
        } else {
            const role = t.startsWith('mom') ? 'm' : 'f';
            const type = t.split('_')[1];
            if (turnOn) d[role] = type;
            else if (d[role] === type) delete d[role];
        }

        const holidays = APP.Utils.normalizeHolidayArray(d.holidays);
        if (holidays.length > 0) d.holidays = holidays;
        else delete d.holidays;

        if (!d.m && !d.f && !d.holidays) delete APP.State.data[ds];

        const cell = document.getElementById(`c-${ds}`);
        if (cell) APP.UI.applyCellStyles(cell, ds);
    }
};
