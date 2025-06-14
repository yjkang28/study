import React from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const studyData = [
  { id: '1', title: '추천 스터디 1', leader: 'leader_name', members: '00/00' },
  { id: '2', title: '추천 스터디 2', leader: 'leader_name', members: '00/00' },
  { id: '3', title: '추천 스터디 3', leader: 'leader_name', members: '00/00' },
  { id: '4', title: '추천 스터디 4', leader: 'leader_name', members: '00/00' },
];

const SearchScreen = () => {
    const navigation = useNavigation();

  const renderItem = ({ item }) => (
     <TouchableOpacity onPress={() => navigation.navigate('스터디 소개글', { study: item })}>
      <View style={styles.studyCard}>
      <Text style={styles.studyTitle}>{item.title}</Text>
      <View style={styles.studyInfo}>
        <Text style={styles.studyLeader}>{item.leader}</Text>
        <Text style={styles.studyMemberCount}>인원수 {item.members}</Text>
      </View>
    </View>
    </TouchableOpacity>
  );

  return (
    
      <View style={styles.container}>
      {/* 검색창 */}
      <TouchableOpacity  onPress={() => navigation.navigate('카테고리 검색')}>
        <View style={styles.searchBar}>
          <Text style={styles.categoryText}> 카테고리 설정</Text>
            <Ionicons name="options-outline" size={20} color="#333" />
        </View>
      </TouchableOpacity>
      {/* 목록 */}
      
      <FlatList
        data={studyData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContainer}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('스터디 개설')}
        >
        <Ionicons name="add-outline" size={28} color="white" />
      </TouchableOpacity>
    </View>
    
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 35,
  
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 11,
    marginLeft: 16,
    marginRight: 16,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'space-between',
    height : 50,
  },
  categoryText: {
    fontsize:  16,
    fontWeight: '600',
    color: '#888'
  },
  
  listContainer: {
    paddingHorizontal: 16,
  },
  studyCard: {
    paddingVertical: 16,
  },
  studyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  studyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  studyLeader: {
    fontSize: 14,
    color: '#888',
  },
  studyMemberCount: {
    fontSize: 14,
    color: '#888',
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#00aaff',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    zIndex: 10,

  },
});