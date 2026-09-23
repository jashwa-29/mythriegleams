const mongoose = require('mongoose');

async function fixEncoding() {
    await mongoose.connect('mongodb://localhost:27017/mythriegleams');
    const db = mongoose.connection.db;
    const res = await db.collection('collections').updateMany(
        { name: /Wall D/ },
        { $set: { name: 'Miniature Art & Wall Décor' } }
    );
    console.log("Updated collections:", res.modifiedCount);
    await mongoose.disconnect();
}

fixEncoding().catch(console.error);
