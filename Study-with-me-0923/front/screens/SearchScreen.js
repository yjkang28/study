import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useIsFocused, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';

const NAVY = '#0E2A3B';
const BORDER = '#E6E6E6';
const CHIP_BORDER = '#CFE2F3';
const CHIP_BG = '#F6FAFF';
const CHIP_TEXT = '#17A1FA';

const SearchScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const isFocused = useIsFocused();

  const [filteredStudies, setFilteredStudies] = useState([]);
  const [categorySelected, setCategorySelected] = useState(false);
  const [userId, setUserId] = useState(null);

  // 로그인 유저 ID (그대로)
  useEffect(() => {
    const loadUser = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        if (id) setUserId(id);
      } catch (err) {
        console.error('❌ 사용자 ID 로드 실패:', err.message);
      }
    };
    loadUser();
  }, []);

  // 스터디 검색 (그대로)
  useEffect(() => {
    const fetchStudies = async () => {
      if (isFocused && route.params) {
        const { duration, gender_rule, category, subCategory } = route.params;
        try {
          const query = new URLSearchParams({
            ...(duration && { duration }),
            ...(gender_rule && { gender_rule }),
            ...(category && { category }),
            ...(subCategory && { subCategory }),
          }).toString();

          const res = await api.get(`/studies/search?${query}`);
          setFilteredStudies(res.data);
          setCategorySelected(true);
        } catch (err) {
          console.error('❌ 검색 실패:', err.message);
        }
      }
    };
    fetchStudies();
  }, [route.params, isFocused]);

  // 칩 라벨(선택 없으면 빈 배열 -> 칩 영역 숨김)
  const chips = (() => {
    const p = route.params || {};
    const arr = [];
    if (p.category) arr.push(p.category);
    if (p.subCategory) arr.push(p.subCategory);
    if (p.gender_rule) arr.push(p.gender_rule);
    if (p.duration) arr.push(`${p.duration}`);
    return arr;
  })();

  return (
    <View style={styles.container}>
      
      {/* 상단 캡슐형 카테고리 설정 버튼 */}
      <TouchableOpacity
        onPress={() => navigation.navigate('카테고리검색')}
        activeOpacity={0.8}
        style={styles.categoryCapsule}
      >
        <Text style={styles.categoryText}>카테고리 설정</Text>
        <View style={styles.gearCircle}>
          <Ionicons name="options-outline" size={18} color="#444" />
        </View>
      </TouchableOpacity>

      {/* 선택 칩 (있을 때만 렌더) */}
      {chips.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroller}              
          contentContainerStyle={styles.chipRow}
        >
          {chips.map((label, idx) => (
            <View key={`${label}-${idx}`} style={styles.chip}>
              <Text style={styles.chipText}>{label}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* 상단 디바이더 */}
      <View style={styles.divider} />

      {/* 리스트 */}
      <ScrollView contentContainerStyle={styles.listWrap}>
        {!categorySelected ? (
          <Text style={styles.infoText}>카테고리를 설정하세요</Text>
        ) : filteredStudies.length === 0 ? (
          <Text style={styles.infoText}>조건에 맞는 스터디가 없습니다</Text>
        ) : (
          filteredStudies.map((study, i) => (
            <TouchableOpacity
              key={study._id}
              style={[styles.row, i === filteredStudies.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => navigation.navigate('스터디소개', { study, userId })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle} numberOfLines={1}>{study.title}</Text>
                <Text style={styles.rowSub} numberOfLines={1}>
                  {study.category}{study.subCategory ? ` · ${study.subCategory}` : ''}
                </Text>
              </View>
              <Text style={styles.rowMeta}>인원수 00/00</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* 플로팅 + 버튼 (탭바와 겹치지 않게 살짝 위로) */}
      <TouchableOpacity
        style={styles.floatingBtn}
        onPress={() => navigation.navigate('스터디개설')}
      >
        <Text style={styles.plusText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

 
  categoryCapsule: {
    marginTop: 12,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: '#F4F6F8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  gearCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EDEFF2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsScroller: {
    flexGrow: 0,
    flexShrink: 0,
    maxHeight: 44,     // 칩 높이 한 줄 고정
  },

  chipRow: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 6,
    alignItems: 'center', // ✅ 칩이 세로로 늘지 않도록
    marginTop:2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: CHIP_BORDER,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    marginRight: 8,
    alignSelf: 'flex-start',
    minHeight: 32,
    justifyContent: 'center',
  },
  chipText: { color: CHIP_TEXT, fontSize: 13, fontWeight: '600' },

  divider: { height: 1, backgroundColor: BORDER, marginTop: 8 },

  listWrap: {
    paddingHorizontal: 16,
    paddingBottom: 120, // 탭바/플로팅 버튼 피하기
  },
  infoText: { fontSize: 15, color: '#888', textAlign: 'center', marginTop: 24 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  rowTitle: { fontSize: 15, fontWeight: '700', color: '#222' },
  rowSub: { marginTop: 2, color: '#6B7280', fontSize: 12 },
  rowMeta: { color: '#8A8A8A', fontSize: 12, marginLeft: 12 },

  floatingBtn: {
    position: 'absolute',
    right: 16,
    bottom: 30, // 탭바 위로
    backgroundColor: '#00aaff',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    zIndex: 10,
  },
  plusText: {
    fontSize: 30,
    color: 'white',
    fontWeight: 'bold',
    lineHeight: 30,
    textAlign: 'center',
  },
});

export default SearchScreen;