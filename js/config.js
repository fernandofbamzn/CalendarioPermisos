/**
 * CONFIGURACION GLOBAL Y LEGAL
 */
window.APP = window.APP || {};

APP.CONFIG = {
    // Base legal unificada del proyecto
    plan: {
        mandatoryWeeks: 6,
        voluntaryWeeks: 11,
        totalWeeks: 17
    },
    // Dias de lactancia por defecto si no se calcula
    defaultLactationDays: 0,
    // Tope general del permiso acumulado por lactancia
    defaultLactationMonths: 9,
    // Lactancia Docentes (Aragon)
    teacherLactationMonths: 12,
    teacherLactationDays: 28,
    // Horas de jornada estandar
    defaultWorkingHours: 7
};
