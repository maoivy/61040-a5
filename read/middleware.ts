import type {Request, Response, NextFunction} from 'express';
import FreetCollection from '../freet/collection';
import ReadCollection from './collection';

/**
 * Checks if the user can read the freet
 * i.e., hasn't read already and the Freet has a read more
 */
 const canReadFreet = async (req: Request, res: Response, next: NextFunction) => {
  const { freetId } = req.body;
  const { userId } = req.session;

  const freet = await FreetCollection.findOne(freetId);
  if (!freet.readmore) {
    res.status(403).json({
      error: `This Freet does not have a read more.`
    });
    return;
  }

  // has a readmore, check for a read record
  const read = await ReadCollection.findOneByFreetAndUser(freetId, userId);
  if (read) {
    res.status(403).json({
      error: `You have already read this Freet.`
    });
    return;
  }

  next();
};

export {
  canReadFreet
};
