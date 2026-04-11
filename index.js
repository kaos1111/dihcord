import express from "express";
import Redis from "ioredis";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const redis = new Redis(process.env.REDIS_URL);

// test route
app.get("/", (req, res) => {
  res.send("Temp mail running");
});

// generate email
app.get("/generate", (req, res) => {
  const id = Math.random().toString(36).substring(2, 10);
  res.json({ email: `${id}@${process.env.DOMAIN}` });
});

// receive emails from Mailgun
app.post("/receive-email", async (req, res) => {
  try {
    const recipient = req.body.recipient;
    const subject = req.body.subject;
    const body = req.body["body-plain"];

    const inboxId = recipient.split("@")[0];

    await redis.lpush(
      `inbox:${inboxId}`,
      JSON.stringify({
        subject,
        body,
        time: new Date().toISOString()
      })
    );

    await redis.expire(`inbox:${inboxId}`, 600);

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// get inbox
app.get("/inbox/:id", async (req, res) => {
  const messages = await redis.lrange(`inbox:${req.params.id}`, 0, -1);
  res.json(messages.map(JSON.parse));
});

app.listen(3000, () => console.log("Server running"));
