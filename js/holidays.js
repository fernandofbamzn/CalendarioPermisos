/**
 * MOTOR DE FESTIVOS
 *
 * Festivos automaticos: nacionales (BOE) y autonomicos Aragon (BOA).
 * Festivos locales: el usuario debe añadirlos manualmente.
 *
 * FUENTES OFICIALES:
 * - Nacional: BOE, Resolucion anual de fiestas laborales
 *   https://www.boe.es (buscar "fiestas laborales" del año correspondiente)
 * - Aragon: BOA, Calendario laboral
 *   https://www.aragon.es/trabajo-y-relaciones-laborales/calendario-laboral
 * - Locales (2 por municipio): BOP provincial o bando del ayuntamiento
 *   Huesca: https://bop.dphuesca.es
 *   Zaragoza: https://bop.dpz.es
 *   Teruel: https://236ws.dpteruel.es/bop
 * - Calendario escolar (periodos no lectivos): DGA - Departamento de Educacion
 *   https://educa.aragon.es/calendario-escolar
 *
 * NOTA IMPORTANTE:
 * Los periodos no lectivos (vacaciones escolares) NO son vacaciones laborales.
 * Son relevantes para docentes porque determinan los dias de trabajo efectivo,
 * pero no reducen el derecho a lactancia acumulada.
 */
window.APP = window.APP || {};

APP.Holidays = {
    // Festivos nacionales fijos de Espana (BOE)
    // Estos se aplican automaticamente cada año
    fixed: {
        '01-01': { type: 'nat', name: 'Año Nuevo' },
        '01-06': { type: 'nat', name: 'Epifania del Señor' },
        '05-01': { type: 'nat', name: 'Dia del Trabajo' },
        '08-15': { type: 'nat', name: 'Asuncion de la Virgen' },
        '10-12': { type: 'nat', name: 'Fiesta Nacional de España' },
        '11-01': { type: 'nat', name: 'Todos los Santos' },
        '12-06': { type: 'nat', name: 'Dia de la Constitucion' },
        '12-08': { type: 'nat', name: 'Inmaculada Concepcion' },
        '12-25': { type: 'nat', name: 'Natividad del Señor' }
    },

    // Festivos autonomicos de Aragon (BOA)
    regional: {
        Aragon: {
            '04-23': { type: 'nat', name: 'Dia de Aragon (San Jorge)' }
        }
    },

    // Periodos no lectivos escolares aproximados.
    // ATENCION: estos son orientativos. El calendario escolar oficial
    // se publica anualmente en el BOA por el Departamento de Educacion del Gobierno de Aragon.
    // El usuario debe verificar y ajustar segun el calendario oficial del curso.
    schoolBreakConfig: {
        christmas: { startDay: 23, startMonth: 11, endDay: 7, endMonth: 0 },
        holyWeek: { daysBeforeEaster: [6, 5, 4], afterEaster: [1] }
    },

    addHoliday(target, dateStr, holiday) {
        if (!target[dateStr]) target[dateStr] = [];
        target[dateStr] = APP.Utils.upsertHoliday(target[dateStr], holiday);
    },

    // Traslado al lunes cuando un festivo cae en domingo (regla general).
    // NOTA: El traslado real depende de la resolucion anual del BOE.
    applyShiftIfSunday(year, monthDay, holidayObj) {
        const [month, day] = monthDay.split('-').map(Number);
        const date = new Date(year, month - 1, day);

        if (holidayObj.shiftIfSunday !== false && date.getDay() === 0) {
            date.setDate(date.getDate() + 1);
            return {
                dateStr: APP.Utils.formatDate(date),
                holiday: { ...holidayObj, name: `${holidayObj.name} (trasladado)` }
            };
        }

        return {
            dateStr: APP.Utils.formatDate(date),
            holiday: holidayObj
        };
    },

    getEaster(year) {
        const f = Math.floor, G = year % 19, C = f(year / 100), H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
              I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)), J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
              L = I - J, month = 3 + f((L + 40) / 44), day = L + 28 - 31 * f(month / 4);
        return new Date(year, month - 1, day);
    },

    getHolidaysForYear(year) {
        const hols = {};

        // Festivos fijos nacionales
        Object.entries(this.fixed).forEach(([monthDay, holidayObj]) => {
            const { dateStr, holiday } = this.applyShiftIfSunday(year, monthDay, holidayObj);
            this.addHoliday(hols, dateStr, holiday);
        });

        // Festivos autonomicos Aragon
        Object.entries(this.regional.Aragon).forEach(([monthDay, holidayObj]) => {
            const { dateStr, holiday } = this.applyShiftIfSunday(year, monthDay, holidayObj);
            this.addHoliday(hols, dateStr, holiday);
        });

        // Semana Santa (festivos nacionales calculados)
        const easter = this.getEaster(year);
        const thu = APP.Utils.addDays(easter, -3);
        const fri = APP.Utils.addDays(easter, -2);

        this.addHoliday(hols, APP.Utils.formatDate(thu), { type: 'nat', name: 'Jueves Santo' });
        this.addHoliday(hols, APP.Utils.formatDate(fri), { type: 'nat', name: 'Viernes Santo' });

        return hols;
    },

    // Periodos no lectivos escolares (aproximados, verificar con calendario oficial DGA)
    getSchoolBreaks(year) {
        const hols = {};

        // Semana Santa escolar: dias no lectivos alrededor de los festivos
        const easter = this.getEaster(year);
        this.schoolBreakConfig.holyWeek.daysBeforeEaster.forEach((offset) => {
            const d = APP.Utils.addDays(easter, -offset);
            this.addHoliday(hols, APP.Utils.formatDate(d), { type: 'school', name: 'Periodo no lectivo (Semana Santa)' });
        });
        this.schoolBreakConfig.holyWeek.afterEaster.forEach((offset) => {
            const d = APP.Utils.addDays(easter, offset);
            this.addHoliday(hols, APP.Utils.formatDate(d), { type: 'school', name: 'Periodo no lectivo (Semana Santa)' });
        });

        // Navidad: periodo no lectivo aproximado
        const cfg = this.schoolBreakConfig.christmas;
        for (let d = new Date(year, cfg.startMonth, cfg.startDay); d <= new Date(year, 11, 31); d.setDate(d.getDate() + 1)) {
            this.addHoliday(hols, APP.Utils.formatDate(d), { type: 'school', name: 'Periodo no lectivo (Navidad)' });
        }
        for (let d = new Date(year, cfg.endMonth, 1); d <= new Date(year, cfg.endMonth, cfg.endDay); d.setDate(d.getDate() + 1)) {
            this.addHoliday(hols, APP.Utils.formatDate(d), { type: 'school', name: 'Periodo no lectivo (Navidad)' });
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
            this.mergeIntoData(data, this.getSchoolBreaks(year));
        }
    },

    getBaseHolidaysForDate(dateStr) {
        const year = Number(dateStr.slice(0, 4));
        if (!Number.isFinite(year)) return [];

        const temp = {};
        this.mergeIntoData(temp, this.getHolidaysForYear(year));
        this.mergeIntoData(temp, this.getSchoolBreaks(year));
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
