import type {NextFunction, Request, Response} from 'express';
import express from 'express';
import FreetCollection from './collection';
import * as userValidator from '../user/middleware';
import * as freetValidator from '../freet/middleware';
import * as util from './util';
import type {Freet} from './model';
import UserCollection from '../user/collection';

const router = express.Router();

/**
 * Get freets from home feed
 *
 * @name GET /api/freets
 *
 * @return {FreetResponse[]} - A list of all the freets sorted in descending
 *                      order by date modified
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
 * @name GET /api/freets?authorId=id
 *
 * @return {FreetResponse[]} - An array of freets created by user with id, authorId
 * @throws {400} - If authorId is not given
 * @throws {404} - If no user has given authorId
 *
 */
router.get(
  '/',
  [
    userValidator.isUserLoggedIn,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    // Check if authorId query parameter was supplied
    if (req.query.author !== undefined) {
      next();
      return;
    }

    const userId = (req.session.userId as string)
    const user = await UserCollection.findOneByUserId(userId);
    const feed = Array<Freet>();

    for (const followedId of [...user.following, userId]) {
      const freets = await FreetCollection.findAllByUserId(followedId);
      feed.push(...freets);
    }
    const response = feed.map(util.constructFreetResponse);
    res.status(200).json(response);
  },
  [
    userValidator.isAuthorExists
  ],
  async (req: Request, res: Response) => {
    const authorFreets = await FreetCollection.findAllByUsername(req.query.author as string);
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
 * @return {FreetResponse} - The created freet
 * @throws {403} - If the user is not logged in
 * @throws {400} - If the freet content is empty or a stream of empty spaces
 * @throws {413} - If the freet content is more than 140 characters long or categories are incorrectly formatted/too long
 */
router.post(
  '/',
  [
    userValidator.isUserLoggedIn,
    freetValidator.isValidFreetContent,
    freetValidator.isValidReadMore,
    freetValidator.isValidCategories,
  ],
  async (req: Request, res: Response) => {
    const userId = (req.session.userId as string) ?? ''; // Will not be an empty string since its validated in isUserLoggedIn
    const categories = util.parseCategories(req.body.categories);
    const freet = await FreetCollection.addOne(userId, req.body.content, req.body.readmore, categories);

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
    // remove it from the likes list of any users that liked it
    await UserCollection.deleteLikesByFreetId(req.params.freetId);
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
 * @throws {403} - if the user is not logged in or not the author of
 *                 of the freet
 * @throws {404} - If the freetId is not valid
 * @throws {413} - If the freet categories are improperly formatted/too long
 */
router.put(
  '/:freetId?',
  [
    userValidator.isUserLoggedIn,
    freetValidator.isFreetExistsParams,
    freetValidator.isValidFreetModifier,
    freetValidator.isValidCategories,
  ],
  async (req: Request, res: Response) => {
    const categories = util.parseCategories(req.body.categories);
    const freet = await FreetCollection.updateOne(req.params.freetId, { categories });
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

    await UserCollection.updateOne(userId, { likes: [...user.likes, req.body.freetId] });
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

export {router as freetRouter};
