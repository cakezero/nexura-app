import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  noOfQuestions: {
    type: Number,
    default: 0,
  },
  reward: {
    type: Number,
    required: true
  }
}, { timestamps: true });

const lesson = mongoose.model("lessons", lessonSchema);

const lessonCompletedSchema = new mongoose.Schema({
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "lessons",
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true
  },
  status: {
    type: String,
    enum: ["in-progress", "completed"],
    default: "in-progress"
  },
  done: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const lessonCompleted = mongoose.model(
  "lessons-completed",
  lessonCompletedSchema
);


const miniLessonSchema = new mongoose.Schema({
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "lessons",
    required: true
  },
  text: {
    type: String,
    required: true
  }
}, { timestamps: true });

const miniLesson = mongoose.model("mini-lessons", miniLessonSchema);


const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  solution: {
    type: String,
    required: true
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "lessons",
    required: true
  }
}, { timestamps: true });

const question = mongoose.model("questions", questionSchema);

const questionCompletedSchema = new mongoose.Schema({
  answer: {
    type: String,
    required: true
  },
  done: {
    type: Boolean,
    default: false
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "questions",
    required: true
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "lessons",
    required: true
  }, 
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true
  }
}, { timestamps: true });

const questionCompleted = mongoose.model(
  "questions-completed",
  questionCompletedSchema
);

export { question, lesson, lessonCompleted, questionCompleted, miniLesson };

