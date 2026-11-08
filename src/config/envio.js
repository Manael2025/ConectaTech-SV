// Tarifas de envío a domicilio por departamento, desde la sede en San Miguel.
// Son valores de ejemplo: ajústalos a los costos reales de tu negocio.
const TARIFAS = {
  // Local
  'San Miguel': 2.50,
  // Cercana
  'Usulután': 3.50,
  'Morazán': 3.50,
  'La Unión': 3.50,
  // Intermedia
  'San Vicente': 4.50,
  'Cabañas': 4.50,
  'La Paz': 4.50,
  'Cuscatlán': 4.50,
  'San Salvador': 4.50,
  'La Libertad': 4.50,
  // Lejana
  'Chalatenango': 5.50,
  'Santa Ana': 5.50,
  'Sonsonate': 5.50,
  'Ahuachapán': 5.50
};

// Si el pedido (ya con descuento) llega a este monto, el envío es gratis
const ENVIO_GRATIS_DESDE = 30;

const DEPARTAMENTOS = Object.keys(TARIFAS);

// Devuelve el costo, o null si el departamento no existe
function costoEnvio(departamento) {
  return Object.hasOwn(TARIFAS, departamento) ? TARIFAS[departamento] : null;
}

module.exports = { TARIFAS, DEPARTAMENTOS, ENVIO_GRATIS_DESDE, costoEnvio };