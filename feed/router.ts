import type {NextFunction, Request, Response} from 'express';
import express from 'express';
import FeedCollection from './collection';
import * as feedValidator from '../feed/middleware';
import * as util from '../freet/util';
import FreetCollection from 'freet/collection';

const router = express.Router();

/**
 * Get freets in feed
 *
 * @name GET /api/feed
 *
 * @return {FreetResponse[]} - A list of all the freets sorted in descending
 *                      order by date modified
 */
 router.get(
  '/',
  [
    feedValidator.isUserLoggedIn,
    feedValidator.isCurrentSessionUserExists
  ],
  async (req: Request, res: Response) => {
    const feed = await FeedCollection.findFeedByUserId(req.session.userId);
    const response = (feed && feed.freets) ? feed.freets : [];
    res.status(200).json(response);
  }
);

export {router as feedRouter};
