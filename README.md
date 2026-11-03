# Indumetálicas El Omnipotente · Catálogo

Catálogo de puertas, ventanas, portones y combos con botón a WhatsApp.

- **Clientes:** `index.html` (el enlace que se comparte).
- **Ella:** `entrar.html` (PIN de 6 números) y `catalogo.html` (Mi catálogo).

Basado en el catálogo de Herrería Artesanos (misma lógica y especificaciones por producto), con estilo propio.

## Técnico
- HTML, CSS y JS sin frameworks. GitHub Pages.
- Supabase: proyecto `jawqbrzarexwpgggnlxc` (tablas `catalogo`, `disponibles`, `sedes`, `perfiles`; bucket `catalogo-fotos`; RLS: todos leen, solo el admin escribe).
- Usuario: `taller@omnipotente.app` (el PIN es la contraseña).
- Al cambiar CSS/JS subir `?v=` en los HTML.
- Pruebas: `python3 -m http.server 8767` en la raíz y `node pruebas/test.js` (Playwright, iPhone 13, Supabase simulado).

La app vieja de Artesanos quedó en la rama `respaldo-app-vieja`.
