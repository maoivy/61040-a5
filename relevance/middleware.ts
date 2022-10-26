import type {Request, Response, NextFunction} from 'express';
import {Collection, Types} from 'mongoose';
import FreetCollection from '../freet/collection';
import UserCollection from '../user/collection';
import RelevanceCollection from './collection';
import CollectionCollection from './collection';

/**
 * Checks if category in req.query is valid, i.e. not undefined or blank, and no more than 24 characters
 */
 const isCategoryValidQuery = async (req: Request, res: Response, next: NextFunction) => {
  const { category } = req.query as { category: string };
  if (!category || category.trim().length === 0) {
    res.status(400).json({
      error: `Category name cannot be blank.`
    });
    return;
  }

  if (category.trim().length > 24) {
    res.status(413).json({
      error: `Category name is too long.`
    });
    return;
  }

  next();
};

/**
 * Checks if category in req.body is valid, i.e. not undefined or blank, and no more than 24 characters
 */
 const isCategoryValidBody = async (req: Request, res: Response, next: NextFunction) => {
  const { category } = req.body as { category: string };
  if (!category || category.trim().length === 0) {
    res.status(400).json({
      error: `Category name cannot be blank.`
    });
    return;
  }

  if (category.trim().length > 24) {
    res.status(413).json({
      error: `Category name is too long.`
    });
    return;
  }

  next();
};

/**
 * Checks if relevance with relevanceId in req.body exists
 */
 const isRelevanceExistsBody = async (req: Request, res: Response, next: NextFunction) => {
  const { relevanceId } = req.body;
  const relevance = await RelevanceCollection.findOneByRelevanceId(relevanceId)
  if (!relevance) {
    res.status(404).json({
      error: {
        relevanceNotFound: `Relevance ${relevanceId} not found.`
      }
    });
    return;
  }

  next();
};

/**
 * Checks if relevance with relevanceId in req.params exists
 */
 const isRelevanceExistsParams = async (req: Request, res: Response, next: NextFunction) => {
  const { relevanceId } = req.params;
  const relevance = await RelevanceCollection.findOneByRelevanceId(relevanceId)
  if (!relevance) {
    res.status(404).json({
      error: {
        relevanceNotFound: `Relevance ${relevanceId} not found.`
      }
    });
    return;
  }

  next();
};

/**
 * Checks if relevance with relevanceId in req.body is active, i.e. freet is currently in the category
 */
 const isRelevanceActiveBody = async (req: Request, res: Response, next: NextFunction) => {
  const { relevanceId } = req.body;
  const relevance = await RelevanceCollection.findOneByRelevanceId(relevanceId);

  if (!relevance.active) {
    res.status(400).json({
      error: `Relevance ${relevanceId} is not currently active.`
    });
    return;
  }

  next();
};

/**
 * Checks if relevance with relevanceId in req.params is active, i.e. freet is currently in the category
 */
 const isRelevanceActiveParams = async (req: Request, res: Response, next: NextFunction) => {
  const { relevanceId } = req.params;
  const relevance = await RelevanceCollection.findOneByRelevanceId(relevanceId)

  if (!relevance.active) {
    res.status(400).json({
      error: `Relevance ${relevanceId} is not currently active.`
    });
    return;
  }

  next();
};

/**
 * Checks if vote in req.body is valid, i.e. "relevant" or "irrelevant"
 */
 const isVoteValid = async (req: Request, res: Response, next: NextFunction) => {
  const { vote } = req.body as { vote: string };
  if (vote !== "relevant" && vote !== "irrelevant") {
    res.status(400).json({
      error: `Vote must be either "relevant" or "irrelevant".`
    });
    return;
  }

  next();
};

/**
 * Checks that current user can vote on relevanceId in req.body
 * i.e., they haven't already voted on it
 */
 const isUserCanVote = async (req: Request, res: Response, next: NextFunction) => {
  const { relevanceId } = req.body;
  const relevance = await RelevanceCollection.findOneByRelevanceId(relevanceId);
  const allVoters = [...relevance.relevantVoters, ...relevance.irrelevantVoters];
  if (!allVoters) {
    next();
    return;
  }

  for (const voter of allVoters) {
    if (voter.toString() === req.session.userId.toString()) {
      res.status(403).json({
        error: `You have already voted on this relevance.`
      });
      return;
    }
  }
  
  next();
};

/**
 * Checks that current user can delete their vote on relevanceId in req.params
 * i.e., they have already voted on it
 */
 const isUserCanDeleteVote = async (req: Request, res: Response, next: NextFunction) => {
  const { relevanceId } = req.params;
  const relevance = await RelevanceCollection.findOneByRelevanceId(relevanceId);
  const allVoters = [...relevance.relevantVoters, ...relevance.irrelevantVoters];
  if (!allVoters) {
    next();
    return;
  }

  for (const voter of allVoters) {
    if (voter.toString() === req.session.userId.toString()) {
      next();
      return;
    }
  }
  
  res.status(403).json({
    error: `You have not yet voted on this relevance.`
  });
  return;
};


export {
  isCategoryValidQuery,
  isCategoryValidBody,
  isRelevanceExistsBody,
  isRelevanceExistsParams,
  isRelevanceActiveBody,
  isRelevanceActiveParams,
  isVoteValid,
  isUserCanVote,
  isUserCanDeleteVote,
};
