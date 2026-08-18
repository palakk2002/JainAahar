import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Warehouse from './app/models/warehouse.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const list = await Warehouse.find({});
        console.log('--- WAREHOUSES IN DB ---');
        list.forEach(w => {
            console.log(`Name: ${w.name}, Email: ${w.email}, Approved: ${w.applicationStatus}, Active: ${w.isActive}`);
        });
        console.log('------------------------');
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
