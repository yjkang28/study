import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, TextInput, TouchableOpacity } from 'react-native'; 
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

const BoardDetail = ({ route, navigation }) => {

  // 💡 studyHostId를 route.params에서 받습니다.
  const { postId, studyId, studyName, studyHostId } = route.params || {};
  
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 💡 댓글 관련 상태 추가
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null); // 현재 사용자 ID
  const fetchPost = async () => {
    try {
      const res = await api.get(`/api/posts/${postId}`);
      setPost(res.data);
    } catch (error) {
      Alert.alert('오류', error.response?.data?.message || '게시글을 불러오지 못했습니다.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const loadUserId = async () => {
      const id = await AsyncStorage.getItem('userId');
      setCurrentUserId(id);
    };
    loadUserId();
  }, []);

  // 💡 댓글 목록 조회 함수
  const fetchComments = async () => {
    try {
      setCommentLoading(true);
      const res = await api.get(`/api/postcomments/post/${postId}`);
      setComments(res.data);
    } catch (error) {
      console.error('댓글 조회 실패:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  // 💡 댓글 작성 함수
  const handleCommentSubmit = async () => {
    if (!newComment.trim()) {
      Alert.alert('알림', '댓글 내용을 입력해주세요.');
      return;
    }
    let userIdToUse = currentUserId; 
    if (!userIdToUse) {
        userIdToUse = await AsyncStorage.getItem('userId');
        setCurrentUserId(userIdToUse); // 상태도 업데이트
    }

    if (!userIdToUse) {
      Alert.alert('오류', '로그인 정보가 없습니다.');
      return;
    }

    try {
      const res = await api.post(`/api/postcomments/post/${postId}`, {
        content: newComment,
        authorId: userIdToUse, // 백엔드로 사용자 ID 전달
      });
      
      // 새 댓글을 목록에 추가 (fetchComments를 다시 호출하는 대신 상태 업데이트로 효율성 높임)
      setComments(prev => [...prev, res.data.comment]); 
      setNewComment('');
    } catch (error) {
      Alert.alert('오류', error.response?.data?.message || '댓글 작성에 실패했습니다.');
    }
  };
  
  // 💡 댓글 삭제 함수
  const handleCommentDelete = (commentId, authorId) => {
    // 권한 확인: 본인 댓글이거나 스터디장인 경우에만 삭제 가능
    const isAuthor = authorId.toString() === currentUserId;
    const isStudyHost = studyHostId === currentUserId; 
    
    if (!isAuthor && !isStudyHost) {
        Alert.alert('권한 없음', '댓글을 삭제할 권한이 없습니다.');
        return;
    }
    
    Alert.alert(
        '댓글 삭제',
        '정말 이 댓글을 삭제하시겠습니까?',
        [
            { text: '취소', style: 'cancel' },
            { text: '삭제', style: 'destructive', onPress: async () => {
                try {
                    await api.delete(`/api/postcomments/${commentId}`, { data: { userId: currentUserId } });
                    Alert.alert('성공', '댓글이 삭제되었습니다.');
                    setComments(prev => prev.filter(c => c._id !== commentId)); // 목록에서 제거
                } catch (error) {
                    Alert.alert('오류', error.response?.data?.message || '삭제에 실패했습니다.');
                }
            }}
        ]
    );
  };
  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments(); // 게시글 로드 후 댓글 로드
    } else {
      Alert.alert('오류', '게시글 정보를 불러올 수 없습니다.');
      navigation.goBack();
    }
  }, [postId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d2b40" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.center}>
        <Text>게시글이 존재하지 않습니다.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 1. 게시글 내용 영역 */}
      <Text style={styles.title}>{post.title}</Text>
      <View style={styles.infoRow}>
        <Text style={styles.author}>{post.author?.username || '익명'}</Text>
        <Text style={styles.date}>{new Date(post.createdAt).toLocaleString('ko-KR')}</Text>
      </View>
      <View style={styles.divider} />
      <Text style={styles.content}>{post.content}</Text>
      
      <View style={styles.commentSection}>
        <Text style={styles.commentTitle}>댓글 ({comments.length})</Text>
        
        {/* 2. 댓글 목록 렌더링 */}
        {commentLoading ? (
            <ActivityIndicator size="small" color="#0d2b40" style={{ marginVertical: 10 }} />
        ) : comments.length > 0 ? (
            comments.map(comment => (
                <View key={comment._id} style={styles.commentItem}>
                    <Text style={styles.commentAuthor}>{comment.author?.username || '익명'}</Text>
                    <Text style={styles.commentContent}>{comment.content}</Text>
                    <View style={styles.commentFooter}>
                        <Text style={styles.commentDate}>{new Date(comment.createdAt).toLocaleString('ko-KR')}</Text>
                        {/* 💡 삭제 버튼: 본인 댓글이거나 스터디장인 경우에만 표시 */}
                        {(comment.author?._id === currentUserId || studyHostId === currentUserId) && (
                            <TouchableOpacity onPress={() => handleCommentDelete(comment._id, comment.author._id)}>
                                <Text style={styles.deleteButton}>삭제</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            ))
        ) : (
            <Text style={styles.noComments}>작성된 댓글이 없습니다.</Text>
        )}
        
        {/* 3. 댓글 입력 필드 */}
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder={currentUserId ? "댓글을 입력하세요..." : "로그인 정보 확인 중..."}
            placeholderTextColor="#888"
            value={newComment}
            onChangeText={setNewComment}
            multiline
            editable={!!currentUserId} 
          />
          <TouchableOpacity style={[styles.submitButton, !currentUserId && { opacity: 0.5 }]} onPress={handleCommentSubmit} disabled={!currentUserId}>
            <Text style={styles.submitButtonText}>작성</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  author: { fontSize: 14, color: '#555' },
  date: { fontSize: 13, color: '#888' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  content: { fontSize: 16, color: '#222', lineHeight: 24 },
  commentSection: { marginTop: 30, paddingHorizontal: 5 },
  commentTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  commentItem: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#0d2b40',
  },
  commentAuthor: { fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  commentContent: { fontSize: 14, color: '#333' },
  commentFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  commentDate: { fontSize: 12, color: '#999' },
  deleteButton: { fontSize: 12, color: '#dc3545', fontWeight: 'bold' },
  noComments: { fontSize: 14, color: '#888', textAlign: 'center', paddingVertical: 10 },
  commentInputContainer: {
    flexDirection: 'row',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 8,
    minHeight: 40,
  },
  submitButton: {
    backgroundColor: '#0d2b40',
    borderRadius: 20,
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  submitButtonText: { color: '#fff', fontWeight: 'bold' },
});

export default BoardDetail;