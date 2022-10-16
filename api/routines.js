const express = require('express');
const { addActivityToRoutine } = require('../db/routine_activities');
const routinesRouter = express.Router();
const {
  getAllPublicRoutines,
  createRoutine,
  getRoutineById,
  updateRoutine,
  destroyRoutine,
} = require('../db/routines');
const { requireUser } = require('./utils');

routinesRouter.get('/', async (req, res, next) => {
  try {
    const response = await getAllPublicRoutines();

    res.send(response);
  } catch (error) {
    next(error);
  }
});

routinesRouter.post('/', requireUser, async (req, res, next) => {
  try {
    const { isPublic, name, goal } = req.body;
    const creatorId = req.user.id;
    const response = await createRoutine({
      creatorId,
      isPublic,
      name,
      goal,
    });
   
    res.send(response);
  } catch (error) {
    next(error);
  }
});

routinesRouter.patch('/:routineId', requireUser, async (req, res, next) => {
  const updateObj = {};
  const { routineId } = req.params;
  const { isPublic, name, goal } = req.body;
  const { creatorId, name: originalName } = await getRoutineById(routineId);
  try {
    updateObj.isPublic = isPublic;
    if (name) {
      updateObj.name = name;
    }
    if (goal) {
      updateObj.goal = goal;
    }
    if (await getRoutineById(routineId)) {
      updateObj.id = routineId;
    } else {
      res.status(404);
      next({
        name: 'RoutineNotFoundError',
        message: `Routine ${routineId} not found`,
        error: 'Error!',
      });
    }
    if (creatorId === req.user.id) {
      const response = await updateRoutine(updateObj);
      res.send(response);
    } else {
      res.status(403);
      next({
        error: 'Error!',
        name: 'NotCreatorOfRoutine',
        message: `User ${req.user.username} is not allowed to update ${originalName}`
      });
    }
  } catch (error) {
    next(error);
  }
});

routinesRouter.delete('/:routineId', requireUser, async (req, res, next) => {
  const { routineId } = req.params;

  try {
    const response = await getRoutineById(routineId);
    const { name } = response;
    const routineCreatorId = response.creatorId;

    if (routineCreatorId === req.user.id) {
      await destroyRoutine(routineId);

      res.send(response);
    } else {
      res.status(403);
      next({
        error: 'Error!',
        name: 'NotCreatorOfRoutine',
        message: `User ${req.user.username} is not allowed to delete ${name}`
      });
    }
  } catch (error) {
    next(error);
  }
});

routinesRouter.post('/:routineId/activities', async (req, res, next) => {
  const { routineId, activityId, count, duration } = req.body;
  try {
    const response = await addActivityToRoutine({
      routineId,
      activityId,
      count,
      duration,
    });
    response
      ? res.send(response)
      : next({
          error: 'Error!',
          message: `Activity ID ${activityId} already exists in Routine ID ${routineId}`,
          name: 'CanNotDuplicateActivity/RoutineId',
        });
  } catch (error) {
    next(error);
  }
});

module.exports = routinesRouter;