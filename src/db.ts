import { createConnection } from 'typeorm';
import { Post } from './entities/Post';
import { User } from './entities/User';
import { Upvote } from './entities/Upvote';
import path from 'path';

export const db = createConnection({
	type: 'postgres',
	database: 'postit-dev',
	username: 'postgres',
	password: 'lonewolf',
	logging: true,
	synchronize: true,
	migrations: [path.join(__dirname, './migration/*')],
	entities: [Post, User, Upvote],
});
