# LCexpress v10.8.4 — Corrección formulario Agregar cliente

Corrige una regresión donde faltaban las funciones `llenarDepartamentos`, `cargarMunicipios` y `cargarDistritos`. `nuevoCliente()` las invocaba antes de abrir el diálogo, por lo que JavaScript se detenía y el formulario nunca aparecía.

También cierra el visor de clientes antes de abrir el formulario de alta y muestra un error visible si el diálogo no pudiera abrirse. No requiere cambios SQL ni cambios de Sync Streams.
