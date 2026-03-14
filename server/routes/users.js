import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const userRoutes = Router();

userRoutes.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, picture, email } = req.body || {};

    if (!id) return res.status(400).json({ error: 'userId required' });

    const user = await prisma.user.upsert({
      where: { id },
      create: {
        id,
        email: email || `${id}@google`,
        name: name || null,
        picture: picture || null
      },
      update: {
        ...(name !== undefined ? { name } : {}),
        ...(picture !== undefined ? { picture } : {}),
        ...(email ? { email } : {})
      }
    });

    return res.json({
      id: user.id,
      name: user.name,
      picture: user.picture,
      email: user.email
    });
  } catch (err) {
    console.error('[Users]', err);
    return res.status(500).json({ error: 'failed to update user' });
  }
});
