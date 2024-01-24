const http = require('http'),
 url = require('url'),
 fs = require('fs');

 /**
 * Creating a HTTP Server 
 * @date 1/24/2024 - 4:45:03 PM
 *
 * @param {*} request
 * @param {*} respone
 */
http.createServer(
(request, respone) => {
    let addr = request.url,
        q = new URL(addr, 'http://' + request.headers.host),
        filePath = '';
    
    // log the request urls
    fs.appendFile('log.txt', 'URL: ' + addr + '\nTimestamp: ' + new Date() + '\n\n', (err) => {
        if(err){
            console.log(err);
        }
        else{
            console.log('Added to log.');
        }
    });

    // setting the filepath of file, which data is included in the respone
    if(q.pathname.includes('documentation')){

        filePath = (__dirname + '/documentation.html')
    }
    else {
        filePath = 'index.html'
    }

    // reading the file and constructing the respone
    fs.readFile(filePath, (err, data) => 
    {
        // if there is an error, throw it
        if(err){
            throw err;
        }

        // The respone the send
        respone.writeHead(200, {'Content-Type': 'text/plain'});
        respone.write(data);
        respone.end();
    })
    
}).listen(8080);

console.log('My first Node test server is running on Port 8080.');