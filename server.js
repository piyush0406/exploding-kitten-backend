require("dotenv").config();
const http = require("http");
const app = require("./app");
const port = process.env.PORT || 5001;

const server = http.createServer(app);

server.listen(port, () => {
  console.log("server is running at port 5001");
});
