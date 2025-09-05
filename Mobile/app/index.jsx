import { Text, View ,} from "react-native";
import { Link } from "expo-router";
export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>raj boy is here</Text>
      <Link  href="/(auth)/signup"> signup </Link>
      <Link  href="/(auth)"> login </Link>
    </View>
  );
}