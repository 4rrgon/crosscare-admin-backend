import pool from "../config/postgres.js";
import dotenv from 'dotenv';

dotenv.config();


export function hasDatePassed(dateString) {
  if (typeof dateString !== 'string') {
    throw new Error("Invalid date format. Please use 'YYYY-MM-DD HH:mm:ss.SSS'.");
  }

  const isoLike = dateString.trim().replace(' ', 'T');

  const dateToCheck = new Date(isoLike);

  if (Number.isNaN(dateToCheck.getTime())) {
    throw new Error("Invalid date format. Please use 'YYYY-MM-DD HH:mm:ss.SSS'.");
  }

  const currentDate = new Date();
  return dateToCheck < currentDate;
}

export const getAverageMealsPerDay = async (patientActivityId) => {
    const client = await pool.connect();

    try {
        const res = await client.query(`
            SELECT COALESCE(AVG(meals_per_day), 0) AS avg_meals_per_day
            FROM (
                SELECT DATE("createdAt") AS meal_day, COUNT(id) AS meals_per_day
                FROM "meal"
                WHERE "patientActivityId" = $1
                GROUP BY DATE("createdAt")
            ) daily_counts
        `, [patientActivityId]);

        return parseFloat(res.rows[0].avg_meals_per_day);
    } catch (err) {
        console.error(err);
        throw new Error("Failed to calculate average meals per day");
    } finally {
        client.release();
    }
};



export const getPatients = async (pageSize = 10, pageNum = 1) => {
  const client = await pool.connect();

  try {
    const offset = (pageNum - 1) * pageSize;

    const res = await client.query(
      `
      SELECT
        p.id,
        p.email,
        p.name,
        p.created_at,
        p.updated_at,
        p.phone_number,
        p.age,
        p.profile_image,
        p.avatar_url,
        p.week,
        p.day,
        p."doctorId",
        p."waterGoal",
        p."calorieGoal",
        p."stepsGoal",
        p."isEmailVerified",

        pa.id AS "patientActivityId",
        pa.weight AS "weight",
        pa.weight_unit AS "weight_unit",
        pa.water AS "water",
        pa."caloriesConsumed" AS "caloriesConsumed",
        pa."bloodPressureDiastolic" AS "bloodPressureDiastolic",
        pa."bloodPressureSystolic" AS "bloodPressureSystolic",
        pa."glucoseLevel" AS "glucoseLevel",
        pa."glucoseUnit" AS "glucoseUnit",
        pa."moodLevel" AS "moodLevel",

        COALESCE(ap.count, 0) AS "appointmentCount"
      FROM "Patient" p
      LEFT JOIN LATERAL (
        SELECT
          id,
          weight,
          weight_unit,
          water,
          "caloriesConsumed",
          "bloodPressureDiastolic",
          "bloodPressureSystolic",
          "glucoseLevel",
          "glucoseUnit",
          "moodLevel"
        FROM "PatientActivity"
        WHERE user_id = p.id
        ORDER BY created_at DESC
        LIMIT 1
      ) pa ON true
      LEFT JOIN (
        SELECT "patientId", COUNT(*) AS count
        FROM "Appointment"
        GROUP BY "patientId"
      ) ap ON ap."patientId" = p.id
      ORDER BY p."created_at" DESC
      LIMIT $1 OFFSET $2
      `,
      [pageSize, offset]
    );

    const futureRes = await client.query(
      `
      SELECT "patientId", COUNT(*) AS count
      FROM "Appointment"
      WHERE "appointmentDate" > NOW()
      GROUP BY "patientId"
      `
    );

    const futureCountMap = new Map();
    for (const r of futureRes.rows) {
      const pid = r.patientId ?? r.patientid ?? r.patient_id;
      const cnt = r.count ?? r.count;
      if (pid != null) {
        futureCountMap.set(String(pid), Number(cnt) || 0);
      }
    }

    const patients = await Promise.all(
      res.rows.map(async (row) => {
        const totalAppointments =
          Number(row.appointmentCount ?? row.appointmentcount ?? 0) || 0;

        const futureAppointments =
          futureCountMap.get(String(row.id)) ?? 0;

        let averageMealsPerDay = null;

        try {
          if (row.patientActivityId) {
            averageMealsPerDay = await getAverageMealsPerDay(
              row.patientActivityId
            );
          }
        } catch (err) {
          console.error(
            `Error fetching average meals per day for patient ${row.id}:`,
            err
          );
        }

        return {
          id: row.id,
          email: row.email,
          name: row.name,
          created_at: row.created_at,
          updated_at: row.updated_at,
          phone_number: row.phone_number,
          age: row.age,
          profile_image: row.profile_image,
          avatar_url: row.avatar_url,
          week: row.week,
          day: row.day,
          doctorId: row.doctorId,
          waterGoal: row.waterGoal,
          calorieGoal: row.calorieGoal,
          stepsGoal: row.stepsGoal,
          isEmailVerified: row.isEmailVerified,

          weight: row.weight ?? null,
          weight_unit: row.weight_unit ?? null,
          water: row.water ?? null,
          caloriesConsumed: row.caloriesConsumed ?? null,
          bloodPressureDiastolic: row.bloodPressureDiastolic ?? null,
          bloodPressureSystolic: row.bloodPressureSystolic ?? null,
          glucoseLevel: row.glucoseLevel ?? null,
          glucoseUnit: row.glucoseUnit ?? null,
          moodLevel: row.moodLevel ?? null,

          totalAppointments,
          futureAppointments,
          averageMealsPerDay
        };
      })
    );

    return patients;
  } catch (err) {
    console.error("getPatients error:", err);
    throw err;
  } finally {
    client.release();
  }
};

