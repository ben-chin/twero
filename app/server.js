/*
 * Imports
 * ========================= */

var Cylon = require('cylon');
var http = require('http');
var url = require('url');
var dotenv = require('dotenv');
var bodyParser = require('body-parser')
var main = require('./main.js')

var SpheroFactory = require('./sphero.js');
var Router = require('./utils/router.js');

/* ------------------------
 * SERVER
 * ------------------------ */

var app = require('express')();
var io = require('socket.io')(http);
var server = require('http').Server(app);

//Load environment variables
dotenv._getKeysAndValuesFromEnvFilePath('twilio/config.env');
dotenv._setEnvs();
dotenv.load();

var TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
server.listen(8000);

var twero = new main.Twero();

app.use(bodyParser.urlencoded({ extended: false }))

var initializeSphero = function(name) {
    var portmask = "/dev/tty.Sphero-***-AMP-SPP";
    var sphero = new SpheroFactory.Sphero();

    sphero.name = name;
    sphero.connection.port = portmask.replace('***', name);
    sphero.work = function(my) {
        twero.addSpheroInstance(name, my);
    }

    Cylon.robot(sphero);
}

initializeSphero('YBR');
initializeSphero('BOR');
initializeSphero('GBR');
Cylon.start();

// Create a route to respond to a call
app.post('/inbound', function(req, res) {
    console.log(req.body.Body);
    try {
        var number = req.body.From;
        switch(req.body.Body) {
            case 'REG':
                twero.register(number);
                break;
            case 'U':
                twero.move(0, number);
                break;
            case 'D':
                twero.move(180, number);
                break;
            case 'L':
                twero.move(260, number);
                break;
            case 'R':
                twero.move(100, number);
                break;
            default:
                console.log('swag');
                break;
        }
    } catch (err) {
        console.log("This broke");
    }
});

var io = io.listen(server);
io.on('connection', function(socket) {
	/* New Sphero added */
	// socket.on('incoming-sphero-connection', function(data) {
	// 	var portmask = "/dev/tty.Sphero-***-AMP-SPP";
	// 	var sphero = new SpheroFactory.Sphero(socket);

	// 	sphero.name = data.name;
	// 	sphero.connection.port = portmask.replace('***', data.name);

	// 	Cylon.robot(sphero).start();
	// });

	/* Starting spheros */
	socket.on('activate-spheros', function() {
		Cylon.start();
	});
});

