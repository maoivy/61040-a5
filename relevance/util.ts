import type {HydratedDocument, Types} from 'mongoose';
import type {Relevance, PopulatedRelevance} from './model';

// Update this if you add a property to the Relevance type!
type RelevanceResponse = {
  _id: string;
  category: string;
  freet: string;
  relevanceScore: number;
  relevantVotes: number;
  totalVotes: number;
};

/**
 * Transform a raw Relevance object from the database into an object
 * with all the information needed by the frontend
 *
 * @param {HydratedDocument<Freet>} relevance - A relevance
 * @returns {RelevanceResponse} - The relevance object formatted for the frontend
 */
const constructRelevanceResponse = (relevance: HydratedDocument<Relevance>): RelevanceResponse => {
  const relevanceCopy: PopulatedRelevance = {
    ...relevance.toObject({
      versionKey: false // Cosmetics; prevents returning of __v property
    })
  };
  const { content } = relevanceCopy.freetId;
  delete relevanceCopy.freetId;
  return {
    ...relevanceCopy,
    _id: relevanceCopy._id.toString(),
    category: relevanceCopy.category.toString(),
    freet: content,
    relevanceScore: relevanceCopy.relevanceScore,
    relevantVotes: relevanceCopy.relevantVotes,
    totalVotes: relevanceCopy.totalVotes,
  };
};

export {
  constructRelevanceResponse,
};
