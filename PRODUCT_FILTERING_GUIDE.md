# Product Filtering System Guide

## Overview
This guide explains the comprehensive product filtering system implemented in your e-commerce application. The system allows users to filter products on the home page based on various criteria set in the navbar.

## 🎯 Features Implemented

### 1. **Search Functionality**
- **Text Search**: Users can search for products by entering keywords
- **Real-time Search**: Search is applied immediately when pressing Enter
- **Search Integration**: Search query is stored in Redux state and applied to product fetching

### 2. **Price Range Filtering**
- **Slider Control**: Interactive price range slider (€0 - €10,000)
- **Min/Max Price**: Users can set minimum and maximum price limits
- **Visual Feedback**: Current price range is displayed in the filter modal

### 3. **Condition Filtering**
- **Product Condition**: Filter by product condition (New, Like New, Used, Defective)
- **Dropdown Selection**: Easy-to-use dropdown menu for condition selection
- **Clear Options**: Option to show all conditions or filter by specific condition

### 4. **Location-Based Filtering**
- **Radius Filter**: Set search radius (0-400 km)
- **City Selection**: Filter by specific cities (Baku, Ganja, Sumqayit, etc.)
- **GPS Location**: Use device location for nearby product search
- **Location Integration**: Coordinates are used for distance-based filtering

### 5. **Category Filtering**
- **Category Selection**: Filter by product categories
- **Dynamic Categories**: Categories are translated and managed through i18n
- **Category Integration**: Works with existing category system

## 🔧 Technical Implementation

### Redux State Management
```javascript
// FilterSlice.jsx
const initialState = {
  priceRange: [0, 10000],
  condition: "",
  radius: 0,
  city: "",
  searchQuery: "",
  location: {
    latitude: null,
    longitude: null,
  },
};
```

### Filter Actions
- `setPriceRange()` - Set price range filter
- `setCondition()` - Set product condition filter
- `setRadius()` - Set search radius
- `setCity()` - Set city filter
- `setSearchQuery()` - Set search query
- `setLocationFilter()` - Set GPS coordinates
- `resetFilters()` - Clear all filters

### API Integration
The filtering system integrates with your backend API:

```javascript
// Example API call with filters
const params = new URLSearchParams({
  page: 1,
  limit: 12,
  minPrice: priceRange[0],
  maxPrice: priceRange[1],
  condition: condition,
  city: city,
  search: searchQuery,
  latitude: latitude,
  longitude: longitude,
  radiusInKm: radius
});
```

## 🎨 User Interface

### 1. **Navbar Integration**
- **Search Input**: Located in the navbar for quick access
- **Filter Button**: Opens comprehensive filter modal
- **Find Button**: Applies current search and navigates to home
- **Category Dropdown**: Quick category selection

### 2. **Filter Modal**
- **Comprehensive Interface**: All filters in one modal
- **Real-time Updates**: Changes reflect immediately
- **Clear Filters**: Easy way to reset all filters
- **Apply Filters**: Apply and navigate to filtered results

### 3. **Filter Status Display**
- **Active Filters**: Shows currently applied filters
- **Visual Tags**: Each active filter is displayed as a tag
- **Clear All**: One-click option to clear all filters
- **Responsive Design**: Works on all screen sizes

## 📱 Usage Instructions

### For Users

1. **Basic Search**:
   - Enter keywords in the search box
   - Press Enter or click "Find" button

2. **Advanced Filtering**:
   - Click the filter icon (🔍) in the navbar
   - Set your desired filters:
     - Price range using the slider
     - Product condition from dropdown
     - Search radius for location-based filtering
     - City selection
   - Click "Apply Filters"

3. **Location-Based Search**:
   - Click "Nearby Products" in the filter modal
   - Allow location access when prompted
   - Products within the specified radius will be shown

4. **Clear Filters**:
   - Click "Clear All Filters" in the filter status bar
   - Or use "Clear Filters" in the filter modal

### For Developers

1. **Adding New Filters**:
   ```javascript
   // In FilterSlice.jsx
   const initialState = {
     // ... existing filters
     newFilter: "",
   };
   
   // Add reducer
   setNewFilter: (state, action) => {
     state.newFilter = action.payload;
   },
   ```

2. **Updating Home Page**:
   ```javascript
   // In Home.jsx
   const { newFilter } = useSelector((state) => state.filter);
   
   // Add to fetchProducts function
   if (newFilter) {
     params.append("newFilter", newFilter);
   }
   ```

3. **Adding Filter UI**:
   ```javascript
   // In ProductFilters.jsx
   <div className="mb-4">
     <label className="block text-sm font-medium mb-2">
       New Filter
     </label>
     <input
       type="text"
       value={localNewFilter}
       onChange={(e) => setLocalNewFilter(e.target.value)}
       className="w-full border rounded px-3 py-2 text-sm"
     />
   </div>
   ```

## 🔄 Filter Flow

1. **User Sets Filter** → Filter state updated in Redux
2. **Home Page Detects Change** → useEffect triggers
3. **API Call Made** → Products fetched with filter parameters
4. **Results Displayed** → Filtered products shown on home page
5. **Filter Status Updated** → Active filters displayed to user

## 🎯 Key Benefits

### For Users
- **Fast Filtering**: Quick access to desired products
- **Multiple Criteria**: Combine multiple filters for precise results
- **Visual Feedback**: Clear indication of active filters
- **Easy Reset**: Simple way to clear all filters

### For Developers
- **Modular Design**: Easy to add new filters
- **Redux Integration**: Centralized state management
- **Reusable Components**: Filter components can be used elsewhere
- **API Integration**: Seamless backend integration

## 🚀 Future Enhancements

1. **Saved Filters**: Allow users to save filter combinations
2. **Filter Presets**: Pre-defined filter sets for common searches
3. **Advanced Search**: Full-text search with multiple fields
4. **Filter Analytics**: Track popular filter combinations
5. **Mobile Optimization**: Touch-friendly filter interface

## 🔧 Troubleshooting

### Common Issues

1. **Filters Not Applying**:
   - Check Redux state in browser dev tools
   - Verify API parameters are being sent
   - Ensure backend supports filter parameters

2. **Search Not Working**:
   - Verify search query is being added to API call
   - Check backend search implementation
   - Ensure proper encoding of search terms

3. **Location Not Working**:
   - Check browser permissions for location
   - Verify GPS coordinates are being captured
   - Ensure backend supports location-based filtering

### Debug Tips

1. **Check Redux State**:
   ```javascript
   // In browser console
   console.log(store.getState().filter);
   ```

2. **Check API Calls**:
   ```javascript
   // In fetchProducts function
   console.log("API params:", params.toString());
   ```

3. **Check Filter Status**:
   ```javascript
   // In Home component
   console.log("Active filters:", hasActiveFilters());
   ```

The filtering system is now fully functional and provides a comprehensive way for users to find products based on their specific criteria!