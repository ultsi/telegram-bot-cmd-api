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
    index.js
    Main entrypoint, initialize tg-bot and then start to initialize 
    the possible web server and finally the app.
*/

'use strict';

module.exports = function(TOKEN, BOT_MODE, APP_URL){

    const Bot = require('node-telegram-bot-api');
    BOT_MODE = BOT_MODE || 'polling';

    // Setup bot
    let bot;

    if (BOT_MODE === 'polling') {
        const botOptions = {
            polling: true // used when no HTTPS:// connection available
        };
        bot = new Bot(TOKEN, botOptions);
        console.log('Set up a telegram bot with polling');
    } else {
        bot = new Bot(TOKEN);

        // This informs the Telegram servers of the new webhook.
        // Note: we do not need to pass in the cert, as it's already provided
        // bot.setWebHook(`${url}/bot${TOKEN}`);
        bot.setWebHook(APP_URL + TOKEN);

        // Load web server
        require('./web.js')(bot, TOKEN);
        console.log('Set up a telegram bot with webhook');
    }

    // Load rest of things
    return require('./commands.js')(bot);
};