/**
 * PLANIFICADOR DE PERMISOS - LÓGICA ARAGÓN V7.0
 * * Incluye:
 * - Ampliación a 17 semanas (RDL 9/2025)
 * - Lógica Lactancia Concertada (12 meses + 28 días fijos madre)
 */

// --- 1. CONFIGURACIÓN ---
const CONFIG = {
    mandatoryDays: 42, // 6 semanas siempre
    // voluntaryDays se calculará según la fecha
};

let state = {
    birthDate: null,
    currentTool: null,
    data: {}, 
    isDragging: false,
    dragTargetState: null,
    lactationInfo: { hoursPerDay: 8 } 
};

let D = {};

// --- 2. INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    D = {
        input: document.getElementById('birthDateInput'),
        empty: document.getElementById('emptyState'),
        tools: document.getElementById('toolsPanel'),
        stats: document.getElementById('statsDashboard'),
        grid: document.getElementById('calendarGrid'),
        btnReset: document.getElementById('btnReset'),
        
        counts: {
            mom_vol: document.getElementById('count_mom_vol'),
            mom_lac: document.getElementById('count_mom_lac'),
            mom_vac: document.getElementById('count_mom_vac'),
            dad_vol: document.getElementById('count_dad_vol'),
            dad_lac: document.getElementById('count_dad_lac'),
            dad_vac: document.getElementById('count_dad_vac'),
        },
        metrics: {
            coverage: document.getElementById('metric_coverage_date'),
            cov_weeks: document.getElementById('metric_coverage_weeks'),
            mom_ret: document.getElementById('metric_mom_return'),
            dad_ret: document.getElementById('metric_dad_return'),
            overlap: document.getElementById('metric_overlap')
        },
        // Modal Lactancia
        lactationModal: document.getElementById('lactationModal'),
        lactationResult: document.getElementById('lactationResult'),
        lactationInputHours: document.getElementById('lactationHours')
    };

    D.input.addEventListener('change', handleDateChange);
    D.btnReset.addEventListener('click', resetApp);
    loadState();
});

// --- PERSISTENCIA Y CARGA ---
function loadState() {
    const saved = localStorage.getItem('plannerAragonV7'); // Cambiado a V7
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.birthDate) {
                state = parsed;
                state.birthDate = new Date(state.birthDate);
                if (isNaN(state.birthDate.getTime())) throw new Error("Fecha corrupta");
                D.input.value = formatDateInput(state.birthDate);
                launchApp();
            }
        } catch(e) {
            localStorage.removeItem('plannerAragonV7');
        }
    }
}

function handleDateChange(e) {
    if(!e.target.value) return;
    const newDate = new Date(e.target.value);
    if(isNaN(newDate.getTime())) return;
    state.birthDate = newDate;
    state.data = {}; 
    generateBaseData(); 
    launchApp();
}

function resetApp() {
    if(confirm('¿Borrar toda la planificación?')) {
        localStorage.removeItem('plannerAragonV7');
        location.reload();
    }
}

function saveState() {
    localStorage.setItem('plannerAragonV7', JSON.stringify(state));
}

function launchApp() {
    if (!state.birthDate || isNaN(state.birthDate.getTime())) return;
    
    D.empty.classList.add('hidden');
    D.tools.classList.remove('hidden');
    D.stats.classList.remove('hidden');
    D.grid.classList.remove('hidden');
    
    if(!state.currentTool) setTool('mom_vol');
    else setTool(state.currentTool);
    
    renderCalendar();
    updateDashboard();
}

// --- LÓGICA DE NEGOCIO ---

// Determina si aplica la nueva ley (31 Julio 2025)
function getVoluntaryWeeksLimit() {
    if(!state.birthDate) return 10;
    const limitDate = new Date('2025-07-31');
    return state.birthDate >= limitDate ? 11 : 10;
}

function generateBaseData() {
    if (!state.birthDate) return;
    const year = state.birthDate.getFullYear();
    addHolidaysForYear(year);
    addHolidaysForYear(year + 1);
    // Cubrimos hasta 3 años por si acaso (para lactancia larga)
    addHolidaysForYear(year + 2);

    let d = new Date(state.birthDate);
    // 6 Semanas Obligatorias siempre
    for(let i=0; i<CONFIG.mandatoryDays; i++) {
        const ds = formatDate(d);
        if(!state.data[ds]) state.data[ds] = {};
        state.data[ds].m = 'mandatory';
        state.data[ds].f = 'mandatory';
        d.setDate(d.getDate() + 1);
    }
    saveState();
}

