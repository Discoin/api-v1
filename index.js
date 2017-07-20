// First prototype of Discoin.
// Perfectly lol
var restify = require('restify');

// Define exchange rate.
// From: 1 Bot currency = ? Discoin
// To: 1 Discoin = ? Bot currency
var rates = [
];
// Define unprocessed transactions.
var transactions = [];

var server = restify.createServer();
server.get('/', function status(req, res, next) {
	res.sendRaw('I should work correctly. If I missed a transaction, please contact my master (austinhuang#1076).');
	next();
});

server.get('/transaction/:user/:amount/:to', function respond(req, res, next) {
	var from = rates.find(f => {return f.token === req.headers.authorization});
	if (from === undefined) {
		res.sendRaw('[ERROR] Unauthorized token!');
		return;
	}
	if (isNaN(parseInt(req.params.amount))) {
		res.sendRaw('[ERROR] "Amount" not a number!');
		return;
	}
	var rate = rates.find(r => {return r.code === req.params.to});
	if (rate === undefined) {
		res.sendRaw('[ERROR] "To" currency NOT FOUND.');
		return;
	}
	var amount = parseInt(req.params.amount) * from.from * rate.to;
	transactions.push({user: req.params.user, for: req.params.to, amount: amount});
	res.sendRaw("Submitted.");
});

server.get('/transaction', function respond(req, res, next) {
	var bot = rates.find(f => {return f.token === req.headers.authorization});
	if (bot === undefined) {
		res.sendRaw('[ERROR] Unauthorized token!');
		return;
	}
	var mytransactions = transactions.filter(t => {return t.for === bot.code});
	res.sendRaw(JSON.stringify(mytransactions));
	mytransactions.forEach(m => {transactions.splice(transactions.indexOf(m), 1);})
});

server.get('/rates', function respond(req, res, next) {
	var info = "Current exchange rates for Discoin follows:\n";
	rates.forEach(i => {info += "\n"+i.name+": 1 "+i.code+" => "+i.from+" Discoin => "+i.from*i.to+" "+i.code});
	res.sendRaw(info);
});

server.listen(process.env.PORT || 8080, function() {
	console.log(`${server.name} listening at ${server.url}`);
});
