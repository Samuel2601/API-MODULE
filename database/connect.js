import mongoose from 'mongoose';

const connectDB = async (databaseName = process.env.BASE_DATOS) => {
  try {
    const uri = `${process.env.URI_MONGO}${databaseName}`;
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`Connected to database: ${databaseName}`);
  } catch (error) {
    console.error('Database connection error:', error);
  }
};

export default connectDB;
