const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

var Schema = mongoose.Schema;
var userSchema = new Schema(
  {
    Username: {
      type: String,
      lowercase: true,
      required: [true, "can't be blank"],
      index: true,
    },
    Password: String,
    Email: {
      type: String,
      lowercase: true,
      unique: true,
      required: [true, "can't be blank"],
      index: true,
    },
    admin: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

userSchema.plugin(uniqueValidator, {
  message: "is already taken.",
});

module.exports = mongoose.model("User", userSchema);
