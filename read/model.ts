import type {Types, PopulatedDoc, Document, Decimal128} from 'mongoose';
import {Schema, model} from 'mongoose';

/**
 * This file defines the properties stored in a Read
 * DO NOT implement operations here ---> use collection file
 */

// Type definition for Read on the backend
export type Read = {
  _id: Types.ObjectId; // MongoDB assigns each object this ID on creation
  userId: Types.ObjectId,
  freetId: Types.ObjectId;
};

// Mongoose schema definition for interfacing with a MongoDB table
// Categories stored in this table will have these fields, with the
// type given by the type property, inside MongoDB
const ReadSchema = new Schema<Read>({
  // for tracking purposes only, no populating needed
  // the user reading the Freet
  userId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  // the Freet being read
  freetId: {
    type: Schema.Types.ObjectId,
    required: true
  }
});

const ReadModel = model<Schema>('Read', ReadSchema);
export default ReadModel;
