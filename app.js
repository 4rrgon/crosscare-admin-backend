import express from 'express'
const app = express()
import session from 'express-session'
import configRoutes from './routes/index.js'
import dotenv from 'dotenv';
dotenv.config();

const secret = process.env.SECRET;

app.use('/public', express.static('public'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(
     session({
          name: 'AuthenticationState',
          secret: secret,
          saveUninitialized: false,
          resave: false
     })
)

app.use((req, res, next) => {
     const date = new Date().toUTCString()
     const method = req.method
     const path = req.path
     const authenticated = req.session.user
     let status = '(Non-Authenticated)'
     if (authenticated){
          if (req.session.user.role === 'superuser')
               status = '(Authenticated Super User)'
          else {
               status = '(Authenticated User)'
          }
     }
     console.log(`[${date}]: ${method} ${path} ${status}`)
     next()
})

app.use('/signout', (req, res, next) => {
     if (!req.session.user)
          return res.status(400).json({error: "Not signed in" })
     next()
})


configRoutes(app)

app.listen(3000, () => {
     console.log("We've now got a server!");
     console.log('Your routes will be running on http://localhost:3000');
})
