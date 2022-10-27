const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

var Schema = mongoose.Schema;
var roomSchema = new Schema(
  {
    Email: {
      type: String,
      lowercase: true,
      required: [true, "can't be blank"],
      index: true,
    },
    roomId: {
      type: String,
      unique: true,
      required: [true, "can't be blank"],
      index: true,
    },
    timings: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

roomSchema.plugin(uniqueValidator, {
  message: "is already taken.",
});

module.exports = mongoose.model("Room", roomSchema);
