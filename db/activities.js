const client = require("./client")

// database functions
async function getAllActivities() {
  try {
    const { rows } = await client.query(`
    SELECT * FROM activities`
    );

    return rows;
  } catch (error) {
    console.error(error);
    
  }

}

async function getActivityById(id) {
  try {
    const { rows: [activity] } = await client.query(`
      SELECT * FROM activities
      WHERE id = ${id}
      `);

    return activity;
  }
  catch (error) {
    console.error(error);
  }
  
}

async function getActivityByName(name) {
  try {
    const { rows: [activity] } = await client.query(`
      SELECT * FROM activities
      WHERE name = $1
    `, [name]);

    return activity;
  }
  catch (error) {
    console.error(error);
  }
  

}

// select and return an array of all activities
async function attachActivitiesToRoutines(routines) {
  try {
    const routineId = routines.map(routine => routine.id)

    if (!routineId?.length) return

    const {rows} = await client.query(`
      SELECT activities.*, routine_activities.count, routine_activities."routineId", routine_activities.duration, routine_activities.id AS "routineActivityId"
      FROM activities
      JOIN routine_activities ON activities.id = routine_activities."activityId"
      WHERE routine_activities."routineId" IN (${routineId.join(",")})
    `);

    const data = routines.map(routine => {
      routine.activities = rows.filter(row => {
        return row.routineId === routine.id;
      })
      return routine;
    })

    return data;
  }
  catch (error) {
    console.error(error)
    throw error;
  }

}

// return the new activity
async function createActivity({ name, description }) {
  try {
    const { rows: [activity] } = await client.query(`
    INSERT INTO activities (name, description)
    VALUES ($1, $2)
    ON CONFLICT (name) DO NOTHING
    RETURNING *;
  `, [name, description]);

    return activity;
  }
  catch (error) {
    console.error(error);
  }

}

// don't try to update the id
// do update the name and description
// return the updated activity
async function updateActivity({ id, ...fields }) {
  const setString = Object.keys(fields)
  .map((key, index) => `"${key}"=$${index + 1}`)
  .join(', ');

if (setString.length === 0) {
  return;
}
try {
  const {
     rows: [activities],
  } = await client.query(
     `
          UPDATE activities
          SET ${setString}
          WHERE id=${id}
          RETURNING *
      `,
     Object.values(fields)
    );
 
  return activities;
} catch (error) {
 console.error(error);
}

}


module.exports = {
  getAllActivities,
  getActivityById,
  getActivityByName,
  attachActivitiesToRoutines,
  createActivity,
  updateActivity,
}
