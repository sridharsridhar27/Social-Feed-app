import React, { useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../context/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";

export default function ProfileScreen({ route, navigation }) {
  const { darkMode } = useContext(ThemeContext);
  const userParam = route?.params?.user || null;
  const updatedUserParam = route?.params?.updatedUser || null;
  const [user, setUser] = useState(userParam);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userPosts, setUserPosts] = useState([]);

  const numColumns = 3;
  const imageSize = Dimensions.get("window").width / numColumns - 2;

  // 🔹 Token header
  const tokenHeader = async () => ({
    headers: { Authorization: `Bearer ${await AsyncStorage.getItem("token")}` },
  });

  // 🔹 Load own profile
  const loadMyProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data.user);
      await loadUserPosts(res.data.user.id);
    } catch (err) {
      console.error("Profile load error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch posts
  const loadUserPosts = async (id) => {
    try {
      const res = await api.get(`/posts/user/${id}`);
      setUserPosts(res.data.posts || []);
    } catch (err) {
      console.error("Fetch user posts error:", err.response?.data || err.message);
    }
  };

  // 🔹 Follow status
  const checkFollow = async () => {
    if (!user) return;
    try {
      const { data } = await api.get(
        `/users/${user.id}/isFollowing`,
        await tokenHeader()
      );
      setIsFollowing(data.isFollowing);
    } catch (err) {
      console.error("checkFollow error:", err.response?.data || err.message);
    }
  };

  // 🔹 Follow toggle
  const toggleFollow = async () => {
    if (!user) return;
    try {
      const url = isFollowing
        ? `/users/${user.id}/unfollow`
        : `/users/${user.id}/follow`;
      await api.post(url, {}, await tokenHeader());
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error("Follow toggle error:", err.response?.data || err.message);
    }
  };

  // ✅ Instant refresh when returning from edit
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const refreshProfile = async () => {
        if (!isActive) return;

        // 🟢 Case 1: Coming from EditProfileScreen
        if (updatedUserParam) {
          setUser(updatedUserParam);
          await loadUserPosts(updatedUserParam.id);
          setLoading(false);
          return;
        }

        // 🟢 Case 2: Viewing another user's profile
        if (userParam) {
          setUser(userParam);
          await checkFollow();
          await loadUserPosts(userParam.id);
          setLoading(false);
          return;
        }

        // 🟢 Case 3: Own profile (default)
        await loadMyProfile();
      };

      refreshProfile();

      return () => {
        isActive = false;
      };
    }, [updatedUserParam, userParam])
  );

  // ✅ Loading indicator
  if (loading) {
    return (
      <View
        style={[styles.center, { backgroundColor: darkMode ? "#000" : "#fff" }]}
      >
        <ActivityIndicator size="large" color={darkMode ? "#fff" : "#000"} />
      </View>
    );
  }

  // ✅ No user case
  if (!user) {
    return (
      <View
        style={[styles.center, { backgroundColor: darkMode ? "#000" : "#fff" }]}
      >
        <Text style={{ color: darkMode ? "#fff" : "#000" }}>
          No user selected
        </Text>
      </View>
    );
  }

  // ✅ Profile Header
  const renderHeader = () => (
    <View style={{ paddingBottom: 10 }}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: darkMode ? "#111" : "#fff",
            shadowColor: darkMode ? "#000" : "#ccc",
          },
        ]}
      >
        <Image
          key={user.avatarUrl}
          source={
            user.avatarUrl
              ? { uri: user.avatarUrl }
              : require("../../assets/default-avatar.png")
          }
          style={styles.avatar}
        />
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text
              style={[styles.statNumber, { color: darkMode ? "#fff" : "#000" }]}
            >
              {userPosts.length}
            </Text>
            <Text
              style={[styles.statLabel, { color: darkMode ? "#aaa" : "#666" }]}
            >
              Posts
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text
              style={[styles.statNumber, { color: darkMode ? "#fff" : "#000" }]}
            >
              {user.followers ?? 0}
            </Text>
            <Text
              style={[styles.statLabel, { color: darkMode ? "#aaa" : "#666" }]}
            >
              Followers
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text
              style={[styles.statNumber, { color: darkMode ? "#fff" : "#000" }]}
            >
              {user.following ?? 0}
            </Text>
            <Text
              style={[styles.statLabel, { color: darkMode ? "#aaa" : "#666" }]}
            >
              Following
            </Text>
          </View>
        </View>
      </View>

      <View style={{ alignItems: "center", marginTop: 10 }}>
        <Text style={[styles.username, { color: darkMode ? "#fff" : "#000" }]}>
          {user.username}
        </Text>
        <Text style={[styles.bio, { color: darkMode ? "#bbb" : "#555" }]}>
          {user.bio || "No bio yet"}
        </Text>
      </View>

      {/* Buttons */}
      {route?.params?.user ? (
        <TouchableOpacity
          style={[
            styles.followBtn,
            {
              backgroundColor: isFollowing
                ? darkMode
                  ? "#222"
                  : "#ddd"
                : "#007bff",
            },
          ]}
          onPress={toggleFollow}
        >
          <Text
            style={[
              styles.followText,
              {
                color: isFollowing
                  ? darkMode
                    ? "#fff"
                    : "#000"
                  : "#fff",
              },
            ]}
          >
            {isFollowing ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("EditProfile", { user })}
          >
            <Ionicons
              name="create-outline"
              size={20}
              color={darkMode ? "#4da6ff" : "#007bff"}
            />
            <Text
              style={{
                color: darkMode ? "#4da6ff" : "#007bff",
                marginLeft: 6,
                fontWeight: "500",
              }}
            >
              Edit Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("Settings")}
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={darkMode ? "#ccc" : "#333"}
            />
            <Text
              style={{
                color: darkMode ? "#ccc" : "#333",
                marginLeft: 6,
                fontWeight: "500",
              }}
            >
              Settings
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Section Title */}
      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold",
          color: darkMode ? "#fff" : "#000",
          marginTop: 20,
          marginLeft: 10,
        }}
      >
        Posts
      </Text>
    </View>
  );

  // ✅ Return list
  return (
    <FlatList
      data={userPosts}
      keyExtractor={(item) => item.id.toString()}
      numColumns={numColumns}
      ListHeaderComponent={renderHeader}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("PostDetails", { postId: item.id, post: item })
          }
        >
          <Image
            source={{ uri: item.imageUrl }}
            style={{
              width: imageSize,
              height: imageSize,
              margin: 1,
              backgroundColor: darkMode ? "#222" : "#ccc",
            }}
          />
        </TouchableOpacity>
      )}
      contentContainerStyle={{
        backgroundColor: darkMode ? "#000" : "#f8f8f8",
        paddingBottom: 40,
      }}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    margin: 12,
    elevation: 4,
  },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#eee" },
  statsContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    marginLeft: 12,
  },
  statBox: { alignItems: "center" },
  statNumber: { fontSize: 18, fontWeight: "bold" },
  statLabel: { fontSize: 13 },
  username: { fontSize: 22, fontWeight: "bold" },
  bio: { fontSize: 14, textAlign: "center", marginTop: 6 },
  followBtn: {
    alignSelf: "center",
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  followText: { fontSize: 16, fontWeight: "600", textAlign: "center" },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    gap: 20,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#444",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});











