var Chat = (function (o, ko, io) {

	var userName = ko.observable(''),
		socket = io.connect(window.location.origin),
		joined = ko.observable(false);
	
	socket.on('welcome', function(name) {
		userName(name);
		joined(true);
	});
	
	o.ViewModel = function(pages) {
		var self = this;
		self.pages = ko.observableArray(pages);
		self.selectedPage = ko.observable(pages[0]);
		self.user = ko.computed(function() {
			return userName();
		});
	};
	
	o.Login = function() {
		var self = this;
		
		self.user = userName;
		self.login = function() {
			socket.emit('set name', self.user());			
		};
	};
	
	o.Chat = function() {
		var self = this;
		
		self.messages = ko.observableArray([]);
		self.message = ko.observable('');
		self.send = function() {
			socket.emit('news', { person: userName(), text: self.message() });
			self.message('');
		};
		socket.on('news', function(data) {
			self.messages.push(data);
		});
	};
	
	var controls = {
		board: null,
		8: function(obj) {
			if (obj.y() === 0) return;
			obj.y(obj.y()-1);
		},
		4: function(obj) {
			if (obj.x() === 0) return;
			obj.x(obj.x()-1);
		},
		6: function(obj) {
			if (obj.x() === this.board.width) return;
			obj.x(obj.x()+1);
		},
		2: function(obj) {
			if (obj.y() === this.board.height) return;
			obj.y(obj.y()+1);
		},
		q: function(obj) {		
			switch (obj.heading()) {
				case 'e': obj.heading('n'); break;
				case 'n': obj.heading('w'); break;
				case 'w': obj.heading('s'); break;
				case 's': obj.heading('e'); break;
			}
		},
		w: function(obj) {
			switch (obj.heading()) {
				case 'e': obj.heading('s'); break;
				case 'n': obj.heading('e'); break;
				case 'w': obj.heading('n'); break;
				case 's': obj.heading('w'); break;
			}		
		}
	};
	
	o.Player = function(width, height) {
		var self = this;
		self.userName;
		self.x = ko.observable(0);
		self.y = ko.observable(0);
		self.heading = ko.observable('e');
		self.direction = ko.computed(function() {
			switch (self.heading()) {
				case 'e': return 'glyphicon glyphicon-chevron-right';
				case 'n': return 'glyphicon glyphicon-chevron-up';
				case 'w': return 'glyphicon glyphicon-chevron-left';
				case 's': return 'glyphicon glyphicon-chevron-down';
			}
		});
		self.left = ko.computed(function() {
			return (self.x() / (width+1) * 100) + '%';
		});
		
		self.top = ko.computed(function() {
			return (self.y() / (height+1) * 100) + '%';
		});
	};	
	
	o.Game = function(board) {
		var self = this;
		
		self.control = ko.observable('');
		self.control.subscribe(function(val) {
			if (val === '') return;
			self.control('');	
			if (val === ' ') {
				socket.emit('fire', { userName: userName(), x: self.player.x(), y: self.player.y(), heading: self.player.heading() });
				return;
			}
			if (typeof controls[val] !== 'undefined') {
				controls[val](self.player);
				socket.emit('position', { userName: userName(), x: self.player.x(), y: self.player.y(), heading: self.player.heading() });
			}			
		});		
		
		self.player = new o.Player(board.width, board.height);
		
		self.opponents = ko.observableArray();
		controls.board = board;
		
		joined.subscribe(function() {
			socket.emit('joingame', userName());
		});
		
		socket.on('loadGame', function(data) {
			data.forEach(function(obj) {
				self.opponents.push(createPlayer(obj));
			});
		});
		socket.on('joingame', function(data) {
			if (data.userName !== userName()) self.opponents.push(createPlayer(data));
		});
		socket.on('position', function(data) {
			if (data.userName !== userName()) {
				self.opponents().map(function(obj) {
					if (obj.userName == data.userName) {
						obj.x(data.x);
						obj.y(data.y);
						obj.heading(data.heading);
					}
					return obj;
				});
			}
		});
		
		var createPlayer = function(obj) {
			var result = new o.Player(board.width, board.height);
			result.x(obj.x);
			result.y(obj.y);
			result.heading(obj.heading);
			result.userName = obj.userName;
			return result;
		};
	};
	

	
	o.Board = function (x,y) {
		var self = this;
		
		self.width = x;
		self.height = y;
	};
	
	
	

	
	return o;
})(Chat || {}, ko, io);