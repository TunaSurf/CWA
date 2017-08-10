var mongoose = require("mongoose"),
    passportLocalMongoose   = require("passport-local-mongoose");

var LocationSchema = new mongoose.Schema( {
    location: String
});

var UserSchema = new mongoose.Schema( {
    username: String,
    password: String,
    locations: [LocationSchema]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);