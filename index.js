if (process.env.NODE_ENV !== "production") require("dotenv").config();

const { default: axios } = require("axios");

// Base API Urls
const HYPIXEL_BASE_URL = "https://api.hypixel.net";
const DISCORD_BASE_URL = "https://discordapp.com/api";

// Get values from .env
const API_KEY = process.env.API_KEY;
const UUID = process.env.UUID;
const WEBHOOK_ID = process.env.WEBHOOK_ID;
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN;

// Make sure no config values are undefined
let exit = false;

if (!UUID) {
  console.error("Invalid .env config. Missing UUID");
  exit = true;
}

if (!API_KEY) {
  console.error("Invalid .env config. Missing API_KEY");
  exit = true;
}

if (!WEBHOOK_ID) {
  console.error("Invalid .env config. Missing WEBHOOK_ID");
  exit = true;
}

if (!WEBHOOK_TOKEN) {
  console.error("Invalid .env config. Missing WEBHOOK_TOKEN");
  exit = true;
}

// If a value is undefined, end process
if (exit) process.exit(1);

sendDiscordWebhook({
  username: "Player Stalker 300",
  embeds: [
    {
      title: "The program has now started!",
      timestamp: new Date().toISOString(),
    },
  ],
});

// Prevents a new message being sent every request
let online = false;

// Interval ID for progess bar to stop the bar from running once a request is started.
let interval;

// Recursive function runs every 15 seconds
function request() {
  // Stop progess bar
  clearInterval(interval);

  // Make request to API
  axios
    .get(`${HYPIXEL_BASE_URL}/player`, {
      params: {
        key: API_KEY,
        player: UUID,
        uuid: UUID,
      },
    })
    .then((res) => {
      // If player logged in since last request
      if (res.data.player.lastLogin > res.data.player.lastLogout && !online) {
        online = true;
        // Send webhook to discord
        sendWebhook(true, res.data.player);
      }
      // If player logged out since last request
      else if (res.data.player.lastLogin < res.data.player.lastLogout && online) {
        online = false;
        // Send webhook to discord
        sendWebhook(false, res.data.player);
      }

      // Start progess bar in console
      timeNewRequest();
    })
    .catch((err) => {
      console.error("Invalid Hypixel API Key (or the API is down)");
      process.exit(1);
    });
}

// Function to send a update message if a player logged in or off
function sendWebhook(status, playerData) {
  if (status) {
    status = "logged in";
  } else {
    status = "logged out";
  }

  sendDiscordWebhook({
    content: "@everyone",
    username: "Player Stalker 300",
    embeds: [
      {
        title: `${playerData.displayname} just ${status}.`,
        description: `Last logged in ${new Date(playerData.lastLogin).toString()}\nLast logged out ${new Date(playerData.lastLogout).toString()}`,
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

// Function to send a webhook
function sendDiscordWebhook(data) {
  axios.post(`${DISCORD_BASE_URL}/webhooks/${WEBHOOK_ID}/${WEBHOOK_TOKEN}`, data).catch((err) => {
    console.log(err);
    console.error("Failed to send a message to the discord webhook. Please make sure the ID and Token are correct!");
    process.exit(1);
  });
}

// Progess bar
function timeNewRequest() {
  let time = 0;
  interval = setInterval(() => {
    if (time >= 15) {
      request();
    }
    console.clear();
    let bar = "#".repeat(time) + "-".repeat(15 - time);
    console.log(`(${time}/15) [${bar}]`);
    time++;
  }, 1000);
}

request();