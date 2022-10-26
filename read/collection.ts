import type {HydratedDocument} from 'mongoose';
import {Types} from 'mongoose';
import type {Read} from './model';
import ReadModel from './model';

/**
 * This files contains a class that has the functionality to explore relevance rankings
 * stored in MongoDB, including adding, finding, updating, and deleting relevance.
 * Feel free to add additional operations in this file.
 *
 * Note: HydratedDocument<Relevance> is the output of the RelevanceModel() constructor,
 * and contains all the information in Relevance. https://mongoosejs.com/docs/typescript.html
 */
class ReadCollection {
  /**
   * Add a read record
   *
   * @param {Types.ObjectId | string} freetId - The freet being read
   * @param {Types.ObjectId | string} userId - The user reading
   * @return {Promise<HydratedDocument<ReadableStreamGenericReader>>} - The newly created relevance 
   */
  static async addOne(freetId: Types.ObjectId | string, userId: Types.ObjectId | string): Promise<HydratedDocument<Read>> {
    const read = new ReadModel({  
      freetId: new Types.ObjectId(freetId),
      userId: new Types.ObjectId(userId),
    });
    await read.save(); 
    return read.populate(['freetId', 'userId']);
  }

  /**
   * Find a read record for a Freet and user
   *
   * @param {Types.ObjectId | string} freetId - The freet being read
   * @param {Types.ObjectId | string} userId - The user reading
   * @return {Promise<Array<HydratedDocument<Read>>>} - The read record for the freet and category, if any
   */
   static async findOneByFreetAndUser(freetId: Types.ObjectId | string, userId: Types.ObjectId | string): Promise<Array<HydratedDocument<Read>>> {
    return ReadModel.findOne({ freetId, userId });
  }

  /**
   * Delete read records for a Freet, used when the Freet is deleted
   *
   * @param {Types.ObjectId | string} freetId - The freet being deleted
   * @return {Promise<void>}
   */
   static async deleteManyByFreet(freetId: Types.ObjectId | string): Promise<void> {
    await ReadModel.deleteMany({ freetId });
  }

  /**
   * Delete read records for a user, used when the user is deleted
   *
   * @param {Types.ObjectId | string} userId - The user being deleted
   * @return {Promise<void>}
   */
   static async deleteManyByUser(userId: Types.ObjectId | string): Promise<void> {
    await ReadModel.deleteMany({ userId });
  }
}

export default ReadCollection;
