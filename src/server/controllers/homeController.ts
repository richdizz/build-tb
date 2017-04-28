import * as debug from 'debug';
let log: debug.IDebugger = debug('msdx:homeController');

import * as express from 'express';
import {User} from '../models/user';

export class HomeController {
  constructor(private app: express.Application) {
    this.loadRoutes();
  }

  /**
   * Setup routing for controller.
   */
  private loadRoutes(): void {
    log('loading routes');
    // setup home route for application
    this.app.get('/', this.handleRootGet);
  }

  /**
   * @description
   *  Handler for the request for the default home route.
   *
   * @param request {express.Request} HTTP request object.
   * @param response {express.Response} HTTP response object.
   */
  private handleRootGet(request: express.Request, response: express.Response): void {
    log('handle GET /');

    // load current user (try to load from session)
    let user: User = new User(request);

    let vm: any = {
      currentUser: {
        id: user.userId,
        name: user.fullName()
      },
      isAuthenticated: user.isAuthenticated()
    };

    // render the view
    response.render('home/index', vm);
  }
}