export const getNumberOfPatients = async () => {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT COUNT(*) FROM "Patient"');
        return { numberOfPatients: parseInt(res.rows[0].count, 10) };
    } finally {
        client.release();
    }
}

export const getPatient = async (id) => {
  if (!id) throw new Error('id is required');

  const client = await pool.connect();
  try {
    const res = await client.query(
      `
      SELECT
        p.id,
        p.email,
        p.name,
        p.created_at,
        p.updated_at,
        p.phone_number,
        p.age,
        p.profile_image,
        p.avatar_url,
        p.week,
        p.day,
        p."doctorId",
        p."waterGoal",
        p."calorieGoal",
        p."stepsGoal",
        p."isEmailVerified",

        pa.id AS "patientActivityId",
        pa.weight AS "weight",
        pa.weight_unit AS "weight_unit",
        pa.water AS "water",
        pa."caloriesConsumed" AS "caloriesConsumed",
        pa."bloodPressureDiastolic" AS "bloodPressureDiastolic",
        pa."bloodPressureSystolic" AS "bloodPressureSystolic",
        pa."glucoseLevel" AS "glucoseLevel",
        pa."glucoseUnit" AS "glucoseUnit",
        pa."moodLevel" AS "moodLevel",

        COALESCE(
          (SELECT COUNT(*) FROM "Appointment" WHERE "patientId" = p.id),
          0
        ) AS "appointmentCount"
      FROM "Patient" p
      LEFT JOIN LATERAL (
        SELECT
          id,
          weight,
          weight_unit,
          water,
          "caloriesConsumed",
          "bloodPressureDiastolic",
          "bloodPressureSystolic",
          "glucoseLevel",
          "glucoseUnit",
          "moodLevel"
        FROM "PatientActivity"
        WHERE user_id = p.id
        ORDER BY created_at DESC
        LIMIT 1
      ) pa ON true
      WHERE p.id = $1
      LIMIT 1
      `,
      [id]
    );

    if (!res.rows || res.rows.length === 0) {
      throw 'Patient not found';
    }

    const row = res.rows[0];

    const futureRes = await client.query(
      `
      SELECT COUNT(*) AS count
      FROM "Appointment"
      WHERE "appointmentDate" > NOW() AND "patientId" = $1
      `,
      [id]
    );

    const futureAppointments = Number(futureRes.rows[0]?.count ?? 0);
    const totalAppointments = Number(row.appointmentCount ?? 0);

    let averageMealsPerDay = null;
    try {
      if (row.patientActivityId != null) {
        averageMealsPerDay = await getAverageMealsPerDay(row.patientActivityId);
      } else {
        averageMealsPerDay = null;
      }
    } catch (err) {
      console.error(`Error fetching average meals per day for patient ${id}:`, err);
      averageMealsPerDay = null;
    }

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      created_at: row.created_at,
      updated_at: row.updated_at,
      phone_number: row.phone_number,
      age: row.age,
      profile_image: row.profile_image,
      avatar_url: row.avatar_url,
      week: row.week,
      day: row.day,
      doctorId: row.doctorId,
      waterGoal: row.waterGoal,
      calorieGoal: row.calorieGoal,
      stepsGoal: row.stepsGoal,
      isEmailVerified: row.isEmailVerified,

      weight: row.weight ?? null,
      weight_unit: row.weight_unit ?? null,
      water: row.water ?? null,
      caloriesConsumed: row.caloriesConsumed ?? null,
      bloodPressureDiastolic: row.bloodPressureDiastolic ?? null,
      bloodPressureSystolic: row.bloodPressureSystolic ?? null,
      glucoseLevel: row.glucoseLevel ?? null,
      glucoseUnit: row.glucoseUnit ?? null,
      moodLevel: row.moodLevel ?? null,

      totalAppointments,
      futureAppointments,
      averageMealsPerDay
    };
  } catch (err) {
    console.error('getPatient error:', err);
    throw err;
  } finally {
    client.release();
  }
};


