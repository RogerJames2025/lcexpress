# LCexpress v10.6.9

- Restaura **Más → Catálogos de productos** con mantenimiento de Categorías, Cajas y Maletas.
- Mantiene selección estricta: en Producto solo se puede guardar Categoría/Caja/Maleta existente y activa.
- Refuerza modo offline en PWA: cachea Supabase Auth y librerías de uso offline, conserva una sesión offline mínima y solicita almacenamiento persistente del navegador.
- Estado de nube ahora muestra conteos locales y si el dispositivo tiene datos locales preparados.
- Clientes incorpora Estado del local: ACTIVO, CERRADO TEMPORAL, CERRADO DEFINITIVO. Los cerrados permanecen visibles como historial y no aparecen para pedidos hasta reactivarlos.
- Ejecutar SQL_MIGRACION_v10_6_9_ESTADO_CLIENTE.sql en Supabase antes de publicar esta versión.
