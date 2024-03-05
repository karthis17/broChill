const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const AppleStrategy = require('passport-apple').Strategy; // Import Apple OAuth strategy
const session = require('express-session');

const User = require('../models/User'); // Importing User model from models directory

const router = express.Router();


// Set up session
router.use(session({
    secret: 'your-secret-key', resave: true, saveUninitialized: true, cookie: {
        maxAge: 86400000 // 1 day in milliseconds
    }
}));

// Initialize passport
router.use(passport.initialize());
router.use(passport.session());

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: 'your-google-client-id',
    clientSecret: 'your-google-client-secret',
    callbackURL: 'http://localhost:3000/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
            user = new User({
                googleId: profile.id,
                displayName: profile.displayName,
                email: profile.emails[0].value,
                avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null
            });

            await user.save();
        }

        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

// Configure Apple OAuth Strategy
passport.use(new AppleStrategy({
    clientID: 'your-apple-client-id',
    teamID: 'your-apple-team-id',
    callbackURL: 'http://localhost:3000/auth/apple/callback',
    keyID: 'your-apple-key-id',
    privateKeyPath: 'path/to/your/apple/private-key.p8'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ appleId: profile.id });

        if (!user) {
            user = new User({
                appleId: profile.id,
                displayName: profile.displayName,
                email: profile.email,
                avatar: null // Apple OAuth doesn't provide avatar info
            });

            await user.save();
        }

        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

// Serialize user into the session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});



router.get("/login/success", (req, res) => {
    if (req.user) {
        res.status(200).json({
            error: false,
            message: "Successfully Loged In",
            user: req.user,
        });
    } else {
        res.status(403).json({ error: true, message: "Not Authorized" });
    }
});

router.get("/login/failed", (req, res) => {
    res.status(401).json({
        error: true,
        message: "Log in failure",
    });
});
// Routes
router.get('/', (req, res) => {
    res.send('Home page');
});

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email', 'photos'] }));

router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login/failed' }),
    (req, res) => {
        res.redirect('/login/success');
    }
);

router.get('/auth/apple', passport.authenticate('apple'));

router.get('/auth/apple/callback',
    passport.authenticate('apple', { failureRedirect: '/login/failed' }),
    (req, res) => {
        res.redirect('/login/success');
    }
);

// Logout route
router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

// Protected route
router.get('/profile', (req, res) => {
    if (req.isAuthenticated()) {
        res.send(`Hello, ${req.user.displayName}!<br><img src="${req.user.avatar}" alt="Avatar">`);
    } else {
        res.redirect('/');
    }
});

module.exports = router;
