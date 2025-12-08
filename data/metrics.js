import pool from "../config/postgres.js";
import dotenv from 'dotenv';

dotenv.config();


export const getPatients = async () => {
    const client = await pool.connect();
    console.log(client)
    try {
        let arr = []
        const res = await client.query('SELECT * FROM "Patient"');
        for(let i = 0; i < res.rows.length; i++){
            let object = {
                id: res.rows[i].id,
                email: res.rows[i].email,
                name: res.rows[i].name,
                createdAt: res.rows[i].createdAt,
                updateAt: res.rows[i].updatedAt,
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
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT * FROM "Patient" WHERE id = $1', [id]);
        if (res.rows.length === 0) {
            throw 'Patient not found';
        }

        let object = {
            id: res.rows[0].id,
            email: res.rows[0].email,
            name: res.rows[0].name,
            createdAt: res.rows[0].createdAt,
            updateAt: res.rows[0].updatedAt,
            phone_number: res.rows[0].phone_number,
            age: res.rows[0].age,
            profile_image: res.rows[0].profile_image,
            avatar_url: res.rows[0].avatar_url,
            week: res.rows[0].week,
            day: res.rows[0].day,
            doctorId: res.rows[0].doctorId,
            waterGoal: res.rows[0].waterGoal,
            calorieGoal: res.rows[0].calorieGoal,
            stepsGoal: res.rows[0].stepsGoal,
            isEmailVerified: res.rows[0].isEmailVerified
        }
        
        return object;
    } finally {
        client.release();
    }
}