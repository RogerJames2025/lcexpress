# LCexpress v10.9.5 — Inventario seguro + modo offline real

## Correcciones de toma física
- Guardar avance fuerza primero el guardado de cualquier campo que todavía tenga el foco.
- Cada conteo digitado deja además un borrador local de seguridad en el dispositivo.
- Un valor 0 solo se considera un conteo real si fue capturado por un usuario; evita que un 0 técnico/sincronizado se confunda con un conteo físico.
- Cerrar / continuar luego ya NO vuelve a abrir automáticamente la misma toma en ese dispositivo.
- Al volver a entrar manualmente desde Historial de inventarios se reactiva normalmente.
- Durante la aceptación final se bloquean los refrescos automáticos para que la ventana no se cierre/reabra.
- La ventana se cierra antes del refresco general una vez que el inventario quedó ACEPTADO.
- La columna “Último conteo físico” de la pantalla principal usa únicamente el último inventario ACEPTADO, nunca una toma nueva o incompleta.
- Se agregó “Cancelar toma” con autorización ADMIN. Cancela sin cambiar existencias y conserva el historial.

## Correcciones offline
- Se agregó una copia auxiliar local de productos, clientes, pedidos, rutas, catálogos, inventarios y configuración.
- Si el módulo PowerSync no puede cargarse durante un arranque sin Internet, las búsquedas y combos usan esa copia local.
- Las altas/modificaciones hechas en ese modo se guardan en una cola auxiliar y se reproducen en PowerSync cuando vuelve Internet.
- El Service Worker ahora se coloca en `public/sw.js`, por lo que Vite lo incluye realmente en `dist`.
- Durante instalación/activación, el Service Worker analiza el index compilado y precarga también los assets JS/WASM con nombre hash generados por Vite.

## Importante para la toma actualmente atascada
Después de instalar v10.9.5 puede usar “Cerrar / continuar luego” y la ventana no se reabrirá sola.
Si la toma quedó dañada y desea descartarla sin afectar existencias, use “Cancelar toma” y autorice con un ADMIN.

No requiere SQL nuevo ni cambios de Sync Streams.
