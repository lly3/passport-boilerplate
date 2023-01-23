import {Request, Response, NextFunction} from 'express'
import { PassportStatic } from "passport"
import passportLocal from "passport-local"
import passportFacebook from "passport-facebook"
import crypto from 'crypto'
import { User } from "../main"

const LocalStrategy = passportLocal.Strategy
const FacebookStrategy = passportFacebook.Strategy

const initPassport = (passport: PassportStatic, getUserByEmail: (email: string) => User | undefined, getUserById: (id: string) => User | undefined, addUser: (user: User) => void) => {
  passport.use(new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
    const user = getUserByEmail(email)
    if(user == null) {
      return done(null, false, { message: "No user with that email" })
    }

    if(password == user.password) {
      return done(null, user)
    }
    else {
      return done(null, false, { message: "Password incorrect" })
    }
  }))

  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID as string,
    clientSecret: process.env.FACEBOOK_APP_SECRET as string,
    callbackURL: "/login/facebook",
    profileFields: ['id', 'emails', 'name'],
    passReqToCallback: true
  }, (req, accessToken, refreshToken, profile, done) => {
    const user = getUserByEmail(profile._json.email)
    if(user == null) {
      // register this user
      const newUser: User = {
        id: profile._json.id,
        email: profile._json.email,
        password: crypto.randomBytes(32).toString('hex')
      }
      addUser(newUser)

      return done(null, newUser)
    }
    else {
      return done(null, user)
    }
  }))

  passport.serializeUser((user, done) => done(null, (user as User).id))
  passport.deserializeUser((id, done) => done(null, getUserById(id as string)))
}

export function checkAuthenticated(req: Request, res: Response, next: NextFunction) {
  if(req.isAuthenticated()) {
    return next()
  }

  res.redirect('/login')
}

export default initPassport