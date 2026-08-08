# LCexpress v10.6.1

Cambios principales:
- Se elimina el envío automático de comprobantes por correo.
- Al finalizar un pedido, el PDF se comparte usando el menú nativo del sistema.
- En Android/iPhone se puede elegir WhatsApp, Gmail, Outlook, Mail u otra app compatible instalada.
- Por seguridad y por limitaciones de las PWA, una web no puede imponer WhatsApp como aplicación receptora de un archivo PDF; el sistema operativo decide el orden del panel de compartir.
- Si el navegador no soporta compartir archivos, el PDF se descarga para adjuntarlo manualmente.
- Se mantienen los cambios de clientes, vendedor por ítem, categorías/cajas/maletas editables y Google Maps.

No se necesita la Edge Function `enviar-pedido` ni un proveedor de correo en esta versión.
