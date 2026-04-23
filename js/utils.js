/**
 * UTILIDADES DE FECHAS Y FORMATO
 */
window.APP = window.APP || {};

APP.Utils = {
    // Orden visual consistente para mostrar varios festivos en un mismo dia.
    holidayTypeOrder: {
        nat: 0,
        m_loc: 1,
        both_loc: 2,
        f_loc: 3,
        school: 4
    },

    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },

    formatDisplay(date) {
        return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    },

    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    },

    isWeekend(date) {
        const day = new Date(date).getDay();
        return day === 0 || day === 6;
    },

    getDiffDays(d1, d2) {
        return Math.floor(Math.abs(new Date(d1) - new Date(d2)) / (1000 * 60 * 60 * 24));
    },

    getHolidayLabel(type) {
        const labels = {
            nat: 'Nacional / Autonomico',
            m_loc: 'Local Madre',
            both_loc: 'Local Madre y Padre',
            f_loc: 'Local Padre',
            school: 'Vacaciones escolares'
        };
        return labels[type] || 'Festivo';
    },

    defaultHolidayName(type) {
        const names = {
            nat: 'Festivo nacional/autonomico',
            m_loc: 'Festivo local madre',
            both_loc: 'Festivo local madre y padre',
            f_loc: 'Festivo local padre',
            school: 'Vacaciones escolares'
        };
        return names[type] || 'Festivo';
    },

    normalizeHolidayEntry(entry) {
        if (!entry) return null;

        if (typeof entry === 'string') {
            return {
                type: entry,
                name: this.defaultHolidayName(entry)
            };
        }

        if (typeof entry === 'object' && typeof entry.type === 'string') {
            return {
                type: entry.type,
                name: entry.name || this.defaultHolidayName(entry.type)
            };
        }

        return null;
    },

    sortHolidays(holidays) {
        return [...holidays].sort((a, b) => {
            const aOrder = this.holidayTypeOrder[a.type] ?? 99;
            const bOrder = this.holidayTypeOrder[b.type] ?? 99;
            return aOrder - bOrder;
        });
    },

    normalizeHolidayArray(holidays) {
        if (!Array.isArray(holidays)) return [];

        const seen = new Set();
        const normalized = [];
        let momLocalHoliday = null;
        let dadLocalHoliday = null;

        holidays.forEach((entry) => {
            const holiday = this.normalizeHolidayEntry(entry);
            if (!holiday) return;

            if (holiday.type === 'm_loc') momLocalHoliday = holiday;
            if (holiday.type === 'f_loc') dadLocalHoliday = holiday;
            if (holiday.type === 'both_loc') {
                momLocalHoliday = null;
                dadLocalHoliday = null;
            }

            if (seen.has(holiday.type)) return;

            seen.add(holiday.type);
            normalized.push(holiday);
        });

        if (momLocalHoliday && dadLocalHoliday && momLocalHoliday.name === dadLocalHoliday.name) {
            const withoutSplitLocals = normalized.filter((holiday) => holiday.type !== 'm_loc' && holiday.type !== 'f_loc');
            withoutSplitLocals.push({
                type: 'both_loc',
                name: momLocalHoliday.name || this.defaultHolidayName('both_loc')
            });
            return this.sortHolidays(withoutSplitLocals);
        }

        return this.sortHolidays(normalized);
    },

    hasHolidayType(holidays, type) {
        return this.normalizeHolidayArray(holidays).some((holiday) => holiday.type === type);
    },

    upsertHoliday(holidays, entry) {
        const holiday = this.normalizeHolidayEntry(entry);
        if (!holiday) return this.normalizeHolidayArray(holidays);

        const next = this.normalizeHolidayArray(holidays).filter((item) => item.type !== holiday.type);
        next.push(holiday);
        return this.sortHolidays(next);
    },

    removeHolidayType(holidays, type) {
        return this.normalizeHolidayArray(holidays).filter((holiday) => holiday.type !== type);
    },

    getHolidayPrimaryType(holidays) {
        const normalized = this.normalizeHolidayArray(holidays);
        return normalized.length > 0 ? normalized[0].type : null;
    },

    // Devuelve si el dia debe tratarse como festivo para un rol concreto.
    isHoliday(ds, role = null) {
        const holidays = this.normalizeHolidayArray(APP.State.data[ds]?.holidays);
        return holidays.some((holiday) => {
            if (holiday.type === 'nat') return true;
            if (role === 'mom' && (holiday.type === 'm_loc' || holiday.type === 'both_loc')) return true;
            if (role === 'dad' && (holiday.type === 'f_loc' || holiday.type === 'both_loc')) return true;
            return false;
        });
    },

    // Los docentes consideran tambien los periodos escolares al calcular no laborables.
    isSchoolHolidayForTeacher(ds, role) {
        const parent = role === 'mom' ? APP.State.parents.mom : APP.State.parents.dad;
        return Boolean(parent?.isTeacher) && this.hasHolidayType(APP.State.data[ds]?.holidays, 'school');
    }
};
