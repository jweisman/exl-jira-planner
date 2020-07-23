const express = require('express'),
      OAuth = require('oauth').OAuth,
      cors = require('cors');

require('dotenv').config();

const PORT = process.env.PORT || 3000;
const JIRA_SERVER = process.env.JIRA_SERVER;
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

const getHost = (req) => (req.headers['x-forwarded-proto'] || req.protocol) + '://' + req.get('host');

const consumer = (url = null) => 
  new OAuth(
    `${JIRA_SERVER}/plugins/servlet/oauth/request-token`,
    `${JIRA_SERVER}/plugins/servlet/oauth/access-token`,
    process.env.CONSUMER_KEY,
    process.env.CONSUMER_PRIVATE_KEY,
    "1.0",
    url + '/sessions/callback',
    "RSA-SHA1"
  );

app.get('/', (req, res) => res.send('Jira OAuth Servlet'));

app.get('/sessions/connect', async (request, response) => {
	consumer(getHost(request)).getOAuthRequestToken(
		function(error, oauthToken, oauthTokenSecret, results) {
    	if (error) {
				console.error(error.data);
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
  console.log('referrer', referrer);
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
        //response.send({result: 'OK'});
        response.send(`
          <p>Returning...</p>
          <script>
            window.opener.postMessage(${JSON.stringify(resp)}, "${referrer ? referrer : "*"}");
            window.close();
          </script>
        `)
				}
			}
		)
  });

  
app.get('/authHeader', async (request, response) => {
  //https://jira.exlibrisgroup.com/rest/api/latest/issue/URM-123286.json
  try {
    const header = consumer().authHeader(request.query.url, 
      request.session.oauthAccessToken, 
      request.session.oauthAccessTokenSecret,
      request.query.method || 'GET');
    response.send({authHeader: header});
  } catch(e) {
    console.error('Error creating Auth Header', e.message);
    response.status(400).send('Error creating Auth Header');
  }
});

app.listen(PORT);