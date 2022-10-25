import type {HydratedDocument} from 'mongoose';
import {Types} from 'mongoose';
import type {Freet} from './model';
import FreetModel from './model';
import UserCollection from '../user/collection';

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
  static async addOne(authorId: Types.ObjectId | string, content: string, readmore: string, categories: Array<string>): Promise<HydratedDocument<Freet>> {
    const date = new Date();
    const freet = new FreetModel({
      authorId: new Types.ObjectId(authorId),
      dateCreated: date,
      content,
      readmore,
      categories,
      likes: 0,
    });
    await freet.save(); // Saves freet to MongoDB
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
   * Get all the freets in by given author username
   *
   * @param {string} username - The username of author of the freets
   * @return {Promise<HydratedDocument<Freet>[]>} - An array of all of the freets
   */
  static async findAllByUsername(username: string): Promise<Array<HydratedDocument<Freet>>> {
    const author = await UserCollection.findOneByUsername(username);
    return FreetModel.find({authorId: author._id}).populate('authorId');
  }

  /**
   * Get all the freets in by given author id
   *
   * @param {string} username - The username of author of the freets
   * @return {Promise<HydratedDocument<Freet>[]>} - An array of all of the freets
   */
   static async findAllByUserId(userId: Types.ObjectId | string): Promise<Array<HydratedDocument<Freet>>> {
    return FreetModel.find({authorId: userId}).populate('authorId');
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

    if (freetDetails.categories !== undefined) {
      freet.categories = freetDetails.categories as Array<string>;
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
    if (freets) {
      const freetIds = Array<Types.ObjectId | string>();
      for (const freet of freets) {
        freetIds.push(freet._id);
      }
      await UserCollection.deleteLikesByFreetIds(freetIds);
    }
    await FreetModel.deleteMany({authorId});
  }
}

export default FreetCollection;
