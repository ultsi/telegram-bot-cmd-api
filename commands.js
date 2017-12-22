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
    commands.js
*/

'use strict';

const Context = require('./context.js');
const when = require('when');

let CommandsAPI = {
    cmds: {},
    helpText: 'This bot is using CommandsAPI. I obey these commands:',
    privateCommandNoticeText: 'This command should only be used in 1-on-1 conversations with me',
    cmdFailText: 'Please use the command as follows: '
};
let userContexts = {};

CommandsAPI.SCOPE_PRIVATE = 'private';
CommandsAPI.SCOPE_ALL = 'all';

function initContext(userId, cmd, msg, bot) {
    let context = new Context.Context(cmd, msg, bot);
    userContexts[userId] = context;
    return context;
}

function retrieveContext(userId, msg) {
    let earlierContext = userContexts[userId];
    if (earlierContext) {
        earlierContext.msg = msg; // Update msg object to current one
        return earlierContext;
    }
    return false;
}

function callCommandFunction(context, cmd, msg, words) {
    let deferred = when.defer();

    if (context.hasEnded()) {
        // Command ended, do nothing.
        deferred.resolve();
        return deferred.promise;
    }

    let phase = cmd.phases[context.phase];

    if (context.phase === 'start' && !context.fetchVariable('_started')) {
        context.storeVariable('_started', true);
        return phase.init(context, msg, words);
    } else if (phase.validateInput(context, msg, words)) {
        try {
            phase.onValidInput(context, msg, words)
            .then(() => {
                phase = cmd.phases[context.phase];
                if (phase.nextPhase) {
                    context.setPhase(phase.nextPhase);
                    let newPhase = cmd.phases[context.phase];
                    console.log(newPhase);
                    return context.sendMessage(newPhase.startMessage);
                } else {
                    context.end();
                    deferred.resolve();
                }
            }, (err) => {
                console.log(err);
                deferred.reject(err);
            });

        } catch (err) {
            console.log(err);
            deferred.reject(err);
        }
    } else {
        context.sendMessage(phase.errorMessage);
        deferred.resolve();
    }
    return deferred.promise;
}

function Message(text, options) {
    this.text = text;
    this.options = options;
}

CommandsAPI.Message = (text, options) => {
    let msg = new Message(text, options);
    return msg;
};

CommandsAPI.KeyboardMessage = (text, keyboardButtons) => {
    let options = {
        'parse_mode': 'Markdown',
        'reply_markup': {
            'keyboard': keyboardButtons,
            'resize_keyboard': true,
            'one_time_keyboard': false
        }
    };
    return CommandsAPI.Message(text, options);
};

CommandsAPI.Reply = (text, options) => {
    this.text = text;
    this.options = options;
    this.type = 'reply';
    return this;
};

CommandsAPI.Photo = (buffer, caption) => {
    let options = {
        caption: caption
    };
    let msg = new Message('', options);
    msg.type = 'photo';
    msg.buffer = buffer;
    return msg;
};

CommandsAPI.register = function(cmdDefinition) {
    CommandsAPI.cmds[cmdDefinition.CMD] = {
        name: cmdDefinition.CMD,
        help: cmdDefinition.HELP,
        scope: cmdDefinition.SCOPE,
        phases: cmdDefinition.PHASES
    };
};

function listCmdHelp() {
    let cmdHelpList = [];
    for (var i in CommandsAPI.cmds) {
        if (!CommandsAPI.cmds[i].adminCommand) {
            cmdHelpList.push(CommandsAPI.cmds[i].name + ' - ' + CommandsAPI.cmds[i].help);
        }
    }
    return cmdHelpList;
}

CommandsAPI.otherwise = function(msg, words, bot) {
    let deferred = when.defer();
    deferred.resolve();
    return deferred.promise;
};

module.exports = function(bot) {

    CommandsAPI.call = function call(firstWord, msg, words) {
        let deferred = when.defer();
        const userId = msg.from.id;

        // Print start message
        if (firstWord === '/start') {
            return bot.sendMessage(msg.from.id, CommandsAPI.helpText);
        } else if (firstWord === '/help') {
            const cmdListStr = listCmdHelp().join('\n');
            return bot.sendMessage(msg.from.id, CommandsAPI.helpText + '\n\n' +  cmdListStr);
        }

        if (CommandsAPI.cmds[firstWord]) {
            const cmd = CommandsAPI.cmds[firstWord];

            // init context for command. Command context is always reinitialised
            // when calling the command (like /command)
            const context = initContext(userId, cmd, msg, bot);

            if (cmd.scope === CommandsAPI.SCOPE_PRIVATE && !context.isPrivateChat()) {
                return deferred.reject(CommandsAPI.privateCommandNoticeText);
            }

            return callCommandFunction(context, cmd, msg, words);
        } else {
            // Command not found, try to retrieve the command
            const context = retrieveContext(userId, msg);
            if (!context || context.hasEnded()) {
                return CommandsAPI.otherwise(msg, words, bot);
            }

            const cmd = context.cmd;
            if (!context.isPrivateChat()) {
                // don't spam chats if not a command this bot recognizes
                deferred.resolve();
            } else {
                return callCommandFunction(context, cmd, msg, words);
            }
        }
        return deferred.promise;
    };

    // Initialize message hook to Command framework
    bot.on('message', (msg) => {
        if (!msg.text) {
            return;
        }
        const words = msg.text.split(' ');
        const cmd_only = words[0].replace(/@.+/, '').toLowerCase(); // remove trailing @username
        try {
            CommandsAPI.call(cmd_only, msg, words)
            .then(() => {},
                (err) => {
                    console.error(err.stack);
                    bot.sendMessage(msg.chat.id, 'Error: ' + err);
                }
            );
        } catch (err) {
            console.error(err.stack);
            bot.sendMessage(msg.chat.id, 'Error: ' + err);
        }
        
    });

    return CommandsAPI;
};