// --- FESTIVOS ARAGÓN ---
function addHolidaysForYear(year) {
    const fixed = ['01-01','01-06','05-01','08-15','11-01','12-06','12-08','12-25'];
    fixed.forEach(day => addHolidayToState(`${year}-${day}`, 'nat'));

    // Aragón
    addHolidayToState(`${year}-04-23`, 'nat'); // San Jorge
    const pilar = new Date(year, 9, 12);
    if(pilar.getDay() === 0) addHolidayToState(`${year}-10-13`, 'nat'); 
    else addHolidayToState(`${year}-10-12`, 'nat');

    // Padre Especiales
    addHolidayToState(`${year}-12-24`, 'f_loc');
    addHolidayToState(`${year}-12-31`, 'f_loc');

    // Semana Santa
    const easter = getEasterDate(year);
    let holyThu = new Date(easter); holyThu.setDate(easter.getDate() - 3);
    let holyFri = new Date(easter); holyFri.setDate(easter.getDate() - 2);
    addHolidayToState(formatDate(holyThu), 'nat');
    addHolidayToState(formatDate(holyFri), 'nat');

    // Escolares
    const xStart = new Date(year, 11, 23);
    const xEnd = new Date(year, 11, 31);
    for(let d = new Date(xStart); d <= xEnd; d.setDate(d.getDate() + 1)) addHolidayToState(formatDate(d), 'school');
    const xStartNext = new Date(year, 0, 1);
    const xEndNext = new Date(year, 0, 7);
    for(let d = new Date(xStartNext); d <= xEndNext; d.setDate(d.getDate() + 1)) addHolidayToState(formatDate(d), 'school');
}

function addHolidayToState(dateStr, type) {
    if(!state.data[dateStr]) state.data[dateStr] = {};
    if(!state.data[dateStr].holidays) state.data[dateStr].holidays = [];
    if(type === 'school' && state.data[dateStr].holidays.includes('nat')) return;
    if(!state.data[dateStr].holidays.includes(type)) state.data[dateStr].holidays.push(type);
}

function getEasterDate(year) {
    const f = Math.floor, G = year % 19, C = f(year / 100), H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
          I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)), J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
          L = I - J, month = 3 + f((L + 40) / 44), day = L + 28 - 31 * f(month / 4);
    return new Date(year, month - 1, day);
}

// --- ALGORITMO DE LACTANCIA (ACTUALIZADO 12 MESES) ---

window.openLactationCalc = function(role) {
    // 1. Encontrar fecha de fin de permiso de este rol
    let lastPermissionDate = 0;
    Object.keys(state.data).forEach(ds => {
        const d = state.data[ds];
        // Buscamos el último día marcado que NO sea lactancia
        if (d[role === 'mom' ? 'm' : 'f'] && d[role === 'mom' ? 'm' : 'f'] !== 'lac') {
             const ts = new Date(ds).getTime();
             if(ts > lastPermissionDate) lastPermissionDate = ts;
        }
    });

    if(lastPermissionDate === 0) {
        alert("Primero planifica los permisos (obligatorio y voluntario) para saber cuándo empieza a contar la lactancia.");
        return;
    }

    const startDate = new Date(lastPermissionDate);
    startDate.setDate(startDate.getDate() + 1); // Empieza a contar al día siguiente

    // 2. Calcular fecha fin: AHORA SON 12 MESES (NO 9)
    const baby12Months = new Date(state.birthDate);
    baby12Months.setFullYear(baby12Months.getFullYear() + 1); // +1 Año exacto

    state.lactationInfo.startDate = startDate;
    state.lactationInfo.endDate = baby12Months;
    state.lactationInfo.role = role;

    // Mostrar Modal
    const roleName = role === 'mom' ? 'Madre (Concertada)' : 'Padre';
    document.getElementById('lactationTitle').innerText = `Calculadora Lactancia: ${roleName}`;
    D.lactationModal.classList.remove('hidden');
    calculateLactation(); 
};

