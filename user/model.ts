import type {Types} from 'mongoose';
import {Schema, model} from 'mongoose';

/**
 * This file defines the properties stored in a User
 * DO NOT implement operations here ---> use collection file
 */

// Type definition for User on the backend
export type User = {
  _id: Types.ObjectId; // MongoDB assigns each object this ID on creation
  username: string;
  password: string;
  dateJoined: Date;
  bio: string;
  filter: string;
  following: Array<Types.ObjectId>;
  followedBy: Array<Types.ObjectId>;
  likes: Array<Types.ObjectId>;
  refreets: Array<Types.ObjectId>;
};

// Mongoose schema definition for interfacing with a MongoDB table
// Users stored in this table will have these fields, with the
// type given by the type property, inside MongoDB
const UserSchema = new Schema({
  // The user's username
  username: {
    type: String,
    required: true
  },
  // The user's password
  password: {
    type: String,
    required: true
  },
  // The date the user joined
  dateJoined: {
    type: Date,
    required: true
  },
  // The user's bio
  bio: {
    type: String,
  },
  // The user's current feed filter
  filter: {
    type: String,
    required: true
  },

  // The below fields are left unpopulated because so far they've been for tracking purposes
  // Who the user is following
  following: {
    type: [Schema.Types.ObjectId],
    required: true
  },
  // Who the user is followed by
  followedBy: {
    type: [Schema.Types.ObjectId],
    required: true
  },
  // Freets the user has liked
  likes: {
    type: [Schema.Types.ObjectId],
    required: true
  },
  // Freets the user has refreeted
  refreets: {
    type: [Schema.Types.ObjectId],
    required: true
  },
});

const UserModel = model<User>('User', UserSchema);
export default UserModel;
