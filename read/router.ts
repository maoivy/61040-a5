import type {NextFunction, Request, Response} from 'express';
import {Types} from 'mongoose';
import express from 'express';
import * as userValidator from '../user/middleware';
import * as freetValidator from '../freet/middleware';
import * as readValidator from './middleware';
import * as util from './util';
import UserCollection from '../user/collection';
import ReadCollection from './collection';

const router = express.Router();

/**
 * Mark a Freet as read.
 *
 * @name POST /api/read
 *
 * @param {Types.ObjectId | string} freetId - The freet being read
 * @return {ReadResponse} - The new read record
 * @throws {403} - If the user is not logged in or has already read the Freet, or if the Freet has no readmore
 * @throws {404} - If freet with freetId is not found
 */
router.post(
  '/',
  [
    userValidator.isUserLoggedIn,
    freetValidator.isFreetExistsBody,
    readValidator.canReadFreet,
  ],
  async (req: Request, res: Response) => {
    const read = await ReadCollection.addOne(req.body.freetId, req.session.userId);

    res.status(201).json({
      message: `You have read Freet ${req.body.freetId}.`,
      relevance: util.constructReadResponse(read),
    });
  }
);

export {router as readRouter};
