import type {HydratedDocument} from 'mongoose';
import {Types} from 'mongoose';
import type {Collection} from './model';
import CollectionModel from './model';
import UserCollection from '../user/collection';

/**
 * This files contains a class that has the functionality to explore freets
 * stored in MongoDB, including adding, finding, updating, and deleting freets.
 * Feel free to add additional operations in this file.
 *
 * Note: HydratedDocument<Freet> is the output of the FreetModel() constructor,
 * and contains all the information in Freet. https://mongoosejs.com/docs/typescript.html
 */
class CollectionCollection {
  /**
   * Add a freet to the collection
   *
   * @param {string} authorId - The id of the author of the freet
   * @param {string} content - The id of the content of the freet
   * @return {Promise<HydratedDocument<Freet>>} - The newly created freet
   */
  static async addOne(userId: Types.ObjectId | string, name: string): Promise<HydratedDocument<Collection>> {
    const date = new Date();
    const collection = new CollectionModel({
      userId,
      name,
      freets: new Array<Types.ObjectId>(),
      dateCreated: date,
    });
    await collection.save(); // Saves freet to MongoDB
    return collection.populate('userId');
  }

  /**
   * Find a collection by collectionId
   *
   * @param {string} collectionId - The id of the collection to find
   * @return {Promise<HydratedDocument<Collection>> | Promise<null> } - The collection with the given collectionId, if any
   */
   static async findOne(collectionId: Types.ObjectId | string): Promise<HydratedDocument<Collection>> {
    return CollectionModel.findOne({_id: collectionId}).populate('userId');
  }

  /**
   * Get all the collections for a given user with username
   *
   * @param {string} username - The user id of the user who made the collections
   * @return {Promise<HydratedDocument<Collection>[]>} - An array of all of the freets
   */
  static async findAllByUsername(username: string): Promise<Array<HydratedDocument<Collection>>> {
    const user = await UserCollection.findOneByUsername(username);
    return CollectionModel.find({userId: user._id}).populate('userId');
  }

  /**
   * Get all the collections for a given user with user id
   *
   * @param {string} userId - The user id of the user who made the collections
   * @return {Promise<HydratedDocument<Collection>[]>} - An array of all of the freets
   */
   static async findAllByUserId(userId: Types.ObjectId | string): Promise<Array<HydratedDocument<Collection>>> {
    return CollectionModel.find({ userId }).populate('userId');
  }

  /**
   * Update a collection with new content (name, freets)
   *
   * @param {string} collectionId - The id of the collection to be updated
   * @param {string} collectionDetails - The updated details of the collection
   * @return {Promise<HydratedDocument<Collection>>} - The newly updated freet
   */
  static async updateOne(collectionId: Types.ObjectId | string, collectionDetails: any): Promise<HydratedDocument<Collection>> {
    const collection = await CollectionModel.findOne({ _id: collectionId });
    if (collectionDetails.name) {
      collection.name = collectionDetails.name as string;
    }
    
    if (collectionDetails.freets !== undefined) {
      collection.freets = collectionDetails.freets as Array<Types.ObjectId>;
    }

    await collection.save();
    return collection.populate('userId');
  }

  /**
   * Delete a collection with given collectionId.
   *
   * @param {string} collectionId - The collectionId of freet to delete
   * @return {Promise<Boolean>} - true if the collection has been deleted, false otherwise
   */
  static async deleteOne(collectionId: Types.ObjectId | string): Promise<boolean> {
    const collection = await CollectionModel.deleteOne({ _id: collectionId });
    return collection !== null;
  }

  /**
   * Delete all the collections of the given user
   *
   * @param {string} userId - The id of the user
   */
  static async deleteManyByUserId(userId: Types.ObjectId | string): Promise<void> {
    await CollectionModel.deleteMany({ userId });
  }
}

export default CollectionCollection;
