// app/index.jsx
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";

export default function AdForm() {
  const [form, setForm] = useState({
    bidType: "offer",
    language: "English",
    title: "",
    category: "",
    price: "",
    condition: "",
    description: "",
    pictures: [],
    postalCode: "",
    city: "",
    street: "",
  });

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.5,
    });
    if (!result.canceled) {
      setForm({ ...form, pictures: [...form.pictures, ...result.assets] });
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Section Header */}
      <Text style={styles.sectionHeader}>Ad Details</Text>

      {/* Bid Type */}
      <View style={styles.radioRow}>
        <TouchableOpacity
          style={[
            styles.radio,
            form.bidType === "offer" && styles.radioSelected,
          ]}
          onPress={() => setForm({ ...form, bidType: "offer" })}
        >
          <Text style={styles.radioText}>I offer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.radio,
            form.bidType === "looking" && styles.radioSelected,
          ]}
          onPress={() => setForm({ ...form, bidType: "looking" })}
        >
          <Text style={styles.radioText}>I am looking for</Text>
        </TouchableOpacity>
      </View>

      {/* Language */}
      <Text style={styles.label}>Language of your input</Text>
      <View style={styles.pickerBox}>
        <Picker
          selectedValue={form.language}
          onValueChange={(val) => setForm({ ...form, language: val })}
        >
          <Picker.Item label="English" value="English" />
          <Picker.Item label="Azerbaijani" value="Azerbaijani" />
          <Picker.Item label="Russian" value="Russian" />
        </Picker>
      </View>

      {/* Title */}
      <TextInput
        style={styles.input}
        placeholder="Title"
        value={form.title}
        onChangeText={(val) => setForm({ ...form, title: val })}
      />
      <Text style={styles.hint}>Tip: You sell better with a meaningful title</Text>

      {/* Category */}
      <View style={styles.pickerBox}>
        <Picker
          selectedValue={form.category}
          onValueChange={(val) => setForm({ ...form, category: val })}
        >
          <Picker.Item label="Select Category" value="" />
          <Picker.Item label="Electronics" value="Electronics" />
          <Picker.Item label="Furniture" value="Furniture" />
          <Picker.Item label="Vehicles" value="Vehicles" />
        </Picker>
      </View>

      {/* Price */}
      <TextInput
        style={styles.input}
        placeholder="Price (AZN)"
        keyboardType="numeric"
        value={form.price}
        onChangeText={(val) => setForm({ ...form, price: val })}
      />

      {/* Condition */}
      <View style={styles.pickerBox}>
        <Picker
          selectedValue={form.condition}
          onValueChange={(val) => setForm({ ...form, condition: val })}
        >
          <Picker.Item label="Condition" value="" />
          <Picker.Item label="New" value="New" />
          <Picker.Item label="Used" value="Used" />
        </Picker>
      </View>

      {/* Description */}
      <TextInput
        style={[styles.input, { height: 100, textAlignVertical: "top" }]}
        placeholder="Description"
        multiline
        value={form.description}
        onChangeText={(val) => setForm({ ...form, description: val })}
      />
      <Text style={styles.charLimit}>1000 characters left</Text>

      {/* Pictures */}
      <Text style={styles.label}>Pictures *</Text>
      <TouchableOpacity style={styles.uploadBox} onPress={handleImagePick}>
        <Text style={{ color: "#666" }}>
          Click to upload or drag files here {"\n"} (Max 8 images, 2MB each)
        </Text>
      </TouchableOpacity>

      {/* Location */}
      <Text style={styles.sectionHeader}>Location</Text>

      <TextInput
        style={styles.input}
        placeholder="Postal Code"
        value={form.postalCode}
        onChangeText={(val) => setForm({ ...form, postalCode: val })}
      />
      <TextInput
        style={styles.input}
        placeholder="Location (City)"
        value={form.city}
        onChangeText={(val) => setForm({ ...form, city: val })}
      />
      <TextInput
        style={styles.input}
        placeholder="Street No. (optional)"
        value={form.street}
        onChangeText={(val) => setForm({ ...form, street: val })}
      />
      <Text style={styles.hint}>
        Tip: By default, we only display the postal code and city.
      </Text>

      {/* Submit */}
      <TouchableOpacity style={styles.submitBtn}>
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },

  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2e7d32",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 6,
    marginVertical: 12,
  },

  label: { fontWeight: "500", marginTop: 12, marginBottom: 4, color: "#333" },
  hint: { fontSize: 12, color: "#777", marginBottom: 10 },
  charLimit: { fontSize: 12, color: "#777", marginTop: 4 },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
  },

  pickerBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginBottom: 12,
  },

  radioRow: { flexDirection: "row", marginVertical: 10, gap: 10 },
  radio: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  radioSelected: { borderColor: "#4CAF50", backgroundColor: "#e8f5e9" },
  radioText: { fontSize: 14, color: "#333" },

  uploadBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#4CAF50",
    borderRadius: 6,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
  },

  submitBtn: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 6,
    alignItems: "center",
    marginVertical: 20,
  },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
