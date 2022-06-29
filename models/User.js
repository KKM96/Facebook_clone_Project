const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

let UserSchema = new mongoose.Schema({                              // User Schema 정의
    username: String,                                               // field 값 설정, type 지정
    firstName: String,
    lastName: String,
    password: String,
    profile: String,
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,                   // ObjectID 각각 다른 Document 식별하는 고유 ID
            ref: "Post"
        }
    ],

    liked_posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        }
    ],

    liked_comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        }
    ],
    friends: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    friendRequests: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
});

UserSchema.plugin(passportLocalMongoose);                       // 사용자 인증을 위한 passport-local-mongoose 모듈과 스키마 연결
let User = mongoose.model("User", UserSchema);                  
module.exports = User;