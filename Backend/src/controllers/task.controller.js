import prisma from '../prisma/client.js';

export const getTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(tasks);
  } catch (error) {
    console.error('❌ Get tasks error:', error);
    res.status(500).json({ error: 'Server error retrieving tasks' });
  }
};

// Create a new task (Phase 9)
export const createTask = async (req, res) => {
  const { title, category, status, deadline, assignedUserIds } = req.body;

  if (!title || !category) {
    return res.status(400).json({ error: 'Title and category are required' });
  }

  try {
    const task = await prisma.task.create({
      data: {
        title,
        category,
        status: status || 'TODO',
        deadline: deadline ? new Date(deadline) : null,
      }
    });

    // Create assignments if users are specified
    if (assignedUserIds && Array.isArray(assignedUserIds)) {
      const assignmentsData = assignedUserIds.map(userId => ({
        taskId: task.id,
        userId: userId
      }));

      await prisma.taskAssignment.createMany({
        data: assignmentsData
      });
    }

    const createdTask = await prisma.task.findUnique({
      where: { id: task.id },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    });

    res.status(201).json(createdTask);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Server error creating task' });
  }
};

// Update task details or column status (Phase 9)
export const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, category, status, deadline, assignedUserIds } = req.body;

  try {
    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update task
    await prisma.task.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingTask.title,
        category: category !== undefined ? category : existingTask.category,
        status: status !== undefined ? status : existingTask.status,
        deadline: deadline !== undefined ? (deadline ? new Date(deadline) : null) : existingTask.deadline,
      }
    });

    // Sync assignments if user list is specified
    if (assignedUserIds && Array.isArray(assignedUserIds)) {
      // Delete old assignments
      await prisma.taskAssignment.deleteMany({
        where: { taskId: id }
      });

      // Insert new assignments
      const assignmentsData = assignedUserIds.map(userId => ({
        taskId: id,
        userId: userId
      }));

      await prisma.taskAssignment.createMany({
        data: assignmentsData
      });
    }

    const updatedTask = await prisma.task.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('❌ Update task error:', error);
    res.status(500).json({ error: 'Server error updating task' });
  }
};

// Delete a task (Phase 9)
export const deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // First delete associated assignments
    await prisma.taskAssignment.deleteMany({
      where: { taskId: id }
    });

    // Then delete task itself
    await prisma.task.delete({
      where: { id }
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('❌ Delete task error:', error);
    res.status(500).json({ error: 'Server error deleting task' });
  }
};
