const Discord = require('eris');
const ytdl = require('ytdl-core');
const fs = require('fs');

var config, guildData, queue;

let files = fs.readdirSync('./');
if (files === undefined || files.length < 2) {
	throw console.log(`[ERROR] No files are available including this one. (This error shouldn't appear but if it does you've done something very wrong)`);
}
if (!files.includes('config.js')) {
	return console.log('[ERROR] No Config.js file found');
}
try {
	if (!files.includes('sounds')) {
		console.log('[WARN] No sounds folder found, creating new folder now');
		fs.mkdirSync('sounds');
	}
	if (!files.includes('tags')) {
		console.log('[WARN] No tags folder found, creating new folder now');
		fs.mkdirSync('tags');
	}
	if (!files.includes('guildData')) {
		console.log('[WARN] No guildData folder found, creating new folder now');
		fs.mkdirSync('guildData');
	}
	let guildFiles = fs.readdirSync('guildData');
	for (let i = 0; i < guildFiles.length; i++) {
		if (guildFiles[i].includes('.json')) {
			let tempGuildData = JSON.parse(fs.readFileSync(`guildData/${guildFiles[i]}`));
			guildData[guildFiles[i].substring(0, guildFiles[i].length - 5)].tags = tempGuildData.tags;
			guildData[guildFiles[i].substring(0, guildFiles[i].length - 5)].sounds = tempGuildData.sounds;
			guildData[guildFiles[i].substring(0, guildFiles[i].length - 5)].settings = tempGuildData.settings;
		}
	}
} catch (e) {
	throw e;
}
config = require('./config.js');

var bot = new Discord.CommandClient(
	config.token,
	{
		// Bot Options
	},
	{
		// Command Options
		description: 'A bot to make sound and text tags',
		owner: '@Heroj04',
		defaultCommandOptions: {
			caseInsensitive: true,
			deleteCommand: true,
			guildOnly: true,
			cooldownMessage: 'You\'re using this command faster than I can cool down.',
			permissionMessage: 'You don\'t have permissions for that command. Make sure you are in a role with the name "tagbotadmin".',
			errorMessage: '[ERROR] Something went wrong processing that command, try again later and if errors persist contact your administrator.',
		},
	}
);

bot
	.on('messageCreate', msg => {
		// bot.createMessage(msg.channel.id, msg.content);
	})
	.on('error', err => {
		console.log(`[ERROR] ${err}`);
	});

bot.registerCommand(
	'SetPrefix',
	(msg, args) => {
		if (args.length === 1) {
			if (guildData[msg.guild.id] === undefined) guildData[msg.guild.id] = [];
			if (guildData[msg.guild.id].settings === undefined) guildData[msg.guild.id].settings = {};
			try {
				guildData[msg.guild.id].settings.prefix = args[0];
				bot.registerGuildPrefix(msg.guild.id, args[0]);
				fs.writeFileSync(`guildData/${msg.guild.id}.json`, JSON.stringify(guildData[msg.guild.id]));
				return `Succesfully set command prefix to ${args[0]}`;
			} catch (e) {
				console.log(`[ERROR] Issue setting bot prefix for guildID ${msg.guild.id}: ${e}`);
				return 'There was an error saving settings for this guild.';
			}
		} else {
			return 'Please supply one word or character to use as the command prefix';
		}
	},
	{
		aliases: ['Prefix', 'cmdPrefix'],
		description: 'Set the command prefix',
		fullDescription: 'Sets the prefix used before commands for this bot, only on this guild.',
		usage: 'SetPrefix <prefix>',
		argsRequired: true,
		requirements: {
			roleNames: ['tagbotadmin'],
		},
	}
);

