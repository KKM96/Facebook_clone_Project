const mongoose = require("mongoose");

let PostSchema = new mongoose.Schema({                  // Post Scheme 정의 
    content: String,
    time: Date,
    likes: Number,
    image: String,
    creator: {                                          // MongoDB : NoSQL로 SQL 보다 자유로운 스키마 구조 가능 // 필드안에 필드 넣기 가능
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        firstName: String,
        lastName: String,
        profile: String
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
});

let Post = mongoose.model("Post", PostSchema);
module.exports = Post;