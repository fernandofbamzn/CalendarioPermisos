/**
 * GESTION DEL ESTADO
 */
window.APP = window.APP || {};

const APP_PRIORITY_ORDER = [
    { id: 'm_vol', label: 'Permiso Madre (Base)' },
    { id: 'm_flex', label: 'Semanas Flexibles Madre' },
    { id: 'm_lac', label: 'Lactancia Madre' },
    { id: 'm_vac', label: 'Vacaciones Madre' },
    { id: 'f_vol', label: 'Permiso Padre (Base)' },
    { id: 'f_flex', label: 'Semanas Flexibles Padre' },
    { id: 'f_lac', label: 'Lactancia Padre' },
    { id: 'f_vac', label: 'Vacaciones Padre' }
];

const APP_ALLOWED_TOOLS = [
    'mom_vol',
    'mom_flex',
    'mom_lac',
    'mom_vac',
    'mom_other',
    'dad_vol',
    'dad_flex',
    'dad_lac',
    'dad_vac',
    'dad_other',
    'mom_hol',
    'dad_hol',
    'common_hol',
    'eraser'
];

function createDefaultSettings() {
    return {
        holidayEditMode: false,
        priorityOrder: APP_PRIORITY_ORDER.map((item) => ({ ...item }))
    };
}

function createDefaultParents() {
    return {
        mom: {
            name: 'Madre',
            role: 'm',
            vacations: 0,
            vacationMode: 'working',
            hours: APP.CONFIG.defaultWorkingHours,
            isTeacher: false,
            weekendsAsHolidays: true,
            extraWeeks: 0,
            lactationType: 'working'
        },
        dad: {
            name: 'Padre',
            role: 'f',
            vacations: 0,
            vacationMode: 'working',
            hours: APP.CONFIG.defaultWorkingHours,
            isTeacher: false,
            weekendsAsHolidays: true,
            extraWeeks: 0,
            lactationType: 'working'
        }
    };
}

