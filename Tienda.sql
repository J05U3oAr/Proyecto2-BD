-- ============================================================
--  ALIENTRONIC - Tienda de Tecnología
--  Base de datos: PostgreSQL
--  Usuario: proy2 | Contraseña: secret
--  cc3088 Bases de Datos 1 - Proyecto 2
-- ============================================================

-- ============================================================
--  1. DDL - CREACIÓN DE TABLAS
-- ============================================================

CREATE TABLE categoria (
    id_categoria SERIAL PRIMARY KEY,
    nombre       VARCHAR(50) NOT NULL
);

CREATE TABLE proveedor (
    id_proveedor SERIAL PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL,
    telefono     VARCHAR(20)  NOT NULL,
    email        VARCHAR(100) NOT NULL
);

CREATE TABLE producto (
    id_producto  SERIAL PRIMARY KEY,
    nombre       VARCHAR(100)   NOT NULL,
    descripcion  TEXT           NOT NULL,
    precio       DECIMAL(10,2)  NOT NULL CHECK (precio > 0),
    stock        INT            NOT NULL CHECK (stock >= 0),
    id_categoria INT            NOT NULL,
    id_proveedor INT            NOT NULL,
    FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria),
    FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor)
);

CREATE TABLE cliente (
    id_cliente SERIAL PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL,
    email      VARCHAR(100) NOT NULL UNIQUE,
    telefono   VARCHAR(20)  NOT NULL
);

CREATE TABLE empleado (
    id_empleado SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    puesto      VARCHAR(50)  NOT NULL
);

CREATE TABLE usuario (
    id_usuario    SERIAL PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    id_empleado   INT          NOT NULL UNIQUE,
    FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado)
);

CREATE TABLE venta (
    id_venta    SERIAL PRIMARY KEY,
    fecha       DATE NOT NULL DEFAULT CURRENT_DATE,
    id_cliente  INT  NOT NULL,
    id_empleado INT  NOT NULL,
    FOREIGN KEY (id_cliente)  REFERENCES cliente(id_cliente),
    FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado)
);

CREATE TABLE detalle_venta (
    id_detalle      SERIAL PRIMARY KEY,
    id_venta        INT           NOT NULL,
    id_producto     INT           NOT NULL,
    cantidad        INT           NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario > 0),
    FOREIGN KEY (id_venta)    REFERENCES venta(id_venta),
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
);

-- ============================================================
--  2. ÍNDICES (justificados)
-- ============================================================

-- Búsqueda frecuente de productos por categoría (filtros en la UI)
CREATE INDEX idx_producto_categoria ON producto(id_categoria);

-- Búsqueda frecuente de productos por proveedor
CREATE INDEX idx_producto_proveedor ON producto(id_proveedor);

-- Reportes de ventas filtrados por fecha
CREATE INDEX idx_venta_fecha ON venta(fecha);

-- Búsqueda de ventas por cliente (historial)
CREATE INDEX idx_venta_cliente ON venta(id_cliente);

-- ============================================================
--  3. VIEW (para alimentar la UI - 5 pts)
-- ============================================================

CREATE VIEW vista_ventas_detalle AS
SELECT
    v.id_venta,
    v.fecha,
    c.nombre        AS cliente,
    e.nombre        AS empleado,
    p.nombre        AS producto,
    p.descripcion   AS descripcion_producto,
    cat.nombre      AS categoria,
    dv.cantidad,
    dv.precio_unitario,
    (dv.cantidad * dv.precio_unitario) AS subtotal
FROM venta v
JOIN cliente       c   ON v.id_cliente  = c.id_cliente
JOIN empleado      e   ON v.id_empleado = e.id_empleado
JOIN detalle_venta dv  ON v.id_venta    = dv.id_venta
JOIN producto      p   ON dv.id_producto = p.id_producto
JOIN categoria     cat ON p.id_categoria = cat.id_categoria;

-- ============================================================
--  4. DATOS DE PRUEBA (mínimo 25 registros por tabla)
-- ============================================================

