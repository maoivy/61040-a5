import type {Types, PopulatedDoc, Document} from 'mongoose';
import {Schema, model} from 'mongoose';
import type {User} from '../user/model';

/**
 * This file defines the properties stored in a Freet
 * DO NOT implement operations here ---> use collection file
 */

// Type definition for Freet on the backend
export type Freet = {
  _id: Types.ObjectId; // MongoDB assigns each object this ID on creation
  authorId: Types.ObjectId;
  dateCreated: Date;
  content: string;
  readmore: string;
  categories: Array<String>;
  likes: number;
  refreets: number;
  replies: number;
  refreetOf: Types.ObjectId;
  replyTo: Types.ObjectId;
};

export type PopulatedFreet = {
  _id: Types.ObjectId; // MongoDB assigns each object this ID on creation
  authorId: User;
  dateCreated: Date;
  content: string;
  readmore: string;
  categories: Array<String>;
  likes: number;
  refreets: number;
  replies: number;
  refreetOf: Freet;
  replyTo: Freet;
};

// Mongoose schema definition for interfacing with a MongoDB table
// Freets stored in this table will have these fields, with the
// type given by the type property, inside MongoDB
const FreetSchema = new Schema<Freet>({
  // The author userId
  authorId: {
    // Use Types.ObjectId outside of the schema
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  // The date the freet was created
  dateCreated: {
    type: Date,
    required: true,
  },
  // The content of the freet
  content: {
    type: String,
    required: true,
  },
  // The readmore of the freet
  readmore: {
    type: String,
  },
  // The categories of the freet
  categories: {
    type: [String],
    required: true,
  },
  // The number of likes on the freet
  likes: {
    type: Number,
    required: true,
  },
  // The number of refreets on the freet
  refreets: {
    type: Number,
    required: true,
  },
  // The number of replies on the freet
  replies: {
    type: Number,
    required: true,
  },
  // The freet this freet is refreeting (if any)
  // Will be empty if not
  refreetOf: {
    type: Schema.Types.ObjectId,
    ref: 'Freet'
  },
  // The freet this freet is replying to (if any)
  // Will be empty if not
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'Freet'
  },
});

const FreetModel = model<Freet>('Freet', FreetSchema);
export default FreetModel;
