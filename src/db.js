const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const dbConnectionString = process.env.MONGODB_URI;

mongoose.connect(dbConnectionString, {
  tlsAllowInvalidCertificates: false,  
  tlsAllowInvalidHostnames: false
});

const connection = mongoose.connection;

connection.once('open', () => {
  console.log('MongoDB database connection established successfully');
});

module.exports = mongoose;
