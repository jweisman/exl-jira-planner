const responses = {
  success: body => ({ statusCode: 200, body: JSON.stringify(body) }),
  unauthorized: () => ({ statusCode: 401, body: JSON.stringify('Unauthorized') }),
  notfound: () => ({ statusCode: 404, body: JSON.stringify('Not Found') }),
  error: msg => ({ statusCode: 400, body: JSON.stringify(msg) }),
}

module.exports = { responses };