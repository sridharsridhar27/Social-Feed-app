import React, { useEffect, useState, useCallback, useContext } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
} from "react-native";
import { ThemeContext } from "../context/ThemeContext"; // ✅ Added
import api from "../services/api";
import PostCard from "../components/PostCard";

const PAGE_SIZE = 8;

export default function HomeScreen() {
  const { darkMode } = useContext(ThemeContext); // ✅ Dark mode context
  const [posts, setPosts] = useState([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(
    async (opts = { refresh: false }) => {
      try {
        if (loading && !opts.refresh) return;
        if (opts.refresh) {
          setRefreshing(true);
          setOffset(0);
          setHasMore(true);
        } else {
          setLoading(true);
        }

        const limit = PAGE_SIZE;
        const currentOffset = opts.refresh ? 0 : offset;

        const res = await api.get(`/posts?limit=${limit}&offset=${currentOffset}`);
        const fetched = res.data?.posts || [];

        if (opts.refresh) {
          setPosts(fetched);
          setOffset(fetched.length);
        } else {
          setPosts((prev) => [...prev, ...fetched]);
          setOffset((prev) => prev + fetched.length);
        }

        if (fetched.length < limit) setHasMore(false);
      } catch (err) {
        console.error("Fetch posts error:", err.response?.data || err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [offset, loading]
  );

  useEffect(() => {
    fetchPosts({ refresh: true });
  }, []);

  const handleRefresh = () => fetchPosts({ refresh: true });
  const handleEndReached = () => {
    if (!hasMore || loading) return;
    fetchPosts({ refresh: false });
  };

  const renderFooter = () => {
    if (!loading) return null;
    return <ActivityIndicator style={{ margin: 12 }} color={darkMode ? "#fff" : "#000"} />;
  };

  if (!posts.length && loading) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: darkMode ? "#000" : "#fff" },
        ]}
      >
        <ActivityIndicator color={darkMode ? "#fff" : "#000"} />
      </View>
    );
  }

  if (!posts.length && !loading) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: darkMode ? "#000" : "#fff" },
        ]}
      >
        <Text style={{ color: darkMode ? "#fff" : "#000" }}>
          No posts yet. Create the first one!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => <PostCard post={item} />}
      contentContainerStyle={[
        styles.listContainer,
        { backgroundColor: darkMode ? "#000" : "#fff" },
      ]}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={darkMode ? "#fff" : "#000"}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 12,
    minHeight: "100%",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});


