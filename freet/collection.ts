import type {HydratedDocument} from 'mongoose';
import {Types} from 'mongoose';
import type {Freet} from './model';
import FreetModel from './model';
import UserCollection from '../user/collection';
import ReadCollection from '../read/collection';

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
   * Add a freet
   *
   * @param {string} authorId - The id of the author of the freet
   * @param {string} content - The id of the content of the freet
   * @return {Promise<HydratedDocument<Freet>>} - The newly created freet
   */
  static async addOne(authorId: Types.ObjectId | string, 
                      content: string, 
                      readmore: string, 
                      categories: Array<string>,
                      refreetOf: Types.ObjectId | string | undefined,
                      replyTo: Types.ObjectId | string | undefined): Promise<HydratedDocument<Freet>> {
    const date = new Date();
    const freet = new FreetModel({
      authorId: new Types.ObjectId(authorId),
      dateCreated: date,
      content,
      readmore,
      categories,
      likes: 0,
      refreets: 0,
      replies: 0,
      refreetOf,
      replyTo,
    });
    await freet.save(); // Saves freet to MongoDB
    // you've read your own Freet
    if (readmore) {
      await ReadCollection.addOne(freet._id, new Types.ObjectId(authorId));
    }
    return freet.populate(['authorId', 'refreetOf', 'replyTo']);
  }

  /**
   * Find a freet by freetId
   *
   * @param {string} freetId - The id of the freet to find
   * @return {Promise<HydratedDocument<Freet>> | Promise<null> } - The freet with the given freetId, if any
   */
  static async findOne(freetId: Types.ObjectId | string): Promise<HydratedDocument<Freet>> {
    return FreetModel.findOne({_id: freetId}).populate(['authorId', 'refreetOf', 'replyTo']);
  }

  /**
   * Get all the freets in the database
   *
   * @return {Promise<HydratedDocument<Freet>[]>} - An array of all of the freets
   */
  static async findAll(): Promise<Array<HydratedDocument<Freet>>> {
    // Retrieves freets and sorts them from most to least recent
    return FreetModel.find({}).sort({ dateCreated: -1 }).populate(['authorId', 'refreetOf', 'replyTo']);
  }

  /**
   * Get all the freets by given author username
   *
   * @param {string} username - The username of author of the freets
   * @return {Promise<HydratedDocument<Freet>[]>} - An array of all of the freets
   */
  static async findAllByUsername(username: string): Promise<Array<HydratedDocument<Freet>>> {
    const author = await UserCollection.findOneByUsername(username);
    return FreetModel.find({authorId: author._id}).populate(['authorId', 'refreetOf', 'replyTo']);
  }

  /**
   * Get all the freets by given author id
   *
   * @param {string} username - The username of author of the freets
   * @return {Promise<HydratedDocument<Freet>[]>} - An array of all of the freets
   */
   static async findAllByUserId(userId: Types.ObjectId | string): Promise<Array<HydratedDocument<Freet>>> {
    return FreetModel.find({authorId: userId}).populate(['authorId', 'refreetOf', 'replyTo']);
  }

  /**
   * Get all the freets replying to a given freet
   *
   * @param {string} freetId - The freetId of freet replies to
   * @return {Promise<HydratedDocument<Freet>[]>} - An array of all of the freets
   */
   static async findAllByReplyTo(freetId: Types.ObjectId | string): Promise<Array<HydratedDocument<Freet>>> {
    return FreetModel.find({ replyTo: freetId }).populate(['authorId', 'refreetOf', 'replyTo']);
  }

  /**
   * Get the freets in a user's feed
   *
   * @param {string} userId - The userId whose feed to find
   * @return {Promise<HydratedDocument<Freet>[]>} - An array of all of the freets
   */
   static async findFeedFreets(userId: Types.ObjectId | string): Promise<Array<HydratedDocument<Freet>>> {
    const user = await UserCollection.findOneByUserId(userId);
    const authors = [...user.following, new Types.ObjectId(userId)];

    if (user.filter === 'original') {
      return FreetModel.find({ 
        authorId: { $in: authors }, 
        refreetOf: { $exists: false },
      }).sort({ dateCreated: -1 }).populate(['authorId', 'refreetOf', 'replyTo']);
    } else if (user.filter === 'refreets') {
      return FreetModel.find({ 
        authorId: { $in: authors }, 
        refreetOf: { $exists: true },
      }).sort({ dateCreated: -1 }).populate(['authorId', 'refreetOf', 'replyTo']);
    } 
    
    // default feed: both original freets and refreets
    return FreetModel.find({ authorId: { $in: authors } }).sort({ dateCreated: -1 }).populate(['authorId', 'refreetOf', 'replyTo']);
  }

  /**
   * Update a freet with the new content (like/reshare/reply count, categories)
   *
   * @param {string} freetId - The id of the freet to be updated
   * @param {string} freetDetails - The updated detalils of the freet
   * @return {Promise<HydratedDocument<Freet>>} - The newly updated freet
   */
  static async updateOne(freetId: Types.ObjectId | string, freetDetails: any): Promise<HydratedDocument<Freet>> {
    const freet = await FreetModel.findOne({_id: freetId});
    if (freetDetails.likes !== undefined) {
      freet.likes = freetDetails.likes as number;
    }

    if (freetDetails.refreets !== undefined) {
      freet.refreets = freetDetails.refreets as number;
    }

    if (freetDetails.replies !== undefined) {
      freet.replies = freetDetails.replies as number;
    }

    if (freetDetails.categories !== undefined) {
      freet.categories = freetDetails.categories as Array<string>;
    }

    await freet.save();
    return freet.populate(['authorId', 'refreetOf', 'replyTo']);
  }

  /**
   * Delete a freet with given freetId.
   *
   * @param {string} freetId - The freetId of freet to delete
   * @return {Promise<Boolean>} - true if the freet has been deleted, false otherwise
   */
  static async deleteOne(freetId: Types.ObjectId | string): Promise<boolean> {
    // clean up residual likes
    await UserCollection.deleteLikesByFreetIds([freetId]);
    const freet = await FreetModel.deleteOne({_id: freetId});
    return freet !== null;
  }

  /**
   * Delete all the freets by the given author
   *
   * @param {string} authorId - The id of author of freets
   */
  static async deleteManyByAuthor(authorId: Types.ObjectId | string): Promise<void> {
    const freets = await FreetModel.find({ authorId }, { _id: 1 });
    // delete the freetIds from likes
    // we don't need to do the same for refreets since they will be preserved
    if (freets) {
      const freetIds = Array<Types.ObjectId | string>();
      for (const freet of freets) {
        freetIds.push(freet._id);
      }
      await UserCollection.deleteLikesByFreetIds(freetIds);
    }
    await FreetModel.deleteMany({authorId});
  }

  /**
   * Clean likes/refreets/reply counts to exclude a given freetId
   * Used to update counts when the freet is deleted
   *
   * @param {string} freetId - The id of the freet to exclude
   * @return {Promise<void>} 
   */
   static async cleanCountsByFreetId(freetId: Types.ObjectId | string): Promise<void> {
    const freet = await FreetCollection.findOne(freetId);
    if (freet.refreetOf) {
      await FreetModel.updateOne({ _id: freet.refreetOf._id }, { $inc: { refreets: -1 } });
    }

    if (freet.replyTo) {
      await FreetModel.updateOne({ _id: freet.replyTo._id }, { $inc: { replies:  - 1 } })
    }
  }

  /**
   * Clean likes/refreets/reply counts to exclude a given userId
   * Used to update counts when the user is deleted
   *
   * @param {string} userId - The id of the user to exclude
   * @return {Promise<void>} 
   */
   static async cleanCountsByUserId(userId: Types.ObjectId | string): Promise<void> {
    const user = await UserCollection.findOneByUserId(userId);

    // likes
    const likes = user.likes;
    await FreetModel.updateMany({ _id: { $in: likes } }, { $inc: { likes: -1 } });

    // refreets
    const refreets = user.refreets;
    await FreetModel.updateMany({ _id: { $in: refreets } }, { $inc: { refreets: -1 } });

    // replies
    // since replies are not unique, this might take a long time - look to improve efficiency
    // on the other hand, user deletions are relatively uncommon and are also not expected to be fast
    const replies = await FreetModel.find({ authorId: userId, replyTo: { $ne: undefined } })
    for (const reply of replies) {
      await FreetModel.updateOne({ _id: reply.replyTo }, { $inc: { replies:  - 1 } })
    }
  }
}

export default FreetCollection;
