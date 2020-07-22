require('dotenv').config();
const AWS = require('aws-sdk');
const utils = require('./utils');
const s3 = new AWS.S3();
//AWS.config.update({region: 'eu-central-1'});

const handler = async (event, context) => {
  const body = JSON.parse(event.body||'{}');
  let result;
  try {
    switch (event.routeKey) {
      case 'GET /capacity':
        result = utils.responses.success(await getCapacity());
        break;
      case 'POST /capacity':
        result = utils.responses.success(await setCapacity(JSON.stringify(body)))
        break;
      default:
        result = utils.responses.notfound();
    }
  } catch (e) {
    console.error('error', e);
    result = utils.responses.error(e.message);
  }
  //return utils.cors(result, event);
  return result;
};

const getCapacity = async () => {
  const Bucket = process.env.BUCKET_NAME;
  const Key = 'jira-planner/capacity.json'
  const data = await s3.getObject({ Bucket, Key }).promise();
  return JSON.parse(data.Body.toString('ascii'));
}

const setCapacity = async Body => {
  const Bucket = process.env.BUCKET_NAME;
  const Key = 'jira-planner/capacity.json';
  await s3.putObject({ Bucket, Key, Body }).promise();
}

module.exports = { handler };
