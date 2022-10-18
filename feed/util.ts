import type {HydratedDocument, Types} from 'mongoose';
import moment from 'moment';
import type {Feed} from './model';

// Update this if you add a property to the User type!
type FeedResponse = {
  _id: string;
  userId: string;
  freets: Array<string>;
};

/**
 * Transform a raw User object from the database into an object
 * with all the information needed by the frontend
 *
 * @param {HydratedDocument<User>} feed - A feed object
 * @returns {FeedResponse} - The feed object 
 */
const constructFeedResponse = (feed: HydratedDocument<Feed>): FeedResponse => {
  const feedCopy: Feed = {
    ...feed.toObject({
      versionKey: false // Cosmetics; prevents returning of __v property
    })
  };
  return {
    ...feedCopy,
    _id: feedCopy._id.toString(),
    userId: feedCopy.userId.toString(),
    freets: feed.freets.map((freet) => freet.content),
  };
};

export {
  constructFeedResponse
};
