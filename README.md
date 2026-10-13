# Café Origen – Simulador de compra online

Proyecto final de JavaScript. Tienda de café con el circuito completo de compra:
ver productos → filtrar/buscar → agregar al carrito → modificar cantidades → elegir envío → completar datos → confirmar.

## Cómo ejecutarlo

El catálogo se carga con `fetch`, por lo que hay que abrir el proyecto desde un servidor local
(no funciona con doble clic sobre `index.html`). Opciones:

- Extensión **Live Server** de VS Code → "Go Live".
- O desde la carpeta del proyecto: `python -m http.server 5500` y abrir http://localhost:5500

## Estructura

```
index.html
css/estilos.css
js/app.js       interfaz, carrito y compra
js/datos.js     fetch de los JSON y manejo de localStorage
data/productos.json, data/envios.json
assets/img/     imágenes de los productos
```

## Requisitos de la consigna

- **DOM / eventos:** render dinámico de productos y carrito; sin `alert`, `prompt` ni `confirm`.
- **JSON + fetch:** `productos.json` y `envios.json`, con `async/await`, `try/catch/finally` y mensaje de error con botón "Reintentar".
- **Funciones de orden superior:** `map`, `filter`, `reduce`, `find`, `some`, `sort`.
- **localStorage:** guarda el carrito y el envío elegido, modifica cantidades, borra items y vacía el storage.
- **Sintaxis avanzada:** operador ternario, `||` y destructuring.
- **Librerías:** Bootstrap, SweetAlert2 (confirmaciones) y Toastify (avisos).