APP.State = {
    storageKey: 'planner_v9_state',
    birthDate: null,
    familyType: 'biparental',
    currentTool: 'mom_vol',
    settings: createDefaultSettings(),
    parents: createDefaultParents(),
    data: {},
    isDragging: false,
    dragTargetState: null,

    normalizeCurrentTool(tool) {
        return APP_ALLOWED_TOOLS.includes(tool) ? tool : 'mom_vol';
    },

    normalizeSettings(settings) {
        const defaults = createDefaultSettings();
        if (!settings || typeof settings !== 'object') return defaults;

        defaults.holidayEditMode = Boolean(settings.holidayEditMode);

        const validIds = APP_PRIORITY_ORDER.map((item) => item.id);
        const receivedIds = Array.isArray(settings.priorityOrder)
            ? settings.priorityOrder
                .map((item) => typeof item === 'string' ? item : item?.id)
                .filter((id) => validIds.includes(id))
            : [];

        const orderedIds = [...new Set(receivedIds)];
        validIds.forEach((id) => {
            if (!orderedIds.includes(id)) orderedIds.push(id);
        });

        defaults.priorityOrder = orderedIds.map((id) => {
            const base = APP_PRIORITY_ORDER.find((item) => item.id === id);
            return { ...base };
        });

        return defaults;
    },

    normalizeParents(parents) {
        const defaults = createDefaultParents();
        if (!parents || typeof parents !== 'object') return defaults;

        ['mom', 'dad'].forEach((key) => {
            const source = parents[key] || {};
            const target = defaults[key];

            if (typeof source.name === 'string' && source.name.trim()) target.name = source.name.trim();
            if (typeof source.role === 'string' && source.role.trim()) target.role = source.role.trim();

            const vacations = Number(source.vacations);
            if (Number.isFinite(vacations) && vacations >= 0) target.vacations = vacations;
            if (source.vacationMode === 'working' || source.vacationMode === 'natural') {
                target.vacationMode = source.vacationMode;
            }

            const hours = Number(source.hours);
            if (Number.isFinite(hours) && hours > 0) target.hours = hours;

            const extraWeeks = Number(source.extraWeeks);
            if (Number.isFinite(extraWeeks) && extraWeeks >= 0) target.extraWeeks = extraWeeks;

            if (typeof source.isTeacher === 'boolean') target.isTeacher = source.isTeacher;
            if (typeof source.weekendsAsHolidays === 'boolean') target.weekendsAsHolidays = source.weekendsAsHolidays;
            if (source.lactationType === 'working' || source.lactationType === 'natural') {
                target.lactationType = source.lactationType;
            }
        });

        return defaults;
    },

    normalizeData(data) {
        const normalized = {};
        if (!data || typeof data !== 'object') return normalized;

        Object.entries(data).forEach(([dateStr, entry]) => {
            if (!entry || typeof entry !== 'object') return;

            const day = { ...entry };
            const holidays = APP.Utils.normalizeHolidayArray(entry.holidays);

            if (holidays.length > 0) day.holidays = holidays;
            else delete day.holidays;

            if (Object.keys(day).length > 0) normalized[dateStr] = day;
        });

        return normalized;
    },

    // Normaliza el payload persistido para mantener compatibilidad hacia atras.
    hydrate(parsed = {}) {
        const birthDate = parsed.birthDate ? new Date(parsed.birthDate) : null;
        this.birthDate = birthDate && !isNaN(birthDate.getTime()) ? birthDate : null;
        this.familyType = (parsed.familyType === 'monoparental') ? 'monoparental' : 'biparental';
        this.currentTool = this.normalizeCurrentTool(parsed.currentTool);
        this.settings = this.normalizeSettings(parsed.settings);
        this.parents = this.normalizeParents(parsed.parents);
        this.data = this.normalizeData(parsed.data);
        this.isDragging = false;
        this.dragTargetState = null;

        if (this.birthDate) {
            APP.Holidays.populateBaseData(this.data, this.birthDate);
            for (let i = 0; i < 42; i++) {
                const ds = APP.Utils.formatDate(APP.Utils.addDays(this.birthDate, i));
                if (!this.data[ds]) this.data[ds] = {};
                this.data[ds].m = 'mandatory';
                this.data[ds].f = 'mandatory';
            }
        }
    },

    // Serializa solo el estado funcional de la app, excluyendo flags temporales de drag.
    serialize() {
        return {
            birthDate: this.birthDate,
            familyType: this.familyType,
            currentTool: this.currentTool,
            settings: this.normalizeSettings(this.settings),
            parents: this.normalizeParents(this.parents),
            data: this.normalizeData(this.data)
        };
    },

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.serialize()));
    },

    load() {
        let saved = localStorage.getItem(this.storageKey);

        // Migracion automatica desde v8
        if (!saved) {
            saved = localStorage.getItem('planner_v8_state');
            if (saved) localStorage.removeItem('planner_v8_state');
        }

        if (!saved) return false;

        try {
            this.hydrate(JSON.parse(saved));
            return true;
        } catch (error) {
            localStorage.removeItem(this.storageKey);
            return false;
        }
    },

    exportJSON() {
        const dataStr = JSON.stringify(this.serialize(), null, 2);
        const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
        const exportFileDefaultName = `plan-familiar-${APP.Utils.formatDate(new Date())}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    },

    importJSON(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                this.hydrate(parsed);
                this.save();

                if (APP.UI?.elements?.input) {
                    APP.UI.elements.input.value = this.birthDate ? APP.Utils.formatDate(this.birthDate) : '';
                }

                APP.UI?.syncParentLabels?.();

                if (this.birthDate) {
                    APP.Events.launchApp();
                }
            } catch (error) {
                alert('No se pudo importar el archivo JSON.');
            }
        };
        reader.readAsText(file);
    },

    reset() {
        localStorage.removeItem(this.storageKey);
        location.reload();
    }
};
