import { NavigationContainer } from "@react-navigation/native"
import { createDrawerNavigator } from "@react-navigation/drawer"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

// Import screens
import ProfileInformation from "./screens/ProfileInformation"
import AccountSettings from "./screens/AccountSettings"
import Payments from "./screens/Payments"
import DataProtection from "./screens/DataProtection"
import Emails from "./screens/Emails"
import AboutClassifiedAds from "./screens/AboutClassifiedAds"

const Drawer = createDrawerNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        initialRouteName="ProfileInformation"
        screenOptions={{
          drawerStyle: {
            backgroundColor: "#fff",
            width: 280,
          },
          drawerActiveTintColor: "#008235",
          drawerActiveBackgroundColor: "#dcfce7",
          drawerInactiveTintColor: "#374151",
          drawerLabelStyle: {
            fontSize: 16,
            marginLeft: -10,
          },
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerTintColor: "#000",
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 20,
          },
        }}
      >
        <Drawer.Screen
          name="ProfileInformation"
          component={ProfileInformation}
          options={{
            title: "Settings",
            drawerLabel: "Profile information",
            drawerIcon: ({ color, size }) => <Icon name="account" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="AccountSettings"
          component={AccountSettings}
          options={{
            title: "Settings",
            drawerLabel: "Account settings",
            drawerIcon: ({ color, size }) => <Icon name="cog" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="Payments"
          component={Payments}
          options={{
            title: "Settings",
            drawerLabel: "Payments",
            drawerIcon: ({ color, size }) => <Icon name="credit-card" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="DataProtection"
          component={DataProtection}
          options={{
            title: "Settings",
            drawerLabel: "Data protection",
            drawerIcon: ({ color, size }) => <Icon name="shield-check" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="Emails"
          component={Emails}
          options={{
            title: "Settings",
            drawerLabel: "Emails",
            drawerIcon: ({ color, size }) => <Icon name="email" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="AboutClassifiedAds"
          component={AboutClassifiedAds}
          options={{
            title: "Settings",
            drawerLabel: "About Classified Ads",
            drawerIcon: ({ color, size }) => <Icon name="heart" size={size} color={color} />,
          }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  )
}
