const FACEBOOK_VERIFY_TOKEN = "123456789";
const FACEBOOK_PAGE_ACCESS_TOKEN = "tu_token_de_acceso";
import express from "express";
const router = express.Router();

router.get("/webhook", (req, res) => {
    console.log(req.query, req.query["hub.verify_token"] === FACEBOOK_VERIFY_TOKEN,req.query["hub.challenge"]);
  if (req.query["hub.verify_token"] === FACEBOOK_VERIFY_TOKEN) {
    res.send(req.query["hub.challenge"]);
  } else {
    res.send("Error de validación");
  }
});

router.post("/webhook", (req, res) => {
    console.log(req.body);
  const body = req.body;

  if (body.object === "whatsapp_business_account") {
    body.entry.forEach((entry) => {
      const webhookEvent = entry.changes[0];  
      console.log(webhookEvent);
      console.log(webhookEvent.value.messages);
    });
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

export default router;
