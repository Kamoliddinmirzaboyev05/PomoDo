import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

interface Plan {
  id: string;
  title: string;
  completed: boolean;
  date: string;
  time: string;
  notificationId?: string;
}

// Notification konfiguratsiyasi
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function PlansScreen() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [newPlan, setNewPlan] = useState('');
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
  const [isAddingPlan, setIsAddingPlan] = useState(false);

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  const registerForPushNotificationsAsync = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Bildirishnoma ruxsati kerak!');
        return;
      }
    }
  };

  const scheduleNotification = async (plan: Plan) => {
    if (!plan.time) return;

    const [hours, minutes] = plan.time.split(':').map(Number);
    const now = new Date();
    const scheduledDate = new Date();
    scheduledDate.setHours(hours, minutes, 0, 0);

    // Agar vaqt o'tgan bo'lsa, ertangi kunga o'tkazamiz
    if (scheduledDate <= now) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    const secondsUntilNotification = Math.floor((scheduledDate.getTime() - Date.now()) / 1000);
    
    if (secondsUntilNotification > 0) {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Reja vaqti keldi! ⏰',
          body: plan.title,
          sound: true,
        },
        trigger: { 
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsUntilNotification
        },
      });

      return notificationId;
    }
  };

  const showTimePicker = () => {
    if (newPlan.trim()) {
      setTimePickerVisibility(true);
    } else {
      Alert.alert('Diqqat!', 'Avval reja nomini kiriting');
    }
  };

  const hideTimePicker = () => {
    setTimePickerVisibility(false);
  };

  const handleTimeConfirm = async (event: any, time?: Date) => {
    setTimePickerVisibility(false);
    
    if (time && event.type === 'set') {
      setSelectedTime(time);
      
      const plan: Plan = {
        id: Date.now().toString(),
        title: newPlan.trim(),
        completed: false,
        date: new Date().toLocaleDateString(),
        time: time.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
      };

      // Bildirishnoma rejalashtirish
      const notificationId = await scheduleNotification(plan);
      plan.notificationId = notificationId;

      setPlans([...plans, plan]);
      setNewPlan('');
      setSelectedTime(new Date());
      setIsAddingPlan(false);
    }
  };

  const addPlanWithoutTime = () => {
    if (newPlan.trim()) {
      const plan: Plan = {
        id: Date.now().toString(),
        title: newPlan.trim(),
        completed: false,
        date: new Date().toLocaleDateString(),
        time: '',
      };

      setPlans([...plans, plan]);
      setNewPlan('');
      setIsAddingPlan(false);
    }
  };

  const togglePlan = (id: string) => {
    setPlans(plans.map(plan => 
      plan.id === id ? { ...plan, completed: !plan.completed } : plan
    ));
  };

  const deletePlan = (id: string) => {
    Alert.alert(
      'Rejani o\'chirish',
      'Haqiqatan ham bu rejani o\'chirmoqchimisiz?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        { 
          text: 'O\'chirish', 
          onPress: async () => {
            const plan = plans.find(p => p.id === id);
            if (plan?.notificationId) {
              await Notifications.cancelScheduledNotificationAsync(plan.notificationId);
            }
            setPlans(plans.filter(p => p.id !== id));
          }
        }
      ]
    );
  };

  const renderPlan = ({ item }: { item: Plan }) => (
    <View style={styles.planItem}>
      <TouchableOpacity 
        style={styles.planContent}
        onPress={() => togglePlan(item.id)}
      >
        <View style={[styles.checkbox, item.completed && styles.checked]}>
          {item.completed && (
            <Ionicons name="checkmark" size={18} color="white" />
          )}
        </View>
        <View style={styles.planText}>
          <Text style={[styles.planTitle, item.completed && styles.completedText]}>
            {item.title}
          </Text>
          <View style={styles.planInfo}>
            <Text style={styles.planDate}>{item.date}</Text>
            {item.time && (
              <Text style={styles.planTime}>🕐 {item.time}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => deletePlan(item.id)}
      >
        <Text style={styles.deleteText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 Rejalar</Text>
      
      {!isAddingPlan ? (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Yangi reja qo'shing..."
            value={newPlan}
            onChangeText={setNewPlan}
            multiline
          />
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setIsAddingPlan(true)}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.addingContainer}>
          <View style={styles.addingHeader}>
            <Text style={styles.addingTitle}>Yangi reja</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => {
                setIsAddingPlan(false);
                setNewPlan('');
              }}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.addingInput}
            placeholder="Reja nomini kiriting..."
            value={newPlan}
            onChangeText={setNewPlan}
            multiline
            autoFocus
          />
          
          <View style={styles.addingButtons}>
            <TouchableOpacity 
              style={styles.timeButton}
              onPress={showTimePicker}
            >
              <Ionicons name="time-outline" size={20} color="#007AFF" />
              <Text style={styles.timeButtonText}>Vaqt belgilash</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.noTimeButton}
              onPress={addPlanWithoutTime}
            >
              <Text style={styles.noTimeButtonText}>Vaqtsiz qo'shish</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={plans}
        renderItem={renderPlan}
        keyExtractor={item => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={plans.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Hali rejalar yo'q</Text>
            <Text style={styles.emptySubText}>Yangi reja qo'shish uchun yuqoridagi tugmani bosing</Text>
          </View>
        }
      />

      {isTimePickerVisible && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeConfirm}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 25,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 18,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  addingContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  addingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  addingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 5,
  },
  addingInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  timeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  timeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  noTimeButton: {
    backgroundColor: '#6c757d',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6c757d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  noTimeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#95a5a6',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#bdc3c7',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  planItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  planContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: '#007AFF',
  },
  planText: {
    flex: 1,
  },
  planTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  planInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planDate: {
    fontSize: 12,
    color: '#666',
  },
  planTime: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  deleteButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    borderRadius: 18,
  },
  deleteText: {
    fontSize: 18,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
});