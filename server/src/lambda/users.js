const axios = require('axios');
exports.handler = (event, context, callback) => {
  axios.get('https://jsonplaceholder.typicode.com/users')
    .then((res) => {
      callback(null, {
        statusCode: 200,
        body: res.data,
      });
    })
    .catch((err) => {
      callback(err);
    });
};