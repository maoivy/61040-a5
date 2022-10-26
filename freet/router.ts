import type {NextFunction, Request, Response} from 'express';
import {Types} from 'mongoose';
import express from 'express';
import FreetCollection from './collection';
import * as userValidator from '../user/middleware';
import * as freetValidator from '../freet/middleware';
import * as util from './util';
import type {Freet} from './model';
import UserCollection from '../user/collection';
import RelevanceCollection from '../relevance/collection';
import ReadCollection from '../read/collection';

const router = express.Router();

/**
 * Get freets from home feed
 *
 * @name GET /api/freets
 *
 * @return {FreetResponse[]} - A list of all the freets sorted in descending
 *                      order by date modified
 * @throws {403} - If user is not logged in
 */
/**
 * Get filtered freets from home feed
 *
 * @name GET /api/freets?filterId=filter
 *
 * @return {FreetResponse[]} - A list of all the freets sorted in descending
 *                      order by date modified
 */
/**
 * Get freets by author.
 *
 * @name GET /api/freets?userId=id
 *
 * @return {FreetResponse[]} - An array of freets created by user with id userId
 * @throws {400} - If userId is not given
 * @throws {404} - If user with userId is not found
 *
 */
router.get(
  '/',
  [
    userValidator.isUserLoggedIn,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    // Check if userId query parameter was supplied
    if (req.query.userId !== undefined) {
      next();
      return;
    }

    const userId = (req.session.userId as string)
    const feed = await FreetCollection.findFeedFreets(userId);
    const response = feed.map(util.constructFreetResponse);
    res.status(200).json(response);
  },
  [
    userValidator.isAuthorExists
  ],
  async (req: Request, res: Response) => {
    const authorFreets = await FreetCollection.findAllByUserId(req.query.userId as string);
    const response = authorFreets.map(util.constructFreetResponse);
    res.status(200).json(response);
  }
);

/**
 * Create a new freet.
 *
 * @name POST /api/freets
 *
 * @param {string} content - The content of the freet
 * @param {string} readmore - The readmore of the freet
 * @param {string} categories - The categories of the freet
 * @param {string} refreetOf - The freet this freet is refreeting
 * @param {string} replyTo - The freet this freet is replying to
 * @return {FreetResponse} - The created freet
 * @throws {403} - If the user is not logged in
 * @throws {400} - If the freet content is empty or a stream of empty spaces,
 *                 or if categories are specified and the freet is a reply or refreet
 * @throws {413} - If the freet content is more than 140 characters long or categories are incorrectly formatted/too long
 */
router.post(
  '/',
  [
    userValidator.isUserLoggedIn,
    freetValidator.isValidFreetContent,
    freetValidator.isValidReadMore,
    freetValidator.isValidCategories,
    freetValidator.isValidRefreetOf,
    freetValidator.canRefreetFreet,
    freetValidator.isValidReplyTo,
    freetValidator.noCategoriesOnRefreetOrReplyCreate,
    freetValidator.canReplyFreet,
  ],
  async (req: Request, res: Response) => {
    const userId = (req.session.userId as string) ?? ''; // Will not be an empty string since its validated in isUserLoggedIn
    const categories = util.parseCategories(req.body.categories);
    const { content, readmore } = req.body;
    // if refreetOf/replyTo is not defined, pass in undefined 
    const refreetOf = (req.body.refreetOf && req.body.refreetOf.trim()) ? req.body.refreetOf : undefined;
    const replyTo = (req.body.replyTo && req.body.replyTo.trim()) ? req.body.replyTo : undefined;
    const freet = await FreetCollection.addOne(userId, content, readmore, categories, refreetOf, replyTo);

    // create a new relevance for each category
    for (const category of categories) {
      await RelevanceCollection.addOneOrReactivate(category, freet._id);
    }

    if (refreetOf) {
      // increment refreet count
      const refreeted = await FreetCollection.findOne(refreetOf);
      await FreetCollection.updateOne(refreetOf, { refreets: refreeted.refreets + 1 });
      // add refreet to user's refreet list
      const user = await UserCollection.findOneByUserId(userId);
      await UserCollection.updateOne(userId, { refreets: [...user.refreets, new Types.ObjectId(refreetOf)] })
    }

    if (replyTo) {
      // increment reply count
      const replied = await FreetCollection.findOne(replyTo);
      await FreetCollection.updateOne(replyTo, { replies: replied.replies + 1 });
    }

    res.status(201).json({
      message: 'Your freet was created successfully.',
      freet: util.constructFreetResponse(freet)
    });
  }
);

/**
 * Delete a freet
 *
 * @name DELETE /api/freets/:id
 *
 * @return {string} - A success message
 * @throws {403} - If the user is not logged in or is not the author of
 *                 the freet
 * @throws {404} - If the freetId is not valid
 */
