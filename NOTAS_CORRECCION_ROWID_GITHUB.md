# LCexpress v10.11.2 — paquete completo para reemplazo en GitHub

Base: ZIP `lcexpress-main (9).zip` proporcionado por el usuario.

Cambios funcionales: `src/lab18.js` (dos consultas) y `src/migracion23.js` (una consulta). Se sustituyó `ORDER BY rowid` por `ORDER BY id`, que es columna definida para tablas PowerSync. No se realizaron migraciones SQL ni se modificaron datos de dispositivos.

**Advertencia:** ordenar UUID por `id` no reproduce necesariamente el orden cronológico de creación de operaciones antiguas. Antes de utilizar esta versión con operaciones pendientes, verificar ese comportamiento. Este paquete no ha superado una prueba integral de pedidos en producción ni una compilación Vite verificada.

Publicación: subir el contenido de la carpeta `lcexpress-main/` a la raíz del repositorio, conservando rutas; no cargar la carpeta contenedora como subcarpeta. Antes de reemplazar, respaldar el repositorio actual. No borrar datos de Chrome, no ejecutar migraciones, no cerrar R00046.
