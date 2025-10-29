import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

export default function CreatePostScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", "Please allow access to your gallery.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], // ✅ new syntax for Expo SDK 51+
        allowsEditing: true,
        quality: 0.8,
      });

      console.log("Image picker result:", result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image picker error:", error);
    }
  };

  const handleUpload = async () => {
    if (!image) return Alert.alert("Error", "Please select an image");
    try {
      setUploading(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) return Alert.alert("Error", "Not logged in");

      const formData = new FormData();
      const uriParts = image.split(".");
      const fileType = uriParts[uriParts.length - 1];
      formData.append("image", {
        uri: image,
        name: `post.${fileType}`,
        type: `image/${fileType === "jpg" ? "jpeg" : fileType}`,
      });
      formData.append("caption", caption);

      const res = await api.post("/posts", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setUploading(false);
      Alert.alert("✅ Success", "Post created successfully!");
      setImage(null);
      setCaption("");
      navigation.navigate("Home"); // Go back to feed
    } catch (err) {
      console.error("Upload error:", err.response?.data || err.message);
      setUploading(false);
      Alert.alert("Error", err.response?.data?.message || "Failed to create post");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create New Post</Text>

      <TouchableOpacity onPress={pickImage}>
        <Image
          source={
            image
              ? { uri: image }
              : require("../../assets/default-avatar.png") // placeholder image
          }
          style={styles.imagePreview}
        />
        <Text style={{ color: "#0066cc", marginTop: 8 }}>Pick an image</Text>
      </TouchableOpacity>

      <TextInput
        placeholder="Write a caption..."
        value={caption}
        onChangeText={setCaption}
        style={styles.input}
        multiline
      />

      <TouchableOpacity
        style={[styles.btn, uploading && { opacity: 0.6 }]}
        onPress={handleUpload}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Upload Post</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: "center", padding: 20, paddingTop: 40 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  imagePreview: {
    width: 280,
    height: 280,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    textAlignVertical: "top",
  },
  btn: {
    width: "100%",
    backgroundColor: "#000",
    borderRadius: 8,
    padding: 14,
    marginTop: 20,
  },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "bold", fontSize: 16 },
});
