import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";
import { ThemeContext } from "../context/ThemeContext";

export default function EditProfileScreen({ navigation, route }) {
  const { darkMode } = useContext(ThemeContext);
  const routeUser = route?.params?.user || null;
  const [username, setUsername] = useState(routeUser?.username || "");
  const [bio, setBio] = useState(routeUser?.bio || "");
  const [avatar, setAvatar] = useState(routeUser?.avatarUrl || null);
  const [uploading, setUploading] = useState(false);

  // ✅ Pick image from gallery
  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", "Please allow access to your gallery.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image picker error:", error);
    }
  };

  // ✅ Save profile and send updated user to Profile tab
  const handleSaveProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return Alert.alert("Not authenticated");

      setUploading(true); // start overlay

      // Step 1️⃣: Update username & bio
      const res = await api.put(
        `/users/${routeUser.id}`,
        { username, bio },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      let updatedUser = res.data.user;

      // Step 2️⃣: Upload avatar if changed
      if (
        avatar &&
        (avatar.startsWith("file") ||
          avatar.startsWith("content") ||
          !avatar.startsWith("http"))
      ) {
        const formData = new FormData();
        const uriParts = avatar.split(".");
        const fileType = uriParts[uriParts.length - 1];
        const name = `avatar.${fileType}`;

        formData.append("avatar", {
          uri: avatar,
          name,
          type: `image/${fileType === "jpg" ? "jpeg" : fileType}`,
        });

        const uploadRes = await api.post(
          `/users/${routeUser.id}/avatar`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        updatedUser = uploadRes.data.user;
      }

      setUploading(false); // stop overlay

      Alert.alert("✅ Success", "Profile updated successfully!");

      // Step 3️⃣: Navigate to Profile tab
      navigation.navigate("MainApp", {
        screen: "Profile",
        params: { updatedUser },
      });
    } catch (err) {
      console.error("Update error:", err.response?.data || err.message);
      setUploading(false);
      Alert.alert("Error", err.response?.data?.message || "Failed to update");
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: darkMode ? "#000" : "#fff" },
      ]}
    >
      {/* Avatar Section */}
      <TouchableOpacity onPress={pickImage} style={{ alignItems: "center" }}>
        <Image
          source={
            avatar
              ? { uri: avatar }
              : require("../../assets/default-avatar.png")
          }
          style={styles.avatar}
        />
        <Text
          style={{
            color: darkMode ? "#4da6ff" : "#0066cc",
            marginTop: 8,
          }}
        >
          Change avatar
        </Text>
      </TouchableOpacity>

      {/* Username Input */}
      <TextInput
        value={username}
        onChangeText={setUsername}
        style={[
          styles.input,
          {
            backgroundColor: darkMode ? "#111" : "#fff",
            borderColor: darkMode ? "#333" : "#ccc",
            color: darkMode ? "#fff" : "#000",
          },
        ]}
        placeholder="Username"
        placeholderTextColor={darkMode ? "#999" : "#666"}
      />

      {/* Bio Input */}
      <TextInput
        value={bio}
        onChangeText={setBio}
        style={[
          styles.input,
          {
            height: 100,
            backgroundColor: darkMode ? "#111" : "#fff",
            borderColor: darkMode ? "#333" : "#ccc",
            color: darkMode ? "#fff" : "#000",
          },
        ]}
        placeholder="Bio"
        placeholderTextColor={darkMode ? "#999" : "#666"}
        multiline
      />

      {/* Save Button */}
      <TouchableOpacity
        style={[
          styles.btn,
          { backgroundColor: darkMode ? "#4da6ff" : "#000" },
        ]}
        onPress={handleSaveProfile}
        disabled={uploading}
      >
        <Text style={styles.btnText}>Save</Text>
      </TouchableOpacity>

      {/* 🔄 Upload Overlay */}
      <Modal visible={uploading} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.overlayBox}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.overlayText}>Saving your changes...</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", padding: 20, paddingTop: 40 },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#eee" },
  input: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  btn: {
    width: "100%",
    padding: 12,
    marginTop: 16,
    borderRadius: 8,
  },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "bold" },

  // 🌀 Overlay Styles
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayBox: {
    padding: 25,
    backgroundColor: "rgba(30,30,30,0.9)",
    borderRadius: 12,
    alignItems: "center",
  },
  overlayText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 12,
    textAlign: "center",
  },
});

