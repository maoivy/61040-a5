import type {HydratedDocument} from 'mongoose';
import {Types} from 'mongoose';
import type {Relevance} from './model';
import RelevanceModel from './model';

/**
 * This files contains a class that has the functionality to explore relevance rankings
 * stored in MongoDB, including adding, finding, updating, and deleting relevance.
 * Feel free to add additional operations in this file.
 *
 * Note: HydratedDocument<Relevance> is the output of the RelevanceModel() constructor,
 * and contains all the information in Relevance. https://mongoosejs.com/docs/typescript.html
 */
class RelevanceCollection {
  /**
   * Add a category, or reactivate an existing relevance
   *
   * @param {string} category - The name of the category being voted in
   * @param {Types.ObjectId | string} freetId - The freet being voted on
   * @return {Promise<HydratedDocument<Relevance>>} - The newly created relevance 
   */
  static async addOneOrReactivate(category: string, freetId: Types.ObjectId | string): Promise<HydratedDocument<Relevance>> {
    const relevance = await RelevanceCollection.findOneByCategoryAndFreetId(category, freetId);
    if (relevance) {
      // relevance already exists and just needs to be reactivated
      relevance.active = true;
      await relevance.save(); 
      return relevance.populate('freetId');
    } else {
      // create a new relevance
      const newRelevance = new RelevanceModel({ 
        category, 
        freetId: new Types.ObjectId(freetId),
        relevanceScore: 0,
        relevantVotes: 0,
        totalVotes: 0,  
        relevantVoters: new Array<Types.ObjectId>(),
        irrelevantVoters: new Array<Types.ObjectId>(),
        active: true,
      });
      await newRelevance.save(); 
      return newRelevance.populate('freetId');
    }
  }

  /**
   * Find all active relevance entries by category, sorted by relevance score then total votes descending
   *
   * @param {string} category - The name of the category
   * @return {Promise<Array<HydratedDocument<Relevance>>>} - The ranking entry for the freet and category, if any
   */
   static async findAllByCategory(category: string): Promise<Array<HydratedDocument<Relevance>>> {
    return RelevanceModel.find({ category, active: true }).sort({ relevanceScore: -1, totalVotes: -1 }).populate('freetId');
  }

  /**
   * Find a relevance entry by relevanceId
   *
   * @param {Types.ObjectId | string} relevanceId - The relevance id
   * @return {Promise<HydratedDocument<Relevance>> | Promise<null> } - The ranking entry for the freet and category, if any
   */
   static async findOneByRelevanceId(relevanceId: Types.ObjectId | string): Promise<HydratedDocument<Relevance>> {
    return RelevanceModel.findOne({ _id: relevanceId }).populate('freetId');
  }

  /**
   * Find a relevance entry by category and freetId
   *
   * @param {string} category - The name of the category
   * @param {Types.ObjectId | string} freetId - The freet id
   * @return {Promise<HydratedDocument<Relevance>> | Promise<null> } - The ranking entry for the freet and category, if any
   */
   static async findOneByCategoryAndFreetId(category: string, freetId: Types.ObjectId | string): Promise<HydratedDocument<Relevance>> {
    return RelevanceModel.findOne({ category, freetId }).populate('freetId');
  }

  /**
   * Deactivate a relevance entry by category and freetId
   *
   * @param {string | Array<string>} category - The name of the category
   * @param {Types.ObjectId | string} freetId - The freet id
   * @return {Promise<HydratedDocument<Relevance>> | Promise<null> } - The deactivated relevance
   */
   static async deactivateByCategoryAndFreetId(category: string | Array<string>, freetId: Types.ObjectId | string): Promise<HydratedDocument<Relevance>> {
    if (typeof category === 'string') {
      return RelevanceModel.updateOne({ category, freetId }, { active: false }).populate('freetId');
    } else {
      return RelevanceModel.updateMany({ category, freetId }, { active: false }).populate('freetId');
    }
  }

  /**
   * Vote on relevance by relevanceId
   *
   * @param {Types.ObjectId | string} relevanceId - The relevance id
   * @param {string} vote - Whether to vote relevant or irrelevant
   * @param {Types.ObjectId | string} userId - The user voting
   * @return {Promise<HydratedDocument<Relevance>>} - The newly updated relevance
   */
  static async updateOneWithNewVote(relevanceId: Types.ObjectId | string, vote: string, userId: Types.ObjectId | string): Promise<HydratedDocument<Relevance>> {
    const relevance = await RelevanceCollection.findOneByRelevanceId(relevanceId); 

    let newRelevantVotes = relevance.relevantVotes;
    let newTotalVotes = relevance.totalVotes;
    let newRelevanceScore = relevance.relevanceScore;
    let newRelevantVoters = relevance.relevantVoters;
    let newIrrelevantVoters = relevance.irrelevantVoters;

    if (vote === "relevant") {
      // increment number of relevance votes
      newRelevantVotes++;
      newRelevantVoters.push(new Types.ObjectId(userId));
    } else if (vote === "irrelevant") {
      // number of relevant votes doesn't change
      newIrrelevantVoters.push(new Types.ObjectId(userId));
    }
    newTotalVotes++;
    newRelevanceScore = newTotalVotes ? (newRelevantVotes / newTotalVotes) : 0;
    
    relevance.relevantVotes = newRelevantVotes as number;
    relevance.totalVotes = newTotalVotes as number;
    relevance.relevanceScore = newRelevanceScore as number;
    relevance.relevantVoters = newRelevantVoters as Array<Types.ObjectId>;
    relevance.irrelevantVoters = newIrrelevantVoters as Array<Types.ObjectId>;

    await relevance.save();
    return relevance.populate('freetId');
  }

