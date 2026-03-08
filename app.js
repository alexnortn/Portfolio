

"use strict";

let express = require('express'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    path = require('path'),
    http = require('http');

let routes = require('./routes/index');

let app = express();

// All environments
var PORT = process.env.PORT || 3000;

app.set('port', PORT);

// // Define custom template engine
// app.engine('js', function (filePath, options, callback) {
//   let data = require(filePath)(options, pug);
//   callback(null, data);
// });

// view engine setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); // What is this pointing towards?

app.use('/', routes);
app.use('*', routes); // Could be a little hacky ->  route all unknown to index

module.exports = app;
