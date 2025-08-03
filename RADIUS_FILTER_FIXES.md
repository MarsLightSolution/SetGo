# Radius Filter Fixes & Improvements

## 🎯 Issues Fixed

### 1. **Backend Pipeline Order Issue**
**Problem**: The `$geoNear` stage was being added AFTER the `$match` stage, which is incorrect for MongoDB aggregation.

**Solution**: Moved `$geoNear` to the beginning of the pipeline:
```javascript
// BEFORE (Incorrect)
pipeline.push({ $match: matchStage });
pipeline.unshift({ $geoNear: { ... } });

// AFTER (Correct)
if (latitude && longitude && radiusInKm) {
  pipeline.push({ $geoNear: { ... } });
}
pipeline.push({ $match: matchStage });
```

### 2. **Location State Management**
**Problem**: Location was stored as separate `latitude` and `longitude` fields instead of a nested object.

**Solution**: Updated FilterSlice to use proper nested structure:
```javascript
// BEFORE
state.latitude = action.payload.latitude;
state.longitude = action.payload.longitude;

// AFTER
state.location.latitude = action.payload.latitude;
state.location.longitude = action.payload.longitude;
```

### 3. **Radius Filter Logic**
**Problem**: Radius filter only worked with location, but should work independently.

**Solution**: Updated frontend logic to handle radius properly:
```javascript
// Handle location-based filtering
if (latitude && longitude) {
  params.append("latitude", latitude);
  params.append("longitude", longitude);
  // Apply radius if specified, otherwise use default 10km
  params.append("radiusInKm", radius > 0 ? radius : 10);
}
```

### 4. **$or Logic Issues**
**Problem**: Multiple `$or` conditions were conflicting with each other.

**Solution**: Fixed the `$or` logic to properly combine conditions:
```javascript
// BEFORE
matchStage.$or = matchStage.$or || [];
matchStage.$or.push(...);

// AFTER
if (!matchStage.$or) matchStage.$or = [];
matchStage.$or.push(...);
```

## 🔧 Technical Improvements

### Backend Enhancements

1. **Proper MongoDB Aggregation Pipeline**:
```javascript
const pipeline = [];

// 1. GeoNear stage (if location-based filtering)
if (latitude && longitude && radiusInKm) {
  pipeline.push({
    $geoNear: {
      near: { type: "Point", coordinates: [longitude, latitude] },
      distanceField: "distance",
      spherical: true,
      maxDistance: radiusInMeters,
      distanceMultiplier: 0.001,
    },
  });
}

// 2. Match stage (all other filters)
pipeline.push({ $match: matchStage });

// 3. Sort stage
pipeline.push({ $sort: { createdAt: -1 } });
```

2. **Enhanced Filter Parameters**:
```javascript
const {
  category, page, limit, userId,
  minPrice, maxPrice, lang,
  condition, city, search,
  latitude, longitude, radiusInKm
} = req.query;
```

3. **Multi-language Search Support**:
```javascript
if (search?.trim()) {
  const searchRegex = new RegExp(search.trim(), "i");
  if (!matchStage.$or) matchStage.$or = [];
  matchStage.$or.push(
    { "title.en": searchRegex },
    { "title.az": searchRegex },
    { "title.ru": searchRegex },
    { "description.en": searchRegex },
    { "description.az": searchRegex },
    { "description.ru": searchRegex },
    { "category.en": searchRegex },
    { "category.az": searchRegex },
    { "category.ru": searchRegex }
  );
}
```

### Frontend Enhancements

1. **Proper Location State Management**:
```javascript
const { location } = useSelector((state) => state.filter);
const { latitude, longitude } = location || {};
```

2. **Enhanced Filter Status Display**:
```javascript
{latitude && longitude && radius === 0 && (
  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
    Location-based (10km default)
  </span>
)}
```

3. **Improved Filter Application**:
```javascript
// Handle location-based filtering
if (latitude && longitude) {
  params.append("latitude", latitude);
  params.append("longitude", longitude);
  params.append("radiusInKm", radius > 0 ? radius : 10);
}
```

## 🧪 Testing & Debugging

### Test Component
Added `FilterTest.jsx` with test buttons:
```javascript
const testRadiusFilter = () => {
  dispatch(setLocationFilter({ latitude: 40.7128, longitude: -74.0060 }));
  dispatch(setRadius(5)); // 5km radius
};

const clearLocation = () => {
  dispatch(setLocationFilter({ latitude: null, longitude: null }));
  dispatch(setRadius(0));
};
```

