import {Types} from 'mongoose';
import type {HydratedDocument} from 'mongoose';
import type {User} from './model';
import UserModel from './model';
import FreetCollection from '../freet/collection';

/**
 * This file contains a class with functionality to interact with users stored
 * in MongoDB, including adding, finding, updating, and deleting. Feel free to add
 * additional operations in this file.
 *
 * Note: HydratedDocument<User> is the output of the UserModel() constructor,
 * and contains all the information in User. https://mongoosejs.com/docs/typescript.html
 */
class UserCollection {
  /**
   * Add a new user
   *
   * @param {string} username - The username of the user
   * @param {string} password - The password of the user
   * @return {Promise<HydratedDocument<User>>} - The newly created user
   */
  static async addOne(username: string, password: string, bio: string): Promise<HydratedDocument<User>> {
    const dateJoined = new Date();
    const following = new Array<Types.ObjectId>();
    const followedBy = new Array<Types.ObjectId>();
    const likes = new Array<Types.ObjectId>();
    const refreets = new Array<Types.ObjectId>();

    const user = new UserModel({ 
      username, password, dateJoined, bio, following, followedBy, likes, refreets, filter: 'default'
    });
    await user.save(); // Saves user to MongoDB

    return user;
  }

  /**
   * Find a user by userId.
   *
   * @param {string} userId - The userId of the user to find
   * @return {Promise<HydratedDocument<User>> | Promise<null>} - The user with the given username, if any
   */
  static async findOneByUserId(userId: Types.ObjectId | string): Promise<HydratedDocument<User>> {
    return UserModel.findOne({_id: userId});
  }

  /**
   * Find a user by username (case insensitive).
   *
   * @param {string} username - The username of the user to find
   * @return {Promise<HydratedDocument<User>> | Promise<null>} - The user with the given username, if any
   */
  static async findOneByUsername(username: string): Promise<HydratedDocument<User>> {
    return UserModel.findOne({username: new RegExp(`^${username.trim()}$`, 'i')});
  }

  /**
   * Find a user by username (case insensitive).
   *
   * @param {string} username - The username of the user to find
   * @param {string} password - The password of the user to find
   * @return {Promise<HydratedDocument<User>> | Promise<null>} - The user with the given username, if any
   */
  static async findOneByUsernameAndPassword(username: string, password: string): Promise<HydratedDocument<User>> {
    return UserModel.findOne({
      username: new RegExp(`^${username.trim()}$`, 'i'),
      password
    });
  }

  /**
   * Update user's information
   *
   * @param {string} userId - The userId of the user to update
   * @param {Object} userDetails - An object with the user's updated credentials
   * @return {Promise<HydratedDocument<User>>} - The updated user
   */
  static async updateOne(userId: Types.ObjectId | string, userDetails: any): Promise<HydratedDocument<User>> {
    const user = await UserModel.findOne({_id: userId});
    if (userDetails.password) {
      user.password = userDetails.password as string;
    }

    if (userDetails.username) {
      user.username = userDetails.username as string;
    }

    if (userDetails.bio !== undefined) {
      user.bio = userDetails.bio as string;
    }

    if (userDetails.filter) {
      user.filter = userDetails.filter as string;
    }

    if (userDetails.following !== undefined) {
      user.following = userDetails.following as Array<Types.ObjectId>;
    }

    if (userDetails.followedBy !== undefined) {
      user.followedBy = userDetails.followedBy as Array<Types.ObjectId>;
    }

    if (userDetails.likes !== undefined) {
      user.likes = userDetails.likes as Array<Types.ObjectId>;
    }

    if (userDetails.refreets !== undefined) {
      user.refreets = userDetails.refreets as Array<Types.ObjectId>;
    }

    await user.save();
    return user;
    
  }

/**
   * Delete likes for freets from every user.
   * Used when the freets in question are deleted.
   *
   * @param {Array<Types.ObjectId | string>} freetIds - The ids of freets to delete
   * @return {Promise<void>}
   */
 static async deleteLikesByFreetIds(freetIds: Array<Types.ObjectId | string>): Promise<void> {
   const freetIdObjects = freetIds.map((id) => new Types.ObjectId(id.toString()));
   await UserModel.updateMany({ 'likes': { $in: freetIdObjects } }, { $pull: { 'likes': { $in: freetIdObjects } } });
}


/**
   * Delete following/followed by records for the user with userId.
   * Used when the user in question is deleted.
   *
   * @param {Types.ObjectId | string} userId - The ids of freets to delete
   * @return {Promise<void>}
   */
 static async deleteFollowers(userId: Types.ObjectId | string): Promise<void> {
   const userIdObject = new Types.ObjectId(userId.toString());
   await UserModel.updateMany({ 'following': userIdObject }, { $pull: { 'following': userIdObject } });
   await UserModel.updateMany({ 'followedBy': userIdObject }, { $pull: { 'followedBy': userIdObject } });
}

  /**
   * Delete a user from the collection.
   *
   * @param {string} userId - The userId of user to delete
   * @return {Promise<Boolean>} - true if the user has been deleted, false otherwise
   */
  static async deleteOne(userId: Types.ObjectId | string): Promise<boolean> {
    const user = await UserModel.deleteOne({_id: userId});
    return user !== null;
  }
}

export default UserCollection;
