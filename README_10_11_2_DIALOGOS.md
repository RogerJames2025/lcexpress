# Avance acumulativo — NO PUBLICAR
Base: Gastos_Rentabilidad_NO_PUBLICAR. Sustitución de llamadas nativas en index.html y módulos src por LCDialog, con estilo lc111-dialog existente. Confirmaciones y entradas esperan respuesta; Escape/cancelar devuelve false o null. Avisos son no bloqueantes y se encolan. El service worker incluye el nuevo script local. Exportadores independientes conservan diagnóstico en consola si LCDialog no está disponible.

Validación: node --check de scripts JS e inline; búsqueda estática de llamadas nativas. No se ejecutaron pruebas de navegador, Vite, PostgreSQL ni PowerSync. Verificar especialmente foco, doble pulsación, cambios de estado durante confirmaciones asíncronas y acciones destructivas. No ejecutar migraciones ni publicar.

Pendiente: cola offline durable de rutas, conflictos de vehículos/odómetro, seguridad de pedidos por ruta, mantenimiento personal, pruebas integrales. La cola actual de rutas es un reintento de una operación en localStorage, no soporte offline completo.
