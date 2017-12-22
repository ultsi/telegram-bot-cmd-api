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
    test.js
    Contains quick tests of everything
    NOT AUTOMATED
*/

let CommandsAPIPolling = require('./index.js')('token', 'polling');

let CommandsAPIWebhook = require('./index.js')('token', 'webhook');


