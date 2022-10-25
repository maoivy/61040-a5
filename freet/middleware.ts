import type {Request, Response, NextFunction} from 'express';
import {Types} from 'mongoose';
import FreetCollection from '../freet/collection';
import UserCollection from '../user/collection';

/**
 * Checks if a freet with freetId in req.params exists
 */
const isFreetExistsParams = async (req: Request, res: Response, next: NextFunction) => {
  const validFormat = Types.ObjectId.isValid(req.params.freetId);
  const freet = validFormat ? await FreetCollection.findOne(req.params.freetId) : '';
  if (!freet) {
    res.status(404).json({
      error: {
        freetNotFound: `Freet with freet ID ${req.params.freetId} does not exist.`
      }
    });
    return;
  }

  next();
};

/**
 * Checks if a freet with freetId in req.body exists
 */
 const isFreetExistsBody = async (req: Request, res: Response, next: NextFunction) => {
  const validFormat = Types.ObjectId.isValid(req.body.freetId);
  const freet = validFormat ? await FreetCollection.findOne(req.body.freetId) : '';
  if (!freet) {
    res.status(404).json({
      error: {
        freetNotFound: `Freet with freet ID ${req.body.freetId} does not exist.`
      }
    });
    return;
  }

  next();
};

/**
 * Checks if the content of the freet in req.body is valid, i.e not a stream of empty
 * spaces and not more than 140 characters
 */
const isValidFreetContent = (req: Request, res: Response, next: NextFunction) => {
  const {content} = req.body as {content: string};
  if (!content.trim()) {
    res.status(400).json({
      error: 'Freet content must be at least one character long.'
    });
    return;
  }

  if (content.length > 140) {
    res.status(413).json({
      error: 'Freet content must be no more than 140 characters.'
    });
    return;
  }

  next();
};

/**
 * Checks if the current user is the author of the freet whose freetId is in req.params
 */
const isValidFreetModifier = async (req: Request, res: Response, next: NextFunction) => {
  const freet = await FreetCollection.findOne(req.params.freetId);
  const userId = freet.authorId._id;
  if (req.session.userId !== userId.toString()) {
    res.status(403).json({
      error: 'Cannot modify other users\' freets.'
    });
    return;
  }

  next();
};

/**
 * Checks if the readmore of the freet in req.body is valid, i.e not a stream of empty
 * spaces and not more than 140 characters
 */
 const isValidReadMore = (req: Request, res: Response, next: NextFunction) => {
  const {readmore} = req.body as {readmore: string};

  // blank readmores will be treated as the freet not having a readmore
  if (readmore && readmore.length > 600) {
    res.status(413).json({
      error: 'Read more content must be no more than 600 characters.'
    });
    return;
  }

  next();
};

/**
 * Checks if the user can like the freet with id in req.body
 * i.e., has not already liked it
 */
 const canLikeFreet = async (req: Request, res: Response, next: NextFunction) => {
  const freetId = req.body.freetId;

  if (req.session.userId) {
    const user = await UserCollection.findOneByUserId(req.session.userId);
    if (user.likes.some((id) => id.toString() == freetId)) {
      res.status(403).json({
        error: 'You have already liked this Freet.'
      });
      return;
    }
  }

  next();
};

/**
 * Checks if the user can unlike the freet with id in req.params
 * i.e., has already liked it
 */
 const canUnlikeFreet = async (req: Request, res: Response, next: NextFunction) => {
  const freetId = req.params.freetId;

  if (req.session.userId) {
    const user = await UserCollection.findOneByUserId(req.session.userId);
    if (!user.likes.some((id) => id.toString() == freetId)) {
      res.status(403).json({
        error: 'You have not yet liked this Freet.'
      });
      return;
    }
  }

  next();
};

/**
 * Checks if the categories in req.body are of the correct format
 * i.e., comma-separated list of strings, none exceeding 24 characters
 */
 const isValidCategories = async (req: Request, res: Response, next: NextFunction) => {
   if (typeof req.body.categories !== 'string') {
    res.status(413).json({
      error: 'Category formatting is invalid.'
    });
    return;
  }

  const categories = req.body.categories.split(',');
  for (const category of categories) {
    if (category.length > 24) {
      res.status(413).json({
        error: 'Category name ' + category + ' exceed the 24-character limit.'
      });
      return;
    }
  }

  next();
};


export {
  isValidFreetContent,
  isFreetExistsParams,
  isFreetExistsBody,
  isValidFreetModifier,
  isValidReadMore,
  canLikeFreet,
  canUnlikeFreet,
  isValidCategories,
};
