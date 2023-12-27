const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

const port = process.env.PORT || 3000;
dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD,
);

// new syntax:
mongoose.connect(DB, { useUnifiedTopology: true }).then((conn) => {
  console.log('DB connected successfully');
});

app.listen(port, () => {
  console.log(`The server is running at http//localhost:${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLER REJECTION Shutting down .....');
  ServerApiVersion.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION Shutting down .....');
  ServerApiVersion.close(() => {
    process.exit(1);
  });
});


// it is used to close the server politely
process.on('SIGTERM',()=>{
  ServerApiVersion.close(()=>{
    console.log("Process teriminated")
  })
})