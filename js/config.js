/**
 * CONFIGURACION GLOBAL Y LEGAL
 * Base: RDL 9/2025, art. 37.4 ET, convenio docentes Aragon
 */
window.APP = window.APP || {};

APP.CONFIG = {
    // Permiso por nacimiento y cuidado del menor (RDL 9/2025)
    // Biparental: 19 semanas por progenitor
    plan: {
        mandatoryWeeks: 6,      // Ininterrumpidas, jornada completa, inmediatas al parto
        voluntaryWeeks: 11,     // Dentro del primer año, en periodos semanales
        flexibleWeeks: 2,       // Hasta los 8 años del menor, en periodos semanales, retribuidas
        totalWeeks: 19
    },
    // Monoparental: 32 semanas para el unico progenitor (RDL 9/2025)
    monoparental: {
        mandatoryWeeks: 6,
        voluntaryWeeks: 22,
        flexibleWeeks: 4,
        totalWeeks: 32
    },
    // Lactancia acumulada (art. 37.4 ET)
    defaultLactationMonths: 9,
    // Extension a 12 meses si ambos progenitores solicitan (con reduccion salarial desde mes 9)
    extendedLactationMonths: 12,
    // Docentes concertada Aragon (convenio colectivo)
    teacherLactationMonths: 12,
    teacherLactationDays: 28,
    // Jornada laboral estandar (art. 34.1 ET: 40h/semana = 8h/dia)
    defaultWorkingHours: 8
};
