# Skill: Motor de Cálculo y Auditoría de Permisos

Esta habilidad proporciona al agente la capacidad de calcular fechas exactas, modelar todas las modalidades de permiso y auditar el código para garantizar el cumplimiento normativo estricto.

## 1. Motor de Fechas y Modalidades Vacacionales
- **Cálculo de Periodos:** Sumar semanas, días laborables y naturales a una fecha base (T₀).
- **Transiciones y Bisiestos:** Manejar meses asimétricos y años bisiestos sin pérdida de precisión.
- **Modalidades de Vacaciones:** Capacidad para calcular periodos vacacionales de forma dinámica, evaluando si el usuario descuenta "días naturales" o "días laborables" según la configuración elegida, sin forzarlas al mes de agosto (excepto en docentes).

## 2. Auditoría de Reglas y Avisos (Validation Logic)
El agente es capaz de inspeccionar y sugerir mejoras al código (`logic.js`) para detectar estados que excedan los límites legales:
- **Permiso Voluntario:** Avisar si su inicio es anterior a la fecha de nacimiento.
- **Lactancia:** Avisar si su inicio es previo a la finalización de las 6 semanas obligatorias post-parto.
- **Topes Máximos:** Avisar (sin bloquear) si la suma de semanas voluntarias/flexibles supera el máximo legal.
- **Semanas Flexibles:** Verificar que no se exceda el límite de 2 semanas (biparental) o 4 semanas (monoparental).

## 3. Adaptador de Estructura Familiar
- **Familias Biparentales:** 19 semanas por progenitor (6 obligatorias + 11 voluntarias + 2 flexibles).
- **Familias Monoparentales:** 32 semanas totales (6 obligatorias + 22 voluntarias + 4 flexibles) según RDL 9/2025.
- **Partos Múltiples/Discapacidad:** Semanas adicionales dinámicas a los contadores máximos.

## 4. Lógica Sectorial de Lactancia
Manejo de múltiples topes (9 meses, 12 meses) y modalidades:
- **Docentes Concertada (Aragón):** 28 días naturales, tope 12 meses.
- **Régimen General:** Ausencia de 1 hora/día, acumulable en jornadas completas laborables mediante fórmula:
  `Días = (Total Días Laborables hasta los 9 meses * 1 hora) / Horas de Jornada Diaria`.
- **Extensión a 12 meses:** Disponible si ambos progenitores solicitan la lactancia (con reducción salarial desde el mes 9).

## 5. Festivos y Periodos No Lectivos
- Los festivos nacionales y autonómicos se calculan automáticamente.
- Los festivos locales (2 por municipio) deben configurarse manualmente.
- **IMPORTANTE:** Los periodos no lectivos (vacaciones escolares) NO son vacaciones laborales. Son relevantes solo para docentes en el cálculo de días efectivos de trabajo.