export const getDoctors = async (pageSize, pageNum) => {
    const client = await pool.connect();
    try {
        let arr = []
        const res = await client.query('SELECT * FROM "Doctor" ORDER BY "created_at" DESC LIMIT $1 OFFSET $2', [pageSize || 10, (pageNum - 1) * pageSize || 0]);
        for(let i = 0; i < res.rows.length; i++){
            let object = {
                id: res.rows[i].id,
                email: res.rows[i].email,
                name: res.rows[i].name,
                created_at: res.rows[i].created_at,
                updated_at: res.rows[i].updated_at
            }
            arr.push(object)
        }

        return arr;
    } finally {
        client.release();
    }
}

export const getNumberOfDoctors = async () => {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT COUNT(*) FROM "Doctor"');
        return { numberOfDoctors: parseInt(res.rows[0].count, 10) };
    } finally {
        client.release();
    }
}

export const getDoctor = async (id) => {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT * FROM "Doctor" WHERE id = $1', [id]);
        if (res.rows.length === 0) {
            throw 'Doctor not found';
        }

        let object = {
            id: res.rows[0].id,
            email: res.rows[0].email,
            name: res.rows[0].name,
            created_at: res.rows[0].created_at,
            updated_at: res.rows[0].updated_at
        }
        
        return object;
    } finally {
        client.release();
    }
}

export const getNumberOfPatientsPerDoctor = async (id) => {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT COUNT(*) FROM "Patient" WHERE "doctorId" = $1', [id]);
        return { numberOfPatients: parseInt(res.rows[0].count, 10) };
    }
        finally {
        client.release();
    }
}

