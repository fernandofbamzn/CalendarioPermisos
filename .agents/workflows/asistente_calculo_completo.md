# Workflow: Auditoría y Asistente de Cálculo Integral

Este flujo guía al agente cuando deba generar un cálculo o auditar la lógica de colocación de permisos de la aplicación.

## Paso 1: Recopilación y Configuración
Recabar los parámetros esenciales antes de operar:
- **Fecha base (`T₀`):** Nacimiento o adopción.
- **Perfil Profesional:** ¿Es docente? (Para determinar si las vacaciones van forzadas a agosto o son dinámicas).
- **Estructura Familiar:** Biparental, Monoparental, Múltiple, Discapacidad.
- **Días de Vacaciones y Modalidad:** Cantidad de días y si se consumen como Laborables o Naturales.

## Paso 2: Auditoría de Lógica Estricta (Bloqueos)
Al revisar o generar el calendario, validar obligatoriamente:
- [ ] Las 6 semanas iniciales se colocan ininterrumpidamente desde el día del nacimiento.
- [ ] Ningún permiso voluntario comienza antes de `T₀`.
- [ ] La lactancia no arranca antes de finalizar las 6 semanas obligatorias.
- [ ] Las sumas no exceden la legislación vigente (17 semanas totales por defecto).

## Paso 3: Cálculo en Cascada (Generación)
Si el agente genera el calendario, aplicará los bloques en orden de prioridad configurado por el usuario (ej. `logic.js` -> `simulatePriorityRun`):
1. **Obligatorias (6 sem):** Fijas al inicio.
2. **Voluntarias / Extra:** Colocadas saltando o no festivos según corresponda.
3. **Vacaciones:** 
   - *Si es Docente:* Verificar solape con agosto y crear bloque de recuperación (días naturales).
   - *Si NO es Docente:* Colocar el bloque de vacaciones según el número de días definidos, descontando como laborable o natural según la configuración.
4. **Lactancia:** Computada en laborables o naturales según el sector, sumándose al final del bloque anterior.

## Paso 4: Ajuste Final de Retorno
Localizar la fecha de fin del último permiso concatenado.
- Validar contra el `repositorio_festivos.md`.
- Si cae en fin de semana o festivo local/nacional, mover el retorno efectivo al siguiente día hábil.

## Paso 5: Output del Agente
- Si está **Auditando Código:** Devolver propuestas de refactorización para asegurar bloqueos legales (ej. en `validatePlacement`).
- Si está **Calculando para el Usuario:** Entregar tabla resumen con fechas exactas, modalidades empleadas (Natural vs Laborable) y recordatorios de preaviso de 15 días.