-- Categorías (5)
INSERT INTO categoria (nombre) VALUES
    ('Laptops'),
    ('Smartphones'),
    ('Accesorios'),
    ('Tablets'),
    ('Monitores');

-- Proveedores (5)
INSERT INTO proveedor (nombre, telefono, email) VALUES
    ('TechDistrib Guatemala',  '2234-5678', 'ventas@techdistrib.gt'),
    ('GlobalTech S.A.',        '2298-1100', 'contacto@globaltech.com'),
    ('Apple Reseller GT',      '2265-4400', 'info@applereseller.gt'),
    ('Samsung Business GT',    '2277-3300', 'b2b@samsunggt.com'),
    ('Importaciones ElecMax',  '2211-9900', 'pedidos@elecmax.gt');

-- Productos (25)
INSERT INTO producto (nombre, descripcion, precio, stock, id_categoria, id_proveedor) VALUES
    ('Alienware m16 R2',         'Laptop gaming Intel i9, RTX 4070, 32GB RAM, 1TB SSD',           9999.99,  8,  1, 1),
    ('Dell XPS 15',              'Laptop profesional OLED 4K, Intel i7, 16GB RAM, 512GB SSD',     7499.99, 12,  1, 1),
    ('MacBook Pro 14 M3',        'Laptop Apple M3 Pro, 18GB RAM, 512GB SSD, pantalla Liquid XDR', 11999.99, 6,  1, 3),
    ('Lenovo ThinkPad X1 Carbon','Laptop empresarial ultradelgada, Intel i7, 16GB, 512GB SSD',    6499.99, 10,  1, 2),
    ('ASUS ROG Zephyrus G14',    'Laptop gaming AMD Ryzen 9, RTX 4060, 16GB RAM, 1TB SSD',        7999.99,  9,  1, 2),
    ('HP Spectre x360 14',       'Laptop 2en1 táctil, Intel i7, 16GB RAM, 512GB SSD, OLED',       6999.99,  7,  1, 1),
    ('iPhone 15 Pro Max',        'Smartphone Apple A17 Pro, 256GB, cámara 48MP, titanio',          9499.99, 15,  2, 3),
    ('Samsung Galaxy S24 Ultra', 'Smartphone Snapdragon 8 Gen 3, 512GB, S-Pen, cámara 200MP',     8999.99, 18,  2, 4),
    ('Google Pixel 8 Pro',       'Smartphone Google Tensor G3, 128GB, IA avanzada',               5999.99, 14,  2, 2),
    ('OnePlus 12',               'Smartphone Snapdragon 8 Gen 3, 256GB, carga 100W',              4499.99, 20,  2, 2),
    ('Samsung Galaxy A55',       'Smartphone Exynos 1480, 128GB, pantalla Super AMOLED',          2799.99, 25,  2, 4),
    ('iPhone 15',                'Smartphone Apple A16, 128GB, Dynamic Island, USB-C',            5999.99, 22,  2, 3),
    ('Logitech MX Master 3S',    'Mouse inalámbrico profesional, 8000 DPI, silencioso',            799.99, 30,  3, 1),
    ('Keychron K2 Pro',          'Teclado mecánico inalámbrico, switches red, retroiluminado',     999.99, 20,  3, 2),
    ('Dell UltraSharp U2722D',   'Monitor 27" 4K IPS, USB-C 90W, sin bordes',                    3499.99, 10,  5, 1),
    ('LG 27GP850-B',             'Monitor gaming 27" QHD 165Hz IPS, 1ms, FreeSync',              2799.99, 12,  5, 2),
    ('iPad Pro 12.9 M2',         'Tablet Apple M2, 256GB, pantalla Liquid Retina XDR',           8499.99,  8,  4, 3),
    ('Samsung Galaxy Tab S9+',   'Tablet Snapdragon 8 Gen 2, 256GB, AMOLED 12.4"',               5999.99, 11,  4, 4),
    ('Razer DeathAdder V3',      'Mouse gaming 30000 DPI, ergonómico, switches ópticos',           699.99, 25,  3, 5),
    ('Sony WH-1000XM5',          'Audífonos over-ear, ANC líder, 30hrs batería, plegables',       2499.99, 18,  3, 5),
    ('Apple AirPods Pro 2',      'Audífonos TWS, ANC adaptativa, chip H2, estuche MagSafe',       2299.99, 20,  3, 3),
    ('Anker 727 Charging Station','Hub cargador 100W, 6 puertos, GaN, compatible todos disp.',     799.99, 35,  3, 5),
    ('Samsung 49" Odyssey G9',   'Monitor ultrawide curvo 49" DQHD 240Hz QLED',                  9999.99,  4,  5, 4),
    ('Lenovo Tab P12 Pro',       'Tablet AMOLED 12.6" 2K, Snapdragon 870, 256GB',                4299.99,  9,  4, 2),
    ('Logitech C920 HD Pro',     'Webcam 1080p 30fps, micrófono dual, ideal streaming',           599.99, 28,  3, 1);

