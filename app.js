import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import configRoutes from './routes/index.js';
import { jwtVerifyMiddleware } from './middleware.js';

dotenv.config();
const app = express();
const secret = process.env.SECRET;
if (!secret) {
  console.warn('WARNING: SECRET is not set in environment. Set process.env.SECRET for JWT signing.');
}

app.use('/public', express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(jwtVerifyMiddleware(process.env.SECRET));

app.use((req, res, next) => {
     const date = new Date().toUTCString();
     const method = req.method;
     const path = req.path;
     const user = req.user;
     let status = '(Non-Authenticated)';
     if (user) {
          if (user.role === 'super admin') status = '(Authenticated Super admin)';
          else status = '(Authenticated User)';
  }
  console.log(`[${date}]: ${method} ${path} ${status}`);
  next();
});

app.use('/signout', (req, res, next) => {
  if (!req.user) {
    return res.status(400).json({ error: 'Not signed in' });
  }
  next();
});

configRoutes(app);

app.listen(3000, () => {
  console.log("We've now got a server!");
  console.log('Your routes will be running on http://localhost:3000');
});
