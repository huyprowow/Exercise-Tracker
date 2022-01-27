const mongoose = require("mongoose");

const { Schema } = mongoose;

const userSchema = new Schema({
  username: String,
  count: Number,
  log: [
    {
      description: { type: String, required: true },
      duration: { type: Number, required: true },
      date: Date,
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