window.calculateLactation = function() {
    const hoursPerDay = parseFloat(D.lactationInputHours.value) || 8;
    const start = new Date(state.lactationInfo.startDate);
    const end = new Date(state.lactationInfo.endDate);
    const role = state.lactationInfo.role;
    
    // Algoritmo: Contar días laborables entre start y end
    let workingDays = 0;
    let iter = new Date(start);

    // Iteramos hasta la fecha de los 12 meses
    while(iter < end) {
        const ds = formatDate(iter);
        const dayOfWeek = iter.getDay();
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        
        let isHoliday = false;
        if(state.data[ds] && state.data[ds].holidays && state.data[ds].holidays.includes('nat')) {
            isHoliday = true;
        }

        if(!isWeekend && !isHoliday) {
            workingDays++;
        }
        iter.setDate(iter.getDate() + 1);
    }

    // Fórmula: Días Laborables * 1 hora / Jornada
    const accumulatedDays = (workingDays * 1) / hoursPerDay;
    const roundDays = Math.floor(accumulatedDays); 
    
    let extraHTML = '';
    
    // MENSAJE ESPECÍFICO PARA MADRE (CONCERTADA)
    if(role === 'mom') {
        extraHTML = `
            <div class="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p class="text-sm font-bold text-purple-800">🏫 Opción Concertada (Aragón)</p>
                <p class="text-xs text-purple-700 mt-1">
                    Por convenio, puedes optar directamente por acumular 
                    <span class="font-bold text-lg">28 días naturales</span>.
                </p>
                <p class="text-[10px] text-purple-600 mt-1 italic">
                    (Normalmente es más ventajoso que el cálculo por horas si trabajas jornada completa, pero compruébalo).
                </p>
            </div>
        `;
    }

    D.lactationResult.innerHTML = `
        <div class="space-y-2">
            <p>Desde: <b>${formatDateDisplay(start)}</b> (Fin permiso)</p>
            <p>Hasta: <b>${formatDateDisplay(end)}</b> (Bebé 12 meses)</p>
            <p>Días laborables en ese periodo: <b>${workingDays}</b></p>
            
            <div class="bg-indigo-50 p-3 rounded-lg border border-indigo-100 mt-2">
                <p class="text-xs text-indigo-600 font-bold uppercase">Cálculo Matemático (1h/día)</p>
                <p class="text-2xl font-bold text-indigo-900">${roundDays} días laborales</p>
                <p class="text-xs text-indigo-800">(${accumulatedDays.toFixed(2)} exactos)</p>
            </div>

            ${extraHTML}

            <p class="text-[10px] text-slate-500 mt-2">
                Nota: El cálculo matemático asume 1h diaria acumulada.
            </p>
        </div>
    `;
};

window.closeLactationModal = function() {
    D.lactationModal.classList.add('hidden');
};


// --- HERRAMIENTAS Y EVENTOS ---
window.setTool = function(tool) {
    state.currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(b => {
        b.classList.remove('ring-2', 'ring-indigo-500', 'bg-white');
        if(b.id === `btn_${tool}`) b.classList.add('ring-2', 'ring-indigo-500', 'bg-white');
    });
};

window.startDrag = function(dateStr) {
    state.isDragging = true;
    state.dragTargetState = !checkToolActive(dateStr);
    applyTool(dateStr, state.dragTargetState);
};
window.onMouseEnterDate = function(dateStr) {
    if(state.isDragging) applyTool(dateStr, state.dragTargetState);
};
window.stopDrag = function() {
    if(state.isDragging) {
        state.isDragging = false;
        saveState(); 
        updateDashboard();
    }
};
window.onDoubleClickDate = function(dateStr) {
    if(state.currentTool.includes('hol')) return;
    const d = new Date(dateStr);
    if(isNaN(d.getTime())) return;
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d); monday.setDate(diff);
    const target = !checkToolActive(dateStr);
    for(let i=0; i<7; i++) {
        let temp = new Date(monday); temp.setDate(monday.getDate()+i);
        applyTool(formatDate(temp), target);
    }
    saveState();
    updateDashboard();
};