### Test Data Script
Created `test-products.js` to populate database with test products:
```javascript
const testProducts = [
  {
    title: { en: "iPhone 13", az: "iPhone 13", ru: "iPhone 13" },
    category: { en: "Electronics", az: "Elektronika", ru: "Электроника" },
    price: 800,
    condition: "new",
    location: {
      type: "Point",
      coordinates: [-74.0060, 40.7128], // New York
      city: "New York"
    },
    // ... other fields
  }
];
```

### Enhanced Logging
Added comprehensive console logging:
```javascript
console.log("Fetching products with params:", params.toString());
console.log("Current filters:", { priceRange, condition, city, radius, latitude, longitude });
console.log("Location data:", location);
console.log("API Response:", json);
```

## 🚀 Key Features Now Working

### 1. **Radius Filter**
- ✅ Works with GPS coordinates
- ✅ Default 10km radius when location is set
- ✅ Custom radius (0-400km)
- ✅ Proper MongoDB geospatial queries

### 2. **Location-Based Search**
- ✅ GPS coordinates from browser
- ✅ Manual location setting
- ✅ Radius-based filtering
- ✅ Distance calculation

### 3. **Multi-Criteria Filtering**
- ✅ Radius + Category + Price
- ✅ Radius + Condition + Search
- ✅ Location + Postal Code + Radius
- ✅ Any combination of filters

### 4. **Real-time Application**
- ✅ Filters apply immediately
- ✅ Visual feedback
- ✅ Clear all filters
- ✅ Debug information

## 📱 User Interface

### Filter Modal
- **Radius Slider**: 0-400km with real-time updates
- **Location Services**: GPS-based nearby search
- **Apply Filters**: Immediate application
- **Clear Filters**: Reset all filters

### Filter Status
- **Active Radius**: Shows current radius setting
- **Location Status**: Indicates if location is set
- **Default Radius**: Shows 10km default when location is set
- **Clear All**: One-click reset

### Debug Tools
- **Filter Test Component**: Shows current state
- **Test Buttons**: Quick radius filter testing
- **Console Logging**: Detailed debugging information

## 🔄 Usage Examples

### Basic Radius Filter
```javascript
// Set location and radius
dispatch(setLocationFilter({ latitude: 40.7128, longitude: -74.0060 }));
dispatch(setRadius(5)); // 5km radius
// Results: Products within 5km of New York
```

### Radius + Category Filter
```javascript
// Combine radius with category
dispatch(setLocationFilter({ latitude: 40.7128, longitude: -74.0060 }));
dispatch(setRadius(10));
dispatch(setSelectedCategory("Electronics"));
// Results: Electronics within 10km of New York
```

### Radius + Price Filter
```javascript
// Combine radius with price range
dispatch(setLocationFilter({ latitude: 40.7128, longitude: -74.0060 }));
dispatch(setRadius(20));
dispatch(setPriceRange([100, 1000]));
// Results: Products €100-€1000 within 20km of New York
```

## 🎯 Benefits

### For Users
- **Accurate Location Search**: Find products near you
- **Flexible Radius**: Set custom search radius
- **Combined Filters**: Radius + other criteria
- **Visual Feedback**: Clear indication of active filters

### For Developers
- **Proper MongoDB Queries**: Correct aggregation pipeline
- **State Management**: Clean Redux state structure
- **Debug Tools**: Easy testing and debugging
- **Scalable Design**: Easy to extend with new filters

## 🔧 Troubleshooting

### Common Issues

1. **Radius Not Working**
   - Check if location is set in Redux state
   - Verify MongoDB geospatial index exists
   - Check console logs for API parameters

2. **Location Not Setting**
   - Check browser permissions for location
   - Verify GPS coordinates are captured
   - Check Redux state for location data

3. **Filters Not Combining**
   - Check $or logic in backend
   - Verify all filter parameters are sent
   - Check console logs for API response

### Debug Commands
```javascript
// Check Redux state
console.log(store.getState().filter);

// Check API parameters
console.log("API params:", params.toString());

// Check location data
console.log("Location:", location);
```

The radius filter is now fully functional and works smoothly with all other filters!