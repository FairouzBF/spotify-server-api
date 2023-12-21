const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = 4000;

// Log environment variables
console.log('MONGODB_USER:', process.env.MONGODB_USER);
console.log('MONGODB_PASSWORD:', process.env.MONGODB_PASSWORD);
console.log('MONGODB_CLUSTER:', process.env.MONGODB_CLUSTER);
console.log('PORT:', process.env.PORT);

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
/* 
app.use('/covers', express.static('covers'));
app.use('/uploads', express.static('uploads')); */

app.use("/api/v1", apiRouter);

app.listen(PORT, () => {
  console.log(`API listening on PORT ${PORT} `);
});

app.get('/', (req, res) => {
  res.send('Hey this is my API running 🥳');
});

app.get('/about', (req, res) => {
  res.send('This is my about route..... ');
});

// Export the Express API
module.exports = app;
