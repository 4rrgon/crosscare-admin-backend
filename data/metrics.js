import pool from "../config/postgres.js";

const DATE_ERROR =
  "Invalid date format. Please use 'YYYY-MM-DD HH:mm:ss.SSS'.";

const patientActivityFields = `
  pa.id AS "patientActivityId",
  pa.weight AS "weight",
  pa.weight_unit AS "weight_unit",
  pa.water AS "water",
  pa."caloriesConsumed" AS "caloriesConsumed",
  pa."bloodPressureDiastolic" AS "bloodPressureDiastolic",
  pa."bloodPressureSystolic" AS "bloodPressureSystolic",
  pa."glucoseLevel" AS "glucoseLevel",
  pa."glucoseUnit" AS "glucoseUnit",
  pa."moodLevel" AS "moodLevel"
`;

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toDateValue(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function mapPatientRow(row, metrics = {}) {
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

    totalAppointments: metrics.totalAppointments ?? 0,
    futureAppointments: metrics.futureAppointments ?? 0,
    averageMealsPerDay: metrics.averageMealsPerDay ?? null,
    averageSessionTime: metrics.averageSessionTime ?? null,
    sessionCount: metrics.sessionCount ?? 0,
  };
}

export function hasDatePassed(dateString) {
  if (typeof dateString !== "string") {
    throw new Error(DATE_ERROR);
  }

  const dateToCheck = new Date(dateString.trim().replace(" ", "T"));

  if (Number.isNaN(dateToCheck.getTime())) {
    throw new Error(DATE_ERROR);
  }

  return dateToCheck < new Date();
}

export const getAverageMealsPerDay = async (patientActivityId) => {
  const client = await pool.connect();

  try {
    const res = await client.query(
      `
      SELECT COALESCE(AVG(meals_per_day), 0) AS avg_meals_per_day
      FROM (
        SELECT DATE("createdAt") AS meal_day, COUNT(*) AS meals_per_day
        FROM "meal"
        WHERE "patientActivityId" = $1
        GROUP BY DATE("createdAt")
      ) daily_counts
      `,
      [patientActivityId]
    );

    return toNumber(res.rows[0]?.avg_meals_per_day, 0);
  } catch (error) {
    console.error("getAverageMealsPerDay error:", error);
    throw new Error("Failed to calculate average meals per day");
  } finally {
    client.release();
  }
};

export const getSessionTimes = async (patientId) => {
  const client = await pool.connect();

  try {
    const res = await client.query(
      `
      SELECT
        AVG("durationMinutes") AS avg_session_time,
        COUNT(*) AS session_count
      FROM "session_metrics"
      WHERE "patientId" = $1
      `,
      [patientId]
    );

    return {
      averageSessionTime: toNumber(res.rows[0]?.avg_session_time, null),
      sessionCount: toNumber(res.rows[0]?.session_count, 0),
    };
  } catch (error) {
    console.error("getSessionTimes error:", error);
    throw new Error("Failed to retrieve session times");
  } finally {
    client.release();
  }
};

export const getPatients = async (pageSize = 10, pageNum = 1) => {
  const client = await pool.connect();

  try {
    const limit = toNumber(pageSize, 10);
    const page = toNumber(pageNum, 1);
    const offset = (page - 1) * limit;

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

        ${patientActivityFields},

        COALESCE(ap.total_appointments, 0) AS "totalAppointments",
        COALESCE(ap.future_appointments, 0) AS "futureAppointments"
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
      ) pa ON TRUE
      LEFT JOIN (
        SELECT
          "patientId",
          COUNT(*) AS total_appointments,
          COUNT(*) FILTER (WHERE "appointmentDate" > NOW()) AS future_appointments
        FROM "Appointment"
        GROUP BY "patientId"
      ) ap ON ap."patientId" = p.id
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );

    const patients = await Promise.all(
      res.rows.map(async (row) => {
        let averageMealsPerDay = null;
        let averageSessionTime = null;
        let sessionCount = 0;

        if (row.patientActivityId != null) {
          try {
            averageMealsPerDay = await getAverageMealsPerDay(row.patientActivityId);
          } catch (error) {
            console.error(
              `Error fetching average meals per day for patient ${row.id}:`,
              error
            );
          }
        }

        try {
          const sessionMetrics = await getSessionTimes(row.id);
          averageSessionTime = sessionMetrics.averageSessionTime;
          sessionCount = sessionMetrics.sessionCount;
        } catch (error) {
          console.error(`Error fetching session times for patient ${row.id}:`, error);
        }

        return mapPatientRow(row, {
          totalAppointments: toNumber(row.totalAppointments, 0),
          futureAppointments: toNumber(row.futureAppointments, 0),
          averageMealsPerDay,
          averageSessionTime,
          sessionCount,
        });
      })
    );

    return patients;
  } catch (error) {
    console.error("getPatients error:", error);
    throw error;
  } finally {
    client.release();
  }
};

