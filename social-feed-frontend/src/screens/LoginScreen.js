import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";

export default function LoginScreen({ navigation }) {
  const colorScheme = useColorScheme();
  const darkMode = colorScheme === "dark";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("All fields required");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      await AsyncStorage.setItem("token", res.data.token);
      navigation.replace("MainApp");
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
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
          name="person-circle-outline"
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
          Welcome Back 👋
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: darkMode ? "#aaa" : "#555" },
          ]}
        >
          Login to continue
        </Text>

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
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={{ color: darkMode ? "#4da6ff" : "#007bff" }}>
            Don’t have an account? Register
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



