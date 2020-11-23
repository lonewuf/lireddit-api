import 'reflect-metadata';
import dotenv from 'dotenv';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import { db } from './db';
import cors from 'cors';
import session from 'express-session';
import Redis from 'ioredis';
import connectRedis from 'connect-redis';
import { COOKIE_NAME, __prod__ } from './constants';
import { createUserLoader } from './utils/createUserLoader';
import { createUpvoteLoader } from './utils/createUpvoteLoader';
// import helmet from 'helmet';
// import { Post } from './entities/Post';

dotenv.config();

const main = async () => {
	const conn = await db;
	conn;
	await conn.runMigrations();

	// await Post.delete({});

	const PORT = process.env.PORT || 5000;
	const app = express();

	// app.use(helmet());

	let RedisStore = connectRedis(session);
	let redis = new Redis();

	app.use(
		cors({
			origin: process.env.WEB_URL,
			credentials: true,
		})
	);

	app.use(
		session({
			name: COOKIE_NAME,
			store: new RedisStore({
				client: redis,
				disableTouch: true,
			}),
			cookie: {
				maxAge: 1000 * 60 * 60 * 24 * 366 * 1, // 1yr
				httpOnly: true,
				secure: __prod__,
				sameSite: 'lax',
			},
			secret: process.env.SECRET_KEY as string,
			saveUninitialized: false,
			resave: false,
		})
	);

	const apolloServer = new ApolloServer({
		schema: await buildSchema({
			resolvers: [HelloResolver, PostResolver, UserResolver],
			validate: false,
		}),
		context: ({ req, res }) => ({
			req,
			res,
			redis,
			userLoader: createUserLoader(),
			upvoteLoader: createUpvoteLoader(),
		}),
	});

	apolloServer.applyMiddleware({
		app,
		path: '/api',
		cors: false,
	});

	app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
};

main().catch((err) => console.log(`Error occur in server: ${err}`));
