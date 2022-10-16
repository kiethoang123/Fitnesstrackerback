const express = require("express");
const usersRouter = express.Router();
const {
	getUserByUsername,
	createUser,
	getUserById,
	getAllRoutinesByUser,
	getPublicRoutinesByUser
} = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { JWT_SECRET } = process.env;

usersRouter.post("/login", async (req, res, next) => {
	const { username, password } = req.body;
	const SALT_COUNT = 10;

	const hashedPassword = await bcrypt.hash(password, SALT_COUNT);
	const isValid = await bcrypt.compare(password, hashedPassword);
	if (!username || !password) {
		next({
			name: "MissingCredentialsError",
			message: "Please supply both a username and password",
		});
	}

	try {
		const user = await getUserByUsername(username);

		if (user && isValid) {
			const token = jwt.sign(
				{
					username: username,
					id: user.id,
				},
				process.env.JWT_SECRET
			);
			res.send({
				token: token,
				user: user,
				message: "you're logged in!",
			});

			return token;
		} else {
			next({
				name: "IncorrectCredentialsError",
				message: "Username or password is incorrect",
			});
		}
	} catch (error) {
		next(error);
	}
});

usersRouter.post("/register", async (req, res, next) => {
	const { username, password } = req.body;

	try {
		const _user = await getUserByUsername(username);

		if (_user) {
			next({
				error: "error",
				name: "UserExistsError",
				message: `User ${username} is already taken.`,
			});
		}

		if (password.length < 8) {
			next({
				error: "error",
				name: "PasswordLengthError",
				message: "Password Too Short!",
			});
		}

		const user = await createUser({ username, password });

		const SALT_COUNT = 10;

		const hashedPassword = await bcrypt.hash(password, SALT_COUNT);

		const token = jwt.sign(
			{
				id: user.id,
				username: username,
				password: hashedPassword,
			},
			process.env.JWT_SECRET,
			{
				expiresIn: "1w",
			}
		);

		res.send({
			message: "Thank you for signing up!",
			token: token,
			user: user,
		});
	} catch (error) {
		next(error);
	}
});

usersRouter.get("/me", async (req, res, next) => {
	const { authorization } = req.headers;
	const prefix = "Bearer ";
	try {
		if (authorization) {
			const token = authorization.slice(prefix.length);

			try {
				const { id } = jwt.verify(token, JWT_SECRET);

				if (id) {
					const user = await getUserById(id);
					
					res.send(user);
				}
			} catch (error) {
				next(error);
			}
		} else {
			res.status(401);
			next({
				error: "Error",
				name: "NoToken",
				message: "You must be logged in to perform this action",
			});
		}
	} catch (error) {
		next(error);
	}
});

usersRouter.get("/:username/routines", async (req, res, next) => {
	try {
		const Username = req.params;

		if (req.user && Username.username === req.user.username) {
			const response = await getAllRoutinesByUser(Username);
			res.send(response);
		} else {
			const response = await getPublicRoutinesByUser(Username);
			res.send(response);
		}
	} catch (error) {
		next(error);
	}
});

module.exports = usersRouter;