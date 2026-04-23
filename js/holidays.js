/**
 * MOTOR DE FESTIVOS
 */
window.APP = window.APP || {};

APP.Holidays = {
    // Festivos nacionales de Espana (fijos)
    fixed: {
        '01-01': { type: 'nat', name: 'Ano Nuevo' },
        '01-06': { type: 'nat', name: 'Dia de Reyes' },
        '05-01': { type: 'nat', name: 'Dia del Trabajo' },
        '08-15': { type: 'nat', name: 'Asuncion' },
        '11-01': { type: 'nat', name: 'Todos los Santos' },
        '12-06': { type: 'nat', name: 'Dia de la Constitucion' },
        '12-08': { type: 'nat', name: 'Inmaculada Concepcion' },
        '12-25': { type: 'nat', name: 'Navidad' }
    },

    // Aragon
    regional: {
        Aragon: {
            '04-23': { type: 'nat', name: 'San Jorge' }
        }
    },

    addHoliday(target, dateStr, holiday) {
        if (!target[dateStr]) target[dateStr] = [];
        target[dateStr] = APP.Utils.upsertHoliday(target[dateStr], holiday);
    },

    // Aplica el traslado general al lunes cuando un festivo fijo cae en domingo.
    getObservedDateString(year, monthDay) {
        const [month, day] = monthDay.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        if (date.getDay() === 0) {
            date.setDate(date.getDate() + 1);
        }
        return APP.Utils.formatDate(date);
    },

    getEaster(year) {
        const f = Math.floor, G = year % 19, C = f(year / 100), H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
              I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)), J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
              L = I - J, month = 3 + f((L + 40) / 44), day = L + 28 - 31 * f(month / 4);
        return new Date(year, month - 1, day);
    },

    getHolidaysForYear(year) {
        const hols = {};

        Object.entries(this.fixed).forEach(([monthDay, holiday]) => {
            this.addHoliday(hols, this.getObservedDateString(year, monthDay), holiday);
        });

        Object.entries(this.regional.Aragon).forEach(([monthDay, holiday]) => {
            this.addHoliday(hols, this.getObservedDateString(year, monthDay), holiday);
        });

        const pilar = new Date(year, 9, 12);
        if (pilar.getDay() === 0) {
            this.addHoliday(hols, `${year}-10-13`, { type: 'nat', name: 'Fiesta del Pilar (trasladada)' });
        } else {
            this.addHoliday(hols, `${year}-10-12`, { type: 'nat', name: 'Fiesta del Pilar' });
        }

        this.addHoliday(hols, `${year}-12-24`, { type: 'f_loc', name: 'Nochebuena' });
        this.addHoliday(hols, `${year}-12-31`, { type: 'f_loc', name: 'Nochevieja' });

        const easter = this.getEaster(year);
        const holyMonday = APP.Utils.addDays(easter, -6);
        const holyTuesday = APP.Utils.addDays(easter, -5);
        const holyWednesday = APP.Utils.addDays(easter, -4);
        const thu = APP.Utils.addDays(easter, -3);
        const fri = APP.Utils.addDays(easter, -2);
        const easterMonday = APP.Utils.addDays(easter, 1);

        this.addHoliday(hols, APP.Utils.formatDate(holyMonday), { type: 'school', name: 'Semana Santa' });
        this.addHoliday(hols, APP.Utils.formatDate(holyTuesday), { type: 'school', name: 'Semana Santa' });
        this.addHoliday(hols, APP.Utils.formatDate(holyWednesday), { type: 'school', name: 'Semana Santa' });
        this.addHoliday(hols, APP.Utils.formatDate(thu), { type: 'nat', name: 'Jueves Santo' });
        this.addHoliday(hols, APP.Utils.formatDate(fri), { type: 'nat', name: 'Viernes Santo' });
        this.addHoliday(hols, APP.Utils.formatDate(easterMonday), { type: 'm_loc', name: 'Lunes de Pascua' });
        this.addHoliday(hols, APP.Utils.formatDate(easterMonday), { type: 'f_loc', name: 'Lunes de Pascua' });

        return hols;
    },

    // Vacaciones escolares aproximadas
    getSchoolHolidays(year) {
        const hols = {};

        for (let d = new Date(year, 11, 23); d <= new Date(year, 11, 31); d.setDate(d.getDate() + 1)) {
            this.addHoliday(hols, APP.Utils.formatDate(d), { type: 'school', name: 'Vacaciones de Navidad' });
        }

        for (let d = new Date(year, 0, 1); d <= new Date(year, 0, 7); d.setDate(d.getDate() + 1)) {
            this.addHoliday(hols, APP.Utils.formatDate(d), { type: 'school', name: 'Vacaciones de Navidad' });
        }

        return hols;
    },

    // Fusiona festivos base con los existentes sin sobrescribir nombres editados manualmente.
    mergeIntoData(data, holidaysByDate) {
        Object.entries(holidaysByDate).forEach(([dateStr, holidays]) => {
            if (!data[dateStr]) data[dateStr] = {};

            let merged = APP.Utils.normalizeHolidayArray(data[dateStr].holidays);
            APP.Utils.normalizeHolidayArray(holidays).forEach((holiday) => {
                if (!APP.Utils.hasHolidayType(merged, holiday.type)) {
                    merged = APP.Utils.upsertHoliday(merged, holiday);
                }
            });

            if (merged.length > 0) data[dateStr].holidays = merged;
        });
    },

    populateBaseData(data, birthDate) {
        if (!birthDate) return;

        const startYear = new Date(birthDate).getFullYear();
        for (let year = startYear; year <= startYear + 2; year++) {
            this.mergeIntoData(data, this.getHolidaysForYear(year));
            this.mergeIntoData(data, this.getSchoolHolidays(year));
        }
    },

    getBaseHolidaysForDate(dateStr) {
        const year = Number(dateStr.slice(0, 4));
        if (!Number.isFinite(year)) return [];

        const temp = {};
        this.mergeIntoData(temp, this.getHolidaysForYear(year));
        this.mergeIntoData(temp, this.getSchoolHolidays(year));
        return APP.Utils.normalizeHolidayArray(temp[dateStr]?.holidays);
    },

    // Restaura solo la capa base sugerida para un dia concreto tras borrar ediciones manuales.
    restoreBaseHolidays(data, dateStr) {
        const holidays = this.getBaseHolidaysForDate(dateStr);
        if (holidays.length === 0) return;

        if (!data[dateStr]) data[dateStr] = {};
        let merged = APP.Utils.normalizeHolidayArray(data[dateStr].holidays);
        holidays.forEach((holiday) => {
            if (!APP.Utils.hasHolidayType(merged, holiday.type)) {
                merged = APP.Utils.upsertHoliday(merged, holiday);
            }
        });
        data[dateStr].holidays = merged;
    }
};