export const getPatientsPerDoctor = async (id, pageSize, pageNum) => {
    const client = await pool.connect();
    try {
        let arr = []
        const res = await client.query('SELECT * FROM "Patient" WHERE "doctorId" = $1 ORDER BY "created_at" DESC LIMIT $2 OFFSET $3', [id, pageSize || 10, ((pageNum - 1) * pageSize) || 0]);
        for(let i = 0; i < res.rows.length; i++){
            let object = {
                id: res.rows[i].id,
                email: res.rows[i].email,
                name: res.rows[i].name,
                created_at: res.rows[i].created_at,
                updated_at: res.rows[i].updated_at,
                phone_number: res.rows[i].phone_number,
                age: res.rows[i].age,
                profile_image: res.rows[i].profile_image,
                avatar_url: res.rows[i].avatar_url,
                week: res.rows[i].week,
                day: res.rows[i].day,
                doctorId: res.rows[i].doctorId,
                waterGoal: res.rows[i].waterGoal,
                calorieGoal: res.rows[i].calorieGoal,
                stepsGoal: res.rows[i].stepsGoal,
                isEmailVerified: res.rows[i].isEmailVerified

            }
            arr.push(object)
        }

        return arr;
    } finally {
        client.release();
    }
}



export const getBloodPressureHistory = async (id) => {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT "bloodPressureDiastolic", "bloodPressureSystolic", date FROM "PatientActivity" WHERE "user_id" = $1 AND "bloodPressureDiastolic" IS NOT NULL AND "bloodPressureSystolic" IS NOT NULL ORDER BY date DESC', [id]);
        return res.rows.map(row => ({
            bloodPressureDiastolic: row.bloodPressureDiastolic,
            bloodPressureSystolic: row.bloodPressureSystolic,
            date: row.date
        }));
    } finally {
        client.release();
    }
}

export const getAllBloodPressureReadings = async () => {
  const client = await pool.connect();
  try {
    const sql = `
      SELECT
        "bloodPressureDiastolic",
        "bloodPressureSystolic",
        date
      FROM "PatientActivity"
      WHERE "bloodPressureDiastolic" IS NOT NULL
        AND "bloodPressureSystolic" IS NOT NULL
      ORDER BY date DESC
    `;
    const res = await client.query(sql);

    return res.rows.map(row => ({
      bloodPressureDiastolic: row.bloodPressureDiastolic,
      bloodPressureSystolic: row.bloodPressureSystolic,
      date: row.date instanceof Date ? row.date.toISOString() : row.date
    }));
  } catch (err) {
    throw err;
  } finally {
    client.release();
  }
};

export const averageBloodPressure = async () => {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT AVG("bloodPressureDiastolic") AS avgDiastolic, AVG("bloodPressureSystolic") AS avgSystolic FROM "PatientActivity" WHERE "bloodPressureDiastolic" IS NOT NULL AND "bloodPressureSystolic" IS NOT NULL');
        return {
            averageDiastolic: parseFloat(res.rows[0].avgDiastolic),
            averageSystolic: parseFloat(res.rows[0].avgSystolic)
        };
    } finally {
        client.release();
    }
}

export const averageGlucoseLevel = async () => {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT AVG("glucoseLevel") AS avgGlucose FROM "PatientActivity" WHERE "glucoseLevel" IS NOT NULL');
        return {
            averageGlucose: parseFloat(res.rows[0].avgGlucose)
        };
    } finally {
        client.release();
    }
}

export const getAllGlucoseLevelReadings = async () => {
    const client = await pool.connect();
    try {
        const sql = `
            SELECT
                "glucoseLevel",
                date
            FROM "PatientActivity"
            WHERE "glucoseLevel" IS NOT NULL
            ORDER BY date DESC
        `;
        const res = await client.query(sql);

        return res.rows.map(row => ({
            glucoseLevel: row.glucoseLevel,
            date: row.date instanceof Date ? row.date.toISOString() : row.date
        }));
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
}

export const getGlucoseLevelHistory = async (id) => {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT "glucoseLevel", date FROM "PatientActivity" WHERE "user_id" = $1 AND "glucoseLevel" IS NOT NULL ORDER BY date DESC', [id]);
        return res.rows.map(row => ({
            glucoseLevel: row.glucoseLevel,
            date: row.date
        }));
    } finally {
        client.release();
    }
};

