-- Verificación rápida de la infraestructura LCexpress v10
SELECT rolname, rolreplication, rolbypassrls
FROM pg_roles WHERE rolname = 'powersync_repl';

SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'powersync'
ORDER BY tablename;

SELECT count(*) AS productos FROM public.productos;
SELECT count(*) AS clientes FROM public.clientes;
SELECT count(*) AS pedidos FROM public.pedidos;
SELECT count(*) AS pedido_detalle FROM public.pedido_detalle;
