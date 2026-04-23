/**
 * PUNTO DE ENTRADA
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar UI
    APP.UI.init();
    
    // 2. Inicializar Eventos
    APP.Events.init();
    
    // 3. Cargar Estado previo
    if (APP.State.load()) {
        if (APP.State.birthDate) {
            APP.UI.elements.input.value = APP.Utils.formatDate(APP.State.birthDate);
            APP.Events.launchApp();
        }
    }

    // 4. Persistence Buttons
    document.getElementById('btnExport').onclick = () => APP.State.exportJSON();
    document.getElementById('btnExportPdf').onclick = () => APP.PDF.export();
    document.getElementById('btnImport').onclick = () => document.getElementById('importFile').click();
    document.getElementById('importFile').onchange = (e) => {
        if (e.target.files[0]) APP.State.importJSON(e.target.files[0]);
    };
    document.getElementById('btnSettings').onclick = () => APP.Settings.open();
});
