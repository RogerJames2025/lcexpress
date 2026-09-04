# LCexpress v10.9.8

Incluye la protección contra tomas duplicadas de v10.9.7.

- Pantalla principal: categoría oculta; sigue siendo obligatoria al crear/modificar producto.
- Último conteo: sin hora y fecha corta D/M/AAAA.
- Más → Operación → Calendario de rutas, navegable por meses, con días de ruta, nombres y días transcurridos entre rutas.
- Clientes: Tipo de comercio (BARBERIA, SALON, NAILS, LASHES, MASAJES, ACADEMIA, SUPPLY, PUBLICO).
- Clientes: marca NO VISITAR con motivo, reversible, visible en lista/ficha y excluida de pedidos nuevos.
- Ver pedido: Departamento, Municipio y Distrito.

Instalación:
1. Confirme Cambios pendientes = 0 en v10.9.6.
2. Ejecute SQL_MIGRACION_v10_9_8_CLIENTES.sql.
3. En PowerSync, Save and Deploy de Sync Streams para refrescar columnas nuevas de clientes.
4. Despliegue v10.9.8 y ábrala con Internet una vez.
