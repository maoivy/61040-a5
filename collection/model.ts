import type {Types, PopulatedDoc, Document} from 'mongoose';
import {Schema, model} from 'mongoose';
import type {User} from '../user/model';
import type {Freet} from '../freet/model';

/**
 * This file defines the properties stored in a Collection
 * DO NOT implement operations here ---> use collection file
 */

// Type definition for Collection on the backend
export type Collection = {
  _id: Types.ObjectId; // MongoDB assigns each object this ID on creation
  userId: Types.ObjectId;
  name: string;
  freets: Array<Types.ObjectId>;
  dateCreated: Date;
};

export type PopulatedCollection = {
  _id: Types.ObjectId; // MongoDB assigns each object this ID on creation
  userId: User;
  name: string;
  freets: Array<Freet>;
  dateCreated: Date;
};

// Mongoose schema definition for interfacing with a MongoDB table
// Collections stored in this table will have these fields, with the
// type given by the type property, inside MongoDB
const CollectionSchema = new Schema<Collection>({
  // The userId of the owner
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  // The name of the collection
  name: {
    type: String,
    required: true
  },
  // The freets in the collection
  freets: [{
    type: Schema.Types.ObjectId,
    ref: 'Freet'
  }],
   // The date the collection was created
   dateCreated: {
    type: Date,
    required: true
  },
});

const CollectionModel = model<Schema>('Collection', CollectionSchema);
export default CollectionModel;
