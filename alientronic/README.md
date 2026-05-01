# ALIENTRONIC 🖥️
### Sistema de Gestión de Inventario y Ventas
**cc3088 - Bases de Datos 1 | Ciclo 1, 2026 | Universidad del Valle de Guatemala**

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Base de datos | PostgreSQL 15 |
| Backend | Node.js + Express |
| Frontend | HTML / CSS / JavaScript puro |
| Infraestructura | Docker + Docker Compose |

---

## Levantar el proyecto desde cero

### Requisitos previos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- Git

### Pasos

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd alientronic

# 2. Crear el archivo .env (copiar desde el ejemplo)
cp .env.example .env

# 3. Levantar todos los servicios
docker compose up --build
```

Eso es todo. En ~30 segundos los servicios estarán listos:

| Servicio | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:3000 |
| PostgreSQL | localhost:5432 |

### Credenciales de acceso
- **Usuario BD:** `proy2`
- **Contraseña BD:** `secret`
- **Login app:** `ana.garcia` / `password123`

También disponibles: `pedro.hdz`, `laura.jimenez`, `marcos.ruiz`, `elena.vargas` — todos con contraseña `password123`.

---

## Estructura del proyecto

```
alientronic/
├── docker-compose.yml
├── .env.example
├── .env
├── database/
│   └── init.sql           ← DDL + índices + VIEW + datos de prueba
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js          ← Entry point Express
│   ├── db.js              ← Pool de conexión PostgreSQL
│   ├── middleware/
│   │   └── auth.js        ← Middleware de autenticación
│   └── routes/
│       ├── auth.js        ← Login / Logout / Session
│       ├── productos.js   ← CRUD completo
│       ├── clientes.js    ← CRUD completo
│       ├── ventas.js      ← Registro con transacción explícita
│       ├── reportes.js    ← Todas las consultas SQL avanzadas
│       └── catalogos.js   ← Catálogos (categorías, proveedores, empleados)
└── frontend/
    ├── nginx.conf
    ├── login.html
    ├── css/style.css
    ├── js/app.js
    └── pages/
        ├── dashboard.html
        ├── productos.html
        ├── clientes.html
        ├── ventas.html
        └── reportes.html
```

---

## Funcionalidades implementadas

### I. Diseño de Base de Datos
- ✅ Diagrama ER con entidades, atributos, relaciones y cardinalidades
- ✅ Modelo relacional documentado
- ✅ Normalización justificada hasta 3FN
- ✅ DDL completo con `PRIMARY KEY`, `FOREIGN KEY`, `NOT NULL` y `CHECK`
- ✅ Script de datos de prueba con 25+ registros por tabla
- ✅ Índices explícitos (`CREATE INDEX`) en 4 columnas justificadas

### II. SQL (ejecutadas desde la app web)
- ✅ **3 consultas con JOIN** múltiple:
  - `GET /api/reportes/ventas-resumen` — venta + cliente + empleado + detalle
  - `GET /api/reportes/productos-detalle` — producto + categoría + proveedor
  - `GET /api/reportes/top-productos` — producto + categoría + detalle_venta
- ✅ **2 consultas con subquery**:
  - `GET /api/reportes/clientes-laptops` — subquery con `IN`
  - `GET /api/reportes/productos-sin-ventas` — subquery con `NOT EXISTS`
- ✅ **GROUP BY + HAVING + agregación**: `GET /api/reportes/empleados-ventas`
- ✅ **CTE (WITH) + Window Function**: `GET /api/reportes/ventas-mensuales`
- ✅ **VIEW** `vista_ventas_detalle` utilizado por el backend para alimentar la UI
- ✅ **Transacción explícita** con `BEGIN / COMMIT / ROLLBACK` en `POST /api/ventas`:
  - Verifica stock antes de insertar (con `FOR UPDATE`)
  - Revierte toda la operación si algún producto tiene stock insuficiente

### III. Aplicación Web
- ✅ **CRUD completo** de Productos y Clientes (crear, leer, actualizar, eliminar)
- ✅ Reporte de ventas visible en la UI con datos reales de la BD
- ✅ Manejo visible de errores: validaciones en frontend y mensajes de error del backend
- ✅ README con instrucciones funcionales (este archivo)

### IV. Avanzado
- ✅ **Autenticación** de usuarios con login/logout y sesión (`express-session`)
- ✅ **Exportar reporte a CSV** desde la UI (botón en página de Reportes)

---

## API Endpoints

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/me` | Verificar sesión activa |

### Productos (CRUD)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/productos` | Listar todos (con JOIN) |
| GET | `/api/productos/:id` | Obtener uno |
| POST | `/api/productos` | Crear |
| PUT | `/api/productos/:id` | Actualizar |
| DELETE | `/api/productos/:id` | Eliminar |

### Clientes (CRUD)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/clientes` | Listar todos |
| GET | `/api/clientes/:id` | Obtener uno |
| POST | `/api/clientes` | Crear |
| PUT | `/api/clientes/:id` | Actualizar |
| DELETE | `/api/clientes/:id` | Eliminar |

### Ventas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/ventas` | Listar todas (usa VIEW) |
| GET | `/api/ventas/:id` | Detalle completo |
| POST | `/api/ventas` | Registrar (transacción explícita) |

### Reportes
| Método | Ruta | SQL utilizado |
|--------|------|---------------|
| GET | `/api/reportes/ventas-resumen` | JOIN (4 tablas) |
| GET | `/api/reportes/productos-detalle` | JOIN (3 tablas) |
| GET | `/api/reportes/top-productos` | JOIN + GROUP BY |
| GET | `/api/reportes/empleados-ventas` | GROUP BY + HAVING + AVG/SUM |
| GET | `/api/reportes/clientes-laptops` | Subquery IN |
| GET | `/api/reportes/productos-sin-ventas` | Subquery NOT EXISTS |
| GET | `/api/reportes/ventas-mensuales` | CTE (WITH) + RANK() |
| GET | `/api/reportes/exportar-ventas-csv` | Export CSV desde VIEW |

---

## Detener el proyecto

```bash
docker compose down
```

Para eliminar también los datos de la base de datos:

```bash
docker compose down -v
```
