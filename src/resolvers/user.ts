import { User } from '../entities/User';
import {
	Arg,
	Ctx,
	Field,
	Mutation,
	ObjectType,
	Query,
	Resolver,
} from 'type-graphql';
import { UsernameAndPaswordInput } from './UsernameAndPaswordInput';
import { validateRegister } from '../utils/validateRegister';
import argon2 from 'argon2';
import { getConnection } from 'typeorm';
import { MyContext } from '../types';
import { COOKIE_NAME } from '../constants';

@ObjectType()
class FieldError {
	@Field()
	field: string;

	@Field()
	message: string;
}

@ObjectType()
class UserResponse {
	@Field(() => [FieldError], { nullable: true })
	errors?: FieldError[];

	@Field(() => User, { nullable: true })
	user?: User;
}

@Resolver()
export class UserResolver {
	@Query(() => User, { nullable: true })
	async me(@Ctx() { req }: MyContext) {
		if (!req.session.userId) {
			return null;
		}
		return await User.findOne(req.session.userId);
	}

	@Mutation(() => UserResponse)
	async register(
		@Arg('input') input: UsernameAndPaswordInput,
		@Ctx() { req }: MyContext
	): Promise<UserResponse> {
		const errors = await validateRegister(input);
		if (errors) {
			return { errors };
		}

		const hashedPassword = await argon2.hash(input.password);
		let user;
		try {
			const result = await getConnection()
				.createQueryBuilder()
				.insert()
				.into(User)
				.values({
					username: input.username,
					email: input.email,
					password: hashedPassword,
				})
				.returning('*')
				.execute();

			user = result.raw[0];
		} catch (err) {
			if (err.code === '23505') {
				return {
					errors: [
						{
							field: 'username',
							message: 'Username already exist.',
						},
					],
				};
			}
		}

		req.session.userId = user.id;

		return { user };
	}

	@Mutation(() => UserResponse)
	async login(
		@Arg('usernameOrEmail') usernameOrEmail: string,
		@Arg('password') password: string,
		@Ctx() { req }: MyContext
	): Promise<UserResponse> {
		const user = await User.findOne(
			usernameOrEmail.includes('@')
				? { where: { email: usernameOrEmail } }
				: { where: { username: usernameOrEmail } }
		);
		if (!user) {
			return {
				errors: [
					{
						field: 'usernameOrEmail',
						message: 'Username of Email does not exist',
					},
				],
			};
		}
		const valid = await argon2.verify(user.password, password);
		if (!valid) {
			return {
				errors: [
					{
						field: 'password',
						message: 'Incorrect password',
					},
				],
			};
		}

		req.session.userId = user.id;
		return { user };
	}

	@Mutation(() => Boolean)
	logout(@Ctx() { req, res }: MyContext) {
		return new Promise((resolve) =>
			req.session.destroy((err) => {
				res.clearCookie(COOKIE_NAME);
				if (err) {
					console.log(err);
					resolve(false);
					return;
				}
				resolve(true);
			})
		);
	}
}
