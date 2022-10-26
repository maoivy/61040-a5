import type {Request, Response, NextFunction} from 'express';
import {Types} from 'mongoose';
import UserCollection from '../user/collection';

/**
 * Checks if the current session user (if any) still exists in the database, for instance,
 * a user may try to post a freet in some browser while the account has been deleted in another or
 * when a user tries to modify an account in some browser while it has been deleted in another
 */
const isCurrentSessionUserExists = async (req: Request, res: Response, next: NextFunction) => {
  if (req.session.userId) {
    const user = await UserCollection.findOneByUserId(req.session.userId);

    if (!user) {
      req.session.userId = undefined;
      res.status(500).json({
        error: {
          userNotFound: 'User session was not recognized.'
        }
      });
      return;
    }
  }

  next();
};

/**
 * Checks if a username in req.body is valid, that is, it matches the username regex
 * For creating a new user
 */
const isValidUsername = (req: Request, res: Response, next: NextFunction) => {
  const usernameRegex = /^\w+$/i;
  if (!usernameRegex.test(req.body.username)) {
    res.status(400).json({
      error: {
        username: 'Username must be a nonempty alphanumeric string.'
      }
    });
    return;
  }

  next();
};

/**
 * Checks if a username in req.body is valid, that is, it matches the username regex
 * For updating an existing user
 */
 const isBlankOrValidUsername = (req: Request, res: Response, next: NextFunction) => {
  // If the username is blank, no update will be done
  if (!req.body.username) {
    next();
    return;
  }

  const usernameRegex = /^\w+$/i;
  if (!usernameRegex.test(req.body.username)) {
    res.status(400).json({
      error: {
        username: 'Username must be a nonempty alphanumeric string.'
      }
    });
    return;
  }

  next();
};


/**
 * Checks if a password in req.body is valid, that is, at 6-50 characters long without any spaces
 * For creating a new user
 */
const isValidPassword = (req: Request, res: Response, next: NextFunction) => {
  const passwordRegex = /^\S+$/;
  if (!passwordRegex.test(req.body.password)) {
    res.status(400).json({
      error: {
        password: 'Password must be a nonempty string.'
      }
    });
    return;
  }

  next();
};

/**
 * Checks if a password in req.body is valid, that is, at 6-50 characters long without any spaces
 * For updating an existing user
 */
 const isBlankOrValidPassword = (req: Request, res: Response, next: NextFunction) => {
  // If the password is blank, no update will be done
  if (!req.body.password) {
    next();
    return;
  }

  const passwordRegex = /^\S+$/;
  if (!passwordRegex.test(req.body.password)) {
    res.status(400).json({
      error: {
        password: 'Password must be a nonempty string.'
      }
    });
    return;
  }

  next();
};

/**
 * Checks if a user with username and password in req.body exists
 */
const isAccountExists = async (req: Request, res: Response, next: NextFunction) => {
  const {username, password} = req.body as {username: string; password: string};

  if (!username || !password) {
    res.status(400).json({error: `Missing ${username ? 'password' : 'username'} credentials for sign in.`});
    return;
  }

  const user = await UserCollection.findOneByUsernameAndPassword(
    username, password
  );

  if (user) {
    next();
  } else {
    res.status(401).json({error: 'Invalid user login credentials provided.'});
  }
};

/**
 * Checks if a username in req.body is already in use
 * For creating a new user
 */
const isUsernameNotAlreadyInUse = async (req: Request, res: Response, next: NextFunction) => {
  const user = await UserCollection.findOneByUsername(req.body.username);

  // If the current session user wants to change their username to one which matches
  // the current one irrespective of the case, we should allow them to do so
  if (!user || (user?._id.toString() === req.session.userId)) {
    next();
    return;
  }

  res.status(409).json({
    error: {
      username: 'An account with this username already exists.'
    }
  });
};

/**
 * Checks if a username in req.body is blank or already in use
 * For updating an existing user
 */
 const isUsernameBlankOrNotAlreadyInUse = async (req: Request, res: Response, next: NextFunction) => {
  // If the username is blank, no update will be done
  if (!req.body.username) {
    next();
    return;
  }

  const user = await UserCollection.findOneByUsername(req.body.username);

  // If the current session user wants to change their username to one which matches
  // the current one irrespective of the case, we should allow them to do so
  if (!user || (user?._id.toString() === req.session.userId)) {
    next();
    return;
  }

  res.status(409).json({
    error: {
      username: 'An account with this username already exists.'
    }
  });
};

/**
 * Checks if the user is logged in, that is, whether the userId is set in session
 */
const isUserLoggedIn = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    res.status(403).json({
      error: {
        auth: 'You must be logged in to complete this action.'
      }
    });
    return;
  }

  next();
};

