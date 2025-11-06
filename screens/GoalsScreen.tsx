import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';

interface Goal {
  id: string;
  title: string;
  description: string;
  progress: number;
  targetDate: string;
  completed: boolean;
}

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetDate: '',
  });

  const addGoal = () => {
    if (newGoal.title.trim()) {
      const goal: Goal = {
        id: Date.now().toString(),
        title: newGoal.title.trim(),
        description: newGoal.description.trim(),
        progress: 0,
        targetDate: newGoal.targetDate,
        completed: false,
      };
      setGoals([...goals, goal]);
      setNewGoal({ title: '', description: '', targetDate: '' });
      setModalVisible(false);
    }
  };

  const updateProgress = (id: string, increment: number) => {
    setGoals(goals.map(goal => {
      if (goal.id === id) {
        const newProgress = Math.max(0, Math.min(100, goal.progress + increment));
        return { 
          ...goal, 
          progress: newProgress,
          completed: newProgress === 100
        };
      }
      return goal;
    }));
  };

  const deleteGoal = (id: string) => {
    Alert.alert(
      'Maqsadni o\'chirish',
      'Haqiqatan ham bu maqsadni o\'chirmoqchimisiz?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        { text: 'O\'chirish', onPress: () => setGoals(goals.filter(g => g.id !== id)) }
      ]
    );
  };

  const renderGoal = ({ item }: { item: Goal }) => (
    <View style={styles.goalItem}>
      <View style={styles.goalHeader}>
        <Text style={[styles.goalTitle, item.completed && styles.completedText]}>
          {item.title}
        </Text>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => deleteGoal(item.id)}
        >
          <Text style={styles.deleteText}>×</Text>
        </TouchableOpacity>
      </View>
      
      {item.description ? (
        <Text style={styles.goalDescription}>{item.description}</Text>
      ) : null}
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[styles.progressFill, { width: `${item.progress}%` }]} 
          />
        </View>
        <Text style={styles.progressText}>{item.progress}%</Text>
      </View>
      
      <View style={styles.goalActions}>
        <TouchableOpacity 
          style={styles.progressButton}
          onPress={() => updateProgress(item.id, -10)}
        >
          <Text style={styles.buttonText}>-10%</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.progressButton}
          onPress={() => updateProgress(item.id, 10)}
        >
          <Text style={styles.buttonText}>+10%</Text>
        </TouchableOpacity>
      </View>
      
      {item.targetDate ? (
        <Text style={styles.targetDate}>Maqsad sanasi: {item.targetDate}</Text>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Maqsadlar</Text>
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ Yangi maqsad</Text>
      </TouchableOpacity>

      <FlatList
        data={goals}
        renderItem={renderGoal}
        keyExtractor={item => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yangi maqsad</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Maqsad nomi"
              value={newGoal.title}
              onChangeText={(text) => setNewGoal({...newGoal, title: text})}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tavsif (ixtiyoriy)"
              value={newGoal.description}
              onChangeText={(text) => setNewGoal({...newGoal, description: text})}
              multiline
              numberOfLines={3}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Maqsad sanasi (masalan: 2024-12-31)"
              value={newGoal.targetDate}
              onChangeText={(text) => setNewGoal({...newGoal, targetDate: text})}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Bekor qilish</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={addGoal}
              >
                <Text style={styles.saveButtonText}>Saqlash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#34C759',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  goalItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  goalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 40,
  },
  goalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  progressButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  targetDate: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  deleteButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 20,
    color: '#ff4444',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#34C759',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});