import { Post } from '../entities/Post';
import {
	Arg,
	Ctx,
	Field,
	FieldResolver,
	InputType,
	Int,
	Mutation,
	ObjectType,
	Query,
	Resolver,
	Root,
	UseMiddleware,
} from 'type-graphql';
import { getConnection } from 'typeorm';
import { MyContext } from '../types';
import { isAuth } from '../middlewares/isAuth';
import { Upvote } from '../entities/Upvote';

@InputType()
class PostInput {
	@Field()
	title: string;

	@Field()
	text: string;
}

@ObjectType()
class PaginatedPost {
	@Field(() => [Post])
	posts: Post[];

	@Field()
	hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
	@FieldResolver(() => String)
	textSnippet(@Root() post: Post) {
		return post.text.slice(0, 100);
	}

	@FieldResolver(() => String)
	creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
		return userLoader.load(post.creatorId);
	}

	@FieldResolver(() => Int, { nullable: true })
	async voteStatus(
		@Root() post: Post,
		@Ctx() { req, upvoteLoader }: MyContext
	) {
		if (!req.session.userId) {
			return null;
		}
		const upvote = await upvoteLoader.load({
			postId: post.id,
			userId: req.session.userId,
		});
		return upvote ? upvote.value : null;
	}

	@Query(() => Post, { nullable: true })
	async post(@Arg('id', () => Int) id: number): Promise<Post | undefined> {
		return await Post.findOne(id);
	}

	@Query(() => [Post])
	async posts2() {
		return await Post.find({});
	}

	@Query(() => PaginatedPost)
	async posts(
		@Arg('limit', () => Int) limit: number,
		@Arg('cursor', () => String, { nullable: true }) cursor: string | null
	): Promise<PaginatedPost> {
		const realLimit = Math.min(50, limit);
		const realLimitPlusOne = realLimit + 1;

		const replacements: any = [realLimitPlusOne];

		if (cursor) {
			replacements.push(new Date(parseInt(cursor)));
		}

		const posts = await getConnection().query(
			`
			select p.*
			from post p
			${cursor ? `where p."createdAt" < $2` : ''}
			order by p."createdAt" desc
			limit $1
		`,
			replacements
		);

		return {
			posts: posts.slice(0, realLimit),
			hasMore: posts.length === realLimitPlusOne,
		};
	}

	@Mutation(() => Boolean)
	@UseMiddleware(isAuth)
	async vote(
		@Arg('postId', () => Int) postId: number,
		@Arg('value', () => Int) value: number,
		@Ctx() { req }: MyContext
	) {
		const isUpvote = value !== -1;
		const realValue = isUpvote ? 1 : -1;
		const { userId } = req.session;

		const upvote = await Upvote.findOne({ where: { postId, userId } });

		// If user have already voted and wants to change
		if (upvote && upvote.value !== realValue) {
			await getConnection().transaction(async (tm) => {
				// update upvote
				await tm.query(
					`
					update upvote
					set value = $1
					where "postId" = $2 and "userId" = $3
				`,
					[realValue, postId, userId]
				);

				// update post
				await tm.query(
					`
					update post
					set points = points + $1
					where id = $2
				`,
					[2 * realValue, postId]
				);
			});
		} else {
			// user has not yet voted
			await getConnection().transaction(async (tm) => {
				await tm.query(
					`
					insert into upvote ("userId", "postId", value)
					values($1, $2, $3)
				`,
					[userId, postId, realValue]
				);

				await tm.query(
					`
					update post
					set points = points + $1
					where id = $2
				`,
					[realValue, postId]
				);
			});
		}

		return true;
	}

	@Mutation(() => Post)
	@UseMiddleware(isAuth)
	async createPost(
		@Arg('input') input: PostInput,
		@Ctx() { req }: MyContext
	): Promise<Post> {
		return await Post.create({
			...input,
			creatorId: req.session.userId,
		}).save();
	}

	@Mutation(() => Post, { nullable: true })
	@UseMiddleware(isAuth)
	async updatePost(
		@Arg('id', () => Int) id: number,
		@Arg('title') title: string,
		@Arg('text') text: string
	): Promise<Post | null> {
		const result = await getConnection()
			.createQueryBuilder()
			.update(Post)
			.set({ title, text })
			.where('id = :id', { id })
			.returning('*')
			.execute();

		return result.raw[0];
	}

	@Mutation(() => Boolean)
	@UseMiddleware(isAuth)
	async deletePost(
		@Arg('id', () => Int) id: number,
		@Ctx() { req }: MyContext
	) {
		const post = await Post.findOne(id);
		if (!post) {
			return false;
		}
		if (post.creatorId !== req.session.userId) {
			throw new Error('Not Authorized');
		}

		await Upvote.delete({ postId: id });
		await Post.delete({ id });
		return true;
	}
}
