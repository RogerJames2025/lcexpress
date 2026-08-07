# LCexpress v10 — Supabase + PowerSync real

Esta versión usa PowerSync como base local SQLite y Supabase/PostgreSQL como base central.

## Configuración incluida
- Supabase Project URL: configurado en `index.html`.
- Supabase publishable key: configurada en `index.html`.
- PowerSync URL: configurada en `src/powersync.js`.
- Login persistente: Supabase Auth.
- Base local: PowerSync SQLite (OPFSCoopSyncVFS).
- Escrituras offline: quedan en `ps_crud` y se suben cuando vuelve Internet.

## Compilar para publicar
Requiere Node.js 22+.

```bash
npm install
npm run build
```

Publica el contenido de la carpeta `dist/` en un hosting HTTPS (Cloudflare Pages, Netlify, Vercel, etc.).

## Importante
No abras `index.html` directamente con `file://`. PowerSync, cámara, service workers y PWA necesitan un origen web/HTTPS.

## Primera carga de inventario
Si Supabase/PowerSync todavía no contiene productos, el primer ADMIN autenticado cargará el inventario embebido de LCexpress a la base local y PowerSync lo subirá a Supabase. Haz esta primera carga con buena conexión y espera a que el indicador muestre `SINCRONIZADO` antes de iniciar otro dispositivo.

## Prueba offline recomendada
1. Inicia sesión con Internet.
2. Espera `SINCRONIZADO`.
3. Busca un producto y un cliente.
4. Activa modo avión.
5. Crea/modifica datos o un pedido.
6. Verifica que la app continúe funcionando.
7. Quita modo avión y espera a que cambios pendientes llegue a 0.
8. Comprueba los registros en Supabase Table Editor.
