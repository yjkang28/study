import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const StudyIntroScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.innerContainer}>
          {/* 상단 소개글 */}
          <View style={styles.header}>
            <Text style={styles.title}>소개글 제목</Text>
            <View style={styles.leaderRow}>
              <Ionicons name="person-circle-outline" size={20} color="#fff" />
              <Text style={styles.leaderName}>leader_name</Text>
            </View>
          </View>

          {/* 설명 */}
          <View style={styles.descriptionBox}>
            <Text style={styles.description}>
              저희 스터디는 ~~~~ 이런 스터디입니다. 저희는 ~~~ 운영되고 있고{'\n'}
              ~~~~~~~~~ 많은 신청 부탁드립니다 ~~~~~~~~
            </Text>
          </View>

          {/* 태그 */}
          <View style={styles.tagRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>자유</Text>
            </View>
            <View style={[styles.tag]}>
              <Text style={[styles.tagText]}>취업</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>...</Text>
            </View>
          </View>

          {/* 정보 */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>인원 : 00 / 00</Text>
            <Text style={styles.infoText}>스터디 개설일 : 20##/##/##</Text>
          </View>

          {/* 댓글 */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentLabel}>댓글</Text>
            <View style={styles.secretComment}>
              <Ionicons name="lock-closed-outline" size={16} color="#555" />
              <Text style={styles.secretText}> 사용자가 작성한 비밀 댓글입니다.</Text>
            </View>
            <View style={styles.secretComment}>
              <Ionicons name="lock-closed-outline" size={16} color="#555" />
              <Text style={styles.secretText}> 사용자가 작성한 비밀 댓글입니다.</Text>
            </View>
            <TouchableOpacity style={styles.replyButton}>
              <Text style={styles.replyButtonText}>+ 댓글 달기</Text>
            </TouchableOpacity>
          </View>

          {/* 가입 신청 버튼 */}
          <TouchableOpacity style={styles.joinButton}>
            <Text style={styles.joinButtonText}>가입 신청</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  innerContainer: {
    flex: 1, // 중요! 이게 없으면 안 채워짐
    paddingHorizontal:16, 
  },
  header: {
    backgroundColor: '#002F4B',
    padding:30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    marginHorizontal: -16,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  leaderName: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: 600,
  },
  descriptionBox: {
    marginTop: 16,
    paddingTop: 40,       // 상단 여백만 줌
    paddingHorizontal: 16, // 좌우는 작게 유지
    paddingBottom: 20,    // 하단 여백도 적당히
    minHeight: 200,  
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  tag: {
    borderWidth: 1,
    borderColor: '#00aaff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  tagText: {
    fontSize: 13,
    color: '#555',
  },
  
  infoBox: {
    marginTop: 16,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: 600,
  },
  commentsSection: {
    marginTop: 24,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  secretComment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f3f3',
    padding: 10,
    borderRadius: 8,
    marginBottom:8,
    marginTop:10,
  },
  secretText: {
    fontSize: 13,
    color: '#555',
  },
  replyButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 20,
    marginTop: 14,
  },
  replyButtonText: {
    fontSize: 14,
    color: '#333',
  },
  joinButton: {
    backgroundColor: '#002F4B',
    padding: 14,
    borderRadius: 25,
    marginTop: 30,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default StudyIntroScreen;