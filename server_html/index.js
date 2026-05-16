const http = require("http")
const url = require('url')
 
let data = [{ id: 1, name: "Item1" }, {id: 2, name: "Item2"}];
 
const server = http.createServer((req,res) => {
    const baseURL = 'http://' + req.headers.host;
  const parsedUrl = new URL(req.url, baseURL);
    // console.log(req.query?.id)
    // get
    // if (req.url === '/user' && req.method === 'GET') {
    //     res.writeHead(200, { "Content-Type": "application/json" });
    //     res.end(JSON.stringify(data));
    // }
    
    // // POST
    // else if (req.url === '/user' && req.method === "POST") {
    //     let body = '';
 
    //     req.on('data', chunk => {
    //         body += chunk.toString();
    //     });
 
    //     req.on('end', () => {
    //         try {
    //             const newItem = JSON.parse(body);
    //             data.push(newItem);
                
    //             res.writeHead(201, { "Content-Type": "application/json" });
    //             res.end(JSON.stringify({ message: "User added!", item: newItem }));
    //         } catch (err) {
    //             res.writeHead(400, { "Content-Type": "application/json" });
    //             res.end(JSON.stringify({ error: "Invalid JSON format" }));
    //         }
    //     });
    // }
 
    // // PUT
    // else if (req.url == "/user" && req.method === "PUT") {
    //     const id = Number(req.query.id)
    //     console.log(id)
    //     let body = '';
    //     req.on("data", chunk => body += chunk.toString());
    //     req.on('end', () => {
    //         const index = data.findIndex(item => item.id === id);
    //         if (index !== -1) {
    //             data[index] = { id, ...JSON.parse(body) };
    //             res.writeHead(200, { "Content-Type": "application/json" });
    //             res.end(JSON.stringify({ message: "User updated!", item: data[index] }));
    //         } else {
    //             res.writeHead(404, { "Content-Type": "application/json" });
    //             res.end(JSON.stringify({ error: "User not found" }));
    //         }
    //     });
    // }
 
    // PATCH
    if (req.url==="/user/patch" && req.method === "PATCH") {
        // console.log(req.params)
        // const id = Number(query.id)
  const queryParams = parsedUrl.searchParams.get('id'); 
  console.log(queryParams)

        console.log("run")
        console.log("id",id)
        console.log(id);
        let body = '';
        req.on("data", chunk => body += chunk.toString());
        req.on('end', () => {
            const index = data.findIndex(item => item.id === id);
            if (index !== -1) {
                const updates = JSON.parse(body);
                data[index] = { ...data[index], ...updates };
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "User partially updated!", item: data[index] }));
            } else {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "User not found" }));
            }
        });
    }
 
    // DELETE
    else if (req.url == "/user" && req.method === "DELETE") {
        const id = Number(req.query.id)
        console.log(id)
        const index = data.findIndex(item => item.id === id);
        if (index !== -1) {
            const deletedItem = data.splice(index, 1);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "User deleted!", item: deletedItem[0] }));
        } else {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "User not found" }));
        }
    }
})
 
server.listen("3002", ()=>{
    console.log("server start at port 3000")
})
 