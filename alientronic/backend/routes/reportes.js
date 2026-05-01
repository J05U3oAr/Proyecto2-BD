const express = require('express');
const pool    = require('../db');
const { requireAuth } = require('../middleware/auth');
const router  = express.Router();

// ── JOIN 1: Ventas con cliente, empleado y total ──────────────────────────────
// GET /api/reportes/ventas-resumen
router.get('/ventas-resumen', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        v.id_venta,
        v.fecha,
        c.nombre   AS cliente,
        c.email    AS email_cliente,
        e.nombre   AS empleado,
        e.puesto,
        COUNT(dv.id_detalle)             AS num_productos,
        SUM(dv.cantidad * dv.precio_unitario) AS total
      FROM venta v
      JOIN cliente       c  ON v.id_cliente  = c.id_cliente
      JOIN empleado      e  ON v.id_empleado = e.id_empleado
      JOIN detalle_venta dv ON v.id_venta    = dv.id_venta
      GROUP BY v.id_venta, v.fecha, c.nombre, c.email, e.nombre, e.puesto
      ORDER BY v.fecha DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al generar reporte.' });
  }
});

// ── JOIN 2: Productos con categoría y proveedor ───────────────────────────────
// GET /api/reportes/productos-detalle
router.get('/productos-detalle', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id_producto,
        p.nombre,
        p.precio,
        p.stock,
        c.nombre  AS categoria,
        pr.nombre AS proveedor,
        pr.email  AS email_proveedor
      FROM producto p
      JOIN categoria c  ON p.id_categoria = c.id_categoria
      JOIN proveedor pr ON p.id_proveedor  = pr.id_proveedor
      ORDER BY c.nombre, p.nombre
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al generar reporte.' });
  }
});

// ── JOIN 3: Top productos más vendidos ────────────────────────────────────────
// GET /api/reportes/top-productos
router.get('/top-productos', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.nombre                              AS producto,
        cat.nombre                            AS categoria,
        SUM(dv.cantidad)                      AS total_vendido,
        SUM(dv.cantidad * dv.precio_unitario) AS ingresos_totales,
        p.stock                               AS stock_actual
      FROM detalle_venta dv
      JOIN producto   p   ON dv.id_producto  = p.id_producto
      JOIN categoria  cat ON p.id_categoria  = cat.id_categoria
      GROUP BY p.id_producto, p.nombre, cat.nombre, p.stock
      ORDER BY total_vendido DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al generar reporte.' });
  }
});

// ── GROUP BY + HAVING: Empleados con más de 3 ventas ─────────────────────────
// GET /api/reportes/empleados-ventas
router.get('/empleados-ventas', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        e.nombre                              AS empleado,
        e.puesto,
        COUNT(v.id_venta)                     AS total_ventas,
        SUM(dv.cantidad * dv.precio_unitario) AS total_ingresos,
        AVG(dv.cantidad * dv.precio_unitario) AS promedio_por_venta
      FROM empleado e
      JOIN venta         v  ON e.id_empleado = v.id_empleado
      JOIN detalle_venta dv ON v.id_venta    = dv.id_venta
      GROUP BY e.id_empleado, e.nombre, e.puesto
      HAVING COUNT(v.id_venta) > 3
      ORDER BY total_ingresos DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al generar reporte.' });
  }
});

// ── Subquery IN: Clientes que han comprado laptops ────────────────────────────
// GET /api/reportes/clientes-laptops
router.get('/clientes-laptops', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.nombre, c.email, c.telefono
      FROM cliente c
      WHERE c.id_cliente IN (
        SELECT v.id_cliente
        FROM venta v
        JOIN detalle_venta dv ON v.id_venta    = dv.id_venta
        JOIN producto      p  ON dv.id_producto = p.id_producto
        JOIN categoria     cat ON p.id_categoria = cat.id_categoria
        WHERE cat.nombre = 'Laptops'
      )
      ORDER BY c.nombre
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al generar reporte.' });
  }
});

// ── Subquery EXISTS: Productos que nunca se han vendido ───────────────────────
// GET /api/reportes/productos-sin-ventas
router.get('/productos-sin-ventas', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.nombre, p.precio, p.stock, cat.nombre AS categoria
      FROM producto p
      JOIN categoria cat ON p.id_categoria = cat.id_categoria
      WHERE NOT EXISTS (
        SELECT 1 FROM detalle_venta dv WHERE dv.id_producto = p.id_producto
      )
      ORDER BY p.nombre
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al generar reporte.' });
  }
});

// ── CTE (WITH): Ventas mensuales con ranking ──────────────────────────────────
// GET /api/reportes/ventas-mensuales
router.get('/ventas-mensuales', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      WITH ventas_mes AS (
        SELECT
          TO_CHAR(v.fecha, 'YYYY-MM') AS mes,
          COUNT(DISTINCT v.id_venta)              AS num_ventas,
          SUM(dv.cantidad * dv.precio_unitario)   AS total_mes
        FROM venta v
        JOIN detalle_venta dv ON v.id_venta = dv.id_venta
        GROUP BY TO_CHAR(v.fecha, 'YYYY-MM')
      )
      SELECT
        mes,
        num_ventas,
        total_mes,
        RANK() OVER (ORDER BY total_mes DESC) AS ranking
      FROM ventas_mes
      ORDER BY mes
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al generar reporte.' });
  }
});

// ── Exportar CSV de ventas ────────────────────────────────────────────────────
// GET /api/reportes/exportar-csv
router.get('/exportar-csv', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        v.id_venta, v.fecha,
        c.nombre AS cliente, c.email,
        e.nombre AS empleado,
        p.nombre AS producto,
        cat.nombre AS categoria,
        dv.cantidad, dv.precio_unitario,
        (dv.cantidad * dv.precio_unitario) AS subtotal
      FROM vista_ventas_detalle v
      JOIN venta vv ON v.id_venta = vv.id_venta
      JOIN cliente c ON vv.id_cliente = c.id_cliente
      JOIN empleado e ON vv.id_empleado = e.id_empleado
      JOIN detalle_venta dv ON vv.id_venta = dv.id_venta
      JOIN producto p ON dv.id_producto = p.id_producto
      JOIN categoria cat ON p.id_categoria = cat.id_categoria
      ORDER BY v.fecha DESC
    `);

    // Fallback: use vista_ventas_detalle directly
    const rows = result.rows.length > 0 ? result.rows : (await pool.query('SELECT * FROM vista_ventas_detalle ORDER BY fecha DESC')).rows;

    const headers = Object.keys(rows[0] || {});
    const csv = [
      headers.join(','),
      ...rows.map(row =>
        headers.map(h => {
          const val = row[h] === null ? '' : String(row[h]);
          return val.includes(',') ? `"${val}"` : val;
        }).join(',')
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte_ventas.csv"');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al exportar CSV.' });
  }
});

// Exportar CSV directo desde view
router.get('/exportar-ventas-csv', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vista_ventas_detalle ORDER BY fecha DESC');
    const rows = result.rows;
    if (rows.length === 0) return res.send('sin datos');

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map(row =>
        headers.map(h => {
          const val = row[h] === null ? '' : String(row[h]);
          return val.includes(',') ? `"${val}"` : val;
        }).join(',')
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ventas_detalle.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Error al exportar.' });
  }
});

module.exports = router;
