var express = require('express'),
	http = require('http'),
	path = require('path'),
	socket = require('socket.io'),
	moniker = require('moniker');

var app = require('express')(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);

	
app.set('port', process.env.PORT || 1337);
app.set('views', __dirname + '/views');
app.set('view engine', 'hjs');

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
  res.render('index');
});

server.listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});

var players = [];

io.sockets.on('connection', function (socket) {
	socket.emit('welcome', moniker.choose());

	socket.on('news', function (data) {
		io.sockets.emit('news', data);
	});
	
	socket.on('set name', function(data) {
		socket.emit('welcome', data);
	});
	
	socket.on('joingame', function(user) {
		socket.emit('loadGame', players);
		var player = {userName: user, x: 0, y: 0, heading: 'e'};		
		players.push(player);
		io.sockets.emit('joingame', player);		
	});
	
	socket.on('position', function(data) {
		players = players.map(function(o) {
			if (o.userName === data.userName) {
				return data;
			}
			return o;
		});
		
		io.sockets.emit('position', data);
	});
	
	socket.on('fire', function(data) {
		//determine if a player is in the current user's path
		//emit to that player's socket that they have been hit
		//io.sockets.emit('news', { person: 'system', text: player.userName + ' has been hit' });
	});
});


