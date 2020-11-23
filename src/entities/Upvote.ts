import { Field, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Post } from './Post';
import { User } from './User';

/**
 * Many to Many
 * user -> upvote <- post
 */
@ObjectType()
@Entity()
export class Upvote extends BaseEntity {
	@Field()
	@Column({ type: 'int' })
	value: number;

	@PrimaryColumn()
	userId: number;

	@ManyToOne(() => User, (user) => user.upvotes)
	user: User;

	@PrimaryColumn()
	postId: number;

	@ManyToOne(() => Post, (post) => post.upvotes)
	post: Post;
}
