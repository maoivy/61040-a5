import type {HydratedDocument, Types} from 'mongoose';
import type {Freet, PopulatedFreet} from '../freet/model';
import type {Collection} from './model';

// Update this if you add a property to the Freet type!
type CollectionResponse = {
  _id: string;
  userId: string;
  name: string;
  freets: Array<Types.ObjectId>;
};

/**
 * Transform a raw Freet object from the database into an object
 * with all the information needed by the frontend
 *
 * @param {HydratedDocument<Freet>} collection - A collection
 * @returns {CollectionResponse} - The freet object formatted for the frontend
 */
const constructCollectionResponse = (collection: HydratedDocument<Collection>): CollectionResponse => {
  const collectionCopy: Collection = {
    ...collection.toObject({
      versionKey: false // Cosmetics; prevents returning of __v property
    })
  };
  return {
    ...collectionCopy,
    name: collectionCopy.name.toString(),
    userId: collectionCopy.userId.toString(),
    _id: collectionCopy._id.toString(),
    freets: collectionCopy.freets as Array<Types.ObjectId>,
  };
};

export {
  constructCollectionResponse,
};
