import { cargarJSON, almacenamiento } from './datos.js';

const { Modal, Offcanvas } = bootstrap;

const CLAVE_CARRITO = 'cafeOrigen.carrito';
const CLAVE_ENVIO = 'cafeOrigen.envio';
const LIMITE_POR_PRODUCTO = 10;

const estado = {
  productos: [],
  envios: [],
  carrito: [],
  envioElegido: null,
};

const elementos = {
  indicadorCarga: document.getElementById('indicadorCarga'),
  errorCatalogo: document.getElementById('errorCatalogo'),
  listaProductos: document.getElementById('listaProductos'),
  campoBusqueda: document.getElementById('campoBusqueda'),
  selectorCategoria: document.getElementById('selectorCategoria'),
  selectorOrden: document.getElementById('selectorOrden'),
  contadorCarrito: document.getElementById('contadorCarrito'),
  panelCarrito: document.getElementById('panelCarrito'),
  listaCarrito: document.getElementById('listaCarrito'),
  resumenCarrito: document.getElementById('resumenCarrito'),
  selectorEnvio: document.getElementById('selectorEnvio'),
  subtotalCarrito: document.getElementById('subtotalCarrito'),
  envioCarrito: document.getElementById('envioCarrito'),
  totalCarrito: document.getElementById('totalCarrito'),
  botonFinalizar: document.getElementById('botonFinalizar'),
  botonVaciar: document.getElementById('botonVaciar'),
  modalCompra: document.getElementById('modalCompra'),
  formularioCompra: document.getElementById('formularioCompra'),
  grupoDireccion: document.getElementById('grupoDireccion'),
  campoNombre: document.getElementById('campoNombre'),
  campoDireccion: document.getElementById('campoDireccion'),
  totalCompra: document.getElementById('totalCompra'),
};

const formatoPrecio = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

function mostrarAviso(mensaje, esError = false) {
  Toastify({
    text: mensaje,
    duration: 2500,
    gravity: 'bottom',
    position: 'right',
    style: { background: esError ? '#b3261e' : '#2f6f4e' },
  }).showToast();
}

async function pedirConfirmacion(titulo, texto, textoBoton) {
  const { isConfirmed } = await Swal.fire({
    title: titulo,
    text: texto,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: textoBoton,
    cancelButtonText: 'Cancelar',
  });
  return isConfirmed;
}

// ---------- Catálogo ----------

function filtrarProductos() {
  const termino = elementos.campoBusqueda.value.trim().toLowerCase();
  const categoria = elementos.selectorCategoria.value;

  const coincidentes = estado.productos.filter(
    (producto) =>
      (categoria === 'todas' || producto.categoria === categoria) &&
      [producto.nombre, producto.descripcion].some((campo) => campo.toLowerCase().includes(termino))
  );

  const comparadores = {
    'precio-asc': (productoA, productoB) => productoA.precio - productoB.precio,
    'precio-desc': (productoA, productoB) => productoB.precio - productoA.precio,
  };
  const comparador = comparadores[elementos.selectorOrden.value];
  return comparador ? coincidentes.sort(comparador) : coincidentes;
}

function crearTarjetaProducto({ id, nombre, categoria, descripcion, precio, stock, imagen }) {
  return `
    <div class="col-sm-6 col-lg-3">
      <article class="card h-100 tarjeta-producto">
        <img src="${imagen}" class="card-img-top" alt="${nombre}">
        <div class="card-body d-flex flex-column">
          <span class="badge text-bg-secondary align-self-start mb-2">${categoria}</span>
          <h2 class="h6 card-title">${nombre}</h2>
          <p class="card-text small text-muted">${descripcion}</p>
          <p class="mt-auto mb-2"><strong>${formatoPrecio.format(precio)}</strong>
            ${stock <= 5 ? `<small class="text-danger ms-1">¡Quedan ${stock}!</small>` : ''}</p>
          <button class="btn btn-dark" data-id="${id}">Agregar al carrito</button>
        </div>
      </article>
    </div>`;
}

function renderizarProductos() {
  const productos = filtrarProductos();
  elementos.listaProductos.innerHTML = productos.length
    ? productos.map(crearTarjetaProducto).join('')
    : '<p class="text-muted">No hay productos que coincidan con tu búsqueda.</p>';
}

function renderizarCategorias() {
  const categorias = [...new Set(estado.productos.map(({ categoria }) => categoria))];
  elementos.selectorCategoria.innerHTML =
    '<option value="todas">Todas las categorías</option>' +
    categorias.map((categoria) => `<option>${categoria}</option>`).join('');
}

// ---------- Carrito ----------

