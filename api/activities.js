const express = require("express");
const activitiesRouter = express.Router();
const { getAllActivities, getPublicRoutinesByActivity, createActivity, updateActivity, getActivityById, getActivityByName } = require('../db');

activitiesRouter.get('/', (req, res, next) => {
    console.log("A request is being made to /activities");
    next();
})

activitiesRouter.get('/:activityId/routines', async (req, res, next) => {
    try {
        const id = req.params.activityId;
        const publicRoutinesByActivity = await getPublicRoutinesByActivity({ id });

        if (publicRoutinesByActivity) {
            res.send(
                publicRoutinesByActivity
            );
        } else {
            next({
                error: "Error!",
                name: "ActivityNotFound",
                message: `Activity ${id} not found`
            })
        }
    }
    catch (error) {
        next(error)
    }
})

activitiesRouter.get('/', async (req, res, next) => {
    try {
        const allActivities = await getAllActivities();
        
        res.send(
            allActivities
        );
    }
    catch (error) {
        next(error);
    }
})

activitiesRouter.post('/', async (req, res, next) => {
    try {
        const data = await createActivity(req.body)

        if (data) {
            res.send(
                data
            );  
        } else {
            next({
                error: "Error!",
                name: "ActivityAlreadyExists",
                message: `An activity with name ${req.body.name} already exists`
            });
        }
    }
    catch (error) {
        next(error);
    }
})

activitiesRouter.patch('/:activityId', async (req, res, next) => {
    try {
        const { activityId } = req.params;
        const { name, description } = req.body;
        const updateObj = {};
        updateObj.id = activityId;
        if (name) {
            updateObj.name = name;
        }
        if (description) {
            updateObj.description = description;
        }
        if (!(await getActivityById(activityId))) {
            next({
                name: 'ActivityNotFoundError',
                message: `Activity ${activityId} not found`,
                error: 'Error!',
            });
        }
        if (await getActivityByName(name)) {
            next({
                name: 'ActivityAlreadyExists',
                message: `An activity with name ${name} already exists`,
                error: 'Error!',
            });
        } else {
            const response = await updateActivity(updateObj);
            if (response) {
                res.send(response);
            } else {
                next({
                    name: 'NoFieldsToUpdate',
                    message: `Please provide a name or description to update`,
                    error: 'Error!',
                });
            }
        }
    }
    catch (error) {
        next(error);
    }
})

module.exports = activitiesRouter;