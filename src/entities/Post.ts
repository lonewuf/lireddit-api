import { Field, Int, ObjectType } from 'type-graphql';
import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Upvote } from './Upvote';
import { User } from './User';

@ObjectType()
@Entity()
export class Post extends BaseEntity {
	@Field()
	@PrimaryGeneratedColumn()
	id!: number;

	@Field()
	@Column()
	title!: string;

	@Field()
	@Column()
	text!: string;

	@OneToMany(() => Upvote, (upvote) => upvote.post)
	upvotes: Upvote[];

	@Field()
	@Column({ type: 'int', default: 0 })
	points!: number;

	@Field(() => Int, { nullable: true })
	voteStatus: number | null;

	@Field()
	@Column()
	creatorId: number;

	@Field()
	@ManyToOne(() => User, (user) => user.posts)
	creator: User;

	@Field(() => String)
	@CreateDateColumn()
	createdAt: Date;

	@Field(() => String)
	@CreateDateColumn()
	updatedAt: Date;
}