export const getNumberOfPatients = async () => {
  const client = await pool.connect();

  try {
    const res = await client.query('SELECT COUNT(*) FROM "Patient"');
    return { numberOfPatients: toNumber(res.rows[0]?.count, 0) };
  } finally {
    client.release();
  }
};

export const getPatient = async (id) => {
  if (id == null || id === "") {
    throw new Error("id is required");
  }

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

        ${patientActivityFields},

        COALESCE(ap.total_appointments, 0) AS "totalAppointments",
        COALESCE(ap.future_appointments, 0) AS "futureAppointments"
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
      ) pa ON TRUE
      LEFT JOIN (
        SELECT
          "patientId",
          COUNT(*) AS total_appointments,
          COUNT(*) FILTER (WHERE "appointmentDate" > NOW()) AS future_appointments
        FROM "Appointment"
        GROUP BY "patientId"
      ) ap ON ap."patientId" = p.id
      WHERE p.id = $1
      LIMIT 1
      `,
      [id]
    );

    if (res.rows.length === 0) {
      throw new Error("Patient not found");
    }

    const row = res.rows[0];

    let averageMealsPerDay = null;
    let averageSessionTime = null;
    let sessionCount = 0;

    if (row.patientActivityId != null) {
      try {
        averageMealsPerDay = await getAverageMealsPerDay(row.patientActivityId);
      } catch (error) {
        console.error(`Error fetching average meals per day for patient ${id}:`, error);
      }
    }

    try {
      const sessionMetrics = await getSessionTimes(row.id);
      averageSessionTime = sessionMetrics.averageSessionTime;
      sessionCount = sessionMetrics.sessionCount;
    } catch (error) {
      console.error(`Error fetching session times for patient ${id}:`, error);
    }

    return mapPatientRow(row, {
      totalAppointments: toNumber(row.totalAppointments, 0),
      futureAppointments: toNumber(row.futureAppointments, 0),
      averageMealsPerDay,
      averageSessionTime,
      sessionCount,
    });
  } catch (error) {
    console.error("getPatient error:", error);
    throw error;
  } finally {
    client.release();
  }
};

export const getDoctors = async (pageSize = 10, pageNum = 1) => {
  const client = await pool.connect();

  try {
    const limit = toNumber(pageSize, 10);
    const page = toNumber(pageNum, 1);
    const offset = (page - 1) * limit;

    const res = await client.query(
      `
      SELECT
        id,
        email,
        name,
        created_at,
        updated_at
      FROM "Doctor"
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );

    return res.rows;
  } finally {
    client.release();
  }
};

export const getNumberOfDoctors = async () => {
  const client = await pool.connect();

  try {
    const res = await client.query('SELECT COUNT(*) FROM "Doctor"');
    return { numberOfDoctors: toNumber(res.rows[0]?.count, 0) };
  } finally {
    client.release();
  }
};

export const getDoctor = async (id) => {
  const client = await pool.connect();

  try {
    const res = await client.query(
      `
      SELECT
        id,
        email,
        name,
        created_at,
        updated_at
      FROM "Doctor"
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (res.rows.length === 0) {
      throw new Error("Doctor not found");
    }

    return res.rows[0];
  } finally {
    client.release();
  }
};

export const getNumberOfPatientsPerDoctor = async (id) => {
  const client = await pool.connect();

  try {
    const res = await client.query(
      'SELECT COUNT(*) FROM "Patient" WHERE "doctorId" = $1',
      [id]
    );

    return { numberOfPatients: toNumber(res.rows[0]?.count, 0) };
  } finally {
    client.release();
  }
};

export const getPatientsPerDoctor = async (id, pageSize = 10, pageNum = 1) => {
  const client = await pool.connect();

  try {
    const limit = toNumber(pageSize, 10);
    const page = toNumber(pageNum, 1);
    const offset = (page - 1) * limit;

    const res = await client.query(
      `
      SELECT
        id,
        email,
        name,
        created_at,
        updated_at,
        phone_number,
        age,
        profile_image,
        avatar_url,
        week,
        day,
        "doctorId",
        "waterGoal",
        "calorieGoal",
        "stepsGoal",
        "isEmailVerified"
      FROM "Patient"
      WHERE "doctorId" = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [id, limit, offset]
    );

    return res.rows;
  } finally {
    client.release();
  }
};

