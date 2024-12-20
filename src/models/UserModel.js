const mongoose = require('../db');
const bcrypt = require('bcrypt');
const { secretKey } = require('../config/config');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetPasswordToken: {
    type: String,
    required: false,
  },

  roles: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    required: true,
  },

  labels: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Label',
      required: false,
    },
  ],

  todos: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Todo',
      required: false,
    },
  ],

  tokens: [
    {
      token: {
        type: String,
      },
      refreshToken: {
        type: String,
      },
    },
  ],
});

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    const hash = await bcrypt.hash(user.password, 10);
    user.password = hash;
  }
  next();
});

userSchema.statics.findByCredentials = async function (email, password) {
  try {
    const user = await this.findOne({ email });
    if (!user) {
      throw new Error('UserNotFound!');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new Error('PasswordIsWrong!');
    }

    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, secretKey, {
    expiresIn: '15m',
  });

  user.tokens = [{ token }];

  await user.save();
  return token;
};

userSchema.methods.generateRefreshToken = async function () {
  const user = this;
  const refreshToken = jwt.sign({ _id: user._id.toString() }, secretKey, {
    expiresIn: '30d',
  });

  user.tokens.push({ refreshToken });

  await user.save();
  return refreshToken;
};

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;
