import type {HydratedDocument, Types} from 'mongoose';
import type {Freet} from './model';
import FreetModel from './model';
import UserCollection from '../user/collection';
import FeedCollection from '../feed/collection';

/**
 * This files contains a class that has the functionality to explore freets
 * stored in MongoDB, including adding, finding, updating, and deleting freets.
 * Feel free to add additional operations in this file.
 *
 * Note: HydratedDocument<Freet> is the output of the FreetModel() constructor,
 * and contains all the information in Freet. https://mongoosejs.com/docs/typescript.html
 */
class FreetCollection {
  /**
   * Add a freet to the collection
   *
   * @param {string} authorId - The id of the author of the freet
   * @param {string} content - The id of the content of the freet
   * @return {Promise<HydratedDocument<Freet>>} - The newly created freet
   */
  static async addOne(authorId: Types.ObjectId | string, content: string, readmore: string): Promise<HydratedDocument<Freet>> {
    const date = new Date();
    const freet = new FreetModel({
      authorId,
      dateCreated: date,
      content,
      readmore,
      likes: 0,
    });
    await freet.save(); // Saves freet to MongoDB
    await FreetCollection.publishFreetToFollowers(freet._id.toString());
    return freet.populate('authorId');
  }

  /**
   * Find a freet by freetId
   *
   * @param {string} freetId - The id of the freet to find
   * @return {Promise<HydratedDocument<Freet>> | Promise<null> } - The freet with the given freetId, if any
   */
  static async findOne(freetId: Types.ObjectId | string): Promise<HydratedDocument<Freet>> {
    return FreetModel.findOne({_id: freetId}).populate('authorId');
  }

  /**
   * Get all the freets in the database
   *
   * @return {Promise<HydratedDocument<Freet>[]>} - An array of all of the freets
   */
  static async findAll(): Promise<Array<HydratedDocument<Freet>>> {
    // Retrieves freets and sorts them from most to least recent
    return FreetModel.find({}).sort({dateCreated: -1}).populate('authorId');
  }

  /**
   * Get all the freets in by given author
   *
   * @param {string} username - The username of author of the freets
   * @return {Promise<HydratedDocument<Freet>[]>} - An array of all of the freets
   */
  static async findAllByUsername(username: string): Promise<Array<HydratedDocument<Freet>>> {
    const author = await UserCollection.findOneByUsername(username);
    return FreetModel.find({authorId: author._id}).populate('authorId');
  }

  /**
   * Update a freet with the new content
   *
   * @param {string} freetId - The id of the freet to be updated
   * @param {string} content - The new content of the freet
   * @return {Promise<HydratedDocument<Freet>>} - The newly updated freet
   */
  static async updateOne(freetId: Types.ObjectId | string, freetDetails: any): Promise<HydratedDocument<Freet>> {
    const freet = await FreetModel.findOne({_id: freetId});
    if (freetDetails.likes) {
      freet.likes = freetDetails.likes as number;
    }

    await freet.save();
    return freet.populate('authorId');
  }

  /**
   * Delete a freet with given freetId.
   *
   * @param {string} freetId - The freetId of freet to delete
   * @return {Promise<Boolean>} - true if the freet has been deleted, false otherwise
   */
  static async deleteOne(freetId: Types.ObjectId | string): Promise<boolean> {
    await FreetCollection.deleteFreetFromFollowers(freetId);
    const freet = await FreetModel.deleteOne({_id: freetId});
    return freet !== null;
  }

  /**
   * Delete all the freets by the given author
   *
   * @param {string} authorId - The id of author of freets
   */
  static async deleteMany(authorId: Types.ObjectId | string): Promise<void> {
    await FreetModel.deleteMany({authorId});
  }

  /**
   * Update followers' (and own) feeds with new freet
   *
   * @param {string} freetId - The freetId of the freet to publish
   * @return {Promise<HydratedDocument<Feed>>} - The updated user
   */
  static async publishFreetToFollowers(freetId: Types.ObjectId | string): Promise<void> {
    const freet = await FreetModel.findOne({_id: freetId});
    const author = await UserCollection.findOneByUserId(freet.authorId);
    
    if (freet) {
      for (const followerId of author.followedBy) {
        const feed = await FeedCollection.findFeedByUserId(followerId);
        feed.freets = [...feed.freets, freet]
        await feed.save();
      }

      const feed = await FeedCollection.findFeedByUserId(author._id);
      feed.freets = [...feed.freets, freet]
      await feed.save();
    }
  }

  /**
   * Delete a deleted freet from followers' (and own) feeds
   *
   * @param {string} freetId - The freetId of the freet to delete
   * @return {Promise<HydratedDocument<Feed>>} - The updated user
   */
   static async deleteFreetFromFollowers(freetId: Types.ObjectId | string): Promise<void> {
    const freet = await FreetModel.findOne({_id: freetId});
    const author = await UserCollection.findOneByUserId(freet.authorId);
    
    if (freet) {
      for (const followerId of author.followedBy) {
        const feed = await FeedCollection.findFeedByUserId(followerId);
        feed.freets = feed.freets.filter((feedFreet) => feedFreet._id != freetId)
        await feed.save();
      }

      const feed = await FeedCollection.findFeedByUserId(author._id);
      feed.freets = feed.freets.filter((feedFreet) => feedFreet._id != freetId)
      await feed.save();
    }
  }
}

export default FreetCollection;
