var express = require("express"),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    app = express(),
    methodOverride = require("method-override"),
    sanitizer = require("express-sanitizer"),
    passport = require("passport"),
    passportLocal = require("passport-local"),
    passportMongoose = require("passport-local-mongoose");
    mongoose.connect("mongodb://localhost/blogapp"); 
    app.set("view engine", "ejs");
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(methodOverride("_method"));
    app.use(express.static(__dirname + "/public"));
    app.use(sanitizer());

app.use(require("express-session")({
    secret: "first blog app",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

var commentSchema = new mongoose.Schema({
    author: String,
    text: String
})

var Comment = mongoose.model("Comment", commentSchema);

var userSchema = new mongoose.Schema({
    name: String,
    password: String,
    blog: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Blog"
    }
    ]
})

var User = mongoose.model("User", userSchema);
userSchema.plugin(passportMongoose);

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser())

var blogSchema = new mongoose.Schema({
    title: String,
    image: String,
    body: String,
    created: {type: Date, default: Date.now},
    comments: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }]
});

var Blog = mongoose.model("Blog", blogSchema);

app.get("/", function(req, res){
    res.redirect("blogs");
});

app.get("/blogs", function(req, res){
    Blog.find({}, function(err, blogs){
        if (err){
            console.log("Error in finding blogs");
        }
        else{
            res.render("index", {blogs: blogs});        
        }
    })
});

app.get("/blogs/new", function(req, res){
    res.render("new");
});

app.post("/blogs/new", function(req, res){
    var t = req.body.title;
    var c = Date.default;
    var i = req.body.image;
    var b = req.sanitize(req.body.body);
    var newObject = {
        title: t,
        created: c,
        image: i,
        body: b
    };
    Blog.create(newObject, function(err, done){
        if (err){
            console.log(err);
        } else{
            console.log("Pushed Succesfully");
        }
    });
    res.redirect("/blogs");
})

app.get("/blogs/:id", function(req, res){
    var id = req.params.id;
    Blog.findById(id).populate("comments").exec(function(err, foundBlog){
        if (err){
            console.log("Error");
        } else {
            res.render("show", {foundBlog: foundBlog});
        }
    });
});

app.get("/login", function(req, res){
    res.render("login",{User: User});
});

app.post("/login", passport.authenticate("local", {
    successRedirect : "index",
    failureRedirect : "login"
    
}),function(req, res){
    
});

app.get("/signup", function(req, res) {
    res.render("signup", {User:User});
})

app.post("/signup", function(req, res) {
    var User = req.body.User;
    User.create(User, function(err, done){
        if (err) {
            console.log(err);
        } else {
            console.log("Created a New User successfully.\n");
        }
    } )
    res.redirect("/login");
})


app.get("/blogs/:id/edit", function(req, res){
    var id = req.params.id;
    Blog.findById(id, function(err, foundBlog){
        if (err){
            console.log("Error");
        } else {
            res.render("update", {foundBlog: foundBlog});
        }
    });
});

app.put("/blogs/:id/edit", function(req, res){
    Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, blog){
        req.body.blog.body=req.sanitize(req.body.blog.body);
        if(err){
            res.redirect("/blogs");
        }
        else {
            res.redirect("/blogs/" + req.params.id);
        }
    });
});

app.get("/blogs/:id/comments/new", function(req, res){
    Blog.findById(req.params.id, function(err, foundBlog) {
        if (err){
            console.log(err);
        }
        else {
            res.render("newComment", {foundBlog: foundBlog});
        }
    })
})

app.post("/blogs/:id/comments", function(req, res){
    // var a = req.body.comment[author];
    // var t = req.body.comment[text];
    Blog.findById(req.params.id, function(err, foundBlog){
        if (err){
            console.log(err);
        }
        else{
            Comment.create(req.body.comment, function(err, comment){
                if(err) {
                    console.log("Error!");
                } else {
                    foundBlog.comments.push(comment);
                    foundBlog.save();
                    res.redirect("/blogs/" + foundBlog._id);
                }
            })  
        }
    })
    
})

app.delete("/blogs/:id/delete", function(req, res){
    Blog.findByIdAndRemove(req.params.id, function(err){
        if (err){
        res.redirect("/blogs");
        } else{
            res.redirect("/blogs");
        }
        
    })
})

app.listen(process.env.PORT, process.env.IP, function(err, run){
    if(err){
        console.log(err);
    }
    else {
        console.log("Server is running");
    }
});