import type {Request, Response, NextFunction} from 'express';
import {Collection, Types} from 'mongoose';
import FreetCollection from '../freet/collection';
import UserCollection from '../user/collection';
import CollectionCollection from './collection';

/**
 * Checks if a collection with collectionId in req.params exists
 */
const isCollectionExists = async (req: Request, res: Response, next: NextFunction) => {
  const validFormat = Types.ObjectId.isValid(req.params.collectionId);
  const collection = validFormat ? await CollectionCollection.findOne(req.params.collectionId) : '';
  if (!collection) {
    res.status(404).json({
      error: {
        collectionNotFound: `Collection with collection ID ${req.params.collectionId} does not exist.`
      }
    });
    return;
  }

  next();
};

/**
 * Checks if a freet with id freetId in req.body exists (undefined or empty is OK)
 */
 const isFreetExists = async (req: Request, res: Response, next: NextFunction) => {
  if (req.body.freetId !== undefined && req.body.freetId.trim().length !== 0 ) {
    const validFormat = Types.ObjectId.isValid(req.body.freetId);
    const freet = validFormat ? await FreetCollection.findOne(req.body.freetId) : '';
    if (!freet) {
      res.status(404).json({
        error: {
          freetNotFound: `Freet ID ${req.body.freetId} is invalid and cannot be added/removed.`
        }
      });
      return;
    }
  }
 
  next();
};

/**
 * Checks if freetId can be added or removed (whichever is specified in req.body) from collection
 * If either is undefined, it's OK since it will be ignored
 */
 const canAddOrRemoveFreet = async (req: Request, res: Response, next: NextFunction) => {
  const collection = await CollectionCollection.findOne(req.params.collectionId);
  const { freetId, addOrRemove } = req.body;
  const freets = collection.freets.map((freet) => freet._id.toString())
  if (freetId !== undefined) {
    if (addOrRemove === 'add' && freets.includes(freetId.toString())) {
      res.status(400).json({
        error: `Freet ID ${freetId} is already in the collection.`
      });
      return;
    } else if (addOrRemove === 'remove' && !freets.includes(freetId.toString())) {
      res.status(400).json({
        error: `Freet ID ${freetId} is not yet in the collection.`
      });
      return;
    }
  }
 
  next();
};

/**
 * Checks if the current user is the owner of the collection whose collectionId is in req.params
 */
const isValidCollectionModifier = async (req: Request, res: Response, next: NextFunction) => {
  const collection = await CollectionCollection.findOne(req.params.collectionId);
  const userId = collection.userId._id;
  if (req.session.userId !== userId.toString()) {
    res.status(403).json({
      error: 'Cannot modify other users\' collections.'
    });
    return;
  }

  next();
};

/**
 * Checks if the name of the collection in req.body is valid, i.e not a stream of empty
 * spaces and not more than 24 characters
 * 
 * Used for creation: empty/undefined is not allowed
 */
 const isValidCollectionNameCreate = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.body as { name: string };

  if (!name.trim()) {
    res.status(400).json({
      error: 'Collection name cannot be blank.'
    });
    return;
  }

  if (name && name.trim().length > 24) {
    res.status(413).json({
      error: 'Collection name must be no more than 24 characters.'
    });
    return;
  }

  next();
};

/**
 * Checks if the name of the collection in req.body is valid, i.e not more than 24 characters
 * 
 * Used for editing: empty/undefined IS allowed
 */
 const isValidCollectionNameEdit = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.body as { name: string };
  if (name && name.trim().length > 24) {
    res.status(413).json({
      error: 'Collection name must be no more than 24 characters.'
    });
    return;
  }

  next();
};

/**
 * Checks if the name of the collection is unique for the user
 */
 const isCollectionNameUnique = async (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.body as { name: string };

  const collections = await CollectionCollection.findAllByUserId(req.session.userId);
  for (const collection of collections) {
    if (collection.name.trim().toLowerCase() === name.trim().toLowerCase()) {
      // this only counts as a collision if it 1) is a creation or 2) is not the same as the current name
      if (!req.params || collection._id.toString() !== req.params.collectionId) {
        res.status(409).json({
          error: 'You already have a collection with this name.'
        });
        return;
      }
    }
  }

  next();
};


export {
  isValidCollectionNameCreate,
  isValidCollectionNameEdit,
  isCollectionNameUnique,
  isCollectionExists,
  isFreetExists,
  // isAddRemoveSpecifiedWithFreet,
  isValidCollectionModifier,
  canAddOrRemoveFreet,
};
