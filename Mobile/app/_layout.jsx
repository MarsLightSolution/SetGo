import { Tabs } from 'expo-router';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { FilterProvider } from '../context/FilterContext';

export default function Layout() {
  return (
    <FilterProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#4ADE80',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            height: 70,
            paddingBottom: 10,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
        }}
      >
        {/* Home Tab */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Icon name="home" size={size} color={color} />
            ),
          }}
        />

        {/* Wishlist Tab */}
        <Tabs.Screen
          name="wishlist"
          options={{
            title: 'Wishlist',
            tabBarIcon: ({ color, size }) => (
              <Icon name="heart" size={size} color={color} />
            ),
          }}
        />

        {/* Add Post Tab (Center) */}
        <Tabs.Screen
          name="post"
          options={{
            title: '',
            tabBarIcon: ({ color, size }) => (
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: '#4ADE80',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: -20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4.65,
                elevation: 8,
              }}>
                <Icon name="plus-circle" size={28} color="#FFFFFF" />
              </View>
            ),
          }}
        />

        {/* Orders & Transactions Tab */}
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders',
            tabBarIcon: ({ color, size }) => (
              <Icon name="shopping-bag" size={size} color={color} />
            ),
          }}
        />

        {/* Profile Management Tab */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Icon name="user" size={size} color={color} />
            ),
          }}
        />

        {/* Hidden Screens (not shown in tab bar) */}
        <Tabs.Screen
          name="filters"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="product"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </FilterProvider>
  );
}