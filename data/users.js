import { checkName, checkPassword, checkRole, checkEmail, getSignupDate, getLastLogin } from "../helpers.js";
import { users } from "../config/mongoCollections.js";
import bcrypt from "bcrypt"

export const register = async (
  companyName,
  email,
  password,
  role,
) => {
  if (!companyName || !email || !password || !role)
    throw "All fields need to have valid values"

  companyName = checkName(companyName);
  if (!checkEmail(email))
    throw 'Email is invalid'

  email = email.trim().toLowerCase();

  const userCollection = await users()
  const duplicateUser = await userCollection.findOne({email: email})

  if (duplicateUser)
    throw `User with id of ${email} already exists`

  password = checkPassword(password)
  let hashedPassword = await bcrypt.hash(password, 16)

  role = checkRole(role)

  let newUser = {
    companyName: companyName,
    email: email,
    password: hashedPassword,
    role: role,
    signupDate: getSignupDate(),
    lastLogin: null
  }

  const insertInfo = await userCollection.insertOne(newUser)
  if (!insertInfo.acknowledged || !insertInfo.insertedId)
    throw `Could not add user with ID of ${email}`
  
  return {registrationCompleted: true}
};

export const login = async (email, password) => {
  if (!email || !password)
    throw "All fields need to have valid values"
  if (!checkEmail(email))
    throw 'Email is invalid'
  email = email.trim().toLowerCase();
  password = checkPassword(password)

  const userCollection = await users()
  const user = await userCollection.findOne({email: email})

  if (!user)
    throw "Either the userId or password is invalid"

  const matchedPassword = await bcrypt.compare(password, user.password)
  if (matchedPassword){
     const returnedObj = {
      companyName: user.companyName,
      email: user.email,
      role: user.role,
      signupDate: user.signupDate,
      lastLogin: getLastLogin()
     }
     return returnedObj
  } else {
    throw "Either the userId or password is invalid"
  }

};
