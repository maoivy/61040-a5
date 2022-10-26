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
 * @param {HydratedDocument<Freet>} category - A category
 * @returns {RelevanceResponse} - The category object formatted for the frontend
 */
const constructRelevanceResponse = (category: HydratedDocument<Relevance>): RelevanceResponse => {
  const categoryCopy: PopulatedRelevance = {
    ...category.toObject({
      versionKey: false // Cosmetics; prevents returning of __v property
    })
  };
  const { content } = categoryCopy.freetId;
  delete categoryCopy.freetId;
  return {
    ...categoryCopy,
    _id: categoryCopy._id.toString(),
    category: categoryCopy.category.toString(),
    freet: content,
    relevanceScore: categoryCopy.relevanceScore,
    relevantVotes: categoryCopy.relevantVotes,
    totalVotes: categoryCopy.totalVotes,
  };
};

export {
  constructRelevanceResponse,
};