/**
 * Checks if the user is signed out, that is, userId is undefined in session
 */
const isUserLoggedOut = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.userId) {
    res.status(403).json({
      error: 'You are already signed in.'
    });
    return;
  }

  next();
};

/**
 * Checks if a user with userId in req.query exists
 */
const isAuthorExists = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.query.userId) {
    res.status(400).json({
      error: 'Provided author userId must be nonempty.'
    });
    return;
  }

  const validFormat = Types.ObjectId.isValid(req.query.userId as string);
  const user = validFormat ? await UserCollection.findOneByUserId(req.query.userId as string) : '';
  if (!user) {
    res.status(404).json({
      error: `A user with userId ${req.query.userId as string} does not exist.`
    });
    return;
  }

  next();
};

/**
 * Checks if a user with userId as id in req.query exists
 */
 const isUserExists = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.query.userId) {
    res.status(400).json({
      error: 'Provided user ID must be nonempty.'
    });
    return;
  }

  const user = await UserCollection.findOneByUserId(req.query.userId as string);
  if (!user) {
    res.status(404).json({
      error: `A user with user ID ${req.query.userId as string} does not exist.`
    });
    return;
  }

  next();
};

/**
 * Checks that a user with username in req.body exists and is not already followed by current user
 * Assumes current user exists and is logged in
 */
 const existsAndIsNotAlreadyFollowed = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.body.username) {
    res.status(400).json({
      error: 'Provided author username must be nonempty.'
    });
    return;
  }

  if (req.session.userId) {
    const user = await UserCollection.findOneByUserId(req.session.userId);
    const followedUser = await UserCollection.findOneByUsername(req.body.username);

    if (user) {
      if (user.following.includes(followedUser._id)) {
        res.status(403).json({
          error: 'You are already following ' + req.body.username + '.'
        });
        return;
      }
    }
  }

  next();
};

/**
 * Checks that a user with username in req.params exists and is already followed by current user
 * Assumes current user exists and is logged in
 */
 const existsAndIsAlreadyFollowed = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.params.username) {
    res.status(400).json({
      error: 'Provided author username must be nonempty.'
    });
    return;
  }

  if (req.session.userId) {
    const user = await UserCollection.findOneByUserId(req.session.userId);
    const followedUser = await UserCollection.findOneByUsername(req.params.username)

    if (user) {
      if (!user.following.includes(followedUser._id)) {
        res.status(403).json({
          error: 'You are not currently following ' + req.params.username + '.'
        });
        return;
      }
    }
  }

  next();
};

/**
 * Checks if the content of the bio in req.body is no more than 140 characters
 */
 const bioNotTooLong = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.bio && req.body.bio.length > 140) {
    res.status(413).json({
      error: 'Bio must be no more than 140 characters.'
    });
    return;
  }

  next();
};

/**
 * Checks that a user with username in req.params is not the user themselves
 * Assumes current user exists and is logged in
 */
 const isNotSelfParams = async (req: Request, res: Response, next: NextFunction) => {
  if (req.session.userId) {
    const user = await UserCollection.findOneByUserId(req.session.userId);

    if (user) {
      if (user.username == req.params.username) {
        res.status(403).json({
          error: 'You cannot unfollow yourself.'
        });
        return;
      }
    }
  }

  next();
};

/**
 * Checks that a user with username in req.body is not the user themselves
 * Assumes current user exists and is logged in
 */
 const isNotSelfBody = async (req: Request, res: Response, next: NextFunction) => {
  if (req.session.userId) {
    const user = await UserCollection.findOneByUserId(req.session.userId);

    if (user) {
      if (user.username == req.body.username) {
        res.status(403).json({
          error: 'You cannot follow yourself.'
        });
        return;
      }
    }
  }

  next();
};

/**
 * Checks that filter in req.body is valid, i.e., "default", "original", or "refreets"
 */
 const isBlankOrValidFilter = async (req: Request, res: Response, next: NextFunction) => {
  const { filter } = req.body;

  if (![undefined, '', 'default', 'original', 'refreets'].includes(filter)) {
    res.status(400).json({
      error: 'Filter must be either "default", "original", or "refreets".'
    });
    return;
  }

  next();
};

export {
  isCurrentSessionUserExists,
  isUserLoggedIn,
  isUserLoggedOut,
  isUsernameBlankOrNotAlreadyInUse,
  isUsernameNotAlreadyInUse,
  isAccountExists,
  isAuthorExists,
  isValidUsername,
  isBlankOrValidUsername,
  isValidPassword,
  isBlankOrValidPassword,
  isUserExists,
  existsAndIsNotAlreadyFollowed,
  existsAndIsAlreadyFollowed,
  bioNotTooLong,
  isNotSelfParams,
  isNotSelfBody,
  isBlankOrValidFilter,
};
