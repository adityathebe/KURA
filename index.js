const pug = require('pug');
const path = require('path');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const express = require('express');
const session = require('express-session');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const _ = require('lodash');

const DB = require('./utils');

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect('mongodb://kuraforum:kuraforum123@ds129733.mlab.com:29733/kura');
// mongoose.connect('mongodb://127.0.0.1/kura');
let db = mongoose.connection;

// Check for Database errors
db.on('error', (err) => {
    console.log(err)
});

// Check for Database connection
db.once('open', () => {
    console.log('Connected to mongoDb')
});

// Bring in Models
let Questions = require('./models/question');
let Answers = require('./models/answer');
let UserModel = require('./models/user');
let CategoryModel = require('./models/category');

// Load View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json())
app.use(express.static(path.join(__dirname, 'assets')));

// Express Message
app.use(require('connect-flash')());
app.use((req, res, next) => {
    res.locals.messages = require('express-messages')(req, res);
    next();
});

// Express validator middleware
app.use(expressValidator({
    errorFormatter: function(param, msg, value) {
        var namespace = param.split('.');
        var root    = namespace.shift();
        var formParam = root;

        while(namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param : formParam,
            msg   : msg,
            value : value
        };
    }
}));

// Express Session Middleware
app.use(session({secret: 'kura_forum_123', resave: true, saveUninitialized: true}));

// Check if user is logged in 
app.use(function(req, res, next) {
    if (req.session && req.session.user) {
        UserModel.findOne({ email: req.session.user.email }, (err, user) => {
            if (user) {
                req.user = user;
                delete req.user.password; // delete the password from the session
                req.session.user = user;  //refresh the session value
                res.locals.user = user;
            }
            // finishing processing the middleware and run the route
            next();
        });
    } else {
        next();
    }
});

// Function to check if user is logged in
function requireLogin (req, res, next) {
    if (!req.user) {
        res.redirect('/user/login');
    } else {
        next();
    }
};

// Custom Express validator to not allow spaces
app.use(expressValidator({
    customValidators: {
        noSpaces: function(value) {
            return (value.search(' ')) >= 0 ? false : true;
        }
    }
}));

// Home Page
app.get('/', (req, res) => {
    DB.getAll().then((data) => {
        res.render('home', {
            questions : data[0],
            users: data[1],
            tags : data[2],
            kuNews : data[4]
        });
    });
});

// Admin
app.get('/admin', requireLogin, (req, res) => {
    if(req.user.admin) {
        let info = [];
        DB.getAll().then((data) => {
            res.render('admin', {
                questions : data[0],
                users: data[1],
                subjects : data[2],
                answers : data[3],
                kuNews : data[4]
            });
        });
    } else {
        req.flash('info', 'Unauthorised User');
        res.redirect('/');
    }
});

// To store categories
app.post('/admin', requireLogin, (req, res) => {
    req.checkBody('name', 'Cannot be blank').notEmpty();
    req.checkBody('stream', 'Cannot be blank').notEmpty();
    req.checkBody('year', 'Cannot be blank').isInt();
    req.checkBody('semester', 'Cannot be blank').isInt();

    var errors = req.validationErrors();

    if (errors) {
        req.flash('info', 'Cannot be blank');
        res.redirect('/admin');
    } else {
        let user = new CategoryModel({
            name : req.body.name,
            stream : req.body.stream,
            year : req.body.year,
            sem : req.body.semester
        });

        user.save((err) => {
            if(err) {
                return console.log(err);
            } else {
                req.flash('success', 'New Category Added');
                res.redirect('/admin');
            }
        });
    }
});

// Category Page
app.get('/category/:id', (req, res) => {
    let subject = decodeURI(req.params.id);
    Questions.find({category:subject}, (err, questions) => {
        if(err) {
            console.log(err);
        } else {
            res.render('category', {questions, subject});
        }
    });
});

// About Us
app.get('/about', (req, res) => {
    res.render('about_us');
});

// Contact Us
app.get('/contact', (req, res) => {
    res.render('contact_us');
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

// Search
app.get("/search", (req, res) => {
    if (req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Questions.find({ "title": regex }, (err, found) => {
            if(err) {
               console.log(err);
            } else {
                DB.getAll().then((data) => {
                    if(_.isEmpty(found)) {
                        req.flash('info', 'No result found!');
                    } 
                    res.render('home', {
                        questions: found, 
                        users: data[1],
                        tags : data[2] 
                    });
                }, (errMsg) => {
                    console.log(errMsg);
                });
           }
       }); 
    } else {
        res.redirect('/');
    }
});

// Route Files
let questionRoute = require('./routes/question');
let answerRoute = require('./routes/answer');
let userRoute = require('./routes/user');
app.use('/questions', questionRoute);
app.use('/answer', answerRoute);
app.use('/user', userRoute);

// 404 Errors
app.get('*', (req, res) => {
    res.render('404_page');
});

app.listen(port, ()=> {
	console.log(`Listening at port ${port}`);
});