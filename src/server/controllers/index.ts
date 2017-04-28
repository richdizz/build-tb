import * as debug from 'debug';
let log: debug.IDebugger = debug('msdx:controllers');

import * as express from 'express';
// load controllers
import {HomeController} from './homeController';
import {AuthController} from './authController';

export class Controllers {
  constructor(private app: express.Application) { }

  public init(): void {
    log('instatiate controllers');
    // instatiate each controller
    let home: HomeController = new HomeController(this.app);
    let auth: AuthController = new AuthController(this.app);
  }
}
