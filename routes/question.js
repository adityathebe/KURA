const express = require('express');
const router = express.Router();

// Bring in Question Model
let Questions = require('../models/question');
let Answers = require('../models/answer');
let CategoryModel = require('../models/category');

// Function to check if user is logged in
function requireLogin (req, res, next) {
    if (!req.session.user) {
        req.flash('info', 'You need to be logged in');
        res.redirect('/user/login');
    } else {
        next();
    }
};

// Ask A Question
router.get('/ask', requireLogin, (req, res) => {
    CategoryModel.find({}, (err, categories) => {
        res.render('ask_question', {categories});        
    })
});

// Delete A Question
router.get('/delete/:id', requireLogin, (req, res) => {
    Questions.findById(req.params.id, (err, question) => {
        if(question) {
            if(req.user.username === question.author) {
                Questions.remove({_id:req.params.id}, (err) => {
                    if (err) {
                        console.log(err);
                    }
                    req.flash('success', 'Succesfully Deleted');
                    res.redirect('/');
                });            
            } else {
                req.flash('danger', 'Unauthorized User');
                res.redirect('/questions/' + req.params.id);
            } 
        } else {
            req.flash('danger', 'Invalid Request');
            res.redirect('/');
        }
    });
});

// Edit Single Question
router.get('/edit/:id', (req, res) => {
    Questions.findById(req.params.id, (err, question) => {
        if (err) {
            console.log(err);
        } else {
            res.render('edit_question', {
                question: question
            });
        }
    });
});


// Update Edit submission
router.post('/edit/:id', (req, res) => {
    let question = {};
    question.title = req.body.title;
    question.author = req.body.author;
    question.body = req.body.body;
    question.category = req.body.category;
    question.updatedAt = new Date();

    let query = {_id:req.params.id}

    Questions.update(query, question, (err) => {
        if(err) {
            return console.log(err);
        } else {
            req.flash('success', 'Updated');
            res.redirect(`/questions/${req.params.id}`);
        }
    });
});

// Accept Post Request from the question form
router.post('/ask', (req, res) => {
    req.checkBody('title', 'Title is required').notEmpty();
    req.checkBody('category', 'Category is required').notEmpty();

    // Get Errors
    let errors = req.validationErrors();

    if (errors) {
        res.render('ask_question', {
            title : 'Add Question',
            errors: errors
        });
    } else {
        let question = new Questions({
            title: req.body.title,
            author: req.user.username,
            body: req.body.body || '',
            category: req.body.category            
        });
        question.save((err) => {
            if (err) {
                return console.log(err);
            } else {
                req.flash('success', 'Article Added');
                res.redirect(`/questions/${question._id}`);
            }
        });
    }
});

// Get Single Question
router.get('/:id', (req, res) => {
    Questions.findById(req.params.id, (err, question) => {
        if (err) {
            console.log(err);
        } else {
            Answers.find({parent: req.params.id}, (err, answers) => {
                res.render('question', {
                    question: question,
                    answers: answers
                });
            });
        }
    });
});

module.exports = router;