router.delete(
  '/:freetId?',
  [
    userValidator.isUserLoggedIn,
    freetValidator.isFreetExistsParams,
    freetValidator.isValidFreetModifier,
  ],
  async (req: Request, res: Response) => {
    // decrement refreet/reply counts if applicable
    await FreetCollection.cleanCountsByFreetId(req.params.freetId);
    // remove relevances 
    await RelevanceCollection.deleteByFreetIds([new Types.ObjectId(req.params.freetId)]);
    // remove read records
    await ReadCollection.deleteManyByFreet(req.params.freetId);

    await FreetCollection.deleteOne(req.params.freetId);
    res.status(200).json({
      message: 'Your freet was deleted successfully.'
    });
  }
);

/**
 * Modify a freet's categories (no other field can be changed by the user)
 *
 * @name PUT /api/freets/:id
 *
 * @param {string} categories - the new categories for the freet
 * @return {FreetResponse} - the updated freet
 * @throws {403} - if the user is not logged in or not the author of the freet
 * @throws {404} - If the freetId is not valid
 * @throws {413} - If the freet categories are improperly formatted/too long
 * @throws {400} - If categories are specified and the freet is a reply or refreet
 */
router.put(
  '/:freetId?',
  [
    userValidator.isUserLoggedIn,
    freetValidator.isFreetExistsParams,
    freetValidator.isValidFreetModifier,
    freetValidator.isValidCategories,
    freetValidator.noCategoriesOnRefreetOrReplyEdit,
  ],
  async (req: Request, res: Response) => {
    const { freetId } = req.params;
    const categories = util.parseCategories(req.body.categories);

    let freet = await FreetCollection.findOne(freetId);
    for (const newCategory of categories) {
      // create a new relevance for every new category
      if (!freet.categories.includes(newCategory)) {
        await RelevanceCollection.addOneOrReactivate(newCategory, freetId);
      }
    }
    for (const oldCategory of freet.categories) {
      if (!categories.includes(oldCategory.toString())) {
        // category was removed, so deactivate it
        await RelevanceCollection.deactivateByCategoryAndFreetId(oldCategory.toString(), freetId);
      }
    }

    freet = await FreetCollection.updateOne(freetId, { categories });

    res.status(200).json({
      message: 'Your freet was updated successfully.',
      freet: util.constructFreetResponse(freet)
    });
  }
);

/**
 * Like freet.
 *
 * @name POST /api/freets/like
 *
 * @param {string} freetId - The freet to like
 * @return {FreetResponse} - The liked freet
 * @throws {403} - If the user is not logged in or has already liked the freet
 * @throws {404} - If the freet ID is invalid
 */
 router.post(
  '/like',
  [
    userValidator.isUserLoggedIn,
    freetValidator.isFreetExistsBody,
    freetValidator.canLikeFreet,
  ],
  async (req: Request, res: Response) => {
    const userId = (req.session.userId as string) ?? ''; // Will not be an empty string since its validated in isUserLoggedIn
    const user = await UserCollection.findOneByUserId(userId);
    const freet = await FreetCollection.findOne(req.body.freetId);

    await UserCollection.updateOne(userId, { likes: [...user.likes, new Types.ObjectId(req.body.freetId)] });
    const updatedFreet = await FreetCollection.updateOne(req.body.freetId, { likes: freet.likes + 1 });

    res.status(201).json({
      message: 'You have successfully liked freet ' + req.body.freetId + '.',
      freet: util.constructFreetResponse(updatedFreet)
    });
  }
);

/**
 * Unlike freet.
 *
 * @name DELETE /api/freets/like/:freetId
 *
 * @param {string} freetId - The freet to unlike
 * @return {FreetResponse} - The liked freet
 * @throws {403} - If the user is not logged in or has not already liked the freet
 * @throws {404} - If the freet ID is invalid
 */
 router.delete(
  '/like/:freetId?',
  [
    userValidator.isUserLoggedIn,
    freetValidator.isFreetExistsParams,
    freetValidator.canUnlikeFreet,
  ],
  async (req: Request, res: Response) => {
    const userId = (req.session.userId as string) ?? ''; // Will not be an empty string since its validated in isUserLoggedIn
    const user = await UserCollection.findOneByUserId(userId);
    const freet = await FreetCollection.findOne(req.params.freetId);

    await UserCollection.updateOne(userId, { likes: user.likes.filter((id) => id.toString() !== req.params.freetId) });
    const updatedFreet = await FreetCollection.updateOne(req.params.freetId, { likes: freet.likes - 1 });

    res.status(201).json({
      message: 'You have successfully unliked freet ' + req.params.freetId + '.',
      freet: util.constructFreetResponse(updatedFreet)
    });
  }
);

/**
 * Get freets by reply parent.
 *
 * @name GET /api/freets/reply?freetId=freetId
 *
 * @return {FreetResponse[]} - An array of freets created by user with id, authorId
 * @throws {400} - If freetId is not given
 * @throws {404} - If no freet has the given freetId
 *
 */
 router.get(
  '/reply',
  [
    userValidator.isUserLoggedIn,
    freetValidator.isFreetGiven,
    freetValidator.isFreetExistsQuery,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    const { freetId } = req.query as { freetId: string }
    const replies = await FreetCollection.findAllByReplyTo(freetId);
    const response = replies.map(util.constructFreetResponse);
    res.status(200).json(response);
  }
);

export {router as freetRouter};
