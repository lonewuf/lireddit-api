import { User } from '../entities/User';
import { UsernameAndPaswordInput } from 'src/resolvers/UsernameAndPaswordInput';

export const validateRegister = async (input: UsernameAndPaswordInput) => {
	if (!input.email.includes('@')) {
		return [
			{
				field: 'email',
				message: 'Invalid email',
			},
		];
	}

	if (input.username.includes('@')) {
		return [
			{
				field: 'username',
				message: 'Username should not contain "@"',
			},
		];
	}

	if (input.username.length <= 3) {
		return [
			{
				field: 'username',
				message: 'Length must be 4 or more characters',
			},
		];
	}

	if (input.password.length <= 6) {
		return [
			{
				field: 'password',
				message: 'Length must be 7 or more characters',
			},
		];
	}

	const checkEmail = await User.findOne({ where: { email: input.email } });
	if (checkEmail) {
		return [
			{
				field: 'email',
				message: 'Email is already registered',
			},
		];
	}

	return null;
};
