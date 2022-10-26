import type {Request, Response, NextFunction} from 'express';
import {Types} from 'mongoose';
import FreetCollection from '../freet/collection';
import UserCollection from '../user/collection';
import ReadCollection from '../read/collection';

/**
 * Checks if a freet with freetId in req.params exists
 */
const isFreetExistsParams = async (req: Request, res: Response, next: NextFunction) => {
  const { freetId } = req.params;
  const validFormat = Types.ObjectId.isValid(freetId);
  const freet = validFormat ? await FreetCollection.findOne(freetId) : '';
  if (!freet) {
    res.status(404).json({
      error: {
        freetNotFound: `Freet with freet ID ${freetId} does not exist.`
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
  const { freetId } = req.body;
  const validFormat = Types.ObjectId.isValid(freetId);
  const freet = validFormat ? await FreetCollection.findOne(freetId) : '';
  if (!freet) {
    res.status(404).json({
      error: {
        freetNotFound: `Freet with freet ID ${freetId} does not exist.`
      }
    });
    return;
  }

  next();
};

/**
 * Checks if a freet with freetId in req.query exists
 */
 const isFreetExistsQuery = async (req: Request, res: Response, next: NextFunction) => {
  const { freetId } = req.query as { freetId: string };
  const validFormat = Types.ObjectId.isValid(freetId);
  const freet = validFormat ? await FreetCollection.findOne(freetId) : '';
  if (!freet) {
    res.status(404).json({
      error: {
        freetNotFound: `Freet with freet ID ${freetId} does not exist.`
      }
    });
    return;
  }

  next();
};

/**
 * Checks if the content of the freet in req.body is valid, i.e not a stream of empty
 * spaces and not more than 140 characters
 * 
 * Emptiness is only allowed for refreets
 */
const isValidFreetContent = (req: Request, res: Response, next: NextFunction) => {
  const {content} = req.body as {content: string};
  if (!content.trim() && !req.body.refreetOf) {
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
 * Checks if a freet with id refreetOf in req.body exists
 */
 const isValidRefreetOf = async (req: Request, res: Response, next: NextFunction) => {
  const { refreetOf } = req.body as { refreetOf: string };
  // if it's empty or undefined, that's OK; the freet is not a refreet
  if (refreetOf === undefined || !refreetOf.trim()) {
    next();
    return;
  }
  
  const validFormat = Types.ObjectId.isValid(refreetOf);
  const freet = validFormat ? await FreetCollection.findOne(refreetOf) : '';
  if (!freet) {
    res.status(404).json({
      error: {
        freetNotFound: `Freet with freet ID ${refreetOf} does not exist.`
      }
    });
    return;
  }

  next();
};

/**
 * Checks if a freet with id replyTo in req.body exists
 */
 const isValidReplyTo = async (req: Request, res: Response, next: NextFunction) => {
  const { replyTo } = req.body as { replyTo: string };
  // if it's empty or undefined, that's OK; the freet is not a reply
  if (replyTo === undefined || !replyTo.trim()) {
    next();
    return;
  }

  const validFormat = Types.ObjectId.isValid(replyTo);
  const freet = validFormat ? await FreetCollection.findOne(replyTo) : '';
  if (!freet) {
    res.status(404).json({
      error: {
        freetNotFound: `Freet with freet ID ${replyTo} does not exist.`
      }
    });
    return;
  }

  next();
};

/**
 * Checks if the user can refreet the freet with id refreetOf 
 * i.e., they have not already refreeted it
 * 
 * We don't need to check if they can un-refreet it; they can simply delete the refreet
 */
 const canRefreetFreet = async (req: Request, res: Response, next: NextFunction) => {
  const user = await UserCollection.findOneByUserId(req.session.userId);
  const { refreetOf } = req.body as { refreetOf: string };

  if (refreetOf) {
    if (user.refreets.some((id) => id.toString() === refreetOf)) {
      res.status(403).json({
        error: 'You have already refreeted this Freet.'
      });
      return;
    }

    const freet = await FreetCollection.findOne(refreetOf);
    if (freet.readmore) {
      // has read more, check for a read record
      const read = await ReadCollection.findOneByFreetAndUser(refreetOf, req.session.userId);
      if (!read) {
        res.status(403).json({
          error: 'You can\'t refreet this Freet before you read the read more.'
        });
        return;
      }
    }
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

  const user = await UserCollection.findOneByUserId(req.session.userId);
  if (user.likes.some((id) => id.toString() === freetId)) {
    res.status(403).json({
      error: 'You have already liked this Freet.'
    });
    return;
  }

  const freet = await FreetCollection.findOne(freetId);
  console.log(freet);
  if (freet.readmore) {
    console.log("here");
    // has read more, check for a read record
    const read = await ReadCollection.findOneByFreetAndUser(freetId, req.session.userId);
    if (!read) {
      res.status(403).json({
        error: 'You can\'t like this Freet before you read the read more.'
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

  const user = await UserCollection.findOneByUserId(req.session.userId);
  if (!user.likes.some((id) => id.toString() === freetId)) {
    res.status(403).json({
      error: 'You have not yet liked this Freet.'
    });
    return;
  }

  next();
};

/**
 * Checks if the user can reply to the freet replyTo in req.body, if applicable
 * i.e., it has no read more or it does and the user has read it
 */
 const canReplyFreet = async (req: Request, res: Response, next: NextFunction) => {
  const replyTo = req.body.replyTo;
  const { userId } = req.session;

  if (replyTo) {
    const freet = await FreetCollection.findOne(replyTo);
    if (freet.readmore) {
      // has read more, check for a read record
      const read = await ReadCollection.findOneByFreetAndUser(replyTo, userId);
      if (!read) {
        res.status(403).json({
          error: 'You can\'t reply to this Freet before you read the read more.'
        });
        return;
      }
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

/**
 * Checks if freetId in req.query exists (i.e. not undefined or blank)
 */
 const isFreetGiven = async (req: Request, res: Response, next: NextFunction) => {
  const { freetId } = req.query as { freetId: string };
  if (freetId === undefined || freetId.trim() === '') {
    res.status(400).json({
      error: `Freet ID was not given.`
    });
    return;
  }

  next();
};

/**
 * Checks that no categories are assigned if the freet in req.body is a refreet or reply
 */
 const noCategoriesOnRefreetOrReplyCreate = async (req: Request, res: Response, next: NextFunction) => {
  const { categories, replyTo, refreetOf } = req.body;

  // it's neither a reply nor refreet, so categories can be anything valid
  const noReply = (replyTo === undefined) || (!replyTo.trim());
  const noRefreet = (refreetOf === undefined) || (!refreetOf.trim());
  if (noReply && noRefreet) {
    next();
    return;
  }

  // if categories is defined and non-empty, throw error
  if (categories !== undefined && categories.trim().length !== 0) {
    res.status(400).json({
      error: `Categories cannot be assigned to replies or refreets.`
    });
    return;
  }

  next();
};

/**
 * Checks that no categories are assigned if the freet in req.params is a refreet or reply
 */
 const noCategoriesOnRefreetOrReplyEdit = async (req: Request, res: Response, next: NextFunction) => {
  const freetId = req.params.freetId as string;
  const { categories } = req.body;
  const freet = await FreetCollection.findOne(freetId);

  // if both are undefined, it's neither a reply nor refreet, so categories can be anything valid
  if (freet.replyTo === undefined && freet.refreetOf === undefined) {
    next();
    return;
  }

  // if categories is defined and non-empty, throw error
  if (categories !== undefined && categories.trim().length !== 0) {
    res.status(400).json({
      error: `Categories cannot be assigned to replies or refreets.`
    });
    return;
  }

  next();
};


export {
  isValidFreetContent,
  isFreetExistsParams,
  isFreetExistsBody,
  isFreetExistsQuery,
  isValidFreetModifier,
  isValidReadMore,
  canLikeFreet,
  canUnlikeFreet,
  isValidCategories,
  isFreetGiven,
  isValidRefreetOf,
  isValidReplyTo,
  canRefreetFreet,
  noCategoriesOnRefreetOrReplyCreate,
  noCategoriesOnRefreetOrReplyEdit,
  canReplyFreet,
};
