# crosscare-admin-backend
Crosscare Admin Backend

# Running the backend

Create a postgres DB with the table "adminportal", and populate it with the necesarry fields by running the following on your postgres instance:

CREATE TABLE public.adminportal ( companyname text NULL, email text NULL, "password" text NULL, "role" text NULL, signupdate text NULL, lastlogin text NULL );

Create a .env file containing a secret and url for your postgres instance as follows, and the initial admin portal username and password:

SECRET=someSecret

URL=dbUrl

HOST=localhost:3000

ADMINEMAIL=admin@example.com

ADMINPASSWORD=password

# Endpoints

POST /login

email

password

GET /signout

GET /metrics/patients?pageNum=1&pageSize=10 (Returns an array of patients)

GET /metrics/numberofpatients

GET /metrics/patient/:id (Returns info for a specific patient)

GET /metrics/doctors?pageNum=1&pageSize=10 (Returns an array of doctors)

GET /metrics/numberofdoctors (Returns the number of doctors on the platform)

GET /metrics/doctor/:id (Returns info about a specific doctor)

GET /metrics/doctor/:id/patients (Returns the patients for a specific doctor)

GET /metrics/:id/numpatients (Returns the number of patients a doctor has)

(Note that the following endpoints are going to return nothing since the db for them is empty)

GET /metrics/bloodpressure (Returns all blood pressure readings in the database for everyone)

GET /metrics/bloodpressurehistory/:id (Returns all blood pressure readings for a specific person)

GET /metrics/avgbloodpressure (Returns the average blood pressure of everyone on the app)

GET /metrics/glucoselevel (Returns all glucose readings in the app)

GET /metrics/avgglucoselevel (Returns the average glucose levelof everyone on the app)

GET /metrics/getglucoselevelhistory/:id

GET /metrics/avgSessionTime (Returns average session time of everyone on the app)

GET /metrics/getAllSessionTimes (Return all session metrics from the DB)

GET /metrics/getSessionTimesSince/:date (Returns all session times since a given date, time is encoded as follows: 2026-03-24%2018:24:25.126)

GET /metrics/getSessionTimesBetween/:startDate/:endDate (Returns all session metrics between the given dates)

GET /getSessionTimeOnDate/:date (Returns average session time on a given day)



# Removed Endpoints

POST /invite

companyName

email

role (Must be super admin, tenant admin, or support)

POST /register/:id

password

confirmPassword

POST /reset (Send password reset email)

email

POST /reset/:id (Resets password using token generated in the email)

password

confirmPassword

