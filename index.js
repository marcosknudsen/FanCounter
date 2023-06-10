const storage = require("node-persist");
const tmi = require("tmi.js");
const teamNames = require("./teams.json");
require('dotenv').config()
const client = new tmi.Client({
  options: { debug: false },
  identity: {
    username: process.env.twitch_bot_channel,
    password: process.env.twitch_bot_oauth,
  },
  channels: [process.env.twitch_channel],
});

async function start() {
  await storage.init();
}

let fans;
start();

client.on("connected", async () => {
  fans = await getFromStorage("fans");
});

client.connect().catch(console.error);
client.on("message", async (channel, tags, message) => {
  if (message.startsWith("!")) {
    let [command, ...arg] = getCommand(message.toLowerCase());
    if (isMod(tags, channel)) {
      switch (command) {
        case "add":
          addFan(arg[0], arg[1]);
          client.say(
            channel,
            `${arg[1]} fue agregado como hincha de ${teamNames[arg[0]]}}`
          );
          break;
        case "get":
          client.say(
            channel,
            teamNames[arg[0]] + ": " + quantityOf(fans, arg[0]).toString()
          );
          break;
        case "delete":
          deleteFan(arg[0].toLowerCase());
          break;
        case "top":
          let arrayTop = top(getTotalArray(fans), arg[0]);
          let string = "";
          for (let i of arrayTop) {
            string += `${arrayTop.indexOf(i) + 1}- ${teamNames[i.index]}(${
              i.quantity
            })\n`;
          }
          client.say(channel, string);
          break;
        case "list":
          teamFans = listByTeam(fans, arg[0]);
          client.say(
            channel,
            teamFans != ""
              ? `${teamNames[arg[0]]}: ${teamFans}`
              : `No hay hinchas registrados de ${teamNames[arg[0]]}`
          );
          break;
        case "ids":
          client.say(
            channel,
            "River 18 - Boca 6 - San Lorenzo 19 - Independiente 12 - Racing 17 - Estudiantes LP 8 - Velez 21 - Huracan 11 - Newells 14 - Rosario 35"
          );
          break;
        case "help":
          client.say(
            channel,
            "Comandos: !add {id} {@user} - !delete {@user} - !list {id} - !get {id} - !top {cantidad}  - !ids (para ver los ids principales)"
          );
          break;
        case "search":
          let team = getTeam(arg[0]);
          client.say(
            channel,
            team != null
              ? `${arg[0]} es hincha de ${getTeam(arg[0])}`
              : `${arg[0]} no esta registrado como hincha`
          );
          break;
        case "total":
          client.say(channel, `Hay ${fans.length} hinchas en total`);
          break;
      }
    }
  }
});

function isMod(tags, channel) {
  return tags.mod || channel.slice(1) === tags.username;
}

function getCommand(string) {
  string = string.replace("!", "");
  return string.split(" ");
}

async function addFan(teamId, user) {
  if (userIndex(fans, user) === -1) {
    fans.push({ team: parseInt(teamId), user: user });
    await storage.setItem("fans", fans);
  }
}

async function getFromStorage(key) {
  let response = await storage.getItem(key);
  return response != null ? response : [];
}

function quantityOf(array, value) {
  let cont = 0;
  for (let fan of array) {
    if (fan.team == value) {
      cont++;
    }
  }
  return cont;
}

async function deleteFan(user) {
  let index = userIndex(fans, user);
  if (index != -1) {
    fans.splice(index, 1);
    await storage.setItem("fans", fans);
  }
}

function getTotalArray(array) {
  let totalArray = ZeroArray(1721);
  for (let i = 0; i < array.length; i++) {
    totalArray[array[i].team]++;
  }
  return totalArray;
}

function ZeroArray(length) {
  var array = [];
  for (let i = 0; i < length; i++) {
    array[i] = 0;
  }
  return array;
}

function getMax(array, arrayExclude) {
  let max = -1;
  let imax = -1;
  for (let i = 0; i < array.length; i++) {
    if (
      array[i] > max &&
      !inArray(arrayExclude, i) &&
      teamNames[i] !== undefined
    ) {
      max = array[i];
      imax = i;
    }
  }
  return { index: imax, quantity: max };
}

function top(array, length) {
  let arrayTop = [];
  let i = 0;
  while (
    getMax(array, arrayTop).quantity != 0 &&
    (length === undefined || i < length)
  ) {
    arrayTop.push(getMax(array, arrayTop));
    i++;
  }
  return arrayTop;
}

function inArray(array, value) {
  let response = false;
  for (let i = 0; i < array.length; i++) {
    if (array[i].index == value) response = true;
  }
  return response;
}

function userIndex(array, user) {
  let index = -1;
  for (let i = 0; i < array.length; i++) {
    if (array[i].user == user) index = i;
  }
  return index;
}

function usersByTeam(array, team) {
  let response = [];
  for (let i = 0; i < array.length; i++) {
    if (array[i].team == team) {
      response.push(array[i].user);
    }
  }
  return response;
}

function listByTeam(array, team) {
  let arrayUsers = usersByTeam(array, team);
  let string = "";
  for (let i = 0; i < arrayUsers.length; i++) {
    string += arrayUsers[i] + "\n";
  }
  return string;
}

function getTeam(id) {
  let team = null;
  for (let i of fans) {
    if (i.user == id) {
      team = teamNames[i.team];
    }
  }
  return team;
}
