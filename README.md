# crosscare-admin-backend
Crosscare Admin Backend

# Running the backend

Create a postgres DB with the table "adminportal", and populate it with the necesarry fields by running the following on your postgres instance:

CREATE TABLE public.adminportal ( companyname text NULL, email text NULL, "password" text NULL, "role" text NULL, signupdate text NULL, lastlogin text NULL );

Create a .env file containing a secret and url for your postgres instance as follows, as well as your smtp email and password (I recommend using gmail), the current host, and the initial admin portal username and password:

SECRET=someSecret

URL=dbUrl

SMTPEMAIL=email@example.com

SMTPPASSWORD=password

HOST=localhost:3000

ADMINEMAIL=admin@example.com

ADMINPASSWORD=password

# Endpoints

POST /invite

companyName

email

role (Must be super admin, tenant admin, or support)

POST /register/:id

password

confirmPassword

POST /login

email

password

GET /signout

POST /reset (Send password reset email)

email

POST /reset/:id (Resets password using token generated in the email)

password

confirmPassword


GET /metrics/patients (Returns a array of all patients)

GET /metrics/numberofpatients

GET /metrics/patient/:id (Returns info for a specific patient)
