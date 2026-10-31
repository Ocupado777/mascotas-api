import express from 'express';
import { pool } from './db.js';

const app = express();
app.use(express.json());

const errorServidor = (res, e) => {
  console.error(e);
  res.status(500).json({ error: 'Error del servidor' });
};

// GET /mascota -> todas
app.get('/mascota', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM mascotas ORDER BY id');
    res.json(rows);
  } catch (e) {
    errorServidor(res, e);
  }
});

// GET /mascota/:valor -> por id (si es número) o por especie (si es texto)
app.get('/mascota/:valor', async (req, res) => {
  const { valor } = req.params;
  try {
    if (/^\d+$/.test(valor)) {
      const { rows } = await pool.query('SELECT * FROM mascotas WHERE id = $1', [valor]);
      if (rows.length === 0) return res.status(404).json({ error: 'Mascota no encontrada' });
      return res.json(rows[0]);
    }
    const { rows } = await pool.query(
      'SELECT * FROM mascotas WHERE LOWER(especie) = LOWER($1) ORDER BY id',
      [valor]
    );
    res.json(rows);
  } catch (e) {
    errorServidor(res, e);
  }
});

// POST /mascota -> crear
app.post('/mascota', async (req, res) => {
  const { nombre, especie, raza, edad } = req.body;
  if (!nombre || !especie) {
    return res.status(400).json({ error: 'nombre y especie son obligatorios' });
  }
  try {
    const { rows } = await pool.query(
      'INSERT INTO mascotas (nombre, especie, raza, edad) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, especie, raza, edad]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    errorServidor(res, e);
  }
});

// PUT /mascota -> actualizar (el id viene en el body)
app.put('/mascota', async (req, res) => {
  const { id, nombre, especie, raza, edad } = req.body;
  if (!id) return res.status(400).json({ error: 'id es obligatorio' });
  try {
    const { rows } = await pool.query(
      'UPDATE mascotas SET nombre = $1, especie = $2, raza = $3, edad = $4 WHERE id = $5 RETURNING *',
      [nombre, especie, raza, edad, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Mascota no encontrada' });
    res.json(rows[0]);
  } catch (e) {
    errorServidor(res, e);
  }
});

// DELETE /mascota -> eliminar (el id viene en el body)
app.delete('/mascota', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id es obligatorio' });
  try {
    const { rows } = await pool.query('DELETE FROM mascotas WHERE id = $1 RETURNING *', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Mascota no encontrada' });
    res.json({ mensaje: 'Mascota eliminada', mascota: rows[0] });
  } catch (e) {
    errorServidor(res, e);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API corriendo en http://localhost:${PORT}`));