function checkToolActive(dateStr) {
    if(!state.data[dateStr]) return false;
    const d = state.data[dateStr];
    const t = state.currentTool;
    if(t === 'eraser') return false;
    if(t === 'common_hol') return d.holidays && d.holidays.includes('nat');
    if(t.includes('hol')) { 
         const hType = t === 'mom_hol' ? 'm_loc' : 'f_loc';
         return d.holidays && d.holidays.includes(hType);
    }
    const role = t.startsWith('mom') ? 'm' : 'f';
    const type = t.split('_')[1]; 
    return d[role] === type;
}

function applyTool(dateStr, turnOn) {
    if(!state.data[dateStr]) state.data[dateStr] = {};
    const d = state.data[dateStr];
    const t = state.currentTool;

    if(d.m === 'mandatory' || d.f === 'mandatory') return;

    if(t === 'eraser') {
        delete d.m; delete d.f;
        if(d.holidays) d.holidays = d.holidays.filter(h => h === 'nat' || h === 'school');
    } else if(t === 'common_hol') {
        if(!d.holidays) d.holidays = [];
        if(turnOn) { if(!d.holidays.includes('nat')) d.holidays.push('nat'); } 
        else { d.holidays = d.holidays.filter(h => h !== 'nat'); }
    } else if(t.includes('hol')) {
        const hType = t === 'mom_hol' ? 'm_loc' : 'f_loc';
        if(!d.holidays) d.holidays = [];
        if(turnOn) { if(!d.holidays.includes(hType)) d.holidays.push(hType); } 
        else { d.holidays = d.holidays.filter(h => h !== hType); }
    } else {
        const role = t.startsWith('mom') ? 'm' : 'f';
        const type = t.split('_')[1];
        if(turnOn) d[role] = type;
        else if(d[role] === type) delete d[role];
    }
    
    if(!d.m && !d.f && (!d.holidays || d.holidays.length===0)) delete state.data[dateStr];
    renderCell(dateStr);
}

// --- RENDER ---
function renderCalendar() {
    if (!state.birthDate || isNaN(state.birthDate.getTime())) return;
    D.grid.innerHTML = '';
    let d = new Date(state.birthDate); d.setDate(1); 

    // Renderizar hasta 18 meses para cubrir lactancia extendida
    for(let i=0; i<18; i++) { 
        const mDiv = document.createElement('div');
        mDiv.className = 'bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden break-inside-avoid';
        const mName = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        mDiv.innerHTML = `<div class="bg-slate-50 px-3 py-2 border-b border-slate-100 font-bold text-slate-600 capitalize text-center text-xs">${mName}</div>`;
        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-7 text-sm';
        ['L','M','X','J','V','S','D'].forEach(day => grid.innerHTML += `<div class="text-center text-[10px] text-slate-400 py-1">${day}</div>`);
        const firstDay = (d.getDay() + 6) % 7; 
        for(let j=0; j<firstDay; j++) grid.innerHTML += `<div></div>`;
        const curMonth = d.getMonth();
        while(d.getMonth() === curMonth) {
            const ds = formatDate(d);
            const cell = document.createElement('div');
            cell.id = `c-${ds}`;
            cell.className = 'calendar-day h-8 flex items-center justify-center cursor-pointer m-0.5 rounded text-xs relative border border-transparent';
            cell.innerHTML = `<span class="z-10 relative pointer-events-none">${d.getDate()}</span>`;
            cell.onmousedown = (e) => { e.preventDefault(); window.startDrag(ds); };
            cell.onmouseenter = () => window.onMouseEnterDate(ds);
            cell.ondblclick = () => window.onDoubleClickDate(ds);
            applyStyles(cell, ds);
            grid.appendChild(cell);
            d.setDate(d.getDate()+1);
        }
        mDiv.appendChild(grid);
        D.grid.appendChild(mDiv);
    }
}

function renderCell(ds) { const c = document.getElementById(`c-${ds}`); if(c) applyStyles(c, ds); }

