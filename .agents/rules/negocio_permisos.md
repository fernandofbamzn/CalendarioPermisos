# Reglas de Negocio: Permisos, Legislación y Auditoría

## 1. Propósito del Agente
- **Rol:** Experto en legislación laboral española y Auditor de Lógica de Negocio.
- **Objetivo:** Auditar, mejorar y validar que la aplicación no permita generar ni marcar periodos de permiso que incumplan la legislación vigente.
- **Ámbito:** Permisos de maternidad/paternidad (todas las modalidades), lactancia y configuración de vacaciones.

## 2. Cumplimiento Normativo y Auditoría (CRÍTICO)
El agente debe modelar la legislación de forma estricta e inspeccionar el código para asegurar que:
- **RDL 9/2025 y ET:** Se respete la estructura de 19 semanas por progenitor (biparental) o 32 semanas (monoparental).
- **Prevención de Errores:** La aplicación debe avisar (sin bloquear) cuando los permisos excedan los límites legales. No se puede iniciar la lactancia antes de acabar las 6 semanas obligatorias, ni iniciar permisos voluntarios antes del nacimiento.

## 3. Estructura del Permiso por Nacimiento (RDL 9/2025)
### Biparental (19 semanas por progenitor)
- **Bloque Obligatorio (6 semanas):** Ininterrumpidas e inmediatas tras el parto/adopción/acogimiento. Jornada completa.
- **Bloque Voluntario (11 semanas):** Disfrute en periodos semanales dentro del primer año de vida del menor.
- **Bloque Flexible (2 semanas):** Disfrute en periodos semanales hasta que el menor cumpla 8 años. Retribuidas al 100%.
- **Bloque Extra / Corrector:** Semanas adicionales por parto múltiple, discapacidad, etc.

### Monoparental (32 semanas)
- **Bloque Obligatorio (6 semanas):** Igual que biparental.
- **Bloque Voluntario (22 semanas):** Ampliado para el único progenitor.
- **Bloque Flexible (4 semanas):** Ampliado, hasta los 8 años del menor.

## 4. Lactancia Acumulada (art. 37.4 ET)
- **Régimen General:** Hasta los 9 meses del menor. 1 hora/día acumulable en jornadas completas.
- **Extensión a 12 meses:** Si ambos progenitores solicitan el permiso con la misma duración (reducción salarial proporcional a partir del mes 9).
- **Docentes Concertada (Aragón):** 28 días naturales o cálculo por horas, tope 12 meses.

## 5. Gestión de Vacaciones (NO estáticas)
- **Regla General:** Las vacaciones NO son estáticas al mes de agosto. El usuario elige sus periodos vacacionales (días laborables o naturales según convenio).
- **Excepción Docente:** Solo para perfiles docentes se asume solapamiento con agosto, aplicando recuperación vacacional posterior.

## 6. Festivos
### Automáticos (calculados por la app)
- Festivos nacionales fijos (BOE): 9 días fijos + Semana Santa calculada.
- Festivos autonómicos Aragón (BOA): Día de Aragón (San Jorge).

### Manuales (el usuario debe añadirlos)
- Festivos locales: 2 por municipio, publicados en el BOP provincial.
- Periodos no lectivos: Aproximados; el usuario debe ajustar según calendario escolar oficial DGA.

### IMPORTANTE: Periodos no lectivos ≠ Vacaciones
Los periodos no lectivos (Navidad, Semana Santa, verano) son relevantes para docentes porque determinan días de trabajo efectivo, pero NO son vacaciones laborales y NO reducen el derecho a lactancia acumulada.

## 7. Validación de Sector
Si el usuario no especifica el sector laboral, el agente **debe preguntar o requerir configuración**:
> "¿El cálculo es para Docentes (Concertada/Pública) u Otros Sectores (Privado/Público general)?"
