import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import api from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";

export default function RegisterScreen({ navigation }) {
  const colorScheme = useColorScheme();
  const darkMode = colorScheme === "dark";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    if (!username || !email || !password)
      return Alert.alert("All fields required");

    try {
      const res = await api.post("/auth/register", {
        username,
        email,
        password,
      });
      Alert.alert("Success", "Account created! Please login now.");
      navigation.navigate("Login");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        { backgroundColor: darkMode ? "#000" : "#f9f9f9" },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.card}>
        <Ionicons
          name="person-add-outline"
          size={80}
          color={darkMode ? "#4da6ff" : "#007bff"}
          style={{ marginBottom: 10 }}
        />
        <Text
          style={[
            styles.title,
            { color: darkMode ? "#fff" : "#111" },
          ]}
        >
          Create Account ✨
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: darkMode ? "#aaa" : "#555" },
          ]}
        >
          Join and connect with others
        </Text>

        <TextInput
          placeholder="Username"
          placeholderTextColor={darkMode ? "#999" : "#888"}
          style={[
            styles.input,
            {
              backgroundColor: darkMode ? "#111" : "#fff",
              color: darkMode ? "#fff" : "#000",
              borderColor: darkMode ? "#333" : "#ddd",
            },
          ]}
          value={username}
          onChangeText={setUsername}
        />

        <TextInput
          placeholder="Email"
          placeholderTextColor={darkMode ? "#999" : "#888"}
          style={[
            styles.input,
            {
              backgroundColor: darkMode ? "#111" : "#fff",
              color: darkMode ? "#fff" : "#000",
              borderColor: darkMode ? "#333" : "#ddd",
            },
          ]}
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor={darkMode ? "#999" : "#888"}
          secureTextEntry
          style={[
            styles.input,
            {
              backgroundColor: darkMode ? "#111" : "#fff",
              color: darkMode ? "#fff" : "#000",
              borderColor: darkMode ? "#333" : "#ddd",
            },
          ]}
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[
            styles.btn,
            { backgroundColor: darkMode ? "#4da6ff" : "#007bff" },
          ]}
          onPress={handleRegister}
        >
          <Text style={styles.btnText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={{ color: darkMode ? "#4da6ff" : "#007bff" }}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    width: "90%",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
    backgroundColor: "#fff",
  },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 20 },
  input: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
  },
  btn: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
