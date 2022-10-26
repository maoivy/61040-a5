import type {HydratedDocument} from 'mongoose';
import moment from 'moment';
import type {Freet, PopulatedFreet} from '../freet/model';

// Update this if you add a property to the Freet type!
type FreetResponse = {
  _id: string;
  author: string;
  dateCreated: string;
  content: string;
  likes: number,
  refreets: number,
  replies: number,
  replyTo: string,
  refreetOf: string,
};

/**
 * Encode a date as an unambiguous string
 *
 * @param {Date} date - A date object
 * @returns {string} - formatted date as string
 */
const formatDate = (date: Date): string => moment(date).format('MMMM Do YYYY, h:mm:ss a');

/**
 * Transform a raw Freet object from the database into an object
 * with all the information needed by the frontend
 *
 * @param {HydratedDocument<Freet>} freet - A freet
 * @returns {FreetResponse} - The freet object formatted for the frontend
 */
const constructFreetResponse = (freet: HydratedDocument<Freet>): FreetResponse => {
  const freetCopy: PopulatedFreet = {
    ...freet.toObject({
      versionKey: false // Cosmetics; prevents returning of __v property
    })
  };
  const {username} = freetCopy.authorId;
  delete freetCopy.authorId;
  return {
    ...freetCopy,
    _id: freetCopy._id.toString(),
    author: username,
    refreetOf: freetCopy.refreetOf ? freetCopy.refreetOf.toString() : "none",
    replyTo: freetCopy.replyTo ? freetCopy.replyTo.toString() : "none",
    dateCreated: formatDate(freet.dateCreated),
  };
};

/**
 * Parse a comma-separated string of categories into an array
 *
 * @param {string} categories - comma-separated string of categories
 * @returns {Array<string} - parsed and cleaned array of categories
 */
const parseCategories = (categoriesString: string): Array<string> => {
  // drop empty and duplicate categories
  const categories = categoriesString.split(',').map((category: string) => category.trim())
  return [...new Set<string>(categories.filter((category: string) => category.length > 0))]
}

export {
  constructFreetResponse,
  FreetResponse,
  parseCategories,
};
