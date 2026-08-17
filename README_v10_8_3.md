# LCexpress v10.8.3 — Corrección de alta de clientes

- Conserva todas las funciones de v10.8.2.
- Corrige permisos/RLS de `clientes` para usuarios autenticados mediante `SQL_FIX_CLIENTES_v10_8_3.sql`.
- El formulario ahora muestra el error real si guardar un cliente falla.
- El botón Guardar cliente tiene `type=submit` explícito y muestra estado “Guardando…”.
- Valida claramente los campos obligatorios antes de guardar.
- Verifica que el cliente haya quedado en SQLite local antes de cerrar el formulario.
