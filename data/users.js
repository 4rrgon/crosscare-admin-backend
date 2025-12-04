import pool from "../config/postgres.js";
import { checkName, checkPassword, checkRole, checkEmail, getSignupDate, getLastLogin } from "../helpers.js";
import nodemailer from 'nodemailer';
import bcrypt from "bcrypt";
import { randomBytes } from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const smtpEmail = process.env.SMTPEMAIL
const smtpPassword = process.env.SMTPPASSWORD
const host = process.env.HOST
const adminEmail = process.env.ADMINEMAIL
const adminPassword = process.env.ADMINPASSWORD


const sendEmail = async (recipient, companyName, invite) => {
  const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: smtpEmail,
          pass: smtpPassword
      }
  });
  const mailOptions = {
      from: smtpEmail,
      to: recipient,
      subject: 'CrossCare Registration',
      html: `${companyName}, click <a href="http://${host}/register/${invite}" target="_blank">this link</a> to complete registration for the Crosscare Tech Admin Portal. This link is valid for seven days. <br> <br> <img src="https://img1.wsimg.com/isteam/ip/2b1875ec-3fdc-443f-afbe-539cc67fb38e/blob-4cb1f5b.png/:/rs=w:200,h:200,cg:true,m/cr=w:200,h:200/qt=q:95" alt="CrossCare Tech Logo - A purple and blue heart with the words CrossCare Tech underneath">`,
  };
  
  try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent: ' + info.response);
  } catch (error) {
      console.error('Error: ' + error);
  }


}


const hasDatePassed = async (sqlDate) => {
  const datePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  if (!datePattern.test(sqlDate)) {
    throw new Error("Invalid date format. Expected 'YYYY-MM-DD HH:MM:SS'");
  }

  const parsed = new Date(sqlDate.replace(" ", "T") + 'Z');
  if (isNaN(parsed.getTime())) {
    throw new Error("Invalid date.");
  }

  const now = new Date();
  return parsed < now;
};


const getCurrentDate = async () => {
  const date = new Date();
  date.setDate(date.getDate());

  const pad = (n) => n.toString().padStart(2, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}


const getExpirationDate = async () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);

  const pad = (n) => n.toString().padStart(2, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export const invite = async (companyName, email, role) => {
  if(!companyName || !email || !role)
    throw 'Must provide companyName, email, and role'

  companyName = checkName(companyName)
  role = checkRole(role);

  if(!checkEmail(email))
    throw 'Email is invalid'
  
  email = email.trim().toLowerCase();

  const generateRandomString = (length) => {
    return randomBytes(length).toString('hex').slice(0, length);
  };

  const inviteCode = generateRandomString(64);

  const expirationDate = await getExpirationDate();

  const client = await pool.connect();
  try{
    const dupCheck = await client.query(
      `SELECT email, "password" FROM adminportal WHERE email = $1`,
      [email]
    );
    console.log(dupCheck)
    if (dupCheck.rowCount > 0 && typeof dupCheck.rows[0].password != 'undefined') {
        throw `User with id of ${email} already exists`;
    }
    
    const signupDate = getSignupDate();
    const lastLogin = null;
    const password = null;

    const insertQuery = `
      INSERT INTO adminportal (companyname, email, "password", "role", signupdate, lastlogin, invite, expirationDate)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING email
    `;
    const insertValues = [companyName, email, password, role, signupDate, lastLogin, inviteCode, expirationDate];

    const insertInfo = await client.query(insertQuery, insertValues);

    if (!insertInfo.rowCount || !insertInfo.rows[0])
      throw `Could not add user with ID of ${email}`;

    await sendEmail(email, companyName, inviteCode);

    return { registrationCompleted: true };

  } finally{
    client.release();
  }

}

export const acceptInvite = async (id, password) => {
  if(!id || !password){
    throw 'Must provide id and password'
  }
  password = checkPassword(password);


  const client = await pool.connect();
  try {
    const dupCheck = await client.query(
      `SELECT invite FROM adminportal WHERE invite = $1`,
      [id]
    );

    if (dupCheck.rowCount == 0)
      throw `Invite code not found`;

    const timeCheck = await client.query(
      `SELECT expirationDate FROM adminportal WHERE invite = $1`,
      [id]
    );

    console.log(timeCheck.rows[0].expirationdate)
    console.log(typeof(timeCheck.rows[0].expirationdate))
    const isExpired = await hasDatePassed(timeCheck.rows[0].expirationdate)
    console.log(isExpired)

    if(isExpired){
      throw 'Invite has expired'
    }


    password = checkPassword(password);
    const hashedPassword = await bcrypt.hash(password, 16);


    const insertQuery = `
      UPDATE adminportal
      SET password = $1,
        invite = NULL,
        expirationDate = NULL
      WHERE invite = $2
    `;
    const insertValues = [hashedPassword, id];

    const insertInfo = await client.query(insertQuery, insertValues);

    return { registrationCompleted: true };
  } finally {
    client.release();
  }
}


export const register = async (
  companyName,
  email,
  password,
  role,
) => {
  if (!companyName || !email || !password || !role)
    throw "All fields need to have valid values";

  companyName = checkName(companyName);
  if (!checkEmail(email))
    throw 'Email is invalid';

  email = email.trim().toLowerCase();

  const client = await pool.connect();
  try {
    const dupCheck = await client.query(
      `SELECT email FROM adminportal WHERE email = $1`,
      [email]
    );

    if (dupCheck.rowCount > 0)
      throw `User with id of ${email} already exists`;

    password = checkPassword(password);
    const hashedPassword = await bcrypt.hash(password, 16);

    role = checkRole(role);

    const signupDate = getSignupDate();
    const lastLogin = null;

    const insertQuery = `
      INSERT INTO adminportal (companyname, email, "password", "role", signupdate, lastlogin)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING email
    `;
    const insertValues = [companyName, email, hashedPassword, role, signupDate, lastLogin];

    const insertInfo = await client.query(insertQuery, insertValues);

    if (!insertInfo.rowCount || !insertInfo.rows[0])
      throw `Could not add user with ID of ${email}`;

    return { registrationCompleted: true };
  } finally {
    client.release();
  }
};

export const login = async (email, password) => {
  if(email == adminEmail && password == adminPassword){
      const returnedObj = {
        companyName: "Admin",
        email: adminEmail,
        role: "super admin",
        signupDate: null,
        lastLogin: getLastLogin()
      };
    return returnedObj
  }

  if (!email || !password)
    throw "All fields need to have valid values";
  if (!checkEmail(email))
    throw 'Email is invalid';
  email = email.trim().toLowerCase();
  password = checkPassword(password);

  const client = await pool.connect();
  try {
    const selectQuery = `
      SELECT companyname, email, "password", "role", signupdate, lastlogin
      FROM adminportal
      WHERE email = $1
      LIMIT 1
    `;
    const result = await client.query(selectQuery, [email]);

    if (!result.rowCount)
      throw "Either the userId or password is invalid";

    const user = result.rows[0];

    const matchedPassword = await bcrypt.compare(password, user.password);
    if (matchedPassword) {
      const returnedObj = {
        companyName: user.companyname,
        email: user.email,
        role: user.role,
        signupDate: user.signupdate,
        lastLogin: getLastLogin()
      };
      return returnedObj;
    } else {
      throw "Either the userId or password is invalid";
    }
  } finally {
    client.release();
  }
};
