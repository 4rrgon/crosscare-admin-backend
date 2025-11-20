import pool from "../config/postgres.js";
import { checkName, checkPassword, checkRole, checkEmail, getSignupDate, getLastLogin } from "../helpers.js";
import bcrypt from "bcrypt";

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
