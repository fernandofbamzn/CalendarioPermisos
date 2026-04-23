/**
 * ASISTENTE DE CONFIGURACION DE FESTIVOS
 */
window.APP = window.APP || {};

APP.HolidayManager = {
    typeButtonConfig: {
        nat: {
            label: 'Nacional / autonomico',
            active: 'bg-red-100 border-red-300',
            inactive: 'bg-red-50 hover:bg-red-100 border-red-200'
        },
        m_loc: {
            label: 'Local madre',
            active: 'bg-purple-100 border-purple-300',
            inactive: 'bg-purple-50 hover:bg-purple-100 border-purple-200'
        },
        f_loc: {
            label: 'Local padre',
            active: 'bg-blue-100 border-blue-300',
            inactive: 'bg-blue-50 hover:bg-blue-100 border-blue-200'
        },
        both_loc: {
            label: 'Local madre/padre',
            active: 'bg-indigo-100 border-indigo-300',
            inactive: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200'
        }
    },

    getSiblingType(type) {
        if (type === 'm_loc') return 'f_loc';
        if (type === 'f_loc') return 'm_loc';
        return null;
    },

    hasSharedLocalHoliday(holidays) {
        const hasCombined = APP.Utils.hasHolidayType(holidays, 'both_loc');
        const hasPair = APP.Utils.hasHolidayType(holidays, 'm_loc') && APP.Utils.hasHolidayType(holidays, 'f_loc');
        return hasCombined || hasPair;
    },

    renderTypeButton(ds, type, activeType) {
        const config = this.typeButtonConfig[type];
        const isActive = type === activeType;
        const classes = isActive ? config.active : config.inactive;
        const marker = isActive ? '<span class="text-[9px] font-black uppercase text-slate-500">Activo</span>' : '';

        return `
            <button onclick="APP.HolidayManager.selectType('${ds}', '${type}')" class="p-4 border rounded-2xl flex items-center justify-between transition-all ${classes}">
                <div class="text-left"><p class="text-sm font-bold text-slate-900">${config.label}</p></div>
                ${marker}
            </button>
        `;
    },

    renderTypeSelector(ds, activeType) {
        return `
            <div id="holidayTypeSelector" class="grid grid-cols-1 gap-3">
                ${this.renderTypeButton(ds, 'nat', activeType)}
                ${this.renderTypeButton(ds, 'm_loc', activeType)}
                ${this.renderTypeButton(ds, 'f_loc', activeType)}
                ${this.renderTypeButton(ds, 'both_loc', activeType)}
            </div>
        `;
    },

    // Abre el editor de festivos reutilizando el modal principal.
    open(ds, selectedType = null) {
        const dateStr = APP.Utils.formatDisplay(ds);
        const modal = document.getElementById('wizardModal');
        const container = modal.querySelector('div');
        const holidays = APP.Utils.normalizeHolidayArray(APP.State.data[ds]?.holidays);
        const activeType = selectedType || holidays[0]?.type || 'nat';
        const currentHoliday = holidays.find((holiday) => holiday.type === activeType) || null;
        const isSharedLocalHoliday = this.hasSharedLocalHoliday(holidays);

        modal.classList.remove('hidden');

        container.innerHTML = `
            <div class="p-8">
                <h3 class="text-2xl font-bold text-slate-900 mb-2">Configurar festivo</h3>
                <p class="text-slate-500 mb-6 font-medium">Dia: <span class="text-indigo-600 font-bold">${dateStr}</span></p>
                <p class="text-[10px] text-slate-500 font-bold uppercase mb-4">Tipo activo: <span id="activeTypeLabel" class="text-slate-700">${APP.Utils.getHolidayLabel(activeType)}</span></p>

                <div class="space-y-4">
                    <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Descripcion del festivo</label>
                        <input type="text" id="holName" placeholder="Ej: Ano Nuevo" value="${currentHoliday?.name || APP.Utils.defaultHolidayName(activeType)}" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all">
                    </div>

                    ${this.renderTypeSelector(ds, activeType)}

                    <div id="sharedNameContainer" class="${isSharedLocalHoliday ? '' : 'hidden'} rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="applySharedName" class="w-4 h-4 accent-indigo-600">
                            <span class="text-[10px] font-bold uppercase text-slate-500">Aplicar mismo nombre a madre/padre</span>
                        </label>
                    </div>

                    <button onclick="APP.HolidayManager.clear('${ds}')" class="w-full p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between transition-all group mt-4">
                        <div class="flex items-center gap-3">
                            <p class="text-sm font-bold text-slate-900 text-left">Limpiar festivos del dia</p>
                        </div>
                    </button>
                </div>

                <div class="mt-8 flex justify-end gap-3">
                    <button onclick="APP.Wizard.close()" class="px-6 py-2 text-xs font-bold text-slate-400 uppercase">Cerrar</button>
                    <button onclick="APP.HolidayManager.saveSelection('${ds}')" class="px-6 py-2 text-xs font-bold uppercase bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">Guardar tipo activo</button>
                </div>
            </div>
        `;

        const nameInput = document.getElementById('holName');
        const selector = document.getElementById('holidayTypeSelector');
        nameInput.dataset.isDirty = 'false';
        nameInput.dataset.baseType = activeType;
        selector.dataset.activeType = activeType;

        nameInput.addEventListener('input', () => {
            nameInput.dataset.isDirty = 'true';
        });
    },

    selectType(ds, type) {
        const selector = document.getElementById('holidayTypeSelector');
        const nameInput = document.getElementById('holName');
        const activeTypeLabel = document.getElementById('activeTypeLabel');
        const sharedNameContainer = document.getElementById('sharedNameContainer');
        if (!selector || !nameInput || !activeTypeLabel) return;

        const previousType = selector.dataset.activeType || 'nat';
        const wasDirty = nameInput.dataset.isDirty === 'true';
        const holidays = APP.Utils.normalizeHolidayArray(APP.State.data[ds]?.holidays);
        const holidayForType = holidays.find((holiday) => holiday.type === type);

        selector.innerHTML = this.renderTypeButton(ds, 'nat', type)
            + this.renderTypeButton(ds, 'm_loc', type)
            + this.renderTypeButton(ds, 'f_loc', type)
            + this.renderTypeButton(ds, 'both_loc', type);
        selector.dataset.activeType = type;
        activeTypeLabel.textContent = APP.Utils.getHolidayLabel(type);

        if (!wasDirty) {
            nameInput.value = holidayForType?.name || APP.Utils.defaultHolidayName(type);
            nameInput.dataset.baseType = type;
        } else if (previousType !== type) {
            nameInput.dataset.baseType = previousType;
        }

        if (sharedNameContainer) {
            const showSharedOption = this.hasSharedLocalHoliday(holidays) && (type === 'm_loc' || type === 'f_loc');
            sharedNameContainer.classList.toggle('hidden', !showSharedOption);
        }
    },

    saveSelection(ds) {
        const selector = document.getElementById('holidayTypeSelector');
        const activeType = selector?.dataset.activeType || 'nat';
        this.set(ds, activeType);
    },

    // Guarda o actualiza un tipo de festivo concreto dentro del dia.
    set(ds, type) {
        const nameInput = document.getElementById('holName');
        const applySharedName = document.getElementById('applySharedName');
        const rawName = nameInput?.value.trim() || '';
        const wasEditedManually = nameInput?.dataset.isDirty === 'true';
        const baseType = nameInput?.dataset.baseType || type;
        const changedTypeWithoutManualEdit = !wasEditedManually && baseType !== type;
        const name = changedTypeWithoutManualEdit
            ? APP.Utils.defaultHolidayName(type)
            : (rawName || APP.Utils.defaultHolidayName(type));

        if (!APP.State.data[ds]) APP.State.data[ds] = {};

        APP.State.data[ds].holidays = APP.Utils.upsertHoliday(APP.State.data[ds].holidays, { type, name });
        if (type === 'both_loc') {
            APP.State.data[ds].holidays = APP.Utils.removeHolidayType(APP.State.data[ds].holidays, 'm_loc');
            APP.State.data[ds].holidays = APP.Utils.removeHolidayType(APP.State.data[ds].holidays, 'f_loc');
        } else if (type === 'm_loc' || type === 'f_loc') {
            APP.State.data[ds].holidays = APP.Utils.removeHolidayType(APP.State.data[ds].holidays, 'both_loc');
        }

        const siblingType = this.getSiblingType(type);
        if (applySharedName?.checked && siblingType) {
            APP.State.data[ds].holidays = APP.Utils.upsertHoliday(APP.State.data[ds].holidays, { type: siblingType, name });
        }

        APP.State.save();
        APP.UI.renderCalendar();
        APP.UI.updateDashboard();
        if (APP.Settings && typeof APP.Settings.renderHolidayTable === 'function') {
            APP.Settings.renderHolidayTable();
        }
        APP.Wizard.close();
    },

    // Limpia las ediciones manuales y repone los festivos base si existian.
    clear(ds) {
        if (APP.State.data[ds]) {
            delete APP.State.data[ds].holidays;
        }

        APP.Holidays.restoreBaseHolidays(APP.State.data, ds);
        if (APP.State.data[ds] && Object.keys(APP.State.data[ds]).length === 0) delete APP.State.data[ds];

        APP.State.save();
        APP.UI.renderCalendar();
        APP.UI.updateDashboard();
        if (APP.Settings && typeof APP.Settings.renderHolidayTable === 'function') {
            APP.Settings.renderHolidayTable();
        }
        APP.Wizard.close();
    }
};
