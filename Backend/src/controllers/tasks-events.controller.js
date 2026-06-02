import prisma from '../prisma/client.js';

export const listEventTasks = async (req, res) => {
  try {
    const { eventId } = req.params;

    const tasks = await prisma.task.findMany({
      where: { eventId },
      include: {
        assignments: {
          include: { user: true }
        }
      },
      orderBy: { deadline: 'asc' }
    });

    res.json(tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      category: task.category,
      status: task.status,
      priority: task.priority,
      deadline: task.deadline,
      assignees: task.assignments.map(a => ({
        id: a.user.id,
        name: a.user.name,
        email: a.user.email,
        taskStatus: a.status
      }))
    })));
  } catch (error) {
    console.error('Error fetching event tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const createEventTask = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, description, category, priority, deadline } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const task = await prisma.task.create({
      data: {
        eventId,
        title,
        description,
        category: category || 'OTHER',
        priority: priority || 'MEDIUM',
        deadline: deadline ? new Date(deadline) : null,
        createdBy: req.user.id
      }
    });

    res.status(201).json({
      id: task.id,
      title: task.title,
      status: task.status
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, status, priority, deadline } = req.body;

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(category && { category }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(deadline && { deadline: new Date(deadline) })
      }
    });

    res.json({
      id: task.id,
      title: task.title,
      status: task.status
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.task.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

export const getVolunteerTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await prisma.taskAssignment.findMany({
      where: { userId },
      include: {
        task: {
          include: { event: true }
        }
      },
      orderBy: { assignedAt: 'desc' }
    });

    res.json(tasks.map(ta => ({
      id: ta.task.id,
      title: ta.task.title,
      description: ta.task.description,
      eventName: ta.task.event.name,
      status: ta.status,
      priority: ta.task.priority,
      deadline: ta.task.deadline,
      assignedAt: ta.assignedAt
    })));
  } catch (error) {
    console.error('Error fetching volunteer tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};
