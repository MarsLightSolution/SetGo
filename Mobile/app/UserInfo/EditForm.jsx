import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useLocalSearchParams } from 'expo-router';
import { API_ENDPOINTS, IMAGE_BASE_URL } from '../../config/api';
import logger from '../../utils/logger';

const log = logger.create('EditForm');

export default function EditForm() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams(); // ✅ catches id from ?id=123

  const [formData, setFormData] = useState({
    offerType: "offer",
    title: "",
    category: "",
    condition: "",
    price: "",
    description: "",
    postalCode: "",
    streetNo: "",
    name: "",
    showFullAddress: false,
    termsAccepted: false,
    subscribe: false,
    pictures: [],
  });

  const [initialImages, setInitialImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const maxDescriptionLength = 1000;

  // Fetch product
  useEffect(() => {
    const fetchAd = async () => {
      try {
        setLoading(true);
        const res = await fetch(API_ENDPOINTS.GET_PRODUCT(id), {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) {
          const product = data.data;
          setFormData({
            ...formData,
            title: product.title?.en || "",
            category: product.category?.en || "",
            condition: product.condition || "",
            price: product.price?.toString() || "",
            description: product.description?.en || "",
            postalCode: product.postalCode || "",
            streetNo: product.street || "",
            name: product.name?.en || "",
          });
          setInitialImages(product.pictures || []);
        } else {
          Alert.alert("Error", "Failed to load ad details");
        }
      } catch (err) {
        log.error(err);
        Alert.alert("Error", "Error fetching ad details");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAd();
  }, [id]);

  // Pick new images
  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      const selected = result.assets.map((a) => ({
        uri: a.uri,
        type: "image/jpeg",
        name: a.uri.split("/").pop(),
      }));
      if (initialImages.length + selected.length > 8) {
        Alert.alert("Limit Reached", "You can upload up to 8 images only.");
        return;
      }
      setFormData((prev) => ({
        ...prev,
        pictures: [...prev.pictures, ...selected],
      }));
    }
  };

  // Remove image
  const removeImage = (type, index) => {
    if (type === "initial") {
      const updated = [...initialImages];
      updated.splice(index, 1);
      setInitialImages(updated);
    } else {
      const updated = [...formData.pictures];
      updated.splice(index, 1);
      setFormData({ ...formData, pictures: updated });
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.title.trim() || !formData.price.trim()) {
        Alert.alert("Validation Error", "Please fill all required fields.");
        return;
      }

      const updatedData = new FormData();
      updatedData.append("title[en]", formData.title);
      updatedData.append("description[en]", formData.description);
      updatedData.append("name[en]", formData.name);
      updatedData.append("category[en]", formData.category);
      updatedData.append("price", formData.price);
      updatedData.append("postalCode", formData.postalCode);
      updatedData.append("street", formData.streetNo);
      updatedData.append("condition", formData.condition);
      updatedData.append("isSell", formData.offerType === "offer" ? "true" : "false");

      formData.pictures.forEach((pic) => {
        updatedData.append("pictures", {
          uri: pic.uri,
          name: pic.name,
          type: pic.type,
        });
      });

      setLoading(true);
      const res = await fetch(API_ENDPOINTS.UPDATE_PRODUCT(id), {
        method: "PUT",
        headers: { "Content-Type": "multipart/form-data" },
        credentials: "include",
        body: updatedData,
      });

      if (!res.ok) throw new Error("Failed to update product");

      Alert.alert("Success", "Ad updated successfully!");
      navigation.navigate("UserInfo");
    } catch (err) {
      log.error("Update error:", err);
      Alert.alert("Error", "Failed to update ad.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Advertisement</Text>

      <TextInput
        style={styles.input}
        placeholder="Title"
        value={formData.title}
        onChangeText={(text) => handleChange("title", text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Category"
        value={formData.category}
        onChangeText={(text) => handleChange("category", text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Condition"
        value={formData.condition}
        onChangeText={(text) => handleChange("condition", text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Price"
        keyboardType="numeric"
        value={formData.price}
        onChangeText={(text) => handleChange("price", text)}
      />

      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Description"
        multiline
        maxLength={maxDescriptionLength}
        value={formData.description}
        onChangeText={(text) => handleChange("description", text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Postal Code"
        keyboardType="numeric"
        value={formData.postalCode}
        onChangeText={(text) => handleChange("postalCode", text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Street No"
        value={formData.streetNo}
        onChangeText={(text) => handleChange("streetNo", text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Your Name"
        value={formData.name}
        onChangeText={(text) => handleChange("name", text)}
      />

      {/* Image Upload Section */}
      <TouchableOpacity style={styles.uploadBox} onPress={pickImages}>
        <Text style={styles.uploadText}>Tap to upload images (Max 8)</Text>
      </TouchableOpacity>

      {/* Existing Images */}
      {initialImages.length > 0 && (
        <View style={styles.imageContainer}>
          {initialImages.map((url, index) => (
            <View key={`initial-${index}`} style={styles.imageWrapper}>
              <Image
                source={{ uri: `${IMAGE_BASE_URL}/${url.replace(/\\/g, "/")}` }}
                style={styles.image}
              />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removeImage("initial", index)}
              >
                <Text style={styles.removeText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Newly Selected Images */}
      {formData.pictures.length > 0 && (
        <View style={styles.imageContainer}>
          {formData.pictures.map((file, index) => (
            <View key={`new-${index}`} style={styles.imageWrapper}>
              <Image source={{ uri: file.uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removeImage("new", index)}
              >
                <Text style={styles.removeText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Submit */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>Update Ad</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#2e7d32",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#bbb",
    padding: 25,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  uploadText: {
    color: "#555",
    fontSize: 14,
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 10,
  },
  imageWrapper: {
    position: "relative",
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 8,
  },
  removeBtn: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "red",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  removeText: {
    color: "#fff",
    fontWeight: "bold",
  },
  submitBtn: {
    backgroundColor: "#2e7d32",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