function detallarCarrito() {
  return estado.carrito.map(({ id, cantidad }) => {
    const producto = estado.productos.find((productoCatalogo) => productoCatalogo.id === id);
    return { ...producto, cantidad, subtotal: producto.precio * cantidad };
  });
}

function calcularTotales(detalle) {
  const subtotal = detalle.reduce((acumulado, item) => acumulado + item.subtotal, 0);
  const costoEnvio = detalle.length ? estado.envioElegido.costo : 0;
  return { subtotal, costoEnvio, total: subtotal + costoEnvio };
}

function guardarCarrito() {
  if (estado.carrito.length) {
    almacenamiento.guardar(CLAVE_CARRITO, estado.carrito);
  } else {
    almacenamiento.borrar(CLAVE_CARRITO);
  }
}

function crearItemCarrito({ id, nombre, precio, cantidad, subtotal, imagen }) {
  return `
    <article class="item-carrito">
      <img src="${imagen}" alt="${nombre}">
      <div class="flex-grow-1">
        <h3 class="h6 mb-1">${nombre}</h3>
        <small class="text-muted">${formatoPrecio.format(precio)} c/u</small>
        <div class="d-flex align-items-center gap-2 mt-1">
          <div class="btn-group btn-group-sm" role="group" aria-label="Cantidad">
            <button class="btn btn-outline-secondary" data-accion="restar" data-id="${id}">−</button>
            <span class="btn btn-light disabled px-3">${cantidad}</span>
            <button class="btn btn-outline-secondary" data-accion="sumar" data-id="${id}">+</button>
          </div>
          <button class="btn btn-sm text-danger" data-accion="quitar" data-id="${id}" aria-label="Quitar ${nombre}">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
      <strong>${formatoPrecio.format(subtotal)}</strong>
    </article>`;
}

function renderizarCarrito() {
  const detalle = detallarCarrito();
  const { subtotal, costoEnvio, total } = calcularTotales(detalle);

  elementos.contadorCarrito.textContent = detalle.reduce((acumulado, { cantidad }) => acumulado + cantidad, 0);
  elementos.listaCarrito.innerHTML = detalle.length
    ? detalle.map(crearItemCarrito).join('')
    : '<p class="text-muted">Tu carrito está vacío. ¡Agregá algún producto!</p>';
  elementos.resumenCarrito.hidden = !detalle.length;

  elementos.subtotalCarrito.textContent = formatoPrecio.format(subtotal);
  elementos.envioCarrito.textContent = costoEnvio ? formatoPrecio.format(costoEnvio) : 'Gratis';
  elementos.totalCarrito.textContent = formatoPrecio.format(total);
}

function cambiarCantidad(idProducto, nuevaCantidad) {
  const producto = estado.productos.find(({ id }) => id === idProducto);
  const limite = Math.min(producto.stock, LIMITE_POR_PRODUCTO);

  if (nuevaCantidad > limite) {
    mostrarAviso(`Máximo disponible de ${producto.nombre}: ${limite}`, true);
    return false;
  }
  const existeEnCarrito = estado.carrito.some(({ id }) => id === idProducto);
  if (nuevaCantidad <= 0) {
    estado.carrito = estado.carrito.filter(({ id }) => id !== idProducto);
  } else if (existeEnCarrito) {
    estado.carrito = estado.carrito.map((item) => (item.id === idProducto ? { ...item, cantidad: nuevaCantidad } : item));
  } else {
    estado.carrito = [...estado.carrito, { id: idProducto, cantidad: nuevaCantidad }];
  }
  guardarCarrito();
  renderizarCarrito();
  return true;
}

function agregarAlCarrito(idProducto) {
  const itemExistente = estado.carrito.find(({ id }) => id === idProducto);
  const cantidadActual = itemExistente ? itemExistente.cantidad : 0;

  if (cambiarCantidad(idProducto, cantidadActual + 1)) {
    mostrarAviso('Producto agregado al carrito');
  }
}

function manejarAccionCarrito(evento) {
  const boton = evento.target.closest('[data-accion]');
  if (!boton) return;

  const idProducto = Number(boton.dataset.id);
  const { cantidad } = estado.carrito.find(({ id }) => id === idProducto);
  const nuevaCantidad = { sumar: cantidad + 1, restar: cantidad - 1, quitar: 0 }[boton.dataset.accion];
  cambiarCantidad(idProducto, nuevaCantidad);
}

async function vaciarCarrito() {
  const confirmado = await pedirConfirmacion('¿Vaciar el carrito?', 'Se quitarán todos los productos.', 'Sí, vaciar');
  if (!confirmado) return;

  estado.carrito = [];
  almacenamiento.vaciar();
  renderizarCarrito();
  mostrarAviso('Carrito vaciado');
}

