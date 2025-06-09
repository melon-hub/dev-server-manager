const http = require("http"); http.createServer((req, res) => res.end("Test server on port 3001")).listen(3001, () => console.log("Server running on port 3001"));
