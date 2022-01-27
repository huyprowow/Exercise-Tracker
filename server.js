const User = require("./model.js");
require("dotenv").config();

const express = require("express");
const app = express();

const cors = require("cors");
const logger = require("morgan");
const mongoose = require("mongoose");

mongoose.connect(process.env.URI_MONGODB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
console.log(mongoose.connection.readyState); //ktra ket noi 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting

app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

app.use(cors());
app.use(logger("dev"));
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", (req, res) => {
  // console.log(req.body);
  const newUser = new User({ username: req.body.username, count: 0, log: [] });
  newUser.save((err, user) => {
    if (err) {
      return console.error(err);
    }
    return res.json({ _id: user._id, username: user.username });
  });
});

app.get("/api/users", (req, res) => {
  User.find((err, users) => {
    if (err) return console.error(err);
    return res.json(
      users.map((user) => {
        return { _id: user._id, username: user.username };
      })
    );
  });
});

app.post("/api/users/:id/exercises", (req, res) => {
  //validate
  let { description, duration, date } = req.body;
  if (!description || !duration) {
    return res.status(400).send("Missing description or duration");
  }
  if (isNaN(duration)) {
    return res.status(400).send("duration not a number");
  } else {
    duration = +duration;
  }
  try {
    if (!date) {
      date = new Date();
    } else {
      date = new Date(date);
    }
  } catch (err) {
    return res.status(400).send("date not valid");
  }
  //update
  const newExercise = {
    description: description,
    duration: duration,
    date: date,
  };
  //   User.log.push(newExercise);
  // User.save(done);
  User.findByIdAndUpdate(
    { _id: req.params.id },
    {
      $inc: { count: 1 },
      $push: { log: newExercise },
    },
    { new: true },
    (err, user) => {
      if (err) return console.error(err);
      return res.json({
        _id: user._id,
        username: user.username,
        description: user.log[user.log.length - 1].description,
        duration: user.log[user.log.length - 1].duration,
        date: user.log[user.log.length - 1].date.toDateString(),
      });
    }
  );
  console.log(newExercise);
});

app.get("/api/users/:_id/logs", (req, res) => {
  const { from, to, limit } = req.query;

  User.findById(req.params._id, (err, user) => {
    if (err) return console.error(err);
    let logs = user.log;
    // return res.json(log)
    const regex = /\d{4}\-\d{2}\-\d{2}/;
    if (!regex.test(from) || !regex.test(to)) {
      return res.json({
        _id: user._id,
        username: user.username,
        count: logs.length,
        log: logs.map((log) => {
          return {
            description: log.description,
            duration: log.duration,
            date: log.date.toDateString(),
          };
        }),
      });
    }
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (from) {
      logs = logs.filter((log) => log.date >= fromDate);
    }
    if (to) {
      logs = logs.filter((log) => log.date <= toDate);
    }
    if (limit) {
      logs = logs.slice(0, +limit);
    }
    return res.json({
      _id: user._id,
      username: user.username,
      from: fromDate.toDateString(),
      to: toDate.toDateString(),
      count: logs.length,
      log: logs.map((log) => {
        return {
          description: log.description,
          duration: log.duration,
          date: log.date.toDateString(),
        };
      }),
    });
  });
});
app.get("/api/users/:id/logs", (req, res) => {
  User.findById(req.params.id, (err, user) => {
    if (err) return console.error(err);
    return res.json(user);
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
