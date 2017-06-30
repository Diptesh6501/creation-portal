'use strict';

const express = require('express'),
    app = express(),
    router = express.Router(),
    proxy = require('express-http-proxy'),
    Keycloak = require('keycloak-connect'),
    session = require('express-session'),
    path = require('path'),
    apiSericeHelper = require('./helpers/apiServiceHelper'),
    env = process.env,
    port = env.port || 8080;

// Create a new session store in-memory
var memoryStore = new session.MemoryStore();
// Setup keycloak to use the in-memory store
var keycloak = new Keycloak({ store: memoryStore });

app.use(session({
    secret: 'mySecret',
    resave: false,
    saveUninitialized: true,
    store: memoryStore
}));
app.use(keycloak.middleware({ admin: '/' }));

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '/')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'private')));

app.use('/ekContentEditor', express.static('./thirdparty/content-editor'))
app.get('/ekContentEditor', function(req, res) {
    res.sendFile(__dirname + "/thirdparty/content-editor/index.html");
});

const learnerURL = env.sunbird_learner_player_url || 'http://52.172.36.121:9000/v1/';
app.all('/service/v1/learner/*', keycloak.protect(), proxy(learnerURL, {
    proxyReqPathResolver: function(req) {
        let urlParam = req.params["0"];
        return require('url').parse(learnerURL + urlParam).path;
    }
}))
const contentURL = env.sunbird_content_player_url || 'http://localhost:5000/api/sb/v1/';
app.all('/service/v1/content/*', keycloak.protect(), proxy(contentURL, {
    proxyReqPathResolver: function(req) {
        let urlParam = req.params["0"]
        return require('url').parse(contentURL + urlParam).path;
    }
}))

app.all('/private/*', keycloak.protect(), function(req, res) {
    res.locals.userId = req.kauth.grant.access_token.content.sub;
    res.render(__dirname + '/private/index.ejs');
});


app.all('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});



//proxy urls

var ekstep = "https://dev.ekstep.in";

app.use('/api/*', proxy(ekstep, {
    proxyReqPathResolver: function(req) {
        return require('url').parse(ekstep + req.originalUrl).path;
    }
}));

app.use('/content-plugins/*', proxy(ekstep, {
    proxyReqPathResolver: function(req) {
        return require('url').parse(ekstep + req.originalUrl).path;
    }
}));

app.use('/plugins/*', proxy(ekstep, {
    proxyReqPathResolver: function(req) {
        return require('url').parse(ekstep + req.originalUrl).path;
    }
}));


app.use('/assets/public/preview/*', proxy(ekstep, {
    proxyReqPathResolver: function(req) {
        return require('url').parse(ekstep + req.originalUrl).path;
    }
}));

app.use('/content/preview/*', proxy(ekstep, {
    proxyReqPathResolver: function(req) {
        return require('url').parse(ekstep + req.originalUrl).path;
    }
}));

app.use('/action/*', proxy(ekstep, {
    proxyReqPathResolver: function(req) {
        return require('url').parse(ekstep + req.originalUrl).path;
    }
}));


//redirect to home if nothing found
app.all('*', function(req, res) {
    res.redirect('/');
});

app.listen(port);
console.log('app running on port ' + port);
