const client = require("./client");
const bcrypt = require("bcrypt");

// database functions

// user functions
async function createUser({ username, password }) {
  try {
    const SALT_COUNT = 10;
    const hashedPassword = await bcrypt.hash(password, SALT_COUNT);

    const {
       rows: [user],
    } = await client.query(
       `
  INSERT INTO users (username, password)
  VALUES ($1, $2)
  RETURNING *`,
       [username, hashedPassword]
    );

    delete user.password;
    return user;
 } catch (error) {
    console.error("Problem creating user", error);
 }
}
  


async function getUser({ username, password }) {
    const user = await getUserByUsername(username);
    const hashedPassword = user.password;

    const isValid = await bcrypt.compare(password, hashedPassword);

    if (isValid){
      delete user.password;
      return user;
      
    }
    

}

async function getUserById(userId) {
  try {
    const user = await client.query(`
    SELECT id, username
    FROM users
    WHERE id= ${userId}`
    );

    const returnedUser =  user.rows[0];
    return returnedUser;
    
  } catch (error) {
    console.error("Problem getting user by id", error);
    
  }

}

async function getUserByUsername(userName) {
  try {
		const user = await client.query(
			`
      SELECT id, username, password
      FROM users
	  WHERE username = $1
    `,
			[userName]
		);
		const returnedUser = user.rows[0];
		
		return returnedUser;
	} catch (error) {
		console.error("Problem getting user by username", error);
	}
}

module.exports = {
  createUser,
  getUser,
  getUserById,
  getUserByUsername,
}
