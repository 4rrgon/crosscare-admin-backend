import { Pool } from "pg";
import dotenv from 'dotenv';
dotenv.config();

const pgUrl = process.env.URL;



const pool = new Pool({
  connectionString: pgUrl,
  ssl: {
    rejectUnauthorized: false
  }

});

export default pool;
