// app/index.jsx
import { Redirect } from "expo-router";

export default function homepage() {
  return <Redirect href="/(tabs)" />; // 👈 This will automatically go to (tabs)/index.jsx
}