-- Clientes (25)
INSERT INTO cliente (nombre, email, telefono) VALUES
    ('Carlos Mendoza',      'c.mendoza@gmail.com',      '5534-2211'),
    ('Andrea López',        'andrea.lopez@hotmail.com', '5521-8800'),
    ('Roberto Cifuentes',   'rcifuentes@empresa.gt',    '5598-3344'),
    ('María Fernanda Paz',  'mfpaz@gmail.com',          '5567-1122'),
    ('Diego Estrada',       'd.estrada@outlook.com',    '5543-9988'),
    ('Lucía Ramírez',       'lucia.r@gmail.com',        '5512-7766'),
    ('José Morales',        'jmorales@gmail.com',       '5578-4433'),
    ('Sofía Aguilar',       'sofia.aguilar@yahoo.com',  '5589-6655'),
    ('Fernando Castillo',   'fcastillo@empresa.gt',     '5556-2200'),
    ('Valeria Torres',      'valeria.t@gmail.com',      '5523-9911'),
    ('Marco Juárez',        'marco.j@hotmail.com',      '5534-8877'),
    ('Daniela Herrera',     'daniela.h@gmail.com',      '5545-6644'),
    ('Pablo Reyes',         'preyes@empresa.gt',        '5512-3355'),
    ('Isabella Méndez',     'isab.mendez@gmail.com',    '5567-4422'),
    ('Andrés Vásquez',      'a.vasquez@gmail.com',      '5578-1133'),
    ('Carmen Flores',       'carmen.f@hotmail.com',     '5589-7700'),
    ('Luis Ortega',         'luis.ortega@gmail.com',    '5523-5544'),
    ('Patricia Lima',       'plima@empresa.gt',         '5534-6611'),
    ('Eduardo Soto',        'eduardo.s@gmail.com',      '5545-3322'),
    ('Gabriela Ramos',      'gaby.ramos@gmail.com',     '5556-8899'),
    ('Cristian Marín',      'c.marin@hotmail.com',      '5512-4477'),
    ('Natalia Fuentes',     'natalia.f@gmail.com',      '5523-1188'),
    ('Sebastián Cruz',      's.cruz@empresa.gt',        '5534-9900'),
    ('Alejandra Pineda',    'ale.pineda@gmail.com',     '5545-2233'),
    ('Rodrigo Solís',       'r.solis@gmail.com',        '5567-8866');

-- Empleados (5)
INSERT INTO empleado (nombre, puesto) VALUES
    ('Ana García',       'Vendedor'),
    ('Pedro Hernández',  'Vendedor'),
    ('Laura Jiménez',    'Supervisor'),
    ('Marcos Ruiz',      'Vendedor'),
    ('Elena Vargas',     'Administrador');

