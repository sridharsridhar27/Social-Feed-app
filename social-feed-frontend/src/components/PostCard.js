import React, { useState, useContext } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { ThemeContext } from "../context/ThemeContext"; // ✅ Added for dark mode
import api from "../services/api";

export default function PostCard({ post }) {
  const navigation = useNavigation();
  const { darkMode } = useContext(ThemeContext); // ✅ read theme
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post._count?.likes || 0);

  const handleLike = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      // optimistic UI update
      const newLiked = !liked;
      setLiked(newLiked);
      setLikeCount((prev) => prev + (newLiked ? 1 : -1));

      await api.post(`/posts/${post.id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Like error:", err.response?.data || err.message);
    }
  };

  const openComments = () => {
    navigation.navigate("PostDetails", { postId: post.id, post });
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: darkMode ? "#111" : "#fff" },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={
            post.user?.avatarUrl
              ? { uri: post.user.avatarUrl }
              : require("../../assets/default-avatar.png")
          }
          style={styles.avatar}
        />
        <View style={{ marginLeft: 10 }}>
          <Text
            style={[
              styles.username,
              { color: darkMode ? "#fff" : "#000" },
            ]}
          >
            {post.user?.username || "Unknown"}
          </Text>
          <Text style={[styles.time, { color: darkMode ? "#aaa" : "#666" }]}>
            {new Date(post.createdAt).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Image */}
      <Image source={{ uri: post.imageUrl }} style={styles.postImage} />

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={handleLike}>
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={26}
            color={liked ? "red" : darkMode ? "#fff" : "#000"}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={openComments} style={{ marginLeft: 15 }}>
          <Ionicons
            name="chatbubble-outline"
            size={24}
            color={darkMode ? "#fff" : "#000"}
          />
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text
          style={[
            styles.likes,
            { color: darkMode ? "#fff" : "#000" },
          ]}
        >
          {likeCount} likes
        </Text>
        <Text
          style={[
            styles.caption,
            { color: darkMode ? "#ddd" : "#000" },
          ]}
        >
          <Text style={{ fontWeight: "bold", color: darkMode ? "#fff" : "#000" }}>
            {post.user?.username}{" "}
          </Text>
          {post.caption}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eee",
  },
  username: { fontWeight: "600", fontSize: 15 },
  time: { fontSize: 12 },
  postImage: {
    width: "100%",
    height: 320,
    backgroundColor: "#ddd",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  footer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  likes: { fontWeight: "600", fontSize: 14 },
  caption: { marginTop: 4, fontSize: 14 },
});

