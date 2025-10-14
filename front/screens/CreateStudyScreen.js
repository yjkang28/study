import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const CreateStudyScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [studyName, setStudyName] = useState('');
  const [maxMembers, setMaxMembers] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (route.params?.selectedCategories) setSelectedCategories(route.params.selectedCategories);
    if (route.params?.studyName !== undefined) setStudyName(route.params.studyName);
    if (route.params?.maxMembers !== undefined) setMaxMembers(route.params.maxMembers);
    if (route.params?.description !== undefined) setDescription(route.params.description);
  }, [route.params]);

  const checkDuplicateName = () => {
    if (!studyName.trim()) {
      Alert.alert('알림', '스터디 이름을 입력해주세요', [{ text: '확인', style: 'default' }]);
    } else {
      Alert.alert('확인 완료', '사용 가능한 이름입니다', [{ text: '확인', style: 'default' }]);
    }
  };

  const removeCategory = (category) => {
    setSelectedCategories((prev) => prev.filter((cat) => cat !== category));
  };

  const handleCreate = async () => {
    if (!studyName || !description) {
      Alert.alert('알림', '필수 항목을 모두 입력해주세요', [{ text: '확인', style: 'default' }]);
      return;
    }

    try {
      const userId = await AsyncStorage.getItem('userId');

      const mainCategories = ['취업', '자격증', '대회', '영어', '출석'];
      const category = selectedCategories.find(c => mainCategories.includes(c)) || '';
      const subCategory = selectedCategories.find(
        c => !mainCategories.includes(c) &&
             c !== '자유' && c !== '정규' &&
             c !== '남' && c !== '여' && c !== '무관' &&
             !['월','화','수','목','금','토','일'].includes(c)
      ) || '';
      const duration = selectedCategories.includes('정규') ? '정규' : '자유';
      const days = selectedCategories.filter(c => ['월','화','수','목','금','토','일'].includes(c));
      const gender_rule = selectedCategories.find(c => ['남','여','무관'].includes(c)) || '무관';

      const res = await api.post('/studies/create', {
        title: studyName,
        description,
        category,
        subCategory,
        gender_rule,
        duration,
        days,
        capacity: maxMembers === '00' ? 0 : parseInt(maxMembers) || 0,
        host: userId,
      });

      Alert.alert('성공', '스터디가 생성되었습니다!', [{ text: '확인', style: 'default' }]);

      if (res.data.chatRoomId) {
        navigation.navigate('ChatRoomScreen', {
          roomId: res.data.chatRoomId,
          studyId: res.data.study._id,
        });
      } else {
        navigation.goBack();
      }
    } catch (err) {
      console.error('❌ 스터디 생성 실패:', err.message);
      Alert.alert('오류', '스터디 생성에 실패했습니다', [{ text: '확인', style: 'default' }]);
    }
  };

  const renderCategoryChips = () => {
    return selectedCategories.map((cat) => (
      <View key={cat} style={styles.categoryChip}>
        <Text style={styles.chipText}>{cat}</Text>
        <TouchableOpacity
          onPress={() => removeCategory(cat)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.chipRemove}>✕</Text>
        </TouchableOpacity>
      </View>
    ));
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      {/* 스터디 이름 섹션 */}
      <View style={styles.card}>
        <Text style={styles.label}>스터디 이름</Text>
        <Text style={styles.subtitle}>최대 10자까지 입력 가능합니다</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="예) 토익 900점 달성하기"
            placeholderTextColor="#999"
            maxLength={10}
            value={studyName}
            onChangeText={setStudyName}
          />
          <TouchableOpacity style={styles.checkButton} onPress={checkDuplicateName}>
            <Text style={styles.checkButtonText}>중복 확인</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 최대인원 섹션 */}
      <View style={styles.card}>
        <Text style={styles.label}>스터디 최대인원</Text>
        <Text style={styles.subtitle}>00 입력시 무제한으로 설정됩니다</Text>
        <View style={styles.memberInputRow}>
          <TextInput
            style={[styles.input, styles.memberInput]}
            placeholder="최대인원을 입력하세요"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={maxMembers}
            onChangeText={setMaxMembers}
          />
          <Text style={styles.memberUnit}>명</Text>
        </View>
      </View>

      {/* 카테고리 섹션 */}
      <View style={styles.card}>
        <Text style={styles.label}>스터디 카테고리</Text>
        <Text style={styles.subtitle}>스터디 특성에 맞는 카테고리를 추가하세요</Text>
        <View style={styles.categoryContainer}>
          {selectedCategories.length === 0 ? (
            <Text style={styles.emptyCategoryText}>선택된 카테고리가 없습니다</Text>
          ) : (
            renderCategoryChips()
          )}
        </View>
        <TouchableOpacity
          style={styles.addCategoryButton}
          onPress={() =>
            navigation.navigate('카테고리선택', {
              selectedCategories,
              studyName,
              maxMembers,
              description,
            })
          }>
          <Text style={styles.addCategoryText}>+ 카테고리 추가</Text>
        </TouchableOpacity>
      </View>

      {/* 소개글 섹션 */}
      <View style={styles.card}>
        <Text style={styles.label}>스터디 소개</Text>
        <Text style={styles.subtitle}>스터디를 소개하는 글을 작성해주세요 (최대 500자)</Text>
        <TextInput
          style={styles.descriptionInput}
          placeholder="스터디의 목표, 진행 방식, 참여 조건 등을 자유롭게 작성해주세요."
          placeholderTextColor="#999"
          multiline
          maxLength={500}
          value={description}
          onChangeText={setDescription}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{description.length} / 500자</Text>
      </View>

      {/* 개설 버튼 */}
      <TouchableOpacity style={styles.submitButton} onPress={handleCreate}>
        <Text style={styles.submitButtonText}>스터디 개설하기</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 52,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
  checkButton: {
    height: 52,
    paddingHorizontal: 20,
    backgroundColor: '#0066FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  memberInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberInput: {
    flex: 1,
  },
  memberUnit: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    minHeight: 40,
    alignItems: 'center',
  },
  emptyCategoryText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F3FF',
    borderRadius: 20,
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 8,
    gap: 6,
  },
  chipText: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '500',
  },
  chipRemove: {
    fontSize: 16,
    color: '#0066FF',
    fontWeight: '600',
  },
  addCategoryButton: {
    marginTop: 12,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  addCategoryText: {
    fontSize: 15,
    color: '#0066FF',
    fontWeight: '600',
  },
  descriptionInput: {
    height: 140,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  submitButton: {
    height: 56,
    backgroundColor: '#0066FF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default CreateStudyScreen;