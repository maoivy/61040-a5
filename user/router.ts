import type {Request, Response} from 'express';
import express from 'express';
import FreetCollection from '../freet/collection';
import UserCollection from './collection';
import * as userValidator from '../user/middleware';
import * as util from './util';
import FeedCollection from '../feed/collection';

const router = express.Router();

/**
 * Sign in user.
 *
 * @name POST /api/users/session
 *
 * @param {string} username - The user's username
 * @param {string} password - The user's password
 * @return {UserResponse} - An object with user's details
 * @throws {403} - If user is already signed in
 * @throws {400} - If username or password is  not in the correct format,
 *                 or missing in the req
 * @throws {401} - If the user login credentials are invalid
 *
 */
router.post(
  '/session',
  [
    userValidator.isUserLoggedOut,
    userValidator.isValidUsername,
    userValidator.isValidPassword,
    userValidator.isAccountExists
  ],
  async (req: Request, res: Response) => {
    const user = await UserCollection.findOneByUsernameAndPassword(
      req.body.username, req.body.password
    );
    req.session.userId = user._id.toString();
    res.status(201).json({
      message: 'You have logged in successfully',
      user: util.constructUserResponse(user)
    });
  }
);

/**
 * Sign out a user
 *
 * @name DELETE /api/users/session
 *
 * @return - None
 * @throws {403} - If user is not logged in
 *
 */
router.delete(
  '/session',
  [
    userValidator.isUserLoggedIn
  ],
  (req: Request, res: Response) => {
    req.session.userId = undefined;
    res.status(200).json({
      message: 'You have been logged out successfully.'
    });
  }
);

/**
 * Create a user account.
 *
 * @name POST /api/users
 *
 * @param {string} username - username of user
 * @param {string} password - user's password
 * @param {string} bio - user's bio
 * @return {UserResponse} - The created user
 * @throws {403} - If there is a user already logged in
 * @throws {409} - If username is already taken
 * @throws {400} - If password or username is not in correct format
 * @throws {413} - If bio is longer than 140 characters
 *
 */
router.post(
  '/',
  [
    userValidator.isUserLoggedOut,
    userValidator.isValidUsername,
    userValidator.isUsernameNotAlreadyInUse,
    userValidator.isValidPassword,
    userValidator.bioNotTooLong,
  ],
  async (req: Request, res: Response) => {
    const user = await UserCollection.addOne(req.body.username, req.body.password, req.body.bio);
    req.session.userId = user._id.toString();
    res.status(201).json({
      message: `Your account was created successfully. You have been logged in as ${user.username}`,
      user: util.constructUserResponse(user)
    });
  }
);

/**
 * Update a user's profile.
 *
 * @name PUT /api/users
 *
 * @param {string} username - The user's new username
 * @param {string} password - The user's new password
 * @param {string} bio - The user's new bio
 * @return {UserResponse} - The updated user
 * @throws {403} - If user is not logged in
 * @throws {409} - If username already taken
 * @throws {400} - If username or password are not of the correct format
 */
router.put(
  '/',
  [
    userValidator.isUserLoggedIn,
    userValidator.isBlankOrValidUsername,
    userValidator.isUsernameBlankOrNotAlreadyInUse,
    userValidator.isBlankOrValidPassword,
    userValidator.bioNotTooLong,
  ],
  async (req: Request, res: Response) => {
    console.log(req.body);
    const userId = (req.session.userId as string) ?? ''; // Will not be an empty string since its validated in isUserLoggedIn
    const user = await UserCollection.updateOne(userId, req.body);
    res.status(200).json({
      message: 'Your profile was updated successfully.',
      user: util.constructUserResponse(user)
    });
  }
);

/**
 * Delete a user.
 *
 * @name DELETE /api/users
 *
 * @return {string} - A success message
 * @throws {403} - If the user is not logged in
 */
router.delete(
  '/',
  [
    userValidator.isUserLoggedIn
  ],
  async (req: Request, res: Response) => {
    const userId = (req.session.userId as string) ?? ''; // Will not be an empty string since its validated in isUserLoggedIn
    await UserCollection.deleteOne(userId);
    await FreetCollection.deleteMany(userId);
    await FeedCollection.deleteOne(userId);
    req.session.userId = undefined;
    res.status(200).json({
      message: 'Your account has been deleted successfully.'
    });
  }
);

/**
 * Follow a user.
 *
 * @name POST /api/users/follow/
 *
 * @param {string} username - username of user to be followed
 * @return {UserResponse} - The followed user
 * @throws {403} - If the user is not logged in, or user is already following user
 * @throws {404} - If username is invalid
 *
 */
 router.post(
  '/follow',
  [
    userValidator.isUserLoggedIn,
    userValidator.existsAndIsNotAlreadyFollowed,
  ],
  async (req: Request, res: Response) => {
    const userId = (req.session.userId as string) ?? ''; // Will not be an empty string since its validated in isUserLoggedIn
    const followedUser = await UserCollection.findOneByUsername(req.body.username);

    const user = await UserCollection.findOneByUserId(userId);
    const newFollowing = [...user.following, req.body.username];
    await UserCollection.updateOne(userId, { following: newFollowing });

    await FeedCollection.updateFeedByAuthor(userId, followedUser._id);

    res.status(201).json({
      message: 'You successfully followed ' + req.body.username + '.',
      user: util.constructUserResponse(followedUser),
    });
  }
);

/**
 * Follow a user.
 *
 * @name DELETE /api/users/follow/:username
 *
 * @param {string} username - username of user to be unfollowed
 * @return {UserResponse} - The followed user
 * @throws {403} - If the user is not logged in, or user is already following user
 * @throws {404} - If username is invalid
 *
 */
 router.delete(
  '/follow/:username',
  [
    userValidator.isUserLoggedIn,
    userValidator.existsAndIsAlreadyFollowed,
  ],
  async (req: Request, res: Response) => {
    const userId = (req.session.userId as string) ?? ''; // Will not be an empty string since its validated in isUserLoggedIn
    const followedUser = await UserCollection.findOneByUsername(req.params.username);

    const user = await UserCollection.findOneByUserId(userId);
    const newFollowing = user.following.filter((username) => username !== req.params.username);
    await UserCollection.updateOne(userId, { following: newFollowing });

    await FeedCollection.deleteFromFeedByAuthor(userId, followedUser._id);

    res.status(201).json({
      message: 'You successfully unfollowed ' + req.params.username + '.',
      user: util.constructUserResponse(followedUser),
    });
  }
);

export {router as userRouter};
