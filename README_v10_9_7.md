# LCexpress v10.9.7 — Tomas de inventario sin duplicados

## Qué corrige
- El botón para iniciar toma queda bloqueado inmediatamente después del primer toque/clic.
- Un segundo toque mientras se crea la toma no hace nada.
- Antes de crear, la app vuelve a leer `inventarios` de PowerSync.
- Solo considera activas las tomas `EN_CONTEO` o `PENDIENTE_AUTORIZACION`.
- Si ya existe una toma activa, no crea otra y abre la existente.
- Si el correlativo local apunta a un número que ya existe, busca automáticamente el siguiente libre.
- El siguiente correlativo se guarda basándose en el número realmente utilizado.
- Incluye un índice parcial de Supabase para que el servidor también impida que existan dos tomas activas a la vez.

## No se modificó
- Aceptación del inventario.
- Conteo físico.
- Ajustes de inventario.
- Existencias.
- Pedidos.
- Rutas.
- Historial de movimientos.

## SQL
Ejecute `SQL_v10_9_7_PROTEGER_TOMAS_DUPLICADAS.sql` cuando Estado nube tenga `Cambios pendientes: 0`.

No se crea todavía un índice UNIQUE sobre `numero`, porque ya existen correlativos históricos duplicados (INV000002). Eso se puede normalizar después sin tocar existencias.
