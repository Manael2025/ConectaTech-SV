INSERT INTO categorias (id, nombre, descripcion) VALUES
  (1, 'Audio', 'Audífonos para estudiar, trabajar y entretenerte'),
  (2, 'Cargadores y cables', 'Carga rápida y conexiones confiables'),
  (3, 'Fundas y protección', 'Protege tu celular de golpes y rayones'),
  (4, 'Accesorios de escritorio', 'Mejora tu espacio de estudio y trabajo');

INSERT INTO productos (nombre, descripcion, precio, precio_oferta, en_oferta, stock, imagen, categoria_id) VALUES
  ('Audífonos inalámbricos Bluetooth', 'Audífonos Bluetooth con estuche de carga y buena autonomía.', 25.00, 22.00, 1, 30, '/img/audifonos-bluetooth.jpg', 1),
  ('Audífonos con cable y micrófono', 'Audífonos con micrófono integrado, ideales para clases virtuales.', 8.00, NULL, 0, 50, '/img/audifonos-cable.jpg', 1),
  ('Cargador rápido USB-C 20W', 'Cargador de pared con carga rápida de 20W.', 12.00, 10.00, 1, 40, '/img/cargador-usbc.jpg', 2),
  ('Cable USB-C a USB-C (1 m)', 'Cable resistente de 1 metro para carga y datos.', 5.00, NULL, 0, 80, '/img/cable-usbc.jpg', 2),
  ('Funda protectora para celular', 'Funda que absorbe golpes y protege los bordes.', 7.00, NULL, 0, 60, '/img/funda-celular.jpg', 3),
  ('Protector de pantalla de vidrio templado', 'Vidrio templado resistente a rayones y golpes.', 4.00, NULL, 0, 100, '/img/protector-vidrio.jpg', 3),
  ('Mouse inalámbrico', 'Mouse inalámbrico cómodo, con receptor USB.', 10.00, NULL, 0, 35, '/img/mouse-inalambrico.jpg', 4),
  ('Soporte ajustable para laptop', 'Soporte plegable y ajustable para trabajar con mejor postura.', 15.00, NULL, 0, 25, '/img/soporte-laptop.jpg', 4);

INSERT INTO cupones (codigo, porcentaje, activo) VALUES
  ('BIENVENIDO10', 10, 1),
  ('ESTUDIANTE5', 5, 1);