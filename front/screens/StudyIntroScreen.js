import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BACKEND_URL } from '@env';
import { useFocusEffect } from '@react-navigation/native';

export default function StudyIntroScreen({ route, navigation }) {
  const { study: initialStudy, userId } = route.params || {};
  const [study, setStudy] = useState(initialStudy || {});
  const [comments, setComments] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [comment, setComment] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rankInfo, setRankInfo] = useState(null);
  const [applied, setApplied] = useState(false);
  const [joinMessage, setJoinMessage] = useState(''); // 가입 메시지
  const [showJoinModal, setShowJoinModal] = useState(false); // 모달 표시

  // ⭐ 별점 표시
  const renderStars = (rating) => (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={18}
          color="#FFD700"
          style={{ marginHorizontal: 1 }}
        />
      ))}
    </View>
  );

  // 데이터 불러오기
  const fetchData = async () => {
    try {
      // 1. 기존 스터디 상세 정보 로딩
      const resStudy = await axios.get(`${BACKEND_URL}/studies/${study._id}`);
      setStudy(resStudy.data);

      // 2. 기타 정보 로딩 (댓글, 리뷰, 랭킹 등 기존 로직)
      const resComments = await axios.get(
        `${BACKEND_URL}/comments/${study._id}?viewerId=${userId}`
      );
      setComments(resComments.data);

      const resReviews = await axios.get(
        `${BACKEND_URL}/reviews/${study._id}?userId=${userId}`
      );
      setAvgRating(resReviews.data.average);
      setReviewCount(resReviews.data.count);

      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      try {
        const resRank = await axios.get(
          `${BACKEND_URL}/attendance/study/${study._id}/global-rank?month=${month}`
        );
        setRankInfo(resRank.data);
      } catch (_) {
        setRankInfo(null);
      }

      // ⭐ 3. 새로 추가된 로직: 현재 사용자의 가입 신청 상태 확인
      if (study._id && userId) {
        const resStatus = await axios.get(`${BACKEND_URL}/applications/${study._id}/status`, {
          params: { userId: userId },
        });
        
        // 상태가 'pending'이면 applied를 true로 설정합니다.
        if (resStatus.data.status === 'pending') {
          setApplied(true);
        } else {
          // 'none', 'approved', 'rejected' 상태라면 false로 설정합니다.
          setApplied(false); 
        }
      }
      // ----------------------------------------------------

    } catch (err) {
      console.error('❌ 스터디 상세 불러오기 실패:', err.message);
    }
  };


  useEffect(() => {
    if (study?._id) fetchData();
  }, [study?._id, userId]);

  useFocusEffect(
    React.useCallback(() => {
      if (study?._id) fetchData();
    }, [study?._id, userId])
  );

  // 가입 신청 실행
  const handleJoin = async () => {
    if (!joinMessage.trim()) {
      Alert.alert('알림', '가입 신청 메시지를 입력하세요.');
      return;
    }
    try {
      setLoading(true);
      await axios.post(`${BACKEND_URL}/applications/${study._id}/apply`, {
        userId,
        message: joinMessage,
      });
      setApplied(true);
      Alert.alert('가입 신청 완료', '승인 대기 중입니다.');
      setShowJoinModal(false);
      setJoinMessage('');
    } catch (err) {
      const msg = err.response?.data?.message || '다시 시도해주세요.';
      if (msg.includes('이미 신청')) {
        setApplied(true);
        Alert.alert('알림', '이미 가입 신청이 접수되어 승인 대기 중입니다.');
      } else {
        Alert.alert('가입 실패', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // 댓글 작성
  const handleAddComment = async () => {
    if (!comment.trim()) return;
    try {
      const res = await axios.post(`${BACKEND_URL}/comments/${study._id}`, {
        userId,
        content: comment,
        isSecret,
      });
      setComments([res.data, ...comments]);
      setComment('');
      setIsSecret(false);
    } catch (err) {
      console.error('❌ 댓글 작성 실패:', err.message);
      Alert.alert('댓글 작성 실패', '다시 시도해주세요.');
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`${BACKEND_URL}/comments/${commentId}`, { data: { userId } });
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      Alert.alert('삭제 완료', '댓글이 삭제되었습니다.'); // ✅ 성공 알림
    } catch (err) {
      Alert.alert('댓글 삭제 실패', '삭제 권한이 없거나 오류가 발생했습니다.');
    }
  };

  const isHost = String(study?.host?._id) === String(userId);
  const isMember = (study?.members || []).some((m) => String(m._id) === String(userId));
  const isFull = study?.capacity > 0 && (study?.members?.length || 0) >= study.capacity;

  // ✅ 호스트는 비활성화되지 않도록 수정
  const joinDisabled = loading || (!isHost && (isMember || isFull || applied));

  const joinLabel = isHost
    ? '가입 관리'
    : isMember
    ? '이미 가입됨'
    : isFull
    ? '정원 마감'
    : applied
    ? '가입중'
    : '가입 신청';

  const onPressJoin = () => {
    if (isHost) {
      navigation.navigate('ApplicationManageScreen', { studyId: study._id, userId });
      return;
    }
    setShowJoinModal(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* 상단 스터디 제목 */}
      <View style={styles.header}>
        <Text style={styles.title}>{study?.title || '스터디 이름'}</Text>
        <Text style={styles.leader}>👑 {study?.host?.username || '스터디장'}</Text>
      </View>

      {/* 소개글 */}
      <Text style={styles.description}>{study?.description || '스터디 설명이 없습니다.'}</Text>

      {/* 태그/정보 */}
      <View style={styles.infoBox}>
        <View style={styles.tagRow}>
          <Text style={styles.tag}>{study?.duration || '자유'}</Text>
          <Text style={styles.tag}>{study?.category || '카테고리'}</Text>
          {!!study?.subCategory && <Text style={styles.tag}>{study.subCategory}</Text>}
          {!!study?.gender_rule && <Text style={styles.tag}>{study.gender_rule}</Text>}
        </View>
        <Text style={styles.infoText}>
          인원 : {study?.members?.length || 0} / {study?.capacity || '00'}
        </Text>
        <Text style={styles.infoText}>
          스터디 개설일 : {study?.createdAt?.slice(0, 10) || '20##/##/##'}
        </Text>
      </View>

      {/* 출석률 */}
      {rankInfo && (
        <View style={styles.rankBox}>
          <Text style={styles.rankText}>
            이번달 출석률 : {rankInfo.출석률}% ({rankInfo.rank}위)
          </Text>
        </View>
      )}

      {/* 리뷰 */}
      <TouchableOpacity
        style={styles.ratingBox}
        onPress={() => navigation.navigate('ReviewScreen', { studyId: study._id, userId })}
      >
        <Text style={styles.ratingLabel}>스터디 평점</Text>
        {renderStars(avgRating)}
        <Text style={{ marginLeft: 6 }}>({avgRating} / {reviewCount}개)</Text>
      </TouchableOpacity>

      {/* 댓글 (최신 3개 + 전체 보기 링크) */}
      <Text style={styles.sectionTitle}>댓글</Text>
      <View style={styles.commentBox}>
        {comments.slice(0, 3).map((c) => (
          <View key={c._id} style={styles.commentRow}>
            <Text style={styles.commentUser}>{c.user.username}</Text>
            <Text style={styles.commentText}>{c.content}</Text>
            {(String(c.user._id) === String(userId) || isHost) && (
              <TouchableOpacity onPress={() => handleDeleteComment(c._id)}>
                <Ionicons name="trash" size={18} color="red" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        {comments.length > 3 && (
          <TouchableOpacity
            onPress={() => navigation.navigate('CommentScreen', { studyId: study._id, userId })}
          >
            <Text style={{ color: '#007bff', marginTop: 8 }}>전체 댓글 보기</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 댓글 입력 */}
      <View style={styles.commentInputRow}>
        <TextInput
          style={styles.commentInput}
          placeholder="댓글 달기"
          value={comment}
          onChangeText={setComment}
        />
        <TouchableOpacity style={styles.commentBtn} onPress={handleAddComment}>
          <Text style={{ color: 'white' }}>작성</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.secretRow}>
        <Text style={{ fontSize: 12 }}>비밀댓글</Text>
        <Switch value={isSecret} onValueChange={setIsSecret} />
      </View>

      {/* 가입 신청 / 관리 버튼 */}
      <TouchableOpacity
        style={[styles.joinBtn, joinDisabled && { backgroundColor: '#999' }]}
        onPress={onPressJoin}
        disabled={joinDisabled}
      >
        <Text style={styles.joinText}>{joinLabel}</Text>
      </TouchableOpacity>

      {/* 가입신청 메시지 모달 */}
      <Modal visible={showJoinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>가입 신청 메시지</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="간단한 메시지를 입력하세요"
              value={joinMessage}
              onChangeText={setJoinMessage}
              multiline
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#ccc' }]}
                onPress={() => {
                  setShowJoinModal(false);
                  setJoinMessage('');
                }}
              >
                <Text>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#003366' }]}
                onPress={handleJoin}
              >
                <Text style={{ color: 'white' }}>신청</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: { marginBottom: 12 },
  title: { fontSize: 22, fontWeight: 'bold' },
  leader: { fontSize: 14, color: '#555', marginTop: 4 },
  description: { fontSize: 14, color: '#333', marginBottom: 16 },
  infoBox: { marginBottom: 16 },
  tagRow: { flexDirection: 'row', marginBottom: 6, flexWrap: 'wrap' },
  tag: {
    backgroundColor: '#e0f0ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 4,
    fontSize: 12,
  },
  infoText: { fontSize: 13, color: '#444', marginTop: 2 },
  rankBox: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  rankText: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  ratingBox: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  ratingLabel: { marginRight: 8, fontWeight: 'bold', fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginVertical: 8 },
  commentBox: { marginBottom: 12 },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 6,
  },
  commentUser: { fontWeight: 'bold', marginRight: 6 },
  commentText: { flex: 1 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginRight: 8,
  },
  commentBtn: {
    backgroundColor: '#003366',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  secretRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  joinBtn: {
    backgroundColor: '#003366',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  joinText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
});