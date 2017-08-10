var express         = require("express"),
    request         = require("request"),
    mongoose        = require("mongoose"),
    passport        = require("passport"),
    methodOverride  = require("method-override"),
    bodyParser      = require("body-parser"),
    localStrategy   = require("passport-local"),
    User            = require("./models/user.js");

var app = express();

mongoose.Promise = global.Promise;
mongoose.connect("mongodb://chase:password@ds117869.mlab.com:17869/cwa");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));

//Passport Config
app.use(require("express-session") ({
    secret: "Mr Whiskers is the best kitty on Earth",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    next();
});

//Routes
app.get("/", function(req, res) {
    res.redirect("/weather");
});

app.get("/weather", function(req, res) {
    if (!req.user || req.user.locations.length == 0) {
        var search = "Virginia Beach, VA";
    } else {
        search = req.user.locations[0].location;
    }
    res.redirect("/weather/" + search);
});

app.get("/search", function(req, res) {
    if (!req.query.search) {
        var search = "Virginia Beach, VA";
    } else {
        search = req.query.search;
    }
    res.redirect("/weather/" + search);
});

app.get("/weather/:locationId", function(req, res) {
    //check if the page the user is on is their home location
    var isHome = false;
    if(req.user && req.user.locations.length > 0 && req.user.locations[0].location == req.params.locationId.replace(/, United States/, '')) {
        isHome = true;
    }
    //check if the page the user is on is saved to their list
    var isSaved = false;
    if(req.user) {
        req.user.locations.forEach(function(e) {
            if(e.location == req.params.locationId.replace(/, United States/, '')) {
                isSaved = true;
            }
        });
    }
    
    var showLocation = req.params.locationId;
    request("https://maps.googleapis.com/maps/api/geocode/json?address=" + showLocation + "&key=AIzaSyDYctz3Zk_hMYNfrsXxfyi9G91NmIYALkA", function (error, response, body) {
        if(!error && response.statusCode == 200) {
            var locationData = JSON.parse(body);
            var lat = locationData["results"][0]["geometry"]["location"]["lat"];
            var lng = locationData["results"][0]["geometry"]["location"]["lng"];
            request("https://api.darksky.net/forecast/b7fe412b53331c5862b164fcd087baae/" + lat + "," + lng, function (error, response, body) {
                if(!error && response.statusCode == 200) {
                    var weatherData = JSON.parse(body);
                    res.render("weather", {weatherData: weatherData, locationData: locationData, isHome: isHome, isSaved: isSaved});
                } else {
                    console.log('error:', error);
                    console.log('statusCode:', response && response.statusCode);
                }
            });
        } else {
            console.log('error:', error);
            console.log('statusCode:', response && response.statusCode);
        }
    });
});

app.patch("/weather/add", function(req, res) {
    User.findOne({_id: req.user.id}).then(function(foundUser){
        foundUser.locations.push(req.body);
        foundUser.save(function(err, data){
            if(err) throw err;
            res.json(data);
        });
    });
});

app.patch("/weather/newHome", function(req, res) {
    User.findOne({_id: req.user.id}).then(function(foundUser){
        
        for(i = 0; i < foundUser.locations.length; i++) {
            if (foundUser.locations[i].location == req.body.location) {
                foundUser.locations.splice(i, 1);
                i -= 1;
            }
        }
        foundUser.locations.unshift(req.body);
        foundUser.save(function(err, data){
            if(err) throw err;
            res.json(data);
        });
    });
});

app.delete("/weather/add", function(req, res) {
    User.findOne({_id: req.user.id}).then(function(foundUser){
        for(i = 0; i < foundUser.locations.length; i++) {
            if (foundUser.locations[i]._id == req.body._id || foundUser.locations[i].location == req.body.location) {
                foundUser.locations.splice(i, 1);
                break;
            }
        }
        foundUser.save(function(err, data){
            if(err) throw err;
            res.json(data);
        });
    });
});

app.get("/register", function(req, res) {
    res.render("register");
});

app.post("/register", function(req, res) {
    User.register(new User({username: req.body.username}), req.body.password, function(err, user) {
        if(err) {
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function() {
            res.redirect("/weather");
        });
    });
});

app.get("/login", function(req, res) {
    res.render("login");
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/weather",
    failureRedirect: "/login"
}), function(req, res) {

});

app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/weather");
});



app.listen(3000, function() {
    console.log("CWA has started");
});

