const express = require('express'),
      OAuth = require('oauth').OAuth,
      cors = require('cors'),
      proxy = require('http-proxy-middleware');


require('dotenv').config();

const PORT = process.env.PORT || 3000;
const JIRA_SERVER = process.env.JIRA_SERVER || 'https://jira.exlibrisgroup.com';
const app = express(),
      session = require('express-session'),
      MemoryStore = require('memorystore')(session);

let sess = {
  cookie: { maxAge: 86400000 },
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}

if (app.get('env') === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sess.cookie.secure = true // serve secure cookies
}
 
app.use(session(sess))
.use(cors());

const getHost = (req) => {
  /* Get API Gateway stage if running in AWS */
  let stage = '';
  if (req.headers['x-apigateway-event']) {
    const event = JSON.parse(decodeURIComponent(req.headers['x-apigateway-event']));
    if (event.requestContext && event.requestContext.stage) {
      stage = '/' + event.requestContext.stage;
    }
  }
  return (req.headers['x-forwarded-proto'] || req.protocol) + '://' + req.get('host') + stage;
}

const consumer = (url = null) => 
  new OAuth(
    `${JIRA_SERVER}/plugins/servlet/oauth/request-token`,
    `${JIRA_SERVER}/plugins/servlet/oauth/access-token`,
    process.env.CONSUMER_KEY,
    JSON.parse(`"${process.env.CONSUMER_PRIVATE_KEY}"`), // convert '\n'
    "1.0",
    url + '/sessions/callback',
    "RSA-SHA1"
  );

app.get('/sessions/connect', async (request, response) => {
  console.log('got here');
	consumer(getHost(request)).getOAuthRequestToken(
		function(error, oauthToken, oauthTokenSecret, results) {
    	if (error) {
				console.error(error);
      	response.send('Error getting OAuth access token');
			} else {
      	request.session.oauthRequestToken = oauthToken;
      	request.session.oauthRequestTokenSecret = oauthTokenSecret;
      	response.redirect(`${JIRA_SERVER}/plugins/servlet/oauth/authorize?oauth_token=${request.session.oauthRequestToken}`);
			}
		}
	)
});

app.get('/sessions/callback', async (request, response) => {
  const referrer = request.headers.referer;
	consumer().getOAuthAccessToken (
		request.session.oauthRequestToken, 
		request.session.oauthRequestTokenSecret, 
		request.query.oauth_verifier,
		(error, oauthAccessToken, oauthAccessTokenSecret, results) => {			
			if (error) { 
				console.error(error);
				response.send("error getting access token");		
			} else {
      	request.session.oauthAccessToken = oauthAccessToken;
        request.session.oauthAccessTokenSecret = oauthAccessTokenSecret;
        const resp = {
          token: oauthAccessToken,
          secret: oauthAccessTokenSecret
        }
        response.send(`
          <p>Returning...</p>
          <script>
            window.opener.postMessage(${JSON.stringify(resp)}, "*");
            window.close();
          </script>
        `)
				}
			}
		)
  });

app.use(
  '/',
  proxy({  
    target: JIRA_SERVER,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      if (req.method === 'OPTIONS') {
        res.writeHead(200, CORS_HEADERS);
        res.end();
        proxyReq.abort();
      } else {
        let header = consumer().authHeader(
          JIRA_SERVER + req.url,
          req.headers['x-oauth-token'], 
          req.headers['x-oauth-secret'],
          req.method || 'GET');
        proxyReq.setHeader('Authorization', header);
      }
    } 
  })
);

module.exports = app;
if (!!!process.env.LAMBDA_TASK_ROOT) app.listen(PORT);