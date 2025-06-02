import React from 'react';
import {
  View,Text,StyleSheet, FlatList, TouchableOpacity, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export default function SearchResultScreen({ route }) {
  const {
    category,
    gender,
    field,
    subFields = [],
  } = route.params || {};

  const navigation = useNavigation();
  // 🟡 더미 검색 결과 (없을 경우 빈 배열로 테스트 가능)
  const searchResults = [
    { id: '1', title: '검색한 스터디 1', leader: 'leader_name', people: '00/00' },
    { id: '2', title: '검색한 스터디 2', leader: 'leader_name', people: '00/00' },
    { id: '3', title: '검색한 스터디 3', leader: 'leader_name', people: '00/00' },
    { id: '4', title: '검색한 스터디 4', leader: 'leader_name', people: '00/00' },
  ];

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('스터디 소개글', { study: item })}>
        <View style={styles.resultItem}>
        <Text style={styles.studyTitle}>{item.title}</Text>
        <View style={styles.studyInfo}>
            <Text style={styles.leaderName}>{item.leader}</Text>
            <Text style={styles.peopleCount}>인원수 {item.people}</Text>
        </View>
        </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
    <View style={styles.container}>
      {/* 🔍 검색 바 */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#aaa" />
        <TextInput placeholder="검색" style={styles.searchInput} />
        <TouchableOpacity  onPress={() => navigation.navigate('카테고리 검색')}>
          <Ionicons name="options-outline" size={24} color="#aaa" />
        </TouchableOpacity>
      </View>

      {/* ✅ 선택된 필터들 표시 */}
      <View style={styles.selectedFilters}>
        {category && <FilterTag label={category} />}
        {gender && <FilterTag label={gender} />}
        {field && <FilterTag label={field} />}
        {subFields.map((item, idx) => (
          <FilterTag key={idx} label={item} />
        ))}
      </View>

      {/* 📋 검색 결과 */}
      {searchResults.length === 0 ? (
        <View style={styles.noResultContainer}>
          <Text style={styles.noResultText}>검색 결과가 없습니다.</Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.resultList}
        />
      )}
    </View>
    </SafeAreaView>
  );
}

const FilterTag = ({ label }) => (
  <View style={styles.filterTag}>
    <Text style={styles.filterTagText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
  },
  selectedFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterTag: {
    borderWidth: 1,
    borderColor: '#00aaff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterTagText: {
    color: '#00aaff',
    fontSize: 13,
  },
  resultList: {
    paddingBottom: 16,
  },
  resultItem: {
    borderBottomWidth: 0.8,
    borderBottomColor: '#ccc',
    paddingVertical: 17,
  },
  studyTitle: {
    fontSize: 16,
    fontWeight: 600,
  },
  studyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  leaderName: {
    color: '#888',
    fontSize: 13,
  },
  peopleCount: {
    color: '#bbb',
    fontSize: 13,
  },
  noResultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  noResultText: {
    fontSize: 16,
    color: '#aaa',
  },
});