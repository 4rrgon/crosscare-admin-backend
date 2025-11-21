# crosscare-admin-backend
Crosscare Admin Backend

# Running the backend

Create a postgres DB with the table "adminportal", and populate it with the necesarry fields by running the following on your postgres instance:

CREATE TABLE public.adminportal ( companyname text NULL, email text NULL, "password" text NULL, "role" text NULL, signupdate text NULL, lastlogin text NULL );

Create a .env file containing a secret and url for your postgres instance as follows:

SECRET=someSecretString

URL=postgres://username:password@host:port/database

Run npm i to install dependecies

Run npm start to run the server on localhost:3000

# Endpoints

POST /register (This is temporary and will be removed in the future)

companyName

email

password

confirmPassword

role (Must be super admin, tenant admin, or support)

POST /login

email

password

GET /signout