export const getBloodPressureHistory = async (id) => {
  const client = await pool.connect();

  try {
    const res = await client.query(
      `
      SELECT
        "bloodPressureDiastolic",
        "bloodPressureSystolic",
        date
      FROM "PatientActivity"
      WHERE "user_id" = $1
        AND "bloodPressureDiastolic" IS NOT NULL
        AND "bloodPressureSystolic" IS NOT NULL
      ORDER BY date DESC
      `,
      [id]
    );

    return res.rows.map((row) => ({
      bloodPressureDiastolic: row.bloodPressureDiastolic,
      bloodPressureSystolic: row.bloodPressureSystolic,
      date: toDateValue(row.date),
    }));
  } finally {
    client.release();
  }
};

export const getAllBloodPressureReadings = async () => {
  const client = await pool.connect();

  try {
    const res = await client.query(
      `
      SELECT
        "bloodPressureDiastolic",
        "bloodPressureSystolic",
        date
      FROM "PatientActivity"
      WHERE "bloodPressureDiastolic" IS NOT NULL
        AND "bloodPressureSystolic" IS NOT NULL
      ORDER BY date DESC
      `
    );

    return res.rows.map((row) => ({
      bloodPressureDiastolic: row.bloodPressureDiastolic,
      bloodPressureSystolic: row.bloodPressureSystolic,
      date: toDateValue(row.date),
    }));
  } finally {
    client.release();
  }
};

export const averageBloodPressure = async () => {
  const client = await pool.connect();

  try {
    const res = await client.query(
      `
      SELECT
        AVG("bloodPressureDiastolic") AS avg_diastolic,
        AVG("bloodPressureSystolic") AS avg_systolic
      FROM "PatientActivity"
      WHERE "bloodPressureDiastolic" IS NOT NULL
        AND "bloodPressureSystolic" IS NOT NULL
      `
    );

    return {
      averageDiastolic: toNumber(res.rows[0]?.avg_diastolic, 0),
      averageSystolic: toNumber(res.rows[0]?.avg_systolic, 0),
    };
  } finally {
    client.release();
  }
};

export const averageGlucoseLevel = async () => {
  const client = await pool.connect();

  try {
    const res = await client.query(
      `
      SELECT AVG("glucoseLevel") AS avg_glucose
      FROM "PatientActivity"
      WHERE "glucoseLevel" IS NOT NULL
      `
    );

    return {
      averageGlucose: toNumber(res.rows[0]?.avg_glucose, 0),
    };
  } finally {
    client.release();
  }
};

export const getAllGlucoseLevelReadings = async () => {
  const client = await pool.connect();

  try {
    const res = await client.query(
      `
      SELECT
        "glucoseLevel",
        date
      FROM "PatientActivity"
      WHERE "glucoseLevel" IS NOT NULL
      ORDER BY date DESC
      `
    );

    return res.rows.map((row) => ({
      glucoseLevel: row.glucoseLevel,
      date: toDateValue(row.date),
    }));
  } finally {
    client.release();
  }
};

export const getGlucoseLevelHistory = async (id) => {
  const client = await pool.connect();

  try {
    const res = await client.query(
      `
      SELECT
        "glucoseLevel",
        date
      FROM "PatientActivity"
      WHERE "user_id" = $1
        AND "glucoseLevel" IS NOT NULL
      ORDER BY date DESC
      `,
      [id]
    );

    return res.rows.map((row) => ({
      glucoseLevel: row.glucoseLevel,
      date: toDateValue(row.date),
    }));
  } finally {
    client.release();
  }
};

export const getAvgSessionTime = async () => {
  const client = await pool.connect();

  try {
    const res = await client.query(
      `
      SELECT AVG("durationMinutes") AS avg_session_time
      FROM "session_metrics"
      `
    );

    return {
      averageSessionTime: toNumber(res.rows[0]?.avg_session_time, 0),
    };
  } finally {
    client.release();
  }
}