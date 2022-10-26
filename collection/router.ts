import type {NextFunction, Request, Response} from 'express';
import {Types} from 'mongoose';
import express from 'express';
import FreetCollection from './collection';
import * as userValidator from '../user/middleware';
import * as freetValidator from '../freet/middleware';
import * as collectionValidator from './middleware';
import * as util from './util';
import type {Collection} from './model';
import UserCollection from '../user/collection';
import CollectionCollection from './collection';

const router = express.Router();

/**
 * Get collections by userId
 *
 * @name GET /api/collection?userId=userId
 *
 * @return {CollectionResponse[]} - A list of all the collections sorted in descending
 *                      order by date created
 * @throws {403} - If current user is not logged in
 * @throws {404} - If user with userId does not exist
 */
router.get(
  '/',
  [
    userValidator.isUserLoggedIn,
    userValidator.isUserExists,
  ],
  async (req: Request, res: Response) => {
    const collections = await CollectionCollection.findAllByUserId(req.query.userId as string);
    const response = collections.map(util.constructCollectionResponse);
    res.status(200).json(response);
  },
);

/**
 * Create a new collection.
 *
 * @name POST /api/collection
 *
 * @param {string} name - The name of the collection
 * @return {CollectionResponse} - The created collection
 * @throws {403} - If the user is not logged in
 * @throws {400} - If the collection name is empty or a stream of empty spaces
 * @throws {413} - If the collection name is more than 24 characters long
 */
router.post(
  '/',
  [
    userValidator.isUserLoggedIn,
    collectionValidator.isValidCollectionNameCreate,
    collectionValidator.isCollectionNameUnique,
  ],
  async (req: Request, res: Response) => {
    const userId = (req.session.userId as string) ?? '';
    const collection = await CollectionCollection.addOne(userId, req.body.name.trim());

    res.status(201).json({
      message: 'Your collection was created successfully.',
      collection: util.constructCollectionResponse(collection)
    });
  }
);

/**
 * Delete a collection
 *
 * @name DELETE /api/collection/:collectionId
 *
 * @return {string} - A success message
 * @throws {403} - If the user is not logged in or is not the owner of the collection
 * @throws {404} - If the collectionId is not valid
 */
router.delete(
  '/:collectionId?',
  [
    userValidator.isUserLoggedIn,
    collectionValidator.isCollectionExists,
    collectionValidator.isValidCollectionModifier,
  ],
  async (req: Request, res: Response) => {
    await CollectionCollection.deleteOne(req.params.collectionId);
    res.status(200).json({
      message: 'Your collection was deleted successfully.'
    });
  }
);

/**
 * Modify a collection's name or freets 
 * 
 * @name PUT /api/collection/:id
 *
 * @param {string} name - the new name for the collection
 * @param {string} freetId - the id of a freet to add or remove
 * @param {string} addOrRemove - whether to add or remove the freet specified
 * @return {FreetResponse} - the updated collection
 * @throws {400} - if the new collection name is blank or a stream of empty spaces, or if both freet and add/remove are
 *                 specified and either the freet is already in or not already in the collection, respectively
 * @throws {403} - if the user is not logged in or not the author of the collection
 * @throws {404} - if the collectionId is not valid or the freet does not exist
 * @throws {409} - if the user already has a collection with that name
 * @throws {413} - if the new collection name exceeds 24 characters

 */
router.put(
  '/:collectionId?',
  [
    userValidator.isUserLoggedIn,
    collectionValidator.isCollectionExists,
    collectionValidator.isFreetExists,
    collectionValidator.isValidCollectionModifier,
    collectionValidator.isValidCollectionNameEdit,
    collectionValidator.isCollectionNameUnique,
    collectionValidator.canAddOrRemoveFreet,
  ],
  async (req: Request, res: Response) => {
    const { collectionId } = req.params;
    const { freetId, name, addOrRemove } = req.body;

    const collection = await CollectionCollection.findOne(collectionId);
    let newFreets = collection.freets.map((freet) => freet._id);
    // note that freet will only be changed if freetId and addOrRemove are both specified
    // otherwise ignored (unless freetId is invalid)
    if (freetId !== undefined) {
      if (addOrRemove == 'add') {
        newFreets.push(new Types.ObjectId(freetId));
      } else if (addOrRemove == 'remove') {
        newFreets = newFreets.filter((id) => id.toString() !== freetId);
      }
    }
    const updatedCollection = await CollectionCollection.updateOne(req.params.collectionId, { name: name.trim(), freets: newFreets });
    res.status(200).json({
      message: 'Your collection was updated successfully.',
      collection: util.constructCollectionResponse(updatedCollection),
    });
  }
);

export {router as collectionRouter};
