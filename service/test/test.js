const handler = require('../index');
const event = require('./event.json');


(async () => {
  try {
    result = await handler.handler(event, {});
    console.log('result', result)
  } catch(e) {
    console.error('Error', e);
    console.log('done', process._getActiveHandles().length)
  }
})();
