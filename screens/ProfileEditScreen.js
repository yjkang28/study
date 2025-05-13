import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Checkbox from 'expo-checkbox';
import RNPickerSelect from 'react-native-picker-select';
import { Ionicons } from '@expo/vector-icons';

const ProfileEditScreen = () => {
  const [gender, setGender] = useState('남');
  const [status, setStatus] = useState('재학');
  const [grade, setGrade] = useState(1);
  const [bio, setBio] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [visibility, setVisibility] = useState({
    학과: false,
    학년: false,
    성별: false,
    소개글: false,
  });

  const departments = [
    { label: '경영대학', value: '경영대학' },
    { label: '인문사회과학대학', value: '인문사회과학대학' },
    { label: '수산과학대학', value: '수산과학대학' },
    { label: '공학대학', value: '공학대학' },
    { label: '글로벌자유전공학부', value: '글로벌자유전공학부' },
    { label: '정보융합대학', value: '정보융합대학' },
    { label: '자유전공학부', value: '자유전공학부' },
    { label: '자연과학대학', value: '자연과학대학' },
    { label: '환경해양대학', value: '환경해양대학' },
    { label: '학부대학', value: '학부대학' },
    { label: '미래융합학부', value: '미래융합학부' },
  ];

  const handleSave = () => {
    Alert.alert('저장 완료', '로컬에서 테스트가 완료되었습니다.');

  };

  const toggleCheckbox = (item) => {
    setVisibility((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

 

  return (
    <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>닉네임</Text>
        <TextInput style={styles.input} placeholder="닉네임을 입력하세요." editable={true} />

        <Text style={styles.label}>프로필 공개 범위</Text>
        <View style={styles.checkboxGroup}>
          {['학과', '학년', '성별', '소개글'].map((item) => (
            <View key={item} style={styles.checkboxContainer}>
              <Checkbox
                value={visibility[item]}
                onValueChange={() => toggleCheckbox(item)}
                color={visibility[item] ? '#003366' : undefined}
              />
              <Text style={styles.checkboxLabel}>{item}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.label}>성별</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.toggleButton, gender === '남' && styles.selectedButton]}
            onPress={() => setGender('남')}
          >
            <Text style={[styles.buttonText, gender === '남' && styles.selectedText]}>남</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, gender === '여' && styles.selectedButton]}
            onPress={() => setGender('여')}
          >
            <Text style={[styles.buttonText, gender === '여' && styles.selectedText]}>여</Text>
          </TouchableOpacity>
        </View>

         <Text style={styles.label}>학과</Text>
         <View style={styles.dropdownContainer}>
        <RNPickerSelect
          onValueChange={(value) => setSelectedDepartment(value)}
          items={departments}
          placeholder={{ label: "학과를 선택하세요", value: null }}
          style={pickerSelectStyles}
          useNativeAndroidPickerStyle={false} 
        />
        <Ionicons
            name="chevron-down"
            size={20}
            color="gray"
            style={styles.dropdownIcon}
          />
        </View>

        <Text style={styles.label}>학년</Text>
        
          <View style={styles.gradeGroup}>
            {[1, 2, 3, 4, 5].map((num) => (
              <TouchableOpacity
                key={num}
                style={[styles.gradeButton, grade === num && styles.selectedButton]}
                onPress={() => setGrade(num)}
              >
                <Text style={[styles.buttonText, grade === num && styles.selectedText]}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.toggleButton, status === '재학' && styles.selectedButton]}
            onPress={() => setStatus('재학')}
          >
            <Text style={[styles.buttonText, status === '재학' && styles.selectedText]}>재학</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, status === '휴학' && styles.selectedButton]}
            onPress={() => setStatus('휴학')}
          >
            <Text style={[styles.buttonText, status === '휴학' && styles.selectedText]}>휴학</Text>
          </TouchableOpacity>
        </View>

          
          <Text style={styles.label}>소개글</Text>
          <TextInput
            style={styles.textArea}
            placeholder="내용을 입력하세요."
            value={bio}
            onChangeText={setBio}
            multiline
          />
          

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>저장</Text>
        </TouchableOpacity>
      </ScrollView>
  </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    
  },
  keyboardContainer: {
    flex: 1,
  },
  label: {
    marginTop: 10,
    marginBottom: 15,
    fontWeight: 'bold',
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonGroup: {
     borderWidth: 1,
     borderColor: '#ccc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
  },
  toggleButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  selectedButton: {
    backgroundColor: '#003366',
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
  },
  selectedText: {
    color: '#fff',
  },
  gradeGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  gradeButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    flex: 1,
    padding: 10,
    margin: 2,
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    alignItems: 'center',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
    height: 100,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButton: {
    backgroundColor: '#003366',
    padding: 15,
    borderRadius: 35,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
  },
  dropdown: {
    marginBottom: 15,
  },

  checkboxGroup: {
    flexDirection: 'row', // 가로로 나열
    flexWrap: 'wrap',     //공간이 부족하면 다음 줄로 넘어감
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,      // 간격 조절
    marginBottom: 10,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
   dropdownContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  dropdownIcon: {
    position: 'absolute',
    right: 13,
    top: 18,
    zIndex: 1,
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    height: 50,
    borderWidth: 1,
    borderColor: '#777',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    color: 'black',
    paddingRight: 30,
    marginTop: 5,
  },
  inputAndroid: {
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    height: 50,
    borderWidth: 0.5,
    borderColor: '#777',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    color: 'black',
    paddingRight: 30,
    marginTop: 5,
  },
};


export default ProfileEditScreen;
""