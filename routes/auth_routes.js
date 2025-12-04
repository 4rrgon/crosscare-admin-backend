import { Router } from "express";
import bcrypt from "bcrypt"
import session from "express-session";
import { checkName, checkPassword, checkRole, checkEmail } from "../helpers.js";
import { acceptInvite, login, register, invite } from "../data/users.js";

const router = Router()



router
  .route('/login')
  .post(async (req, res) => {
    try{
      let email = req.body.email;
      let password = req.body.password;

      let missing = []
      if (!email)
        missing.push("email")
      if (!password)
        missing.push("password")

      if (missing.length > 0){
        return res.status(400).render('register', {
          error: `The missing fields are: ${missing.join(", ")}`
        })
      }

      const user = await login(email, password)
        
      req.session.user = {
        companyName: user.companyName,
        email: user.email,
        role: user.role
      }

      console.log(req.session);

      return res.json( user )
      
    } catch (e) {
      return res.status(400).render('login', { error: e })
    }
  });

router
  .route('/register')
  .post(async (req, res) => {
    try {
      let companyName = req.body.companyName;
      let email = req.body.email;
      let password = req.body.password;
      let confirmPassword = req.body.confirmPassword;
      let role = req.body.role;

      let missing = []
      if (!companyName)
        missing.push("companyName")
      if (!email)
        missing.push("email")
      if (!password)
        missing.push("password")
      if (!confirmPassword)
        missing.push("confirmPassword")
      if (!role)
        missing.push("role")

      if (missing.length > 0){
        return res.status(400).render('register', {
          error: `The missing fields are: ${missing.join(", ")}`
        })
      }

      companyName = checkName(companyName)
      password = checkPassword(password)
      confirmPassword = checkPassword(confirmPassword)

      if (password !== confirmPassword){
        return res.status(400).json({ error: "The passwords do not match" });
      }

      role = checkRole(role)

      const registered = await register(companyName, email, password, role)
      if (registered.registrationCompleted){
        return res.status(200).json( { message: "Successfully signed up" } );
      } else {
        return res.status(500).json({ error: "Internal Server Error" });
      }
    } catch (e) {
      console.log(e)
      return res.status(400).json({ error: e }) 
    }
     
  });

  router
  .route('/register/:id')
  .post(async (req, res) => {
    try {
      let password = req.body.password;
      let confirmPassword = req.body.confirmPassword;

      let missing = []
      if (!password)
        missing.push("password")
      if (!confirmPassword)
        missing.push("confirmPassword")


      if (missing.length > 0){
        return res.status(400).json({error: 'Must provide all fields'})
      }

      password = checkPassword(password)
      confirmPassword = checkPassword(confirmPassword)

      if (password !== confirmPassword){
        return res.status(400).json({ error: "The passwords do not match" });
      }

      const registered = await acceptInvite(req.params.id, password)
      if (registered.registrationCompleted){
        return res.status(200).json( { message: "Successfully signed up" } );
      } else {
        return res.status(500).json({ error: "Internal Server Error" });
      }
    } catch (e) {
      console.log(e)
      return res.status(400).json({ error: e }) 
    }
     
  });


router.route('/invite').post(async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "super admin") {
      return res.status(403).json({ error: "Must be logged in as a super admin" });
    }

    let companyName = checkName(req.body.companyName);
    let email = req.body.email;
    let role = checkRole(req.body.role);

    const registered = await invite(companyName, email, role);

    if (registered.registrationCompleted) {
      return res.status(200).json({ message: "Successfully sent invite" });
    }

    return res.status(500).json({ error: "Internal Server Error" });

  } catch (e) {
    console.log(e);
    return res.status(400).json({ error: e });
  }
});





router.route('/signout').get(async (req, res) => {
  try {
    req.session.destroy()
    res.status(200).json("Successfully signed out")
  } catch (e) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }
});

export default router