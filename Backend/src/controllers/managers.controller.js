import prisma from '../prisma/client.js';

export const listManagers = async (req, res) => {
  try {
    const managers = await prisma.user.findMany({
      where: { platformRole: 'EVENT_MANAGER' },
      include: {
        eventAssignments: {
          include: { event: true }
        }
      }
    });

    res.json(managers.map(manager => ({
      id: manager.id,
      name: manager.name,
      email: manager.email,
      role: manager.platformRole,
      events: manager.eventAssignments.map(ea => ({
        id: ea.event.id,
        name: ea.event.name
      }))
    })));
  } catch (error) {
    console.error('Error fetching managers:', error);
    res.status(500).json({ error: 'Failed to fetch managers' });
  }
};

export const createManager = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash(password, 10);

    const manager = await prisma.user.create({
      data: {
        name,
        email,
        phone: '',
        password: hashedPassword,
        platformRole: 'EVENT_MANAGER'
      }
    });

    res.status(201).json({
      id: manager.id,
      name: manager.name,
      email: manager.email,
      role: manager.platformRole
    });
  } catch (error) {
    console.error('Error creating manager:', error);
    res.status(500).json({ error: 'Failed to create manager' });
  }
};

export const updateManager = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    const manager = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email })
      }
    });

    res.json({
      id: manager.id,
      name: manager.name,
      email: manager.email,
      role: manager.platformRole
    });
  } catch (error) {
    console.error('Error updating manager:', error);
    res.status(500).json({ error: 'Failed to update manager' });
  }
};

export const removeManager = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing manager:', error);
    res.status(500).json({ error: 'Failed to remove manager' });
  }
};

export const assignEventToManager = async (req, res) => {
  try {
    const { managerId } = req.params;
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    const assignment = await prisma.eventManager.upsert({
      where: {
        userId_eventId: {
          userId: managerId,
          eventId
        }
      },
      update: {},
      create: {
        userId: managerId,
        eventId,
        role: 'MANAGER'
      }
    });

    res.json({
      managerId: assignment.userId,
      eventId: assignment.eventId,
      role: assignment.role
    });
  } catch (error) {
    console.error('Error assigning event to manager:', error);
    res.status(500).json({ error: 'Failed to assign event' });
  }
};