bot.registerCommand(
	'AddTag',
	(msg, args) => {
		if (args.length > 1) {
			if (guildData[msg.guild.id] === undefined) guildData[msg.guild.id] = [];
			if (guildData[msg.guild.id].tags === undefined) guildData[msg.guild.id].tags = [];
			for (let i = 0; i < guildData[msg.guild.id].tags.length; i++) {
				if (args[0].toLowerCase() === guildData[msg.guild.id].tags[i].name) {
					return `That tagname is already in use on this server.`;
				}
			}
			let bkup = guildData[msg.guild.id].tags;
			try {
				guildData[msg.guild.id].tags.push({
					name: args[0].toLowerCase(),
					content: args.splice(1, args.length - 1).join(` `),
				});
				fs.writeFileSync(`guildData/${msg.guild.id}.json`, JSON.stringify(guildData[msg.guild.id]));
				return `Tag Created`;
			} catch (e) {
				guildData[msg.guild.id].tags = bkup;
				console.log(`[ERROR] Issue saving tags for server ID ${msg.guild.id}: ${e}`);
				return `Error saving tags for this server`;
			}
		} else {
			return `Incorrect syntax refer to 'Help AddTag' for more info`;
		}
	},
	{
		aliases: ['+Tag', 'NewTag', 'CreateTag'],
		description: 'Create a new message tag',
		fullDescription: 'Create an alias for a message which can then be called later to call the same message.',
		usage: 'AddTag <tagName> <MessageString>',
		argsRequired: true,
		requirements: {
			roleNames: ['tagbotadmin'],
		},
	}
);

bot.registerCommand(
	'RemoveTag',
	(msg, args) => {
		if (args.length > 0) {
			if (guildData[msg.guild.id] === undefined) guildData[msg.guild.id] = [];
			if (guildData[msg.guild.id].tags === undefined) guildData[msg.guild.id].tags = [];
			for (let i = 0; i < guildData[msg.guild.id].tags.length; i++) {
				if (args[0].toLowerCase() === guildData[msg.guild.id].tags[i].name) {
					let bkup = guildData[msg.guild.id].tags;
					try {
						guildData[msg.guild.id].tags.splice(i, 1);
						fs.writeFileSync(`guildData/${msg.guild.id}.json`, JSON.stringify(guildData[msg.guild.id]));
						return `Tag Removed`;
					} catch (e) {
						guildData[msg.guild.id].tags = bkup;
						console.log(`Issue saving tags for server ID ${msg.guild.id}: ${e}`);
						return `Error saving tags for this server`;
					}
				}
			}
			return `Sorry, that tagname doesn't seem to exist on this server.`;
		} else {
			return `Incorrect syntax refer to 'Help RemoveTag' for more info`;
		}
	},
	{
		aliases: ['-Tag', 'DeleteTag', 'DestroyTag'],
		description: 'Remove a saved tag',
		fullDescription: 'Remove a message tag which has been saved on this guild.',
		usage: 'RemoveTag <tagName>',
		argsRequired: true,
		requirements: {
			roleNames: ['tagbotadmin'],
		},
	}
);

bot.registerCommand(
	'TagList',
	(msg, args) => {
		if (guildData[msg.guild.id] === undefined) guildData[msg.guild.id] = [];
		if (guildData[msg.guild.id].tags === undefined || guildData[msg.guild.id].tags.length === 0) {
			return 'No tags have been created on this guild.';
		} else {
			let verbose = false;
			for (let i = 0; i < args.length; i++) {
				if (args[i].toLowerCase() === '--verbose') {
					verbose = true;
				}
			}
			let newmsg = `Tags available on ${msg.guild.name}`;
			for (var i = 0; i < guildData[msg.guild.id].tags.length; i++) {
				if (verbose) newmsg += `\n`;
				newmsg += `\n${guildData[msg.guild.id].tags[i].name}`;
				if (verbose) newmsg += ` - ${guildData[msg.guild.id].tags[i].content}`;
			}
			return newmsg;
		}
	},
	{
		aliases: ['ListTags', 'ShowTags', '~Tags'],
		usage: 'TagList [--verbose]',
		description: 'List all tags',
		fullDescription: 'Produces a list of all available message tags on the current guild. Adding the --verbose flag displays the message for each tag.',
	}
);

bot.registerCommand(
	'Tag',
	(msg, args) => {
		if (guildData[msg.guild.id] === undefined) guildData[msg.guild.id] = [];
		if (guildData[msg.guild.id].tags === undefined || guildData[msg.guild.id].tags.length === 0) {
			return 'No tags have been created on this guild.';
		} else {
			for (var i = 0; i < guildData[msg.guild.id].tags.length; i++) {
				if (args[0].toLowerCase() === guildData[msg.guild.id].tags[i].name) {
					return guildData[msg.guild.id].tags[i].content;
				}
			}
			return 'That tag does not appear to exist on this guild.';
		}
	},
	{
		aliases: ['DisplayTag', '/'],
		usage: 'Tag <tagName>',
		description: 'Use a tag',
		argsRequired: true,
		fullDescription: 'Returns the message attached to a specific tag name on this guild.',
	}
);

function next(id) {
	bot.joinVoiceChannel(queue[id].channel)
		.then(conn => {
			conn.play(queue[id][0].sound)
				.on(`end`, reason => {
					queue[id].splice(0, 1);
					if (queue[id].length > 0) {
						return next(bot, id);
					}
					conn.disconnect();
				});
		})
		.catch(e => {
			bot.createMessage(queue[id][0].text, `[ERROR] Error joining voice channel: ${e}`);
			queue[id].splice(0, 1);
			if (queue[id].length > 0) {
				return next(bot, id);
			}
		});
}

bot.registerCommand(
	'AddSound',
	(msg, args) => {
		if (args.length === 2) {
			if (guildData[msg.guild.id] === undefined) guildData[msg.guild.id] = [];
			if (guildData[msg.guild.id].sounds === undefined) guildData[msg.guild.id].sounds = [];
			for (var i = 0; i < guildData[msg.guild.id].sounds.length; i++) {
				if (guildData[msg.guild.id].sounds[i].name === args[0].toLowerCase()) {
					return 'A sound with that name already exists.';
				}
			}
			ytdl.getInfo(args[1], (err, info) => {
				if (err) {
					console.log(`[ERROR] Issue getting video metadata: ${err}`);
					bot.createMessage(msg.channel.id, `[ERROR] Issue getting video data`);
					return;
				}
				fs.readdir('sounds', (e, soundFiles) => {
					if (e) {
						console.log(`[ERROR] Issue getting sound files: ${err}`);
						bot.createMessage(msg.channel.id, `[ERROR] Issue getting sound files`);
						return;
					}
					if (soundFiles.includes(`${info.video_id}.complete`)) {
						// already downloaded
						let bkup = guildData[msg.guild.id].sounds;
						try {
							guildData[msg.guild.id].sounds.push({
								name: args[0].toLowerCase(),
								video: info.video_id,
							});
							fs.writeFileSync(`guildData/${msg.guild.id}.json`, JSON.stringify(guildData[msg.guild.id]));
							bot.createMessage(msg.channel.id, `Added new sound ${args[0]}`);
						} catch (error) {
							guildData[msg.guild.id].sounds = bkup;
							console.log(`Issue saving sounds for server ID ${msg.guild.id}: ${error}`);
							bot.createMessage(msg.channel.id, `Error saving sounds for this server`);
						}
					} else {
						// download new clip
						// get some audio from some metadata
						let video = ytdl.downloadFromInfo(info, {
							filter: `audioonly`,
						});
						// pipe the audio into a file
						video.on(`info`, (data) => {
							console.log(`[INFO] Started download of ${info.title}`);
							video.pipe(fs.createWriteStream(`sounds/${info.video_id}`));
						});

						// rename the file
						video.on(`end`, () => {
							console.log(`[INFO] Completed download of ${queue[id][0].title}`);
							fs.renameSync(`sounds/${info.video_id}`, `sounds/${info.video_id}.complete`);
							let bkup = guildData[msg.guild.id].sounds;
							try {
								guildData[msg.guild.id].sounds.push({
									name: args[0].toLowerCase(),
									video: info.video_id,
								});
								fs.writeFileSync(`guildData/${msg.guild.id}.json`, JSON.stringify(guildData[msg.guild.id]));
								bot.createMessage(msg.channel.id, `Added new sound ${args[0]}`);
							} catch (error) {
								guildData[msg.guild.id].sounds = bkup;
								console.log(`Issue saving sounds for server ID ${msg.guild.id}: ${error}`);
								bot.createMessage(msg.channel.id, `Error saving sounds for this server`);
							}
						});

						video.on(`error`, (er) => {
							bot.createMessage(msg.channel.id, `[ERROR] There was an error downloading: ${queue[id][0].title}`);
							console.log(`[ERROR] Issue downloading clip ${info.title}: ${er}`);
						});
					}
				});
			});
		} else {
			return 'Please supply a sound name and the youtube URL to the sound clip, see "Help AddSound" for more info';
		}
	},
	{
		aliases: ['+Sound', 'CreateSound', 'NewSound'],
		description: 'Add a new sound',
		fullDescription: 'Attach a name to a sound clip to be played at a later time.',
		usage: 'AddSound <soundName> <SoundClipURL>',
		argsRequired: true,
		requirements: {
			roleNames: ['tagbotadmin'],
		},
	}
);

bot.registerCommand(
	'RemoveSound',
	(msg, args) => {
		if (args.length > 0) {
			if (guildData[msg.guild.id] === undefined) guildData[msg.guild.id] = [];
			if (guildData[msg.guild.id].sounds === undefined) guildData[msg.guild.id].sounds = [];
			for (let i = 0; i < guildData[msg.guild.id].sounds.length; i++) {
				if (args[0].toLowerCase() === guildData[msg.guild.id].sounds[i].name) {
					let bkup = guildData[msg.guild.id].sounds;
					try {
						guildData[msg.guild.id].sounds.splice(i, 1);
						fs.writeFileSync(`guildData/${msg.guild.id}.json`, JSON.stringify(guildData[msg.guild.id]));
						return `Tag Removed`;
					} catch (e) {
						guildData[msg.guild.id].sounds = bkup;
						console.log(`Issue saving sounds for server ID ${msg.guild.id}: ${e}`);
						return `Error saving sounds for this server`;
					}
				}
			}
			return `Sorry, that soundname doesn't seem to exist on this server.`;
		} else {
			return `Incorrect syntax refer to 'Help RemoveSound' for more info`;
		}
	},
	{
		aliases: ['-Sound', 'DeleteSound', 'DestroySound'],
		description: 'Remove a saved sound',
		fullDescription: 'Remove a sound tag which has been saved on this guild.',
		usage: 'RemoveSound <soundName>',
		argsRequired: true,
		requirements: {
			roleNames: ['tagbotadmin'],
		},
	}
);

bot.registerCommand(
	'SoundList',
	(msg, args) => {
		if (guildData[msg.guild.id] === undefined) guildData[msg.guild.id] = [];
		if (guildData[msg.guild.id].sounds === undefined || guildData[msg.guild.id].sounds.length === 0) {
			return 'No sounds have been created on this guild.';
		} else {
			let verbose = false;
			for (let i = 0; i < args.length; i++) {
				if (args[i].toLowerCase() === '--verbose') {
					verbose = true;
				}
			}
			let newmsg = `Sounds available on ${msg.guild.name}`;
			for (var i = 0; i < guildData[msg.guild.id].sounds.length; i++) {
				if (verbose) newmsg += `\n`;
				newmsg += `\n${guildData[msg.guild.id].sounds[i].name}`;
				if (verbose) newmsg += ` - www.youtube.com/watch?v=${guildData[msg.guild.id].sounds[i].video}`;
			}
			return newmsg;
		}
	},
	{
		aliases: ['ListSounds', 'ShowSounds', '~Sounds'],
		usage: 'SoundList [--verbose]',
		description: 'List all sounds',
		fullDescription: 'Produces a list of all available sound tags on the current guild. Adding the --verbose flag displays the url for each tag.',
	}
);

for (var id in guildData) {
	if (guildData[id].settings.hasOwnProperty(id)) {
		if (guildData[id].settings.prefix !== undefined && guildData[id].settings.prefix !== '') {
			bot.registerGuildPrefix(id, guildData[id].settings.prefix);
		}
	}
}

bot.connect();
