# LCexpress v10.2 - Usuarios ADMIN

Esta versión agrega **Más → Usuarios** para usuarios ADMIN.

## Seguridad
La app NO contiene la Service Role Key. Crear/modificar usuarios se hace mediante una Supabase Edge Function (`usuarios-admin`) que verifica que el usuario que llama tenga `rol=ADMIN` y `activo=true`.

## Antes de usar el módulo
1. Ejecute `SQL_AUTO_PERFIL_USUARIOS.sql` una vez en Supabase SQL Editor.
2. Cree/depliegue la Edge Function `usuarios-admin` usando `supabase/functions/usuarios-admin/index.ts`.
3. Mantenga activada la verificación JWT de la función (no haga la función pública).
4. Suba/reemplace los archivos de esta versión en GitHub. Cloudflare reconstruirá automáticamente.

## Funciones
- Listar usuarios.
- Crear usuario con nombre, apellido, correo, contraseña, rol ADMIN/VENDEDOR.
- Activar/desactivar.
- Cambiar rol.
- Cambiar correo.
- Cambiar contraseña opcionalmente al editar.
- Evita que un ADMIN se desactive o se quite a sí mismo el rol ADMIN.

La creación/edición de credenciales requiere Internet. El funcionamiento normal de inventario/pedidos continúa siendo offline-first.
