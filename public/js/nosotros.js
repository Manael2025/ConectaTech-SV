async function cargarTarifas() {
  const cuerpo = document.getElementById('tarifas');
  const gratis = document.getElementById('envio-gratis');

  try {
    const opciones = await pedirApi('/api/pedidos/opciones');

    // Agrupa los departamentos que tienen el mismo costo
    const grupos = new Map();
    for (const d of opciones.departamentos) {
      if (!grupos.has(d.costo)) grupos.set(d.costo, []);
      grupos.get(d.costo).push(d.nombre);
    }

    cuerpo.innerHTML = [...grupos.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([costo, nombres]) => `
        <tr>
          <td><strong>${dinero(costo)}</strong></td>
          <td>${esc(nombres.join(', '))}</td>
        </tr>`).join('');

    gratis.textContent = 'Envío gratis en pedidos desde ' + dinero(opciones.envioGratisDesde) + '.';
  } catch (error) {
    cuerpo.innerHTML = '<tr><td colspan="2">No se pudieron cargar las tarifas.</td></tr>';
  }
}

cargarTarifas();