/**
 * LOGICA DE NEGOCIO (CALCULOS)
 */
window.APP = window.APP || {};

APP.Logic = {
    getPlanLimits() {
        return APP.CONFIG.plan;
    },

    getLastVoluntaryDay(dataSource = APP.State.data, role) {
        const roleKey = role === 'mom' ? 'm' : 'f';
        let lastVoluntaryDay = null;

        Object.keys(dataSource || {}).sort().forEach((ds) => {
            if ((dataSource[ds] || {})[roleKey] === 'vol') {
                lastVoluntaryDay = ds;
            }
        });

        return lastVoluntaryDay;
    },

    getHolidayImpact(ds, role, dataSource = APP.State.data) {
        const parent = role === 'mom' ? APP.State.parents.mom : APP.State.parents.dad;
        const holidays = APP.Utils.normalizeHolidayArray(dataSource[ds]?.holidays);
        const national = holidays.some((holiday) => holiday.type === 'nat');
        const local = holidays.some((holiday) => (
            role === 'mom'
                ? holiday.type === 'm_loc' || holiday.type === 'both_loc'
                : holiday.type === 'f_loc' || holiday.type === 'both_loc'
        ));
        const school = Boolean(parent.isTeacher) && holidays.some((holiday) => holiday.type === 'school');

        return {
            national,
            local,
            school,
            isLegalHoliday: national || local,
            isSchoolBreak: school
        };
    },

    // Calcula siempre ambas alternativas para que la UI o el asistente decidan despues.
    calculateLactation(startDate, hoursPerDay, role, dataSource = APP.State.data) {
        const parent = role === 'mom' ? APP.State.parents.mom : APP.State.parents.dad;

        const start = new Date(startDate);
        start.setDate(start.getDate() + 1);

        const lactationLimit = new Date(APP.State.birthDate);
        lactationLimit.setMonth(
            lactationLimit.getMonth() + (parent.isTeacher ? APP.CONFIG.teacherLactationMonths : APP.CONFIG.defaultLactationMonths)
        );

        let workingDays = 0;
        let iter = new Date(start);
        const rangeEnd = APP.Utils.addDays(lactationLimit, -1);
        const breakdown = {
            rangeStart: new Date(start),
            rangeEnd,
            totalAnalyzedDays: 0,
            includedDays: 0,
            excludedDays: 0,
            counts: {
                weekend: 0,
                national: 0,
                local: 0,
                school: 0
            },
            includedDates: [],
            excludedDates: []
        };

        while (iter < lactationLimit) {
            const ds = APP.Utils.formatDate(iter);
            const isWeekend = APP.Utils.isWeekend(iter);
            const holidayImpact = this.getHolidayImpact(ds, role, dataSource);
            const isLegalHoliday = holidayImpact.isLegalHoliday;

            if (holidayImpact.isSchoolBreak) {
                breakdown.counts.school++;
            }

            let treatAsWorkday = !isLegalHoliday;
            if (parent.weekendsAsHolidays && isWeekend) {
                treatAsWorkday = false;
            } else if (isWeekend) {
                treatAsWorkday = true;
            } else if (isLegalHoliday) {
                treatAsWorkday = false;
            }

            breakdown.totalAnalyzedDays++;

            if (treatAsWorkday) {
                workingDays++;
                breakdown.includedDays++;

                let reason = 'Dia laborable incluido';
                if (isWeekend && !parent.weekendsAsHolidays) {
                    reason = holidayImpact.isLegalHoliday
                        ? 'Fin de semana incluido aunque coincida con festivo'
                        : 'Fin de semana incluido por configuracion';
                }

                breakdown.includedDates.push({ ds, reason });
            } else {
                breakdown.excludedDays++;

                const reasons = [];
                if (parent.weekendsAsHolidays && isWeekend) {
                    breakdown.counts.weekend++;
                    reasons.push('Fin de semana excluido');
                }
                if (holidayImpact.national) {
                    breakdown.counts.national++;
                    reasons.push('Festivo nacional/autonomico');
                }
                if (holidayImpact.local) {
                    breakdown.counts.local++;
                    reasons.push('Festivo local del progenitor');
                }

                breakdown.excludedDates.push({
                    ds,
                    reasons,
                    schoolBreak: holidayImpact.isSchoolBreak
                });
            }

            iter.setDate(iter.getDate() + 1);
        }

        const accumulatedHours = workingDays;
        const calcDays = Math.ceil(accumulatedHours / hoursPerDay);
        const recommendedMode = parent.isTeacher && APP.CONFIG.teacherLactationDays >= calcDays ? 'natural' : 'working';

        return {
            isTeacher: parent.isTeacher,
            workingDays,
            startDate: start,
            endDate: lactationLimit,
            recommendedMode,
            breakdown,
            working: {
                mode: 'working',
                days: calcDays,
                workingDays
            },
            natural: parent.isTeacher
                ? {
                    mode: 'natural',
                    days: APP.CONFIG.teacherLactationDays
                }
                : null
        };
    },

    validatePlacement(role, cat, date) {
        if (!APP.State.birthDate) return true;

        const birth = new Date(APP.State.birthDate);
        const mandatoryEnd = APP.Utils.addDays(birth, 42);
        const d = new Date(date);

        if (cat === 'lac' && d < mandatoryEnd) {
            return { valid: false, msg: 'La lactancia no puede empezar antes de las 6 semanas obligatorias.' };
        }

        if (cat === 'vol' && d < birth) {
            return { valid: false, msg: 'El permiso no puede empezar antes del nacimiento.' };
        }

        return { valid: true };
    },

    updateMetrics() {
        const counts = { m_vol: 0, m_ex: 0, m_vac: 0, m_lac: 0, f_vol: 0, f_ex: 0, f_vac: 0, f_lac: 0, overlap: 0 };
        let lastDate = 0;
        let mReturn = 0;
        let fReturn = 0;

        Object.keys(APP.State.data).forEach((ds) => {
            const d = APP.State.data[ds];
            const ts = new Date(ds).getTime();

            if (d.m === 'vol') counts.m_vol++;
            if (d.m === 'ex') counts.m_ex++;
            if (d.m === 'vac') counts.m_vac++;
            if (d.m === 'lac') counts.m_lac++;

            if (d.f === 'vol') counts.f_vol++;
            if (d.f === 'ex') counts.f_ex++;
            if (d.f === 'vac') counts.f_vac++;
            if (d.f === 'lac') counts.f_lac++;

            if (d.m && d.f && d.m !== 'mandatory' && d.f !== 'mandatory') counts.overlap++;

            const hasActivity = d.m || d.f;
            if (hasActivity && ts > lastDate) lastDate = ts;
            if (d.m) mReturn = ts;
            if (d.f) fReturn = ts;
        });

        return { counts, lastDate, mReturn, fReturn };
    }
};
