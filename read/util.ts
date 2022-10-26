import type {HydratedDocument, Types} from 'mongoose';
import type {Read} from './model';

// Update this if you add a property to the Read type!
type ReadResponse = {
  _id: string;
  freetId: string,
  userId: string,
};

/**
 * Transform a raw Read object from the database into an object
 * with all the information needed by the frontend
 *
 * @param {HydratedDocument<Read>} read - A read record
 * @returns {ReadResponse} - The read object formatted for the frontend
 */
const constructReadResponse = (read: HydratedDocument<Read>): ReadResponse => {
  return {
    _id: read._id.toString(),
    freetId: read.freetId.toString(),
    userId: read.userId.toString(),
  };
};

export {
  constructReadResponse,
};
