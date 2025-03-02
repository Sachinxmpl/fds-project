import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const router = Router();
const prisma = new PrismaClient();

// Get user profile
router.get('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
       res.status(404).json({ message: 'User not found' });
       return
    }

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { username, email, password } = req.body;

    const updateData: any = {};

    if (username) updateData.username = username;
    if (email) updateData.email = email;
    
    // If password is provided, hash it
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // If username is updated, update avatar
    if (username) {
      updateData.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

export default router;