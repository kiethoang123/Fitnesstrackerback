const express = require("express");
const {
	getRoutineActivityById,
	destroyRoutineActivity,
	getRoutineById,
	canEditRoutineActivity,
	updateRoutineActivity,
} = require("../db");
const { requireUser } = require("./utils");

const routineActivitiesRouter = express.Router();

routineActivitiesRouter.patch(
	"/:routineActivityId",
	requireUser,
	async (req, res, next) => {
		try {
			const { count, duration } = req.body;
			const { routineActivityId } = req.params;
			const { id: currentUserId } = req.user;
			const canEdit = await canEditRoutineActivity(
				routineActivityId,
				currentUserId
			);
			const updateObj = {};

			if (count) {
				updateObj.count = count;
			}
			if (duration) {
				updateObj.duration = duration;
			}
			if (canEdit) {
				updateObj.id = routineActivityId;
				const response = await updateRoutineActivity(updateObj);

				res.send(response);
			} else {
				res.status(403);
				const error = await getRoutineActivityById(routineActivityId);
				const { name } = await getRoutineById(error.routineId);
				next({
					error: "Error!",
					name: "NotCreatorOfRoutine",
					message: `User ${req.user.username} is not allowed to update ${name}`,
				});
			}
		} catch (error) {
			next(error);
		}
	}
);

routineActivitiesRouter.delete(
	"/:routineActivityId",
	requireUser,
	async (req, res, next) => {
		const userId = req.user.id;
		const id = req.params.routineActivityId;
		try {
			const routineActivity = await getRoutineActivityById(id);
			const routine = await getRoutineById(routineActivity.routineId);
			if (userId === routine.creatorId) {
				const destroyedRoutineActivity = await destroyRoutineActivity(
					routine.id
				);

				res.send(destroyedRoutineActivity);
			} else {
				res.status(403);
				next({
					error: "Error",
					name: "NoToken",
					message: `User ${req.user.username} is not allowed to delete ${routine.name}`,
				});
			}
		} catch (error) {
			next(error);
		}
	}
);

module.exports = routineActivitiesRouter;