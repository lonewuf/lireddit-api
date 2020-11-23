import DataLoader from 'dataloader';
import { Upvote } from '../entities/Upvote';

// export const createUpvoteLoader = () =>
// 	new DataLoader<{ postId: number; userId: number }, Upvote | null>(
// 		async (keys) => {
// 			const upvotes = await Upvote.findByIds(keys as any);
// 			const upvotesKeysToUpvote: Record<string, Upvote> = {};
// 			upvotes.map((upvote) => {
// 				upvotesKeysToUpvote[`${upvote.postId}|${upvote.userId}`] = upvote;
// 			});

// 			return keys.map(
// 				(key) => upvotesKeysToUpvote[`${key.postId}|${key.userId}`]
// 			);
// 		}
//   );

export const createUpvoteLoader = () => {
	return new DataLoader<{ postId: number; userId: number }, Upvote | null>(
		async (keys) => {
			console.log('sadasdasd');
			const updoots = await Upvote.findByIds(keys as any);
			const updootIdsToUpdoot: Record<string, Upvote> = {};
			updoots.forEach((updoot) => {
				updootIdsToUpdoot[`${updoot.postId}|${updoot.userId}`] = updoot;
			});

			return keys.map(
				(key) => updootIdsToUpdoot[`${key.postId}|${key.userId}`]
			);
		}
	);
};