function renderizarEnvios() {
  elementos.selectorEnvio.innerHTML = estado.envios
    .map(({ id, nombre, costo }) => `<option value="${id}">${nombre} (${costo ? formatoPrecio.format(costo) : 'gratis'})</option>`)
    .join('');
  elementos.selectorEnvio.value = estado.envioElegido.id;
}

function elegirEnvio() {
  estado.envioElegido = estado.envios.find(({ id }) => id === elementos.selectorEnvio.value);
  almacenamiento.guardar(CLAVE_ENVIO, estado.envioElegido.id);
  renderizarCarrito();
}

// ---------- Compra ----------

function abrirFormularioCompra() {
  const { total } = calcularTotales(detallarCarrito());
  const { requiereDireccion } = estado.envioElegido;

  elementos.totalCompra.textContent = formatoPrecio.format(total);
  elementos.grupoDireccion.hidden = !requiereDireccion;
  elementos.campoDireccion.required = requiereDireccion;
  elementos.formularioCompra.classList.remove('was-validated');

  elementos.panelCarrito.addEventListener(
    'hidden.bs.offcanvas',
    () => Modal.getOrCreateInstance(elementos.modalCompra).show(),
    { once: true }
  );
  Offcanvas.getInstance(elementos.panelCarrito).hide();
}

async function confirmarCompra(evento) {
  evento.preventDefault();
  if (!elementos.formularioCompra.checkValidity()) {
    elementos.formularioCompra.classList.add('was-validated');
    mostrarAviso('Revisá los datos del formulario', true);
    return;
  }

  const { total } = calcularTotales(detallarCarrito());
  const confirmado = await pedirConfirmacion('¿Confirmar la compra?', `Vas a pagar ${formatoPrecio.format(total)}.`, 'Sí, comprar');
  if (!confirmado) return;

  const nombre = elementos.campoNombre.value.trim();
  const numeroPedido = `CO-${Date.now().toString(36).toUpperCase()}`;
  const { dias, nombre: nombreEnvio } = estado.envioElegido;
  const entrega = dias ? `entrega estimada en ${dias} días hábiles` : 'retiro disponible hoy';

  Modal.getInstance(elementos.modalCompra).hide();
  estado.carrito = [];
  almacenamiento.vaciar();
  elementos.formularioCompra.reset();
  renderizarCarrito();

  await Swal.fire({
    icon: 'success',
    title: '¡Compra confirmada!',
    html: `Gracias, <b></b>.<br>Pedido <b>${numeroPedido}</b> · ${nombreEnvio} · ${entrega}.<br>Total: <b>${formatoPrecio.format(total)}</b>`,
    didOpen: (ventana) => {
      ventana.querySelector('b').textContent = nombre;
    },
    confirmButtonText: 'Seguir comprando',
  });
}

// ---------- Inicio ----------

function restaurarDatosGuardados() {
  const carritoGuardado = almacenamiento.leer(CLAVE_CARRITO, []);
  estado.carrito = carritoGuardado.filter(({ id }) => estado.productos.some((producto) => producto.id === id));

  const idEnvioGuardado = almacenamiento.leer(CLAVE_ENVIO, null);
  estado.envioElegido = estado.envios.find(({ id }) => id === idEnvioGuardado) || estado.envios[0];
}

async function iniciarAplicacion() {
  elementos.indicadorCarga.hidden = false;
  elementos.errorCatalogo.hidden = true;
  try {
    [estado.productos, estado.envios] = await Promise.all([
      cargarJSON('data/productos.json'),
      cargarJSON('data/envios.json'),
    ]);
    restaurarDatosGuardados();
    renderizarCategorias();
    renderizarProductos();
    renderizarEnvios();
    renderizarCarrito();
  } catch (error) {
    elementos.errorCatalogo.hidden = false;
    elementos.errorCatalogo.querySelector('span').textContent = error.message;
    mostrarAviso('No se pudo cargar el catálogo', true);
  } finally {
    elementos.indicadorCarga.hidden = true;
  }
}

elementos.listaProductos.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button[data-id]');
  if (boton) agregarAlCarrito(Number(boton.dataset.id));
});
elementos.listaCarrito.addEventListener('click', manejarAccionCarrito);
elementos.campoBusqueda.addEventListener('input', renderizarProductos);
elementos.selectorCategoria.addEventListener('change', renderizarProductos);
elementos.selectorOrden.addEventListener('change', renderizarProductos);
elementos.selectorEnvio.addEventListener('change', elegirEnvio);
elementos.botonVaciar.addEventListener('click', vaciarCarrito);
elementos.botonFinalizar.addEventListener('click', abrirFormularioCompra);
elementos.formularioCompra.addEventListener('submit', confirmarCompra);
document.getElementById('botonReintentar').addEventListener('click', iniciarAplicacion);

iniciarAplicacion();
