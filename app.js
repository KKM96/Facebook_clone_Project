const express = require("express");
const mongoose = require("mongoose");                 // () 추가 테스트 => x
const session = require("express-session");
const cookieParser = require('cookie-parser');
const passport = require("passport");
const LocalStrategy = require("passport-local");
const socket = require("socket.io");
const dotenv = require("dotenv");
const flash = require("connect-flash");
const Post = require("./models/Post");
const User = require("./models/User");                  // 서버파일, app.js 코드에서 필요한 모듈 불러오기

const port = process.env.PORT || 3000;                  // port 3000으로 설정
const onlineChatUsers = {};                             // 채팅 기능을 위해 user의 정보를 담을 개체변수 할당

dotenv.config();                                        // dotenv를 통해 .env 파일 변수를 process.env를 통해 사용할 수 있게하는 메서드 호출

const postRoutes = require("./routes/posts");
const userRoutes = require("./routes/users");
const app = express();

app.set("view engine", "ejs");                          // app.set 에서 ejs를 사용하여 view를 구성할 것을 명시

// 미들웨어
app.use(cookieParser(process.env.SECRET))
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
})
);
app.use(flash());

// passport setup
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// MongoDB Connection
mongoose
    .connect("mongodb://127.0.0.1:27017/facebook_clone", {              // host: local을 나타내는 127.0.0.1, Port: MongoDB의 기본 포트인 27017, DB명 : facebook_clone
        useNewUrlParser: true,                                          // useNewUrlParser, useUnifiedTopology => true로 해주지않으면 deprecatedError 발생
        // useCreateIndex: true,                                           // 이었지만 버전 변경 되면서 Mongodb에서 이를 더 지원 X
        // useUnifiedTopology: true,
    })
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((err) => {
        console.log(err);
    }); 

// Template 파일에 변수 전송
app.use((req, res, next) => {
    res.locals.user = req.user;
    res.locals.login = req.isAuthenticated();
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

// Routers  // 라우터 장착, 서버와 연결 
app.use("/", userRoutes);
app.use("/", postRoutes);

const server = app.listen(port, () => {
    console.log("App is running on port " + port);
});

//WebSocket setup // socket.io를 이용해 websocket 통신 구현, express 서버와 연결
const io = socket(server);

const room = io.of("/chat");
room.on("connection", socket => {
    console.log("new user : ", socket.id);

    room.emit("newUser", { socketID: socket.id });                          // room.emit : 모든 사용자에게 메세지를 보내는 것

    socket.on("newUser", data => {                                          // 메시지를 보내는 특정 이벤트 1 : 새로운 사용자가 등장했을 때
        if (!(data.name in onlineChatUsers)) {                              // 기존 사용자가 아닌 새로운 사용자일 경우 객체 변수에 해당 사용자 넣기
            onlineChatUsers[data.name] = data.socketID;                     
            socket.name = data.name;
            room.emit("updateUserList", Object.keys(onlineChatUsers));
            console.log("Online users: " + Object.keys(onlineChatUsers));
        }
    });

    socket.on("disconnect", () => {                                         // 메시지를 보내는 특정 이벤트 2 : 사용자가 나갔을 때
        delete onlineChatUsers[socket.name];                                // 사용자가 나갈 경우 사용자 정보 삭제
        room.emit("updateUserList", Object.keys(onlineChatUsers));
        console.log(`user ${socket.name} disconnected`);
    });

    socket.on("chat", data => {                                             // 메시지를 보내는 특정 이벤트 3 : 사용자들이 메시지를 보냈을 때
        console.log(data);
        if (data.to === "Global Chat") {
            room.emit("chat", data);
        } else if (data.to) {
            room.to(onlineChatUsers[data.name]).emit("chat", data);
            room.to(onlineChatUsers[data.to]).emit("chat", data);
        }
    });
});