  /**
   * Remove a vote by relevanceId
   *
   * @param {Types.ObjectId | string} relevanceId - The relevance id
   * @param {Types.ObjectId | string} userId - The user voting
   * @return {Promise<HydratedDocument<Relevance>>} - The newly updated relevance
   */
   static async updateOneWithRemovedVote(relevanceId: Types.ObjectId | string, userId: Types.ObjectId | string): Promise<HydratedDocument<Relevance>> {
    const relevance = await RelevanceCollection.findOneByRelevanceId(relevanceId); 
    const userIdObject = new Types.ObjectId(userId);

    let newRelevantVotes = relevance.relevantVotes;
    let newTotalVotes = relevance.totalVotes;
    let newRelevanceScore = relevance.relevanceScore;
    let newRelevantVoters = relevance.relevantVoters;
    let newIrrelevantVoters = relevance.irrelevantVoters;

    if (relevance.relevantVoters.includes(userIdObject)) {
      // user had voted relevant
      newRelevantVotes--;
      newRelevantVoters = newRelevantVoters.filter((id) => id.toString() !== userId);
    } else if (relevance.irrelevantVoters.includes(userIdObject)) {
      newIrrelevantVoters = newIrrelevantVoters.filter((id) => id.toString() !== userId);
    }
    newTotalVotes--;
    newRelevanceScore = newTotalVotes ? (newRelevantVotes / newTotalVotes) : 0;
    
    relevance.relevantVotes = newRelevantVotes as number;
    relevance.totalVotes = newTotalVotes as number;
    relevance.relevanceScore = newRelevanceScore as number;
    relevance.relevantVoters = newRelevantVoters as Array<Types.ObjectId>;
    relevance.irrelevantVoters = newIrrelevantVoters as Array<Types.ObjectId>;

    await relevance.save();
    return relevance.populate('freetId');
  }

  /**
   * Removes all relevance votes for a given userId
   * Used when that user is deleted
   * 
   * @param {Types.ObjectId | string} userId - The user whose votes to remove
   * @return {Promise<void>}
   */
     static async removeVotesByUserId(userId: Types.ObjectId | string): Promise<void> {
      const userIdObject = new Types.ObjectId(userId);
      
      // relevant votes
      // update vote counts
      await RelevanceModel.updateMany({ relevantVoters: userIdObject }, { $inc: { relevantVotes: -1, totalVotes: -1 }})
      // update relevance scores
      // await RelevanceModel.updateMany({ relevantVoters: userIdObject, totalVotes: 0 }, { relevanceScore: 0 })
      // await RelevanceModel.updateMany({ 
      //   relevantVoters: userIdObject, 
      //   totalVotes: { $ne: 0 } 
      // }, { relevanceScore: { $divide: ['$relevantVotes', '$totalVotes'] } });
      

      // irrelevant votes
      // update vote counts
      await RelevanceModel.updateMany({ irrelevantVoters: userIdObject }, { $inc: { totalVotes: -1 }})
      // update relevance scores
      // await RelevanceModel.updateMany({ irrelevantVoters: userIdObject, totalVotes: 0 }, { relevanceScore: 0 })
      // await RelevanceModel.updateMany({ 
      //   irrelevantVoters: userIdObject, 
      //   totalVotes: { $ne: 0 } 
      // }, { relevanceScore: { $divide: ['$relevantVotes', '$totalVotes'] } });

      // update relevance scores
      // divide only works in aggregate so I could not find a better way to do it than this :)
      const votes = await RelevanceModel.find({ $or: [{ relevantVoters: userIdObject }, { irrelevantVoters: userIdObject }]});
      for (const vote of votes) {
        const newRelevanceScore = (vote.totalVotes === 0) ? 0 : vote.relevantVotes / vote.totalVotes;
        await RelevanceModel.updateOne({ _id: vote._id }, { relevanceScore: newRelevanceScore });
      }

      // remove the voter from the lists
      await RelevanceModel.updateMany({ relevantVoters: userIdObject }, { $pull: { relevantVoters: userIdObject } });
      await RelevanceModel.updateMany({ irrelevantVoters: userIdObject }, { $pull: { irrelevantVoters: userIdObject } });
    }

  /**
   * Deletes all relevances for given freets
   *
   * @param {Array<Types.ObjectId> | Array<string>} freetIds - The freet ids
   * @return {Promise<void> }
   */
   static async deleteByFreetIds(freetIds: Array<Types.ObjectId> | Array<string>): Promise<void> {
    await RelevanceModel.deleteMany({ freetId: { $in: freetIds } });
  }
}

export default RelevanceCollection;
