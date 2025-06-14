import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const fieldSubFields = {
  "취업": ["기획/전략", "회계/세무", "마케팅", "IT", "디자인", "금융", "의료", "미디어/문화", "공기업", "공무원"],
  "자격증": ["인문사회과학대학", "자연과학", "경영대학", "공과대학", "수산과학", "환경/해양대학", "정보융합대학", "학부대학", "미래융합대학"],
};

const categories = ['자유', '정규'];
const genders = ['남', '여', '무관'];
const fields = ['취업', '자격증', '대회', '영어', '출석'];

const CategorySelect = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [selectedSubFields, setSelectedSubFields] = useState([]);
  const navigation = useNavigation();
  const route = useRoute();
  const onSelect = route.params?.onSelect;

  const toggleSelection = (current, setter, value) => {
    setter(current === value ? null : value);
    if (setter === setSelectedField) {
      setSelectedSubFields([]); // 분야 바꾸면 상세 초기화
    }
  };

  const toggleSubFieldSelection = (value) => {
    setSelectedSubFields((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const handleSubmit = () => {
    const allSelected = [
      selectedCategory,
      selectedGender,
      selectedField,
      ...selectedSubFields,
    ].filter(Boolean);

    if (onSelect) onSelect(allSelected);
    navigation.goBack();
  };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={styles.container}>
        <ScrollView>
          {/* 스터디 종류 */}
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>스터디 종류</Text>
            <View style={styles.optionList}>
              {['자유', '정규'].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.optionItem}
                 onPress={() =>
                    setSelectedCategory(selectedCategory === item ? null : item)
                  }
                >
                  <View style={[
                    styles.radioCircle,
                    selectedCategory === item && styles.radioCircleSelected
                  ]}>
                    {selectedCategory === item && (
                      <MaterialIcons name="check" size={14} color="white" />
                    )}
                  </View>
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>성별</Text>
            <View style={styles.optionList}>
              {['남', '여', '무관'].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.optionItem}
                  onPress={() =>
                      setSelectedGender(selectedGender === item ? null : item)
                    }
                >
                  <View style={[
                    styles.radioCircle,
                    selectedGender === item && styles.radioCircleSelected
                  ]}>
                    {selectedGender === item && (
                      <MaterialIcons name="check" size={14} color="white" />
                    )}
                  </View>
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 스터디 분야 */}
          <Text style={styles.title}>스터디 분야</Text>
          <View style={styles.row}>
            {fields.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.button,
                  selectedField === item && styles.selectedButton,
                ]}
                onPress={() => toggleSelection(selectedField, setSelectedField, item)}
              >
                <Text
                  style={[
                    styles.buttonText,
                    selectedField === item && styles.selectedButtonText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 스터디 분야(상세) */}
          {fieldSubFields[selectedField] && (
            <>
              <Text style={styles.title}>스터디 분야(상세)</Text>
              <View style={styles.row}>
                {fieldSubFields[selectedField].map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.button,
                      selectedSubFields.includes(item) && styles.selectedButton,
                    ]}
                    onPress={() => toggleSubFieldSelection(item)}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        selectedSubFields.includes(item) && styles.selectedButtonText,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>

        {/* 하단 버튼 */}
        <TouchableOpacity
          style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>카테고리 추가</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    marginVertical: 12,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    marginLeft: 14,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginLeft:5,
  },
  selectedButton: {
    backgroundColor: '#17A1FA',
  },
  buttonText: {
    fontSize: 15,
    color: '#333',
    fontWeight: 600,
  },
  selectedButtonText: {
    color: '#fff',
    fontWeight: 600,

  },
  submitButton: {
    backgroundColor: '#0A2540',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  optionRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 20,
  marginTop: 30,
},
  optionLabel: {
    width: 100,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  optionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  radioCircleSelected: {
    backgroundColor: '#17A1FA',
    borderColor: '#17A1FA',
  },
  optionText: {
    fontSize: 15,
    color: '#333',
  },
 
});

export default CategorySelect;