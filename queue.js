const requestTimeout = 8;
const appKey = 'voipstudio';
const apiVer = '1.1';
const path = require('path');
const fs = require('fs');
const credentialsFile = path.resolve(__dirname, 'api.credentials');
const https = require('https');

var apiCredentials = "";

if (fs.existsSync(credentialsFile)) {
    apiCredentials = fs.readFileSync(credentialsFile, 'utf8');
} else {
	console.log("Error: VoIPstudio API credentials file [" + credentialsFile + "] not found");
	process.exit(1);
}

apiCredentials = apiCredentials.trim();

if (!/^[0-9]{6,7}:[a-f0-9]{40}$/.test(apiCredentials)) {
	console.log("Error: VoIPstudio API credentials file [" + credentialsFile + "] has invalid format");
	process.exit(1);
}

var printUsage = function() {
	var scriptName = path.basename(__filename);
	console.log("");
	console.log("This script allows to make all Agents in selected Queue join or leave");
	console.log("");
	console.log("Usage: " + scriptName + " '<Queue Name>' <join|leave>\n");
	process.exit(0);
}

if (process.argv.length !== 4) {
	printUsage();
}

var queueName = process.argv[2],
	action = process.argv[3];

if (!(action == 'join' || action == 'leave')) {
	console.log("Error: invalid action [" + action + "] allowed values: join or leave");
	process.exit(1);
}

var apiCall = function(method, url, data = null) {
    return new Promise(function(resolve, reject) {
    	
		var timeoutId = setTimeout(function() {
			reject(method + ' ' + options.path + ' FAILED after '+requestTimeout+' seconds of timeout');
		}, requestTimeout * 1000);

		var options = {
			timeout: requestTimeout,
		    host: 'l7api.com',
		    port: 443,
		    path: '/v'+apiVer+'/'+appKey+'/' + url,
		    method: method,
		    headers: {
		      'User-Agent': 'JS REST Client',
		      'Authorization': 'Basic ' + new Buffer(apiCredentials).toString('base64')
		   } 
		};

		if (data) {
			data = JSON.stringify(data);
			options.headers['Content-Type'] = 'application/json';
			options.headers['Content-Length'] = data.length;
		}

		var req = https.request(options, (res) => {
			
		    res.on('data', (d) => {

		    	clearTimeout(timeoutId);

		        var json = JSON.parse(d.toString('utf8'));
		        
			    if (res.statusCode === 200) {
			    	resolve(json);
			    } else {
			    	reject(method + ' ' + options.path + ' FAILED with: ' + JSON.stringify(json));
			    }
		    });
		});

		req.on('error', (e) => {
			clearTimeout(timeoutId);
		    reject(method + ' ' + options.path + ' FAILED with: ' + JSON.stringify(e));
		});

		if (data) {
			req.write(data);
		}

		req.end();
    });
}

apiCall('GET', 'queues?include=users&fields[users]=id,first_name,last_name,status').then(function(json){

	var queue = null;

	json.data.forEach(function(data) {
		if (data.name == queueName) {
			queue = data;
		}
	});

	if (!queue) {
		console.log("Error: queue [" + queueName + "] not found");
		process.exit(1);
	}

	if (queue.users.length === 0) {
		console.log("Info: queue [" + action + "] has no Agents, aborting...");
		process.exit(0);
	}

	var users = [];

	queue.users.forEach(function(data) {
		users.push({ id: data.id, status: (action == 'leave') ? false : true });
	});

	return apiCall('PATCH', 'queues/' + queue.id + '?include=users', { users: users});
}).then(function(json) {
	var op = (action == 'leave') ? 'left' : 'joined';
	console.log(json.data.users.length + ' Agents has ' + op + ' queue "' + queueName + '"');
}).catch(function(error) {
	console.log(error);
});

