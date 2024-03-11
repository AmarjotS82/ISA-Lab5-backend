const http = require('http');
const url = require('url');
const { Client } = require('pg');



function handleGetRequest(req, res) {

  const parsedUrl = url.parse(req.url, true);

 if (parsedUrl.pathname === '/sql') {
    sendSelectQuery(req, res);
  }
}

function handlePostRequest(req, res) {

  console.log(req.url)
  if (req.url !== '/execInsert') {
    res.writeHead(404, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
    res.end('Not Found');
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  let data = '';

  req.on('data', chunk => {
    data += chunk;
  });

  req.on('end', () => { 
    try {
      const jsonData = JSON.parse(data);

      const query = jsonData.query;

      if (query) { 
        let queryResponse = ""
        execQuery(query)
        .then(result => {
            console.log('Query result:', result);
            queryResponse += result
            sendRes(res,true, queryResponse)
        })
        .catch(error => {
            console.error('Error executing query:', error);
            queryResponse += error
            sendRes(res,false, queryResponse)
        });
         
      } else {
        sendRes(res, 'Error on server side.')
      }
    } catch (error) {
      console.log(error);
      sendRes(res, 'Error processing json on server side.')
    }
  });
}

function sendRes(res,issuccess, message) {
  const jsonResponse = JSON.stringify({ success: issuccess, message: message });
  res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
  res.end(jsonResponse);
}



function route(req, res) {
  console.log(`Received ${req.method} request for ${req.url}`);
  if (req.method === 'GET') {
    handleGetRequest(req, res); 
  } 
  else if (req.method === 'POST') {
    handlePostRequest(req, res);
  }
  else if (req.method === 'OPTIONS') {
    // Handle preflight request
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
  }
  else {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end('Not Found');
  }
}

function sendSelectQuery(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const query = parsedUrl.query;
  let query_str = JSON.stringify(query)
  let response = "";

  execQuery(query_str)
  .then(result => {
      console.log('Query result:', result);
      response += result
      const jsonResponseObj = {
        success: true, 
        queryResponse: response,
        query: query_str
      };
    
      const jsonResponse = JSON.stringify(jsonResponseObj);
    
      res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
      res.end(jsonResponse);
  })
  .catch(error => {
      console.error('Error executing query:', error);
      response += error
      const jsonResponseObj = {
        success: false, 
        queryResponse: response,
        query: query_str
      };
    
      const jsonResponse = JSON.stringify(jsonResponseObj);
    
      res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
      res.end(jsonResponse);
  });

  
}

const server = http.createServer(route);
const PORT = process.env.PORT || 8000; // use port provided by service or 8000

server.listen(PORT, () => {
  console.log("testing")
  console.log(`Server is running on port ${PORT}`);
});

function execQuery(query) {
  return new Promise((resolve, reject) => {
      const client = new Client({
          connectionString: 'postgresql://test4:EfITGgkm5jYODtwhwUoNqw@isa-labs-4391.g95.gcp-us-west2.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full',
          ssl: {
              rejectUnauthorized: false,
          },
      });

      client.connect()
          .then(() => client.query(query))
          .then(res => {
              console.log('Query result:', res.rows);
              resolve(res.rows);
          })
          .catch(err => {
              console.error('Error executing query:', err.stack);
              reject(err);
          })
          .finally(() => client.end());
  });
}