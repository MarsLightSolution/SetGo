const mongoose = require('mongoose');
const Product = require('./models/product.model');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chat_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const createTestProducts = async () => {
  try {
    // Clear existing products
    await Product.deleteMany({});
    
    // Create test products with location data
    const testProducts = [
      {
        title: {
          en: "iPhone 13",
          az: "iPhone 13",
          ru: "iPhone 13"
        },
        category: {
          en: "Electronics",
          az: "Elektronika",
          ru: "Электроника"
        },
        price: 800,
        condition: "new",
        description: {
          en: "Brand new iPhone 13",
          az: "Yeni iPhone 13",
          ru: "Новый iPhone 13"
        },
        postalCode: "10001",
        location: {
          type: "Point",
          coordinates: [-74.0060, 40.7128], // New York
          city: "New York"
        },
        isSell: false,
        owner: new mongoose.Types.ObjectId(),
        pictures: ["test-image-1.jpg"]
      },
      {
        title: {
          en: "MacBook Pro",
          az: "MacBook Pro",
          ru: "MacBook Pro"
        },
        category: {
          en: "Electronics",
          az: "Elektronika",
          ru: "Электроника"
        },
        price: 1200,
        condition: "used",
        description: {
          en: "Used MacBook Pro in good condition",
          az: "İstifadə edilmiş MacBook Pro yaxşı vəziyyətdə",
          ru: "Б/у MacBook Pro в хорошем состоянии"
        },
        postalCode: "10002",
        location: {
          type: "Point",
          coordinates: [-74.0060, 40.7128], // New York
          city: "New York"
        },
        isSell: false,
        owner: new mongoose.Types.ObjectId(),
        pictures: ["test-image-2.jpg"]
      },
      {
        title: {
          en: "Car for Sale",
          az: "Avtomobil satılır",
          ru: "Автомобиль на продажу"
        },
        category: {
          en: "Cars & Motorcycles",
          az: "Avtomobillər və Motosikletlər",
          ru: "Автомобили и Мотоциклы"
        },
        price: 15000,
        condition: "used",
        description: {
          en: "Used car in excellent condition",
          az: "İstifadə edilmiş avtomobil əla vəziyyətdə",
          ru: "Б/у автомобиль в отличном состоянии"
        },
        postalCode: "10003",
        location: {
          type: "Point",
          coordinates: [-74.0060, 40.7128], // New York
          city: "New York"
        },
        isSell: false,
        owner: new mongoose.Types.ObjectId(),
        pictures: ["test-image-3.jpg"]
      }
    ];
    
    await Product.insertMany(testProducts);
    console.log('Test products created successfully!');
    
    // Test the filtering
    const products = await Product.find({});
    console.log(`Total products: ${products.length}`);
    
    // Test radius filter
    const nearbyProducts = await Product.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [-74.0060, 40.7128], // New York
          },
          distanceField: "distance",
          spherical: true,
          maxDistance: 5000, // 5km
          distanceMultiplier: 0.001,
        },
      },
      { $match: { isSell: false } }
    ]);
    
    console.log(`Products within 5km: ${nearbyProducts.length}`);
    
  } catch (error) {
    console.error('Error creating test products:', error);
  } finally {
    mongoose.connection.close();
  }
};

createTestProducts();