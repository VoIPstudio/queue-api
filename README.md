# VoIPstudio Queue Agents management script

Example Node script to manage Queue Agents via REST API

# Install

1. If not already present in your environment, install [NodeJSss](https://nodejs.org)
2. Download latest `queue-api` release from [GitHub](https://github.com/VoIPstudio/queue-api/releases)
3. In the same folder where `queue.js` is create file `api.credentials` with VoIPstudio API User ID and API Key in format `<UserID>:<API_Key>`, for example: `123456:abcdef098765433abcdef098763abcdef09876ab` see (REST API Manual)[https://voipstudio.com/app/#manual.rest-api.introduction] for further details on how to obtain API credentials.

# Run

The script synopsis is:

`node queue.js '<Queue Name>' <join|leave>`

For example to make all Agents leave queue 'Support West' run:

`node queue.js 'Support West' leave`