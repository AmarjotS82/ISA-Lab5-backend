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
        let queryResponse = eexecQuery(query)
          sendRes(res, queryResponse)
      } else {
        sendRes(res, 'Error on server side.')
      }
    } catch (error) {
      console.log(error);
      sendRes(res, 'Error processing json on server side.')
    }
  });
}

function sendRes(res, message) {
  const jsonResponse = JSON.stringify({ success: true, message: message });
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

  const response = execQuery(query)

  const jsonResponseObj = {
    success: response !== "", 
    queryResponse: response,
  };

  const jsonResponse = JSON.stringify(jsonResponseObj);

  res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
  res.end(jsonResponse);
}

const server = http.createServer(route);
const PORT = process.env.PORT || 8000; // use port provided by service or 8000

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

function execQuery(query){


    const client = new Client({
        connectionString: 'postgresql://test4:EfITGgkm5jYODtwhwUoNqw@isa-labs-4391.g95.gcp-us-west2.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full',
        ssl: {
            rejectUnauthorized: false,
        },
    });

    client.connect();

    const queryResponse = client.query(query, (err, res) => {
        console.log(err, res);
        if (err) {
            console.log('Error executing query:', err.stack);
        } else {
            console.log('Query result:', res.rows);
        }
        client.end();
        return res;
    });
    return queryResponse;
}