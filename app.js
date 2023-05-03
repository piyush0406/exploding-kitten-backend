const express = require("express");
const app = express();
const redis = require("redis");

const url = process.env.REDISURL || "redis://localhost:6379";
const client = redis.createClient({ url });
client
  .connect()
  .then(() => {
    console.log("redis connected");
  })
  .catch((err) => {
    console.log(err);
  });

// for CORS error
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  // res.header("Access-Control-Allow-Headers", true);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Autorization"
  );

  if (req.method === "OPTIONS") {
    // res.header("Access-Control-Allow-Methods", "PUT,POST,PATCH,DELETE,GET");

    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.header("Access-Control-Allow-Credentials", true);

    return res.status(200).json({});
  }

  next();
});

app.use(express.json());

app.post("/userNew", async (req, res) => {
  try {
    const { name, win } = req.body;

    const exists = await new Promise((resolve, reject) => {
      client.exists(name, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result === 1);
        }
      });
    });

    if (exists) {
      await client.hSet(name, ["win", win]);
      res.status(200).send(`${name} won updated to ${win}`);
    } else {
      await client.hSet(name, ["win", win]);
      res.status(201).send(`${name} Won`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error setting player");
  }
});

app.post("/user", async (req, res) => {
  try {
    const { name, win } = req.body;
    await client.hSet(name, ["win", win + 1]);
    res.status(201).send(`${name} Won`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error setting player");
  }
});

app.get("/getUser", async (req, res) => {
  try {
    const names = await new Promise((resolve, reject) => {
      client.keys("*", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    const users = await Promise.all(
      names.map(async (name) => {
        const win = await new Promise((resolve, reject) => {
          client.hGet(name, "win", (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });

        return { name, win };
      })
    );

    res.send(users);
  } catch (err) {
    console.error(err);

    res.status(500).send("Error getting users");
  }
});

module.exports = app;
