import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const COLORS = {
  primary: '#4F46E5',     // 포인트 보라 (메인과 통일)
  primaryDark: '#3730A3',
  bg: '#F8FAFC',          // 메인 배경
  card: '#FFFFFF',        // 카드/버튼 배경
  text: '#0F172A',        // 기본 텍스트
  textLight: '#475569',   // 보조 텍스트
  muted: '#94A3B8',       // 흐린 텍스트
  border: '#E2E8F0',      // 연한 보더
};

const detailedCategories = {
  취업: ['기획/전략', '회계/사무', '마케팅', 'IT', '디자인'],
  자격증: ['한국사', '토익', '컴활', '운전면허'],
  대회: ['공모전', '해커톤', '아이디어', '창업'],
  영어: ['토익', '토플', '스피킹', '회화'],
  출석: ['출석관리', '출결인증']
};

const SearchCategories = ({ navigation }) => {
  const [duration, setDuration] = useState(null);
  const [gender_rule, setGender] = useState(null);
  const [category, setCategory] = useState(null);
  const [subCategory, setSubCategory] = useState(null);

  const toggleSelection = (current, setter, value) => {
    setter(current === value ? null : value);
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* 스터디 종류 */}
        <Text style={styles.title}>스터디 종류</Text>
        <View style={styles.row}>
          {['자유', '정규'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.buttonBase, styles.wideButton, duration === type && styles.selectedButton]}
              onPress={() => toggleSelection(duration, setDuration, type)}
            >
              <Text style={[styles.buttonText, duration === type && styles.selectedButtonText]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 성별 */}
        <Text style={styles.title}>성별</Text>
        <View style={styles.row}>
          {['남', '여', '무관'].map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.buttonBase, styles.wideButton, gender_rule === g && styles.selectedButton]}
              onPress={() => toggleSelection(gender_rule, setGender, g)}
            >
              <Text style={[styles.buttonText, gender_rule === g && styles.selectedButtonText]}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 스터디 분야 */}
        <Text style={styles.title}>스터디 분야</Text>
        <View style={styles.rowWrap}>
          {Object.keys(detailedCategories).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.buttonBase, styles.pill, category === cat && styles.selectedButton]}
              onPress={() => {
                setCategory(category === cat ? null : cat);
                setSubCategory(null);
              }}
            >
              <Text style={[styles.buttonText, styles.pillText, category === cat && styles.selectedButtonText]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 세부 분야 */}
        {category && (
          <>
            <Text style={styles.title}>세부 분야</Text>
            <View style={styles.rowWrap}>
              {detailedCategories[category].map((sub) => (
                <TouchableOpacity
                  key={sub}
                  style={[styles.buttonBase, styles.pill, subCategory === sub && styles.selectedButton]}
                  onPress={() => toggleSelection(subCategory, setSubCategory, sub)}
                >
                  <Text style={[styles.buttonText, styles.pillText, subCategory === sub && styles.selectedButtonText]}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* 검색 버튼 */}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={() =>
          navigation.navigate('Tabs', {
            screen: '검색',
            params: { duration, gender_rule, category, subCategory },
          })
        }
      >
        <Text style={styles.submitButtonText}>검색 결과 보기</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  title: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: COLORS.text, 
    marginVertical: 12, 
    paddingLeft: 16 
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 16, 
    paddingHorizontal: 12 
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 12,
  },

  // 공통 버튼 베이스
  buttonBase: {
    marginHorizontal: 4,
    marginVertical: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: 'center',
  },
  wideButton: { flex: 1 },

  pill: {
    flex: 0,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    marginRight: 8,
    marginBottom: 8,
  },
  pillText: { fontSize: 15, includeFontPadding: false },

  // 선택 상태
  selectedButton: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  buttonText: { fontSize: 16, color: COLORS.text },
  selectedButtonText: { color: '#FFFFFF' },

  // 제출 버튼
  submitButton: {
    marginHorizontal: 20,
    marginBottom: 60,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 35,
    alignItems: 'center',
  },
  submitButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});

export default SearchCategories;