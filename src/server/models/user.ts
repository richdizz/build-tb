import * as debug from 'debug';
let log: debug.IDebugger = debug('msdx:user');

import * as express from 'express';

export interface IAzureADUser {
  userId: string;
  givenName: string;
  familyName: string;
}

export class User implements IAzureADUser {
  private static USER_SESSION_KEY: string = 'aadUser';

  public userId: string;
  public givenName: string;
  public familyName: string;

  constructor(private request: express.Request) {
    // try to load user from the session
    let sessionUser: IAzureADUser = this.request.session[User.USER_SESSION_KEY];
    log('user loaded from session: ' + JSON.stringify(sessionUser));

    // set user props
    this.userId = !sessionUser ? '' : sessionUser.userId;
    this.givenName = !sessionUser ? '' : sessionUser.givenName;
    this.familyName = !sessionUser ? '' : sessionUser.familyName;
  }

  public setCurrentUser(userId: string, givenName: string, familyName: string): void {
    let currentUser: IAzureADUser = {
      familyName: familyName,
      givenName: givenName,
      userId: userId
    };

    log('saving user to session: ' + JSON.stringify(currentUser));
    this.request.session[User.USER_SESSION_KEY] = currentUser;
  }

  /**
   * @description
   *  Indicates if the current user has authenticated or not.
   *
   * @returns {boolean} Authentication status.
   */
  public isAuthenticated(): boolean {
    return this.request.session[User.USER_SESSION_KEY] !== undefined;
  }

  /**
   * @description: IAzureADUser
   *  Full name of the user.
   *
   * @returns {string}  User's name as it exists within the AzureAD tenant.
   */
  public fullName(): string {
    return this.givenName + ' ' + this.familyName;
  }
}
