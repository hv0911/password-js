const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const Schema = mongoose.Schema ;
const bcrypt = require("bcryptjs");

// connect to mongodb
mongoose.connect("mongodb://localhost:27017/passport")
.then((e)=>console.log(`connected to mongodb:${e.connection.host}`))
.catch((err)=>console.log(err));

const UserSchema = new Schema({
    username:{ type:String, required:true },
    password:{type:String , required: true},
});

const User = mongoose.model("User",UserSchema);

const app = express();

//setting the template 
app.set("views",__dirname);
app.set("view engine","ejs");

// writing function for passport
passport.use(
    new LocalStrategy((username,password,done)=>{

        User.findOne({username:username},(err,user)=>{
            if(err){
                done(err);
            }
            if(!user){
                return done(null,false,{message:"Incorrect username"});

            }
            // adding ecrption
            bcrypt.compare(password, user.password, (err, res) => {
                if (res) {
                  // passwords match! log user in
                  return done(null, user)
                } else {
                  // passwords do not match!
                  return done(null, false, { message: "Incorrect password" })
                }
              })

            // return done(null,user);
        });
    
    })
);

passport.serializeUser((user,done)=>{
    done(null,user.id);
});

passport.deserializeUser((id,done)=>{
User.findById(id,(err,user)=>{
    done(err,user);
})
});




// setting middlewares
app.use(session({secret:"cat" , resave:false , saveUninitialized:true}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({extended:false}));

app.get("/",(req,res)=>{
    res.render("index",{user:req.user});
});

app.get("/sign-up",(req,res)=>{
    res.render("sign-up-form");
});

app.post("/sign-up",(req,res,next)=>{

    const somePassword = req.body.password;
    bcrypt.hash(somePassword, 10 , (err,hashedPassword)=>{

        if(err){
            return next(err);
        }

        const user = new User({
            username:req.body.username,
            password:hashedPassword,
        });
        user.save((err)=>{
            if(err){
                return next(err);
            }
            res.redirect("/");
        })

    })
   

});

app.post("/log-in",

 passport.authenticate("local",{
    successRedirect:"/",
    failureRedirect:"/"
 })

);

app.get("/log-out",(req,res,next)=>{
    req.logOut((err)=>{
        if(err){
            return next(err);
        }
        res.redirect("/");
    })
})

app.get('/profile',(req,res)=>{
    res.render("profile", { user:req.user });
})


app.listen(3000 , ()=>console.log(`app is listening on port 3000`));