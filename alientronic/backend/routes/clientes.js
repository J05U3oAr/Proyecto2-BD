const express = require('express');
const pool    = require('../db');
const { requireAuth } = require('../middleware/auth');
const router  = express.Router();

// GET /api/clientes
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cliente ORDER BY id_cliente');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener clientes.' });
  }
});

// GET /api/clientes/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cliente WHERE id_cliente=$1', [req.params.id]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener cliente.' });
  }
});

// POST /api/clientes
router.post('/', requireAuth, async (req, res) => {
  const { nombre, email, telefono } = req.body;
  if (!nombre || !email || !telefono)
    return res.status(400).json({ error: 'Nombre, email y teléfono son requeridos.' });

  try {
    const result = await pool.query(
      'INSERT INTO cliente (nombre, email, telefono) VALUES ($1,$2,$3) RETURNING *',
      [nombre, email, telefono]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'Ya existe un cliente con ese email.' });
    res.status(500).json({ error: 'Error al crear cliente.' });
  }
});

// PUT /api/clientes/:id
router.put('/:id', requireAuth, async (req, res) => {
  const { nombre, email, telefono } = req.body;
  if (!nombre || !email || !telefono)
    return res.status(400).json({ error: 'Nombre, email y teléfono son requeridos.' });

  try {
    const result = await pool.query(
      'UPDATE cliente SET nombre=$1, email=$2, telefono=$3 WHERE id_cliente=$4 RETURNING *',
      [nombre, email, telefono, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'Ya existe un cliente con ese email.' });
    res.status(500).json({ error: 'Error al actualizar cliente.' });
  }
});

// DELETE /api/clientes/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const check = await pool.query('SELECT 1 FROM venta WHERE id_cliente=$1 LIMIT 1', [req.params.id]);
    if (check.rows.length > 0)
      return res.status(409).json({ error: 'No se puede eliminar: el cliente tiene ventas asociadas.' });

    const result = await pool.query('DELETE FROM cliente WHERE id_cliente=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar cliente.' });
  }
});

module.exports = router;