function applyStyles(el, ds) {
    const d = state.data[ds] || {};
    const h = d.holidays || [];
    el.className = 'calendar-day h-8 flex items-center justify-center cursor-pointer m-0.5 rounded text-xs relative border border-transparent font-medium';
    el.style.background = ''; el.style.color = '#334155'; el.style.boxShadow = '';

    if(h.includes('nat')) el.classList.add('h-national');
    else if(h.includes('school')) el.classList.add('h-school');
    else el.classList.add('hover:bg-slate-50');

    if(h.includes('m_loc')) el.classList.add('h-mom-loc');
    if(h.includes('f_loc')) el.classList.add('h-dad-loc');

    const m = d.m; const f = d.f;
    if(m === 'mandatory') { el.classList.add('p-mandatory'); return; }
    if(m && f && m!=='mandatory') { el.classList.add('split-vol'); return; }
    if(m) {
        if(m === 'vol') el.classList.add('p-mom-vol');
        if(m === 'vac') el.classList.add('p-mom-vac');
        if(m === 'lac') el.classList.add('p-mom-lac');
    }
    if(f) {
        if(f === 'vol') el.classList.add('p-dad-vol');
        if(f === 'vac') el.classList.add('p-dad-vac');
        if(f === 'lac') el.classList.add('p-dad-lac');
    }
}

function updateDashboard() {
    const counts = { m_vol:0, m_vac:0, m_lac:0, f_vol:0, f_vac:0, f_lac:0, overlap:0 };
    let maxDate = 0, mRet = 0, fRet = 0;
    Object.keys(state.data).sort().forEach(ds => {
        const d = state.data[ds]; const ts = new Date(ds).getTime();
        if(d.m === 'vol') counts.m_vol++; if(d.m === 'vac') counts.m_vac++; if(d.m === 'lac') counts.m_lac++;
        if(d.f === 'vol') counts.f_vol++; if(d.f === 'vac') counts.f_vac++; if(d.f === 'lac') counts.f_lac++;
        if(d.m && d.f && d.m !== 'mandatory') counts.overlap++;
        if(d.m || d.f) if(ts > maxDate) maxDate = ts;
        if(d.m) mRet = ts; if(d.f) fRet = ts;
    });

    const volLimit = getVoluntaryWeeksLimit();

    D.counts.mom_vol.innerText = `${(counts.m_vol/7).toFixed(1)}/${volLimit} sem`;
    D.counts.mom_lac.innerText = `${counts.m_lac} días`;
    D.counts.mom_vac.innerText = `${counts.m_vac} días`;
    D.counts.dad_vol.innerText = `${(counts.f_vol/7).toFixed(1)}/${volLimit} sem`;
    D.counts.dad_lac.innerText = `${counts.f_lac} días`;
    D.counts.dad_vac.innerText = `${counts.f_vac} días`;
    
    const limitDays = volLimit * 7;
    D.counts.mom_vol.className = counts.m_vol > limitDays ? 'text-[9px] text-red-600 font-bold' : 'text-[9px] text-slate-500';
    D.counts.dad_vol.className = counts.f_vol > limitDays ? 'text-[9px] text-red-600 font-bold' : 'text-[9px] text-slate-500';

    const dateOpts = { day: 'numeric', month: 'short', year: '2-digit' };
    if(maxDate > 0) {
        const covDate = new Date(maxDate); D.metrics.coverage.innerText = covDate.toLocaleDateString('es-ES', dateOpts);
        const diffWeeks = Math.ceil(Math.abs(maxDate - state.birthDate.getTime()) / (1000 * 60 * 60 * 24 * 7)); 
        D.metrics.cov_weeks.innerText = `${diffWeeks} sem cubiertas`;
    } else { D.metrics.coverage.innerText = '--'; D.metrics.cov_weeks.innerText = '0 sem cubiertas'; }
    if(mRet > 0) { const d = new Date(mRet); d.setDate(d.getDate()+1); D.metrics.mom_ret.innerText = d.toLocaleDateString('es-ES', dateOpts); } else D.metrics.mom_ret.innerText = '--';
    if(fRet > 0) { const d = new Date(fRet); d.setDate(d.getDate()+1); D.metrics.dad_ret.innerText = d.toLocaleDateString('es-ES', dateOpts); } else D.metrics.dad_ret.innerText = '--';
    D.metrics.overlap.innerText = `${counts.overlap} días`;
}

function formatDate(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function formatDateInput(d) { return formatDate(d); }
function formatDateDisplay(d) { return d.toLocaleDateString('es-ES'); }