import { Field, InputType } from 'type-graphql';

@InputType()
export class UsernameAndPaswordInput {
	@Field()
	username: string;

	@Field()
	email: string;

	@Field()
	password: string;
}
