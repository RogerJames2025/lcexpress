# LCexpress v10.11.2 — corrección ruta oficial en tableta

Caso verificado: Roxana tiene la ruta oficial R00046 abierta (`r112-077a7a9b-7b2d-47b6-8238-5b98017ac93e`), pero la tableta conserva una segunda apertura rechazada `RUTA_YA_ABIERTA` (`r112-0f1619da-f339-4a3e-9b4c-babec3d073c6`).

## Archivos modificados
- `src/ruta-dependencias112.js`: no reemplaza la ruta oficial por otra apertura local en conflicto; conserva bloqueo de cierre de la ruta oficial.
- `src/ruta112.js`: la ventana Ruta no invalida la ruta oficial por un conflicto que corresponde a otra ruta.
- `scripts/test-ruta-dependencias112.mjs`: cuatro aserciones adicionales de regresión.

No hay migraciones SQL ni cambios a las colas locales. La apertura rechazada permanece conservada para revisión administrativa. El botón de recuperación de confirmación oficial no puede confirmar una apertura rechazada.

## Validación realizada
`node scripts/test-ruta-dependencias112.mjs`: 12 aserciones superadas.
`node --check src/ruta112.js` y `node --check src/ruta-dependencias112.js`: OK.
Compilación Vite y pruebas en dispositivos reales: NO ejecutadas.

## Publicación
Publicar mediante flujo habitual de GitHub/Cloudflare. Conservar la versión anterior como respaldo. Abrir primero la URL publicada desde Chrome en la tableta; no borrar caché/almacenamiento ni reinstalar. Confirmar que la barra muestre R00046 y que Pedidos permita entrar. Verificar luego guardado real de un pedido legítimo con conexión antes de usar sin conexión.
