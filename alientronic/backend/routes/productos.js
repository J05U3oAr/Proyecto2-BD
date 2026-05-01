const express = require('express');
const pool    = require('../db');
const { requireAuth } = require('../middleware/auth');
const router  = express.Router();

// GET /api/productos - lista con JOIN a categoria y proveedor
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.nombre AS categoria, pr.nombre AS proveedor
      FROM producto p
      JOIN categoria c  ON p.id_categoria = c.id_categoria
      JOIN proveedor pr ON p.id_proveedor  = pr.id_proveedor
      ORDER BY p.id_producto
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos.' });
  }
});

// GET /api/productos/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.nombre AS categoria, pr.nombre AS proveedor
       FROM producto p
       JOIN categoria c  ON p.id_categoria = c.id_categoria
       JOIN proveedor pr ON p.id_proveedor  = pr.id_proveedor
       WHERE p.id_producto = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Producto no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener producto.' });
  }
});

// POST /api/productos
router.post('/', requireAuth, async (req, res) => {
  const { nombre, descripcion, precio, stock, id_categoria, id_proveedor } = req.body;
  if (!nombre || !descripcion || !precio || stock === undefined || !id_categoria || !id_proveedor)
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  if (precio <= 0) return res.status(400).json({ error: 'El precio debe ser mayor a 0.' });
  if (stock < 0)   return res.status(400).json({ error: 'El stock no puede ser negativo.' });

  try {
    const result = await pool.query(
      `INSERT INTO producto (nombre, descripcion, precio, stock, id_categoria, id_proveedor)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [nombre, descripcion, precio, stock, id_categoria, id_proveedor]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear producto.' });
  }
});

// PUT /api/productos/:id
router.put('/:id', requireAuth, async (req, res) => {
  const { nombre, descripcion, precio, stock, id_categoria, id_proveedor } = req.body;
  if (!nombre || !descripcion || !precio || stock === undefined || !id_categoria || !id_proveedor)
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });

  try {
    const result = await pool.query(
      `UPDATE producto SET nombre=$1, descripcion=$2, precio=$3, stock=$4,
       id_categoria=$5, id_proveedor=$6 WHERE id_producto=$7 RETURNING *`,
      [nombre, descripcion, precio, stock, id_categoria, id_proveedor, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Producto no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar producto.' });
  }
});

// DELETE /api/productos/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const check = await pool.query(
      'SELECT 1 FROM detalle_venta WHERE id_producto = $1 LIMIT 1',
      [req.params.id]
    );
    if (check.rows.length > 0)
      return res.status(409).json({ error: 'No se puede eliminar: el producto tiene ventas asociadas.' });

    const result = await pool.query(
      'DELETE FROM producto WHERE id_producto=$1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Producto no encontrado.' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar producto.' });
  }
});

module.exports = router;
