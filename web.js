/*
    telegram-bot-cmd-api, Simple but rich API to make creating Telegram bots easy
    Copyright (C) 2017 Joonas Ulmanen

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
    web.js
    Web endpoints for HTTPS webhook bot setups (like Heroku)
*/

'use strict';
const express = require('express');
const packageInfo = require('./package.json');
const bodyParser = require('body-parser');

// Setup web server

var app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.json({
        version: packageInfo.version
    });
});

app.listen(process.env.PORT, '0.0.0.0', (server) => {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Web server started at http://%s:%s', host, port);
});

module.exports = function(bot, token) {
    app.post('/' + token, (req, res) => {
        bot.processUpdate(req.body);
        res.sendStatus(200);
    });
};