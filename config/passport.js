const userdb = require("../model/User");
const OAuth2Strategy = require("passport-google-oauth2").Strategy;
const baseURL =
  process.env.NODE_ENV === "production"
    ? process.env.BACKENDBASEURL
    : "http://localhost:4000";
const passportConfig = (passport) => {
  passport.use(
    new OAuth2Strategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${baseURL}/auth/google/callback`,
        // scope: ["profile", "email"],
        passReqToCallback: true,
      },
      async (request, accessToken, refreshToken, profile, done) => {
        console.log(profile, "profile");
        try {
          let user = await userdb.findOne({ googleId: profile.id });

          if (!user) {
            user = new userdb({
              googleId: profile.id,
              displayName: profile.displayName,
              email: profile.emails[0].value,
              image: profile.photos[0].value,
            });

            await user.save();
          }

          return done(null, user);
        } catch (error) {
          console.error("Error processing Google OAuth callback:", error);
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });
};

module.exports = passportConfig;
