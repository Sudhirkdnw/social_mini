const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const userModel = require('./src/models/user.model');

async function createAdmin() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const existing = await userModel.findOne({ username: 'sudhiradmin' });
    if (existing) {
        console.log('Admin user already exists! Updating role to admin...');
        existing.role = 'admin';
        await existing.save();
        console.log('Done - role updated to admin');
    } else {
        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        await userModel.create({
            username: 'sudhiradmin',
            password: hashedPassword,
            fullName: 'Sudhir Admin',
            role: 'admin',
            isVerified: true,
        });
        console.log('Admin user created successfully!');
        console.log('  Username: SudhirAdmin');
        console.log('  Password: Admin@123');
        console.log('  Role: admin');
    }

    await mongoose.disconnect();
    process.exit(0);
}

createAdmin().catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
});
