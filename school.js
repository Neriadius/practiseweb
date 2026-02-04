const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://daryn:i2345678@cluster0.gk1sglg.mongodb.net/';
const client = new MongoClient(uri);

async function main() {
    await client.connect();
    const db = client.db('srudent');
    const students = db.collection('students');

    // 1. Bulk insert
    await students.insertMany([
        { name: "Daryn", age: 17, major: "SE" },
        { name: "Alisher", age: 19, major: "SE" },
        { name: "Alikhan", age: 21, major: "CS" }
    ]);

    // 1.1 Get only names
    const names = await students.find({}, { projection: { _id: 0, name: 1 } }).toArray();
    console.log(names);

    // 2. Find students > 19, sort by age, limit 2
    const older = await students.find({ age: { $gt: 19 } })
        .sort({ age: 1 })
        .limit(2)
        .toArray();
    console.log(older);

    // 3. Update age for students < 19
    await students.updateMany(
        { age: { $lt: 19 } },
        { $inc: { age: 1 } }
    );

    // 4. Calculate average age (aggregation)
    const avgAge = await students.aggregate([
        { $group: { _id: null, averageAge: { $avg: "$Age" } } }
    ]).toArray();
    console.log(avgAge[0]);
}

main().catch(console.error);