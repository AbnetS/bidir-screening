const config       = require('./config');
const _          = require('lodash');
const mongoose    = require('mongoose');
const validator  = require('validator');
const co         = require("co");

const Account            = require('./models/account');
const Screening          = require('./models/screening');
const Question           = require('./models/question');
const Form               = require('./models/form');
const Section            = require('./models/section');

const TokenDal           = require('./dal/token');
const ScreeningDal       = require('./dal/screening');
const QuestionDal          = require('./dal/question');
const LogDal             = require('./dal/log');
const NotificationDal    = require('./dal/notification');
const ClientDal          = require('./dal/client');
const TaskDal            = require('./dal/task');
const AccountDal         = require('./dal/account');
const SectionDal         = require('./dal/section');

let PREQS = []

// connect to MongoDB
mongoose.connect(config.MONGODB.URL, config.MONGODB.OPTS);

// Add MongoDB connection error Handler
mongoose.connection.on('error', () => {
  console.log('responding to MongoDB connection error');

  console.error('MongoDB connection error. Please make sure MongoDB is running');

  process.exit(1);
});

(async function(){
  let screening = await Screening.findOne({})
      .sort({ date_created: 1 })
      .exec();
  let client = await ClientDal.get({ _id: screening.client })
  let screeningBody = {};
  let questions = [];
  let sections = [];

      // Create Answer Types
     PREQS = [];
      for(let question of screening.questions) {
        question = await createQuestion(question);

        if(question) {
          questions.push(question._id);
        }
      }

      await createPrerequisites();

      // Create Section Types
      PREQS = [];
      for(let section of screening.sections) {
        section = await Section.findOne({ _id: section }).exec();
        if(!section) continue;
        section = section.toJSON();

        let _questions = [];
        delete section._id;
        if(section.questions.length) {

          for(let question of section.questions) {
            PREQS = [];
            question = await createQuestion(question);
            if(question) {

              _questions.push(question._id);
            }

            
          }

        }

        section.questions = _questions;

        let _section = await SectionDal.create(section);

        sections.push(_section._id);
      }

      await createPrerequisites();

      screeningBody.questions = questions.slice();
      screeningBody.sections = sections.slice();
      screeningBody.client = client._id;
      screeningBody.title = screening.title;
      screeningBody.subtitle = screening.subtitle;
      screeningBody.purpose = screening.purpose;
      screeningBody.layout = screening.layout;
      screeningBody.has_sections = screening.has_sections;
      screeningBody.disclaimer = screening.disclaimer;
      screeningBody.signatures = screening.signatures.slice();
      screeningBody.created_by = client.created_by._id;
      screeningBody.branch = client.branch._id;



  console.log(screeningBody)
})()
  .catch((err)=> console.log(err))

// Utilities
function createQuestion(question) {
  return co(function* () {
    if(question) {
      question = yield Question.findOne({ _id: question }).exec();
      if(!question) return;

      question = question.toJSON();
    }


    let subs = [];
    delete question._id;

    if(question.sub_questions.length) {
      for(let sub of question.sub_questions) {
        delete sub._id;
        let ans = yield createQuestion(sub);

        if(ans) {
          subs.push(ans._id);
        }
      }

      question.sub_questions = subs;
    }

    let prerequisites = question.prerequisites.slice();

    question.prerequisites = [];

    question = yield QuestionDal.create(question);

    PREQS.push({
      _id: question._id,
      question_text: question.question_text,
      prerequisites: prerequisites
    });



    return question;

  })
}


function createPrerequisites() {
  return co(function*() {
    if(PREQS.length) {
      for(let question of PREQS) {
        let preqs = [];
        for(let  prerequisite of question.prerequisites) {
          let preq = yield Question.findOne({ _id: prerequisite.question }).exec();

          let ques = yield findQuestion(preq.question_text);
          if(ques) {
            preqs.push({
              answer: prerequisite.answer,
              question: ques._id
            })
          }
        }

        yield QuestionDal.update({ _id: question._id }, {
          prerequisites: preqs
        })
      }
    } 
  })
}

function findQuestion(text) {
  return co(function* () {
    let found = null;

    if(PREQS.length) {
      for(let question of PREQS) {

        question = yield Question.findOne({ _id: question._id }).exec();

        if(question.question_text == text) {
          found = question;
          break;
        }
      }
    }

    return found;
  })
}