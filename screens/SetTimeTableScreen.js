import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert  } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const defaultColor = '#ccc';
const weekdays = ['월', '화', '수', '목', '금', '토', '일'];

const SetTimeTableScreen = () => {
  const [subjects, setSubjects] = useState([
    {
      id: 1,
      name: '',
      color: defaultColor,
      schedules: [
        { day: '월', start: '', end: '' },
      ],
    },
  ]);
  
  const addSubject = () => {
    const newId = subjects.length + 1;
    setSubjects([
      ...subjects,
      {
        id: newId,
        name: '',
        color: defaultColor,
        schedules: [
          { day: '월', start: '', end: '' },
        ],
      },
    ]);
  };

  const removeSubject = (index) => {
    if (subjects.length === 1) {
      Alert.alert('삭제 불가', '최소 한 과목은 있어야 합니다.');
      return;
    }
    const updated = [...subjects];
    updated.splice(index, 1);
    setSubjects(updated);
  };

  const handleInputChange = (index, field, value) => {
    const newSubjects = [...subjects];
    newSubjects[index][field] = value;
    setSubjects(newSubjects);
  };

  const handleScheduleChange = (subjectIndex, scheduleIndex, field, value) => {
    const updated = [...subjects];
    updated[subjectIndex].schedules[scheduleIndex][field] = value;
    setSubjects(updated);
  };
 
  const addSchedule = (subjectIndex) => {
    const updated = [...subjects];
    updated[subjectIndex].schedules.push({ day: '월', start: '', end: '' });
    setSubjects(updated);
  };

  const removeSchedule = (subjectIndex, scheduleIndex) => {
    const updated = [...subjects];
    if (updated[subjectIndex].schedules.length === 1) {
      Alert.alert('삭제 불가', '최소 한 세트는 남겨야 합니다.');
      return;
    }
    updated[subjectIndex].schedules.splice(scheduleIndex, 1);
    setSubjects(updated);
  };

  const handleColorPick = (index) => {
    // 추후 색상 팔레트로 대체 가능
    const newSubjects = [...subjects];
    newSubjects[index].color = newSubjects[index].color === '#FFB6C1' ? '#ADD8E6' : '#FFB6C1';
    setSubjects(newSubjects);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>시간표</Text>
      {subjects.map((subject,  subjectIndex) => (
        <View key={subject.id} style={styles.subjectBox}>
          <TouchableOpacity
            style={[styles.colorDot, { backgroundColor: subject.color }]}
            onPress={() => handleColorPick(subjectIndex)}
          />
           <View style={styles.inputContainer}>
            <TextInput
              placeholder="과목명 입력"
              style={styles.input}
              value={subject.name}
              onChangeText={(text) => handleSubjectChange(subjectIndex, 'name', text)}
            />
            {subject.schedules.map((schedule, scheduleIndex) => (
              <View key={scheduleIndex} style={styles.scheduleRow}>
                <TextInput
                  placeholder="요일"
                  style={styles.dayInput}
                  value={schedule.day}
                  onChangeText={(text) => handleScheduleChange(subjectIndex, scheduleIndex, 'day', text)}
                />
                <TextInput
                  placeholder="시작 시간"
                  style={styles.timeInput}
                  value={schedule.start}
                  onChangeText={(text) => handleScheduleChange(subjectIndex, scheduleIndex, 'start', text)}
                />
                <Text> ~ </Text>
                <TextInput
                  placeholder="종료 시간"
                  style={styles.timeInput}
                  value={schedule.end}
                  onChangeText={(text) => handleScheduleChange(subjectIndex, scheduleIndex, 'end', text)}
                />
                <TouchableOpacity onPress={() => removeSchedule(subjectIndex, scheduleIndex)}>
                  <Ionicons name="close-outline" size={18} color="gray" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={() => addSchedule(subjectIndex)}>
              <Text style={styles.addScheduleText}>+ 요일/시간 추가</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => removeSubject(subjectIndex)} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color="gray" />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={addSubject}>
        <Ionicons name="add-circle-outline" size={20} color="black" />
        <Text style={styles.addButtonText}>과목 추가하기</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveButton} onPress={() => console.log(subjects)}>
        <Text style={styles.saveButtonText}>저장</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop:30,
    padding: 20,
    backgroundColor: '#fff',
    marginBottom:50,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subjectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  inputContainer: {
    flex: 1,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 6,
    marginBottom: 8,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayInput: {
    width: 40,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
    textAlign: 'center',
  },
  timeInput: {
    width: 70,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginHorizontal: 4,
    textAlign: 'center',
  },
  addScheduleText: {
    marginTop: 6,
    marginLeft: 60,
    color: '#777',
    fontWeight: 'bold',
  },
    deleteButton: {
      marginLeft: 10,
      marginTop: 10,
    },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingVertical:8,
    paddingHorizontal: 10,
  },
  addButtonText: {
    marginLeft: 6,
    fontWeight: 'bold',
  },
  saveButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 20,
  backgroundColor: '#007AFF',
  borderRadius: 20,
  paddingVertical: 10,
  paddingHorizontal: 20,
},

saveButtonText: {
  color: 'white',
  fontWeight: 'bold',
  marginLeft: 6,
  paddingVertical: 4,
},
});

export default SetTimeTableScreen;