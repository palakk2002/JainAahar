import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Warehouse from './app/models/warehouse.js';

dotenv.config();

const seedWarehouse = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to DB');

        const warehousesToSeed = [
            {
                email: 'indore@warehouse.com',
                phone: '9999999999',
                name: 'Rajesh Sharma',
                warehouseName: 'Indore Central Warehouse',
                city: 'Indore',
                state: 'Madhya Pradesh',
                address: 'Plot 42-45, Super Corridor Industrial Area, Near Airport Road, Indore, MP 452001',
                pincode: '452001',
                coordinates: [75.8577, 22.7196]
            },
            {
                email: 'shivpuri@warehouse.com',
                phone: '8888888888',
                name: 'Vikram Singh Bhadauria',
                warehouseName: 'Shivpuri Regional Warehouse',
                city: 'Shivpuri',
                state: 'Madhya Pradesh',
                address: 'Survey No. 118, Jhansi Bypass Road, Industrial Zone, Shivpuri, MP 473551',
                pincode: '473551',
                coordinates: [77.6593, 25.4358]
            }
        ];

        for (const data of warehousesToSeed) {
            const existing = await Warehouse.findOne({ $or: [{ email: data.email }, { phone: data.phone }] });
            if (existing) {
                console.log(`Warehouse ${data.warehouseName} already exists. Removing it...`);
                await Warehouse.deleteOne({ _id: existing._id });
            }

            console.log(`Creating approved Warehouse: ${data.warehouseName}...`);
            const warehouse = new Warehouse({
                name: data.name,
                email: data.email,
                phone: data.phone,
                password: 'password123',
                warehouseName: data.warehouseName,
                shopName: data.warehouseName,
                category: 'General',
                address: data.address,
                city: data.city,
                state: data.state,
                pincode: data.pincode,
                isVerified: true,
                emailVerified: true,
                phoneVerified: true,
                isActive: true,
                applicationStatus: 'approved',
                location: {
                    type: 'Point',
                    coordinates: data.coordinates
                },
                serviceRadius: 10
            });

            await warehouse.save();
            console.log(`Warehouse ${data.warehouseName} created successfully!`);
        }

        console.log('---------------------------------');
        console.log('Seeding completed!');
        console.log('1. Indore WH: indore@warehouse.com / password123');
        console.log('2. Shivpuri WH: shivpuri@warehouse.com / password123');
        console.log('---------------------------------');

    } catch (error) {
        console.error('Error seeding warehouses:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from DB');
    }
};

seedWarehouse();
