const _ = require('lodash');

let QuestionModel = require('./models/question');
let AnswerModel = require('./models/answer');
let UserModel = require('./models/user');
let CategoryModel = require('./models/category');

const getUser = (query) => {
    return new Promise((resolve, reject) => {
        if(_.isEmpty(query)) {
            UserModel.find({}, (err, users) => {
                if (users) {
                    resolve(users);
                } else {
                    reject('No User found')
                }
            });   
        } else {
            UserModel.findOne(query, (err, user) => {
                if (user) {
                    resolve(user);
                } else {
                    reject('No User found')
                }
            });        
        }    
    });    
}

const getQuestion = (query) => {
    return new Promise((resolve, reject) => {
        if(_.isEmpty(query)) {
            QuestionModel.find({}, (err, questions) => {
                if (questions) {
                    resolve(questions);
                } else {
                    reject('No Questions found')
                }
            });   
        } else {
            QuestionModel.findOne(query, (err, questions) => {
                if (questions) {
                    resolve(questions);
                } else {
                    reject('No Questions found')
                }
            });        
        }
    });    
}

const getTags = (query) => {
    return new Promise((resolve, reject) => {
        if(_.isEmpty(query)) {
            CategoryModel.find({}, (err, tags) => {
                if (tags) {
                    resolve(tags);
                } else {
                    reject('No Subject found')
                }
            });   
        } else {
            QuestionModel.findOne(query, (err, tag) => {
                if (tag) {
                    resolve(tag);
                } else {
                    reject('No Subject found')
                }
            });        
        }
    });    
}

const getAll = (data, error) => {
    // info = [questions, users, tags]
    let info = []
    return new Promise( (resolve, reject) => {
        getQuestion({}).then((questions) => {
            info.push(questions);
            return getUser({});
        }).then((users) => {
            info.push(users);
            return getTags({});
        }).then((tags) => {
            info.push(tags);
            resolve(info);
        }).catch((errMsg) => {
            reject(errMsg);
        });        
    });
};

module.exports = {
    getUser,
    getQuestion,
    getAll
}