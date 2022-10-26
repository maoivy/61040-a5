import type {NextFunction, Request, Response} from 'express';
import {Types} from 'mongoose';
import express from 'express';
import * as userValidator from '../user/middleware';
import * as freetValidator from '../freet/middleware';
import * as relevanceValidator from './middleware';
import * as util from './util';
import UserCollection from '../user/collection';
import RelevanceCollection from './collection';

const router = express.Router();

/**
 * Get freets for category
 *
 * @name GET /api/relevance?category=category
 *
 * @return {CollectionResponse[]} - A list of all the freets in the category sorted in descending
 *                      order by relevance score
 * @throws {403} - If current user is not logged in
 * @throws {400} - If categoryName is undefined or blank
 * @throws {413} - If categoryName exceeds 24 characters
 */
router.get(
  '/',
  [
    userValidator.isUserLoggedIn,
    relevanceValidator.isCategoryValidQuery,
  ],
  async (req: Request, res: Response) => {
    const rankings = await RelevanceCollection.findAllByCategory(req.query.category as string);
    const response = rankings.map(util.constructRelevanceResponse);
    res.status(200).json(response);
  },
);

/**
 * Vote on a relevance.
 *
 * @name POST /api/relevance
 *
 * @param {string} relevanceId - The relevance to vote on
 * @param {string} vote - Whether or not the user thinks it is "relevant" or "irrelevant"
 * @return {RankingResponse} - The updated ranking
 * @throws {403} - If the user is not logged in or has already voted on the relevance
 * @throws {404} - If no relevance ranking is found with relevanceId
 */
router.post(
  '/',
  [
    userValidator.isUserLoggedIn,
    relevanceValidator.isRelevanceExistsBody,
    relevanceValidator.isRelevanceActiveBody,
    relevanceValidator.isVoteValid,
    relevanceValidator.isUserCanVote,
  ],
  async (req: Request, res: Response) => {
    const userId = (req.session.userId as string) ?? '';
    const { relevanceId, vote } = req.body;
    const relevance = await RelevanceCollection.updateOneWithNewVote(relevanceId, vote, userId);

    res.status(201).json({
      message: `You have successfully voted.`,
      relevance: util.constructRelevanceResponse(relevance)
    });
  }
);

/**
 * Delete a relevance vote
 *
 * @name DELETE /api/relevance/:relevanceId?
 *
 * @return {string} - A success message
 * @throws {403} - If the user is not logged in or is not the owner of the collection
 * @throws {404} - If the collectionId is not valid
 */
router.delete(
  '/:relevanceId?',
  [
    userValidator.isUserLoggedIn,
    relevanceValidator.isRelevanceExistsParams,
    relevanceValidator.isRelevanceActiveParams,
    relevanceValidator.isUserCanDeleteVote,
  ],
  async (req: Request, res: Response) => {
    await RelevanceCollection.updateOneWithRemovedVote(req.params.relevanceId, req.session.userId);
    res.status(200).json({
      message: 'Your relevance vote was deleted successfully.'
    });
  }
);

export {router as relevanceRouter};
