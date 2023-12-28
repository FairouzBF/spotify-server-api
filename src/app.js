const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const apiRouter = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();
const PORT = 4000;

// Log environment variables
console.log('MONGODB_USER:', process.env.MONGODB_USER);
console.log('MONGODB_PASSWORD:', process.env.MONGODB_PASSWORD);
console.log('MONGODB_CLUSTER:', process.env.MONGODB_CLUSTER);
console.log('PORT:', process.env.PORT);
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);

mongoose.set('strictQuery', false);
mongoose
  .connect(
    `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}${process.env.MONGODB_CLUSTER}.mongodb.net/?retryWrites=true&w=majority`,
    {
      serverSelectionTimeoutMS: 50000,
      connectTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
    },
  )
  .then(() => {
    console.log(`Successfully connect to database`);
  })
  .catch(err => console.log(err));



// Use CORS middleware
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
  optionsSuccessStatus: 204,
};
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// Other middleware and routes
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(errorHandler);

app.use('/api/v1', apiRouter);

app.use('/covers', express.static('covers'));
app.use('/uploads', express.static('uploads'));

app.listen(PORT, () => {
  console.log(`API listening on PORT ${PORT} `);
});

app.get('/', (req, res) => {
  res.send('Hey this is my API running 🥳');
});

// Export the Express API
module.exports = app;
