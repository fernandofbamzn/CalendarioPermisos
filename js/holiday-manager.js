/**
 * ASISTENTE DE CONFIGURACION DE FESTIVOS
 */
window.APP = window.APP || {};

APP.HolidayManager = {
    // Abre el editor de festivos reutilizando el modal principal.
    open(ds, selectedType = null) {
        const dateStr = APP.Utils.formatDisplay(ds);
        const modal = document.getElementById('wizardModal');
        const container = modal.querySelector('div');
        const holidays = APP.Utils.normalizeHolidayArray(APP.State.data[ds]?.holidays);
        const currentHoliday = holidays.find((holiday) => holiday.type === selectedType) || holidays[0] || null;

        modal.classList.remove('hidden');

        container.innerHTML = `
            <div class="p-8">
                <h3 class="text-2xl font-bold text-slate-900 mb-2">Configurar festivo</h3>
                <p class="text-slate-500 mb-6 font-medium">Dia: <span class="text-indigo-600 font-bold">${dateStr}</span></p>

                <div class="space-y-4">
                    <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Descripcion del festivo</label>
                        <input type="text" id="holName" placeholder="Ej: Ano Nuevo" value="${currentHoliday?.name || ''}" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all">
                    </div>

                    <div class="grid grid-cols-1 gap-3">
                        <button onclick="APP.HolidayManager.set('${ds}', 'nat')" class="p-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-2xl flex items-center gap-3 transition-all">
                            <div class="text-left"><p class="text-sm font-bold text-red-900">Nacional / autonomico</p></div>
                        </button>

                        <button onclick="APP.HolidayManager.set('${ds}', 'm_loc')" class="p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-2xl flex items-center gap-3 transition-all">
                            <div class="text-left"><p class="text-sm font-bold text-purple-900">Local madre</p></div>
                        </button>

                        <button onclick="APP.HolidayManager.set('${ds}', 'f_loc')" class="p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl flex items-center gap-3 transition-all">
                            <div class="text-left"><p class="text-sm font-bold text-blue-900">Local padre</p></div>
                        </button>
                    </div>

                    <button onclick="APP.HolidayManager.clear('${ds}')" class="w-full p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between transition-all group mt-4">
                        <div class="flex items-center gap-3">
                            <p class="text-sm font-bold text-slate-900 text-left">Limpiar festivos del dia</p>
                        </div>
                    </button>
                </div>

                <div class="mt-8 flex justify-end gap-3">
                    <button onclick="APP.Wizard.close()" class="px-6 py-2 text-xs font-bold text-slate-400 uppercase">Cerrar</button>
                </div>
            </div>
        `;
    },

    // Guarda o actualiza un tipo de festivo concreto dentro del dia.
    set(ds, type) {
        const name = document.getElementById('holName').value || APP.Utils.defaultHolidayName(type);
        if (!APP.State.data[ds]) APP.State.data[ds] = {};

        APP.State.data[ds].holidays = APP.Utils.upsertHoliday(APP.State.data[ds].holidays, { type, name });

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
