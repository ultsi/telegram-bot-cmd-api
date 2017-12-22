/*
    telegram-bot-cmd-api, Simple but rich API to make creating Telegram bots easy
    Copyright (C) 2017  Joonas Ulmanen

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
    context.js
    Simple way to 'remember' command context with users
*/

'use strict';

const when = require('when');
let contexts = module.exports = {};


contexts.Context = function(cmd, msg, bot) {
    this.cmd = cmd;
    this.msg = msg;
    this.phase = 'start';
    this.bot = bot;
    this.variables = {};
};

contexts.Context.prototype.sendMessage = function(message) {
    if (!message || !message.text) {
        let deferred = when.defer();
        deferred.reject('no message object');
        return deferred.promise;
    }
    let self = this;
    let to = self.cmd.scope === 'private' ? self.msg.from : self.msg.chat;

    if (message.type === 'photo') {
        return self.bot.sendPhoto(to.id, message.buffer, message.options);
    } else {
        return self.bot.sendMessage(to.id, message.text, message.options);
    }
};

contexts.Context.prototype.storeVariable = function(key, value) {
    this.variables[key] = value;
};

contexts.Context.prototype.fetchVariable = function(key) {
    return this.variables[key];
};

contexts.Context.prototype.forgetVariables = function() {
    this.variables = {};
};

contexts.Context.prototype.resolve = function() {
    let deferred = when.defer();
    deferred.resolve();
    return deferred.promise;
};

contexts.Context.prototype.setPhase = function(phase) {
    this.phase = phase;
};

contexts.Context.prototype.end = function() {
    this.phase = -1;
    this.variables = 0;
};

contexts.Context.prototype.isPrivateChat = function() {
    return this.msg.chat.type === 'private';
};

contexts.Context.prototype.hasEnded = function() {
    return this.phase === -1;
};