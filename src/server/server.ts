import * as debug from 'debug';
let log: debug.IDebugger = debug('msdx:server');

import * as os from 'os';
import * as colors from 'colors';

import * as http from 'http';
import * as express from 'express';
let logger: any = require('connect-logger');
let cookieParser: any = require('cookie-parser');
import * as session from 'express-session';
let fileStore: any = require('session-file-store')(session);
let expressHandlebars: any = require('hbs');

log('loading controllers');
import {Controllers} from './controllers/index';

// setup express
log('setup express');
let app: express.Express = express();
app.use(logger());
app.use(cookieParser('8d705e4b-c142-420e-955a-a1a58263b6bd'));
app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: '13603e53-f0af-41dd-b020-dbf5c9e7768e',
  store: new fileStore()
}));

// configure handlebars as the view engine
expressHandlebars.registerPartials(__dirname + '/views');

// configure express to use handlebars as the view engine
app.set('view engine', 'hbs');
// change express default where to look for views on the server
app.set('views', __dirname + '/views');

// setup express to have static resource folders
app.use('/public/vendor', express.static(__dirname + '/../../node_modules'));

// load UX and API controllers
log('initialize controllers');
let controllers: Controllers = new Controllers(app);
controllers.init();

// setup ssl self hosting
let httpServerPort: string = process.env.PORT || 3000;

// create & startup HTTP webserver
http.createServer(app)
    .listen(httpServerPort);

console.log(colors.cyan('+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+'));
console.log(colors.green('Starting up http server...'));
console.log(colors.green('Available on:'));

// list IPs listening on
let networks: { [index: string]: os.NetworkInterfaceInfo[] } = os.networkInterfaces();
Object.keys(networks).forEach((device: string) => {
  networks[device].forEach((details: os.NetworkInterfaceInfo) => {
    if (details.family === 'IPv4') {
      console.log(colors.yellow('  http://' + details.address + ':' + httpServerPort));
    }
  });
});

console.log(colors.gray('Hit CTRL-C to stop the server'));
console.log(colors.cyan('+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+'));
