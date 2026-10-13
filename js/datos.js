export async function cargarJSON(ruta) {
  const respuesta = await fetch(ruta);
  if (!respuesta.ok) {
    throw new Error(`No se pudo cargar ${ruta} (error ${respuesta.status})`);
  }
  return respuesta.json();
}

export const almacenamiento = {
  leer(clave, valorPorDefecto) {
    const guardado = localStorage.getItem(clave);
    return guardado ? JSON.parse(guardado) : valorPorDefecto;
  },
  guardar(clave, valor) {
    localStorage.setItem(clave, JSON.stringify(valor));
  },
  borrar(clave) {
    localStorage.removeItem(clave);
  },
  vaciar() {
    localStorage.clear();
  },
};