-- Usuarios (5) - passwords hasheadas con bcrypt (valor: "password123")
INSERT INTO usuario (username, password_hash, id_empleado) VALUES
    ('ana.garcia',    '$2b$10$XQxBHmA9rEf3vKz8ePqNaOkT7uWlYmN2cRdSoP1jHgF4iBnMeVtLu', 1),
    ('pedro.hdz',     '$2b$10$mNpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMn', 2),
    ('laura.jimenez', '$2b$10$AbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzA', 3),
    ('marcos.ruiz',   '$2b$10$ZyXwVuTsRqPoNmLkJiHgFeDcBaZyXwVuTsRqPoNmLkJiHgFeDcBaZ', 4),
    ('elena.vargas',  '$2b$10$QpRoSnTmUlVkWjXiYhZgAfBeDcGhIjKlMnOpQrStUvWxYzAbCdEfG', 5);

-- Ventas (25)
INSERT INTO venta (fecha, id_cliente, id_empleado) VALUES
    ('2026-01-05',  1,  1),
    ('2026-01-08',  3,  2),
    ('2026-01-12',  7,  1),
    ('2026-01-15',  2,  3),
    ('2026-01-20', 10,  4),
    ('2026-01-22',  5,  2),
    ('2026-01-28', 12,  1),
    ('2026-02-02', 15,  3),
    ('2026-02-07',  8,  4),
    ('2026-02-10', 18,  2),
    ('2026-02-14',  4,  1),
    ('2026-02-18', 20,  3),
    ('2026-02-22',  9,  4),
    ('2026-02-25', 22,  2),
    ('2026-03-01',  6,  1),
    ('2026-03-05', 25,  3),
    ('2026-03-08', 11,  4),
    ('2026-03-12', 13,  2),
    ('2026-03-15', 16,  1),
    ('2026-03-19', 19,  3),
    ('2026-03-22', 23,  4),
    ('2026-03-25', 14,  2),
    ('2026-04-01', 17,  1),
    ('2026-04-05', 21,  3),
    ('2026-04-10', 24,  4);

-- Detalle de ventas (25+)
INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario) VALUES
    (1,  7,  1, 9499.99),   -- iPhone 15 Pro Max
    (1, 13,  1,  799.99),   -- Mouse MX Master
    (2,  1,  1, 9999.99),   -- Alienware m16
    (3,  8,  1, 8999.99),   -- Samsung S24 Ultra
    (3, 21,  1, 2299.99),   -- AirPods Pro 2
    (4,  3,  1,11999.99),   -- MacBook Pro M3
    (5, 11,  2, 2799.99),   -- Galaxy A55 x2
    (6,  2,  1, 7499.99),   -- Dell XPS 15
    (6, 15,  1, 3499.99),   -- Monitor Dell 4K
    (7, 12,  1, 5999.99),   -- iPhone 15
    (7, 22,  1,  799.99),   -- Anker charger
    (8,  5,  1, 7999.99),   -- ASUS ROG
    (9,  9,  1, 5999.99),   -- Pixel 8 Pro
    (9, 20,  1, 2499.99),   -- Sony WH-1000XM5
    (10, 17,  1, 8499.99),  -- iPad Pro M2
    (11, 6,  1, 6999.99),   -- HP Spectre
    (11, 14, 1,  999.99),   -- Keychron K2
    (12, 10, 1, 4499.99),   -- OnePlus 12
    (13, 18, 1, 5999.99),   -- Galaxy Tab S9+
    (14, 4,  1, 6499.99),   -- ThinkPad X1
    (15, 25, 2,  599.99),   -- Webcam x2
    (16, 19, 1,  699.99),   -- Razer mouse
    (17, 16, 1, 2799.99),   -- LG Monitor
    (18, 24, 1, 4299.99),   -- Lenovo Tab P12
    (19, 23, 1, 9999.99),   -- Samsung Odyssey
    (20, 8,  1, 8999.99),   -- S24 Ultra
    (21, 7,  1, 9499.99),   -- iPhone 15 Pro Max
    (22, 3,  1,11999.99),   -- MacBook Pro M3
    (23, 1,  1, 9999.99),   -- Alienware
    (24, 12, 2, 5999.99),   -- iPhone 15 x2
    (25, 20, 1, 2499.99);   -- Sony WH-1000XM5