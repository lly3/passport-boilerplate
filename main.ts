import express from 'express'
import passport from 'passport'
import flash from 'express-flash'
import session from 'express-session'
import dotenv from 'dotenv'
import initPassport, { checkAuthenticated } from './config/passport'

if(process.env.NODE_ENV !== 'production') {
  dotenv.config()
}

const app = express()

export type User = {
  id: string
  email: string
  password: string
}

// mock user database
let users: User[] = [
  {
    id: "0",
    email: "test@test.com",
    password: "testtest"
  },
]

app.use(express.json())
initPassport(
  passport, 
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id),
  user => users.push(user)
)
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET as string,
  resave: false,
  saveUninitialized: false,
  // add storage
}))
app.use(passport.initialize())
app.use(passport.session())

app.get('/login', async (req, res) => {
  res.send('Pretent this is login page!')
})

app.post('/login', passport.authenticate('local', {
  successRedirect: '/auth',
  failureRedirect: '/login',
  failureFlash: true
}))

app.get('/login/facebook', passport.authenticate('facebook', {
  scope: ['email'],
  successRedirect: '/auth',
  failureRedirect: '/login',
  failureFlash: true
}))

app.get('/logout', (req, res, next) => {
  req.logout(err => {
    if(err) {
      return next(err)
    }

    res.redirect('/login')
  })
})

app.get('/register', (req, res) => {
  res.send('Pretent this is register page!')
})

app.get('/', (req, res) => {
  console.log(users)
  res.send('Welcome to my website!');
});

app.get('/auth', checkAuthenticated, (req, res) => {
  const user = req.user as User
  res.send(`Welcome back: ${user.email}`)
})

app.listen(3000, () => console.log('Server is running at port 3000'))