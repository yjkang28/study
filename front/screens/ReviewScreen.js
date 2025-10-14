import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BACKEND_URL } from '@env';

export default function ReviewScreen({ route }) {
  const { studyId, userId } = route.params;
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [myReview, setMyReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const renderStars = (rating, onSelect) => (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity key={i} onPress={() => onSelect && onSelect(i)}>
          <Ionicons
            name={i <= rating ? 'star' : 'star-outline'}
            size={22}
            color="#FFD700"
            style={{ marginHorizontal: 2 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/reviews/${studyId}?userId=${userId}`);
      setReviews(res.data.reviews);
      setAvgRating(res.data.average);
      if (res.data.myReview) {
        setMyReview(res.data.myReview);
        setRating(res.data.myReview.rating);
        setComment(res.data.myReview.comment);
      }
    } catch (err) {
      console.error('❌ 리뷰 불러오기 실패:', err.message);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSave = async () => {
    if (!rating) {
      Alert.alert('알림', '별점을 선택하세요.');
      return;
    }
    try {
      await axios.post(`${BACKEND_URL}/reviews/${studyId}`, { userId, rating, comment });
      Alert.alert('완료', myReview ? '리뷰가 수정되었습니다.' : '리뷰가 작성되었습니다.');
      fetchReviews(); // ✅ 저장 후 목록 새로고침
    } catch (err) {
      Alert.alert('실패', err.response?.data?.message || '리뷰 저장 실패');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${BACKEND_URL}/reviews/${myReview._id}`, { data: { userId } });
      Alert.alert('완료', '리뷰가 삭제되었습니다.');
      setMyReview(null);
      setRating(0);
      setComment('');
      fetchReviews(); // ✅ 삭제 후 목록 새로고침
    } catch (err) {
      Alert.alert('실패', err.response?.data?.message || '리뷰 삭제 실패');
    }
  };

  const handleRecommend = async (reviewId) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/reviews/${reviewId}/recommend`, { userId });
    setReviews((prev) =>
      prev.map((r) =>
        r._id === reviewId
          ? {
              ...r,
              recommendCount: res.data.recommends,         // 총 개수
              iRecommended: !r.iRecommended,              // 내가 눌렀다고 토글
            }
          : r
      )
    );
  } catch (err) {
    console.error('❌ 추천 실패:', err.message);
  }
};

  return (
    <ScrollView style={styles.container}>
      <View style={styles.avgBox}>
        <Text style={styles.avgLabel}>평균 평점</Text>
        {renderStars(avgRating)}
        <Text style={{ marginLeft: 6 }}>({avgRating})</Text>
      </View>

      

      <Text style={styles.sectionTitle}>모든 리뷰</Text>
      {reviews.map((r) => (
        <View key={r._id} style={styles.reviewCard}>
          {/* 상단: 닉네임 / 추천 버튼 */}
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewUser}>{r.user.username}</Text>

            <TouchableOpacity
              onPress={() => handleRecommend(r._id)}   // ✅ 기능은 그대로
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.likeBtn}
              activeOpacity={0.7}
            >
              <Ionicons
                name={!r.iRecommended ? 'thumbs-up' : 'thumbs-up-outline'}  // ← boolean 기반
                size={16}
                color="#FF3B30"
              />
              <Text style={styles.likeCount}>
                {(r.recommendCount ?? r.recommends?.length ?? 0)}    
              </Text>
            </TouchableOpacity>
          </View>

          {/* 별점 */}
          <View style={styles.starRow}>
            {renderStars(r.rating)}
          </View>

          {/* 코멘트 */}
          <Text style={styles.reviewText}>{r.comment}</Text>
        </View>
      ))}

      <View style={styles.myReviewBox}>
        <Text style={styles.sectionTitle}>내 리뷰</Text>
        {renderStars(rating, setRating)}
        <TextInput
          style={styles.input}
          placeholder="리뷰를 작성하세요"
          value={comment}
          onChangeText={setComment}
          multiline={true}         // ✅ 여러 줄 입력 허용
          textAlignVertical="top"  // ✅ Android에서 위쪽부터 입력되게

        />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={{ color: 'white' }}>{myReview ? '수정' : '작성'}</Text>
        </TouchableOpacity>
        {myReview && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={{ color: 'white' }}>삭제</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  avgBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avgLabel: { fontWeight: 'bold', marginRight: 6 },
  myReviewBox: { marginBottom: 20,padding: 10, borderTopWidth: 1, borderTopColor:'#eee',
     },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginVertical: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 15,
    paddingVertical: 20, paddingHorizontal: 20, marginVertical: 8 },
  saveBtn: { backgroundColor: '#003366', padding: 10, borderRadius: 15, alignItems: 'center', marginVertical: 4 },
  deleteBtn: { backgroundColor: 'red', padding: 10, borderRadius: 6, alignItems: 'center' },
  reviewCard: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#fff',      // 카드 흰 배경
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',       // 연한 보더
    marginBottom: 12,
  },
  reviewHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 6,
},
  reviewUser: {
    fontWeight: '700',
    fontSize: 13,
    color: '#111',
  },

  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
  marginLeft: 4,
  color: '#FF3B30',             // 빨간 숫자
  fontWeight: '700',
  fontSize: 12,
},

starRow: {
  flexDirection: 'row',
  marginBottom: 6,
},

reviewText: {
  fontSize: 13,
  color: '#111',
},

});
