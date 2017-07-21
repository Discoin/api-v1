// First prototype of Discoin.
// Perfectly lol
const restify = require('restify');
const fs = require('fs');
const request = require('request');
const randtoken = require('rand-token');
const schedule = require('node-schedule');
var PastebinAPI = require('pastebin-js'),
    pastebin = new PastebinAPI('pls');
const limits = JSON.parse(fs.readFileSync("./limits.json", "utf8"));
const glimits = JSON.parse(fs.readFileSync("./glimits.json", "utf8"));
const alltrans = JSON.parse(fs.readFileSync("./transactions.json", "utf8"));
const clientsecret = "pls";

// Define exchange rate.
// From: 1 Bot currency = ? Discoin
// To: 1 Discoin = ? Bot currency
const rates = [
];
// Define unprocessed transactions.
const transactions = [];

const server = restify.createServer();
server.get('/', function status(req, res, next) {
	res.redirect("https://github.com/austinhuang0131/discoin", next);
});

server.get('/transaction/:user/:amount/:to', function respond(req, res, next) {
	const from = rates.find(f => {return f.token === req.headers.authorization});
	if (from === undefined) {
		res.sendRaw(401, '[ERROR] Unauthorized!');
		return;
	}
	if (isNaN(parseInt(req.params.amount))) {
		res.sendRaw(400, '[ERROR] "Amount" not a number!');
		return;
	}
	if (parseInt(req.params.amount) * from.from > from.limit.daily) {
		res.sendRaw(413, '[Declined] Daily per user limit exceeded. The currency '+from.code+' has a daily transaction limit of '+from.limit.daily+' Discoins per user.');
		return;
	}
	const rate = rates.find(r => {return r.code === req.params.to});
	if (rate === undefined) {
		res.sendRaw('[ERROR] "To" currency NOT FOUND.');
		return;
	}
	var limit = limits.find(l => {return l.user === req.params.user});
	if (limit === undefined) {
		limit = {user: req.params.user, usage: parseInt(req.params.amount) * from.from};
	}
	else if (limit.usage + parseInt(req.params.amount) * from.from > rate.limit.daily) {
		res.sendRaw(413, '[Declined] Daily per user limit exceeded. The currency '+rate.code+' has a daily transaction limit of '+rate.limit.daily+' Discoins per user. The user can still exchange a total of '+balance+' Discoins into the currency '+rate.code+' for today.');
		return;
	}
	else {
		limits.splice(limits.indexOf(limit), 1);
		limit.usage += parseInt(req.params.amount) * from.from;
	}
	if (rate.limit.total !== undefined) {
		var glimit = glimits.find(gl => {return gl.code === req.params.to});
		if (glimit === undefined) {
			glimit = {code: req.params.to, usage: parseInt(req.params.amount) * from.from};
		}
		else if (glimit.usage + parseInt(req.params.amount) * from.from > rate.limit.total) {
			res.sendRaw(413, '[Declined] Daily total limit exceeded. The currency '+rate.code+' has a daily total transaction limit of '+rate.limit.total+' Discoins.');
			return;
		}
		else {
			glimits.splice(glimits.indexOf(glimit), 1);
			glimit.usage += parseInt(req.params.amount) * from.from;
		}
	}
	limits.push(limit);
	glimits.push(glimit);
	fs.writeFile("./limits.json", JSON.stringify(limits), "utf8");
	fs.writeFile("./glimits.json", JSON.stringify(glimits), "utf8");
	var amount = parseInt(req.params.amount) * from.from * rate.to;
	var rid = randtoken.generate(20);
	transactions.push({user: req.params.user, for: req.params.to, amount: amount, id: rid});
	alltrans.push({user: req.params.user, fromtime: Date(), from: from.code, to: req.params.to, amount: parseInt(req.params.amount) * from.from, id: rid});
	fs.writeFileSync("./transactions.json", JSON.stringify(alltrans), "utf8");
	var balance = rate.limit.daily - limit.usage;
	res.sendRaw(202, "Approved.\nThe receipt ID is "+rid+".\nThe user can still exchange a total of "+balance+" Discoins into the currency "+rate.code+" for today.");
});

server.get('/transaction', function respond(req, res, next) {
	const bot = rates.find(f => {return f.token === req.headers.authorization});
	if (bot === undefined) {
		res.sendRaw(401, '[ERROR] Unauthorized!');
		return;
	}
	const mytransactions = transactions.filter(t => {return t.for === bot.code});
	res.sendRaw(JSON.stringify(mytransactions));
	mytransactions.forEach(m => {
		const at = alltrans.filter(ot => {return ot.id === m.id;});
		alltrans.splice(transactions.indexOf(at), 1);
		at.totime = Date();
		alltrans.push(at);
		fs.writeFileSync("./transactions.json", JSON.stringify(alltrans), "utf8");
		transactions.splice(transactions.indexOf(m), 1);
	});
});

server.get('/rates', function respond(req, res, next) {
	let info = "Current exchange rates for Discoin follows:\n";
	rates.forEach(i => {info += "\n"+i.name+": 1 "+i.code+" => "+i.from+" Discoin => "+i.from*i.to+" "+i.code;});
	info += "\n\nNote that certain transaction limit may exist. Details will be displayed when a transaction is approved.";
	res.sendRaw(info);
});

server.get('/record', function status(req, res, next) {
	if (req.getQuery().indexOf("code=") === -1) {
		res.redirect("https://discordapp.com/oauth2/authorize?client_id=209891886058438656&scope=identify&response_type=code", next);
		return;
	}
	request.post("https://discordapp.com/api/oauth2/token?client_id=209891886058438656&grant_type=authorization_code&code="+req.getQuery().replace("code=", "")+"&redirect_uri=http://discoin-austinhuang.rhcloud.com/record&client_secret="+clientsecret, function (error, response, body) {
		if (error || response.statusCode !== 200) {
			res.sendRaw("[ERROR] Cannot connect to Discord! Consult http://status.discordapp.com or try again.");
			return;
		}
		body = JSON.parse(body);
		request({url: 'https://discordapp.com/api/users/@me', headers: {'Authorization': 'Bearer '+body.access_token}}, function (error, response, body) {
			if (error || response.statusCode !== 200) {
				res.sendRaw("[ERROR] Cannot connect to Discord! Consult http://status.discordapp.com or try again.");
			}
			else {
				body = JSON.parse(body);
				var mytrans = alltrans.filter(ts => {return ts.user === body.id});
				var records = "Hello "+body.username+"#"+body.discriminator+" ("+body.id+"). Here's your transaction record for this calendar month.\nShould you have any questions, don't hesitate to contact Discoin Operation Office at https://discord.gg/t9kUMsv.\n\n--- LEGEND ---\n* Request Time: The time your origin bot requests the transfer\n* Reception Time: The time your destination bot (should) receive the transfer. If not received by the time given please contact the Operation Office.\n* From/To: Currecy codes.\n* Amount: In Discoin.\n\n| Receipt ID         || Request Time                          || Reception Time                        || From ||  To  || Amount";
				mytrans.forEach(mt => {
					if (mt.totime !== undefined) {
						records += "\n|"+mt.id+"||"+mt.fromtime+"||"+mt.totime+"|| "+mt.from+"  || "+mt.to+" || "+mt.amount;
					}
					else {
						records += "\n|"+mt.id+"||"+mt.fromtime+"||              UNPROCESSED              || "+mt.from+"  || "+mt.to+" || "+mt.amount;
					}
				})
				res.sendRaw(records);
			}
		});
	});
});

var monthcleanup = schedule.scheduleJob({date: 1, hour: 0, minute: 0, second: 0}, function(){
	pastebin.createPaste(JSON.stringify(alltrans), "Monthly transaction record").then(function (data) {console.log(data);}).fail(function (err) {console.log(err);});
	fs.writeFileSync("./transactions.json", "[]", "utf8");
	alltrans = [];
});
var dailycleanup = schedule.scheduleJob({hour: 0, minute: 0, second: 0}, function(){
	fs.writeFileSync("./limits.json", "[]", "utf8");
	fs.writeFileSync("./glimits.json", "[]", "utf8");
	limits = [];
	glimits = [];
});

server.listen(process.env.OPENSHIFT_NODEJS_PORT || 8080, process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1", function() {
	console.log(`${server.name} listening at ${server.url}`);
});
