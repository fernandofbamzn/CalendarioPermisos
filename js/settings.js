/**
 * PANEL DE CONFIGURACION UNIFICADO
 */
window.APP = window.APP || {};

APP.Settings = {
    holidaySort: {
        key: 'ds',
        direction: 'asc'
    },

    open(initialTab = 'general') {
        const modal = document.getElementById('wizardModal');
        const container = modal.querySelector('div');

        container.innerHTML = `
            <div class="p-8 max-h-[90vh] overflow-y-auto no-scrollbar">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-2xl font-bold text-slate-900">Configuracion del sistema</h3>
                    <button onclick="APP.Wizard.close()" class="text-slate-400 hover:text-slate-600">x</button>
                </div>

                <div class="flex gap-4 mb-8 border-b border-slate-100 pb-2">
                    <button id="tabGeneral" onclick="APP.Settings.showTab('general')" class="text-xs font-bold uppercase tracking-widest text-indigo-600 border-b-2 border-indigo-600 pb-2">General</button>
                    <button id="tabHolidays" onclick="APP.Settings.showTab('holidays')" class="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 pb-2">Festivos</button>
                    <button id="tabParents" onclick="APP.Settings.showTab('parents')" class="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 pb-2">Padres</button>
                </div>

                <div id="sectionGeneral" class="space-y-6 animate-fade">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-between">
                            <div>
                                <p class="text-[10px] font-bold text-purple-900 uppercase">Fines de semana madre</p>
                                <p class="text-[9px] text-purple-600">Tratarlos como festivos</p>
                            </div>
                            <input type="checkbox" id="momWeekends" ${APP.State.parents.mom.weekendsAsHolidays ? 'checked' : ''} class="w-5 h-5 accent-purple-600">
                        </div>
                        <div class="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                            <div>
                                <p class="text-[10px] font-bold text-blue-900 uppercase">Fines de semana padre</p>
                                <p class="text-[9px] text-blue-600">Tratarlos como festivos</p>
                            </div>
                            <input type="checkbox" id="dadWeekends" ${APP.State.parents.dad.weekendsAsHolidays ? 'checked' : ''} class="w-5 h-5 accent-blue-600">
                        </div>
                    </div>

                    <div class="p-6 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                        <div>
                            <p class="text-sm font-bold">Modo de edicion visual de festivos</p>
                            <p class="text-[10px] text-slate-400">Activa para marcar festivos haciendo clic en el calendario.</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="setEditMode" onchange="APP.Settings.toggleEditMode(this.checked)" class="sr-only peer" ${APP.State.settings.holidayEditMode ? 'checked' : ''}>
                            <div class="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>
                </div>

                <div id="sectionHolidays" class="hidden space-y-4 animate-fade">
                    <div class="flex justify-between items-center bg-indigo-50 p-4 rounded-2xl">
                        <p class="text-[10px] font-bold text-indigo-400 uppercase">Tabla de festivos configurados</p>
                        <button onclick="APP.Settings.addHolidayRow()" class="text-[10px] bg-white px-3 py-1 rounded-lg border border-indigo-100 font-bold text-indigo-600 hover:bg-indigo-100 transition-colors">+ Anadir fila</button>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs">
                            <thead>
                                <tr class="text-slate-400 uppercase tracking-tighter">
                                    <th class="py-2"><button onclick="APP.Settings.toggleHolidaySort('ds')" class="font-bold hover:text-indigo-600 transition-colors">Dia ${this.getSortIndicator('ds')}</button></th>
                                    <th class="py-2"><button onclick="APP.Settings.toggleHolidaySort('name')" class="font-bold hover:text-indigo-600 transition-colors">Nombre ${this.getSortIndicator('name')}</button></th>
                                    <th class="py-2"><button onclick="APP.Settings.toggleHolidaySort('type')" class="font-bold hover:text-indigo-600 transition-colors">Tipo ${this.getSortIndicator('type')}</button></th>
                                    <th class="py-2">Accion</th>
                                </tr>
                            </thead>
                            <tbody id="holidayList"></tbody>
                        </table>
                    </div>
                </div>

                <div id="sectionParents" class="hidden grid grid-cols-2 gap-6 animate-fade">
                    <div class="space-y-4 p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                        <p class="text-[10px] font-black text-purple-400 uppercase">Progenitor 1</p>
                        <div>
                            <label class="block text-[8px] font-bold text-slate-400 uppercase mb-1">Nombre</label>
                            <input type="text" id="momName" value="${APP.State.parents.mom.name}" class="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-sm">
                        </div>
                        <div class="flex gap-4">
                            <div>
                                <label class="block text-[8px] font-bold text-slate-400 uppercase mb-1">Jornada (h)</label>
                                <input type="number" id="momHours" value="${APP.State.parents.mom.hours}" class="w-16 bg-white border border-purple-200 rounded-xl px-3 py-2 text-sm text-center">
                            </div>
                            <div class="flex items-center gap-2 pt-4">
                                <input type="checkbox" id="momIsTeacher" ${APP.State.parents.mom.isTeacher ? 'checked' : ''} class="w-4 h-4 accent-purple-600">
                                <label class="text-[10px] font-bold text-slate-600 uppercase">Docente</label>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                        <p class="text-[10px] font-black text-blue-400 uppercase">Progenitor 2</p>
                        <div>
                            <label class="block text-[8px] font-bold text-slate-400 uppercase mb-1">Nombre</label>
                            <input type="text" id="dadName" value="${APP.State.parents.dad.name}" class="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-sm">
                        </div>
                        <div class="flex gap-4">
                            <div>
                                <label class="block text-[8px] font-bold text-slate-400 uppercase mb-1">Jornada (h)</label>
                                <input type="number" id="dadHours" value="${APP.State.parents.dad.hours}" class="w-16 bg-white border border-blue-200 rounded-xl px-3 py-2 text-sm text-center">
                            </div>
                            <div class="flex items-center gap-2 pt-4">
                                <input type="checkbox" id="dadIsTeacher" ${APP.State.parents.dad.isTeacher ? 'checked' : ''} class="w-4 h-4 accent-blue-600">
                                <label class="text-[10px] font-bold text-slate-600 uppercase">Docente</label>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mt-10 pt-6 border-t border-slate-100 flex justify-end gap-3">
                    <button onclick="APP.Wizard.close()" class="px-6 py-3 text-xs font-bold text-slate-400 uppercase">Cerrar</button>
                    <button onclick="APP.Settings.save()" class="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase">Guardar cambios</button>
                </div>
            </div>
        `;

        this.renderHolidayTable();
        this.showTab(initialTab);
        modal.classList.remove('hidden');
    },

    getSortIndicator(key) {
        if (this.holidaySort.key !== key) return '&#8597;';
        return this.holidaySort.direction === 'asc' ? '&#8593;' : '&#8595;';
    },

    toggleHolidaySort(key) {
        if (this.holidaySort.key === key) {
            this.holidaySort.direction = this.holidaySort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.holidaySort.key = key;
            this.holidaySort.direction = 'asc';
        }

        this.open('holidays');
    },

    showTab(tab) {
        ['general', 'holidays', 'parents'].forEach((sectionName) => {
            const section = document.getElementById(`section${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}`);
            const btn = document.getElementById(`tab${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}`);

            if (sectionName === tab) {
                section.classList.remove('hidden');
                btn.className = 'text-xs font-bold uppercase tracking-widest text-indigo-600 border-b-2 border-indigo-600 pb-2';
            } else {
                section.classList.add('hidden');
                btn.className = 'text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 pb-2';
            }
        });
    },

    // Aplana los festivos por fila y los ordena segun la cabecera elegida.
    renderHolidayTable() {
        const table = document.getElementById('holidayList');
        if (!table) return;

        const rows = [];
        Object.entries(APP.State.data)
            .filter(([_, d]) => APP.Utils.normalizeHolidayArray(d.holidays).length > 0)
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([ds, d]) => {
                APP.Utils.normalizeHolidayArray(d.holidays).forEach((holiday) => {
                    rows.push({ ds, holiday });
                });
            });

        rows.sort((a, b) => {
            const factor = this.holidaySort.direction === 'asc' ? 1 : -1;

            if (this.holidaySort.key === 'name') {
                return factor * (a.holiday.name || '').localeCompare(b.holiday.name || '', 'es');
            }

            if (this.holidaySort.key === 'type') {
                return factor * APP.Utils.getHolidayLabel(a.holiday.type).localeCompare(APP.Utils.getHolidayLabel(b.holiday.type), 'es');
            }

            return factor * a.ds.localeCompare(b.ds);
        });

        if (rows.length === 0) {
            table.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-slate-400 text-xs italic">No hay festivos configurados</td></tr>`;
            return;
        }

        const typeClass = {
            nat: 'text-red-500',
            m_loc: 'text-purple-500',
            both_loc: 'text-indigo-500',
            f_loc: 'text-blue-500',
            school: 'text-amber-500'
        };

        table.innerHTML = rows.map(({ ds, holiday }) => `
            <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td class="py-3 text-[10px] font-bold text-indigo-600">${ds}</td>
                <td class="py-3 text-[10px] text-slate-700">${holiday.name || 'Festivo'}</td>
                <td class="py-3 text-[10px] ${typeClass[holiday.type] || 'text-slate-500'}">${APP.Utils.getHolidayLabel(holiday.type)}</td>
                <td class="py-3 text-right">
                    <button onclick="APP.HolidayManager.open('${ds}', '${holiday.type}')" class="p-1.5 text-slate-400 hover:text-indigo-600">Editar</button>
                    <button onclick="APP.Settings.removeHoliday('${ds}', '${holiday.type}')" class="p-1.5 text-slate-400 hover:text-red-600">Borrar</button>
                </td>
            </tr>
        `).join('');
    },

    removeHoliday(ds, type) {
        if (!APP.State.data[ds]) return;

        let holidays = APP.Utils.removeHolidayType(APP.State.data[ds].holidays, type);
        if ((type === 'm_loc' || type === 'f_loc') && APP.Utils.hasHolidayType(holidays, 'both_loc')) {
            holidays = APP.Utils.removeHolidayType(holidays, 'both_loc');
        }
        if (holidays.length > 0) APP.State.data[ds].holidays = holidays;
        else delete APP.State.data[ds].holidays;

        if (Object.keys(APP.State.data[ds]).length === 0) delete APP.State.data[ds];

        APP.State.save();
        this.renderHolidayTable();
        APP.UI.renderCalendar();
        APP.UI.updateDashboard();
    },

    addHolidayRow() {
        const ds = prompt('Introduce fecha (YYYY-MM-DD):', APP.Utils.formatDate(new Date()));
        if (ds && !isNaN(new Date(ds).getTime())) {
            APP.HolidayManager.open(ds);
        }
    },

    toggleEditMode(val) {
        APP.State.settings.holidayEditMode = val;
        APP.State.save();
        APP.UI.renderCalendar();
    },

    save() {
        APP.State.parents.mom.weekendsAsHolidays = document.getElementById('momWeekends').checked;
        APP.State.parents.dad.weekendsAsHolidays = document.getElementById('dadWeekends').checked;

        APP.State.parents.mom.name = document.getElementById('momName').value.trim() || 'Madre';
        APP.State.parents.mom.hours = parseFloat(document.getElementById('momHours').value) || APP.CONFIG.defaultWorkingHours;
        APP.State.parents.mom.isTeacher = document.getElementById('momIsTeacher').checked;

        APP.State.parents.dad.name = document.getElementById('dadName').value.trim() || 'Padre';
        APP.State.parents.dad.hours = parseFloat(document.getElementById('dadHours').value) || APP.CONFIG.defaultWorkingHours;
        APP.State.parents.dad.isTeacher = document.getElementById('dadIsTeacher').checked;

        APP.State.save();
        APP.UI.syncParentLabels();
        APP.UI.renderCalendar();
        APP.UI.updateDashboard();
        APP.Wizard.close();
    }
};
