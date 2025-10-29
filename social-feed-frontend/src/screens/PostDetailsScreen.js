import React, { useEffect, useState, useRef, useContext } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../context/ThemeContext"; // ✅ Added

export default function PostDetailsScreen({ route }) {
  const { darkMode } = useContext(ThemeContext); // ✅ get theme
  const { postId, post } = route.params;
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const flatListRef = useRef(null);

  const loadComments = async () => {
    try {
      const res = await api.get(`/posts/${postId}/comments`);
      setComments(res.data.comments || []);
    } catch (err) {
      console.error("Fetch comments error:", err.response?.data || err.message);
    }
  };

  const handleAddComment = async () => {
    if (!text.trim()) return;
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await api.post(
        `/posts/${postId}/comments`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments((prev) => [...prev, res.data.comment]);
      setText("");

      // auto scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    } catch (err) {
      console.error("Add comment error:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    loadComments();
  }, []);

  const renderComment = ({ item }) => (
    <View
      style={[
        styles.comment,
        {
          borderBottomColor: darkMode ? "#333" : "#ddd",
          backgroundColor: darkMode ? "#000" : "#fff",
        },
      ]}
    >
      <Image
        source={
          item.user?.avatarUrl
            ? { uri: item.user.avatarUrl }
            : require("../../assets/default-avatar.png")
        }
        style={styles.avatar}
      />
      <View style={{ marginLeft: 10, flex: 1 }}>
        <Text
          style={{
            fontWeight: "bold",
            color: darkMode ? "#fff" : "#000",
          }}
        >
          {item.user?.username ?? "User"}
        </Text>
        <Text style={{ color: darkMode ? "#ccc" : "#000" }}>
          {item.text ?? ""}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: darkMode ? "#000" : "#fff" },
      ]}
    >
      <KeyboardAvoidingView
        style={[
          styles.keyboardContainer,
          { backgroundColor: darkMode ? "#000" : "#fff" },
        ]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FlatList
          ref={flatListRef}
          data={comments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderComment}
          style={{
            backgroundColor: darkMode ? "#000" : "#fff",
            flex: 1,
          }}
          contentContainerStyle={{
            paddingBottom: 80,
            backgroundColor: darkMode ? "#000" : "#fff",
          }}
          ListHeaderComponent={() => (
            <View
              style={[
                styles.postHeader,
                { backgroundColor: darkMode ? "#000" : "#fff" },
              ]}
            >
              <Image
                source={{ uri: post?.imageUrl }}
                style={styles.postImage}
              />
              <View style={{ padding: 10 }}>
                <Text
                  style={{
                    fontWeight: "bold",
                    color: darkMode ? "#fff" : "#000",
                  }}
                >
                  {post?.user?.username ?? "Unknown"}
                </Text>
                <Text style={{ color: darkMode ? "#ccc" : "#000" }}>
                  {post?.caption ?? ""}
                </Text>
              </View>
            </View>
          )}
        />

        {/* ✅ Input Box */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: darkMode ? "#111" : "#fff",
              borderTopColor: darkMode ? "#333" : "#ddd",
            },
          ]}
        >
          <TextInput
            placeholder="Add a comment..."
            placeholderTextColor={darkMode ? "#777" : "#999"}
            value={text}
            onChangeText={setText}
            style={[
              styles.input,
              {
                backgroundColor: darkMode ? "#1a1a1a" : "#f2f2f2",
                color: darkMode ? "#fff" : "#000",
              },
            ]}
          />
          <TouchableOpacity onPress={handleAddComment}>
            <Ionicons
              name="send"
              size={24}
              color={darkMode ? "#4da6ff" : "#007bff"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  keyboardContainer: { flex: 1 },
  postHeader: { marginBottom: 8 },
  postImage: { width: "100%", height: 300 },
  comment: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 0.5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eee",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    padding: 10,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 8,
  },
});


