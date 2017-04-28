import * as debug from 'debug';
let log: debug.IDebugger = debug('msdx:authController');

import * as express from 'express';
import * as config from 'nconf';
let uuid: any = require('node-uuid');
import {AzureAD} from '../auth/azureAD';
import {User} from '../models/user';
let adalNode: any = require('adal-node');

export class AuthController {
  constructor(private app: express.Application) {
    // init the routes
    this.loadRoutes();
  }

  private loadRoutes(): void {
    log('loading routes');

    this.app.get('/login', this.handleLoginGet);
    this.app.get('/auth', this.handleAuthGet);
    this.app.get('/logout', this.handleLogoutGet);
  }

  /**
   * @description
   *  Clients get redirected here in order to create an OAuth authorize url and redirect them to AAD.
   *  There they will authenticate and give their consent to allow this app access to
   *  some resource they own.
   *
   * @param request {express.Request} HTTP request object.
   * @param response {express.Response} HTTP response object.
   */
  private handleLoginGet(request: express.Request, response: express.Response): void {
    log('handle GET /login');

    let azureAD: AzureAD = new AzureAD();

    // create unique state id to project against CSFR
    let requestState: string = uuid.v4();

    // create the authorization endpoint URL
    let endpoint: string = azureAD.getAuthorizationCodeEndpoint(requestState);

    // save cookie with the state
    response.cookie('aadAuthCodeReqState', requestState);

    // if a redirect was specified within the app, save it
    if (request.query.redir) {
      response.cookie('postAuthRedirect', request.query.redir);
    }
    // if a specific resource ID is requested, save it
    if (request.query.resourceId) {
      response.cookie('postAuthResourceId', request.query.resourceId);
    }

    // send user to the authorization endpoint
    log('auth endpoint: ' + endpoint);
    response.redirect(endpoint);
  }

  /**
   * @description
   *  After consent is granted AAD redirects here.  The ADAL library is invoked via the
   *  AuthenticationContext and retrieves an access token that can be used to access the
   *  user owned resource.
   *
   * @param request {express.Request} HTTP request object.
   * @param response {express.Response} HTTP response object.
   */
  private handleAuthGet(request: express.Request, response: express.Response): void {
    log('handle GET /auth');

    if (request.cookies.aadAuthCodeReqState !== request.query.state) {
      response.send('ERROR: possible CSFR');
    }
    response.clearCookie('aadAuthCodeReqState');

    // build authority & get auth context
    let authorityUrl: string = config.get('aad-authority') + config.get('aad-tenant-id');
    let authContext: any = new adalNode.AuthenticationContext(authorityUrl);

    // get resourceId to query (default to AzureAD graph)
    let resourceId: string = config.get('aad-graph-api-resource');
    if (request.cookies.postAuthResourceId) {
      resourceId = request.cookies.postAuthResourceId;
      response.clearCookie('postAuthResourceId');
    }

    // get token for specified resource
    authContext.acquireTokenWithAuthorizationCode(
      request.query.code,
      config.get('redirect-endpoint'),
      resourceId,
      config.get('aad-client-id'),
      config.get('aad-client-secret'),
      (error: any, tokenResponse: any) => {
        log('token response: ' + JSON.stringify(tokenResponse));

        // save the access token credentials returned in session
        let azureAD: AzureAD = new AzureAD(request);
        azureAD.saveAccessTokenResponse(
          tokenResponse.resource,
          tokenResponse.accessToken,
          tokenResponse.expiresOn,
          tokenResponse.refreshToken);

        // save details about user
        let user: User = new User(request);
        user.setCurrentUser(tokenResponse.userId, tokenResponse.givenName, tokenResponse.familyName);

        let postAuthRedirect: string = '/';

        // if redirect requested prior to auth...
        if (request.cookies.postAuthRedirect) {
          postAuthRedirect = request.cookies.postAuthRedirect;
          response.clearCookie('postAuthRedirect');
        }

        response.redirect(postAuthRedirect);
      });
  }

  /**
   * @description
   *  Handles the logout process from the application & Azure AD.
   *
   * @param request {express.Request} HTTP request object.
   * @param response {express.Response} HTTP response object.
   */
  private handleLogoutGet(request: express.Request, response: express.Response): void {
    log('handle GET /logout');

    let azureAD: AzureAD = new AzureAD();

    // create logout url
    let logoutUrl: string = azureAD.getLogoutEndpoint();

    // delete session in store & cookie
    request.session.destroy((error) => {
      if (error) {
        console.error('failed to destroy session', error);
      }
      request.session = null;
    });

    // delete the auth cookies
    response.clearCookie('aadAuthCodeReqState');

    // redirect to logout page
    response.redirect(logoutUrl);
  }
}
