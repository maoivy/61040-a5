import type {HydratedDocument, Types} from 'mongoose';
import type {Feed} from './model';
import type {Freet} from '../freet/model';
import FeedModel from './model';
import UserCollection from '../user/collection'
import FreetCollection from '../freet/collection'

/**
 * This file contains a class with functionality to interact with users stored
 * in MongoDB, including adding, finding, updating, and deleting. Feel free to add
 * additional operations in this file.
 *
 * Note: HydratedDocument<User> is the output of the UserModel() constructor,
 * and contains all the information in Feed. https://mongoosejs.com/docs/typescript.html
 */
class FeedCollection {
  /**
   * Add a new feed
   *
   * @param {string} userId - The userId of the user
   * @return {Promise<HydratedDocument<Feed>>} - The newly created feed
   */
  static async addOne(userId: Types.ObjectId): Promise<HydratedDocument<Feed>> {
    const freets = new Array<Freet>();
    const feed = new FeedModel({ userId, freets });
    await feed.save(); // Saves feed to MongoDB
    return feed;
  }

  /**
   * Find a feed
   *
   * @param {string} userId - The userId of the user
   * @return {Promise<HydratedDocument<Feed>>} - The newly created feed
   */
   static async findFeedByUserId(userId: Types.ObjectId | string): Promise<HydratedDocument<Feed>> {
    return FeedModel.findOne({ userId });
  }

  /**
   * Update feed with freets of user
   *
   * @param {string} userId - The userId of the user to update
   * @param {string} authorId - The userId of the author whose freets we add
   * @return {Promise<HydratedDocument<Feed>>} - The updated user
   */
  static async updateFeedByAuthor(userId: Types.ObjectId | string, authorId: Types.ObjectId | string): Promise<HydratedDocument<Feed>> {
    const author = await UserCollection.findOneByUserId(authorId);
    const freets = await FreetCollection.findAllByUsername(author.username);
    
    const feed = await FeedCollection.findFeedByUserId(userId);
    if (freets) {
      feed.freets = [...feed.freets, ...freets]
    }

    await feed.save();
    return feed;
  }

  /**
   * Remove freets of user from feed
   *
   * @param {string} userId - The userId of the user to update
   * @param {string} authorId - The userId of the author whose freets we add
   * @return {Promise<HydratedDocument<Feed>>} - The updated user
   */
   static async deleteFromFeedByAuthor(userId: Types.ObjectId | string, authorId: Types.ObjectId | string): Promise<HydratedDocument<Feed>> {
    const feed = await FeedCollection.findFeedByUserId(userId);
    feed.freets = feed.freets.filter((freet) => freet.authorId.toString() !== authorId.toString());

    await feed.save();
    return feed;
  }

  /**
   * Delete a feed.
   *
   * @param {string} userId - The userId of feed to delete
   * @return {Promise<Boolean>} - true if the feed has been deleted, false otherwise
   */
  static async deleteOne(userId: Types.ObjectId | string): Promise<boolean> {
    const feed = await FeedModel.deleteOne({ userId });
    return feed !== null;
  }
}

export default FeedCollection;
