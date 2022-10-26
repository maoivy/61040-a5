import type {Types, PopulatedDoc, Document, Decimal128} from 'mongoose';
import {Schema, model} from 'mongoose';
import type {Freet} from "../freet/model";

/**
 * This file defines the properties stored in a Relevance
 * DO NOT implement operations here ---> use collection file
 */

// Type definition for Relevance on the backend
export type Relevance = {
  _id: Types.ObjectId; // MongoDB assigns each object this ID on creation
  category: string;
  freetId: Types.ObjectId;
  relevanceScore: number;
  relevantVotes: number;
  totalVotes: number;
  relevantVoters: Array<Types.ObjectId>;
  irrelevantVoters: Array<Types.ObjectId>;
  active: boolean;
};

export type PopulatedRelevance = {
  _id: Types.ObjectId; // MongoDB assigns each object this ID on creation
  category: string;
  freetId: Freet;
  relevanceScore: number;
  relevantVotes: number;
  totalVotes: number;
  relevantVoters: Array<Types.ObjectId>;
  irrelevantVoters: Array<Types.ObjectId>;
  active: boolean;
};

// Mongoose schema definition for interfacing with a MongoDB table
// Categories stored in this table will have these fields, with the
// type given by the type property, inside MongoDB
const RelevanceSchema = new Schema<Relevance>({
  // The category being voted on
  category: {
    type: String,
    required: true,
  },
  // The freet being voted on
  freetId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Freet'
  },
  relevanceScore: {
    type: Number,
    required: true,
  },
  relevantVotes: {
    type: Number,
    required: true,
  },
  totalVotes: {
    type: Number,
    required: true,
  },
  relevantVoters: {
    type: [Schema.Types.ObjectId],
    required: true
  },
  irrelevantVoters: {
    type: [Schema.Types.ObjectId],
    required: true
  },
  active: {
    type: Boolean,
    required: true,
  }
});

const RelevanceModel = model<Schema>('Relevance', RelevanceSchema);
export default RelevanceModel;
