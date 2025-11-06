import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';

type TimerPhase = 'work' | 'break';
const { width } = Dimensions.get('window');

const AUDIO_FILES = {
  clock: { name: 'Soat tovushi', file: require('../sounds/Clock.mp3'), icon: 'time-outline' },
  birds1: { name: 'Qushlar 1', file: require('../sounds/Birds sound 1.mp3'), icon: 'leaf-outline' },
  birds2: { name: 'Qushlar 2', file: require('../sounds/Birds sound 2.mp3'), icon: 'flower-outline' },
  rain1: { name: 'Yomg\'ir 1', file: require('../sounds/Rain 1.mp3'), icon: 'rainy-outline' },
  rain2: { name: 'Yomg\'ir 2', file: require('../sounds/Rain 2.mp3'), icon: 'thunderstorm-outline' },
  water: { name: 'Suv tovushi', file: require('../sounds/Water sound.mp3'), icon: 'water-outline' },
};

const TIMER_SETTINGS = {
  work25: 25 * 60, // 25 daqiqa
  work50: 50 * 60, // 50 daqiqa  
  work90: 90 * 60, // 90 daqiqa
  break5: 5 * 60,  // 5 daqiqa
  break10: 10 * 60, // 10 daqiqa
  break15: 15 * 60, // 15 daqiqa
};

type WorkMode = 'work25' | 'work50' | 'work90';
type BreakMode = 'break5' | 'break10' | 'break15';

export default function PomodoroScreen() {
  const [workMode, setWorkMode] = useState<WorkMode>('work25');
  const [currentPhase, setCurrentPhase] = useState<TimerPhase>('work');
  const [timeLeft, setTimeLeft] = useState(TIMER_SETTINGS.work25);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [tickSound, setTickSound] = useState<Audio.Sound | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<string>('clock');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [showAudioSelector, setShowAudioSelector] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Audio setup
  useEffect(() => {
    setupAudio();
    return () => {
      if (tickSound) {
        tickSound.unloadAsync();
      }
    };
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.log('Audio setup error:', error);
    }
  };

  const playTickSound = async () => {
    if (!isAudioEnabled) return;
    
    try {
      if (tickSound) {
        await tickSound.stopAsync();
        await tickSound.unloadAsync();
      }

      const audioFile = AUDIO_FILES[selectedAudio as keyof typeof AUDIO_FILES];
      if (audioFile) {
        const { sound } = await Audio.Sound.createAsync(audioFile.file, {
          shouldPlay: true,
          isLooping: false,
          volume: 0.3,
        });
        setTickSound(sound);
      }
    } catch (error) {
      console.log('Audio play error:', error);
      // Fallback - vibration
      Vibration.vibrate(30);
    }
  };

  const previewAudio = async (audioKey: string) => {
    try {
      const audioFile = AUDIO_FILES[audioKey as keyof typeof AUDIO_FILES];
      if (audioFile) {
        const { sound } = await Audio.Sound.createAsync(audioFile.file, {
          shouldPlay: true,
          isLooping: false,
          volume: 0.5,
        });
        
        setTimeout(async () => {
          await sound.stopAsync();
          await sound.unloadAsync();
        }, 2000); // 2 soniya preview
      }
    } catch (error) {
      console.log('Preview error:', error);
    }
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        playTickSound(); // Har soniyada tovush chiqarish
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, isAudioEnabled, selectedAudio]);

  const playBreakSound = () => {
    // 3 ta qisqa tovush
    Vibration.vibrate([0, 200, 100, 200, 100, 200]);
  };

  const getBreakDuration = (workMode: WorkMode): BreakMode => {
    switch (workMode) {
      case 'work25': return 'break5';
      case 'work50': return 'break10';
      case 'work90': return 'break15';
    }
  };

  const handleTimerComplete = async () => {
    setIsRunning(false);
    setShowPlayButton(true);
    
    if (currentPhase === 'work') {
      setCompletedSessions(prev => prev + 1);
      const breakMode = getBreakDuration(workMode);
      
      // Bildirishnoma yuborish
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Ish vaqti tugadi! 🎉',
          body: 'Tanaffus vaqti boshlandi. Dam oling!',
          sound: true,
        },
        trigger: null,
      });
      
      playBreakSound();
      setCurrentPhase('break');
      setTimeLeft(TIMER_SETTINGS[breakMode]);
      
      // Avtomatik tanaffus boshlash
      setTimeout(() => {
        setIsRunning(true);
        setShowPlayButton(false);
      }, 2000);
      
    } else {
      // Tanaffus tugadi
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Tanaffus tugadi! ⏰',
          body: 'Ish vaqti boshlash uchun tayyor!',
          sound: true,
        },
        trigger: null,
      });
      
      setCurrentPhase('work');
      setTimeLeft(TIMER_SETTINGS[workMode]);
    }
  };

  const switchWorkMode = (newMode: WorkMode) => {
    setWorkMode(newMode);
    setCurrentPhase('work');
    setTimeLeft(TIMER_SETTINGS[newMode]);
    setIsRunning(false);
    setShowPlayButton(true);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setShowPlayButton(true);
    if (currentPhase === 'work') {
      setTimeLeft(TIMER_SETTINGS[workMode]);
    } else {
      const breakMode = getBreakDuration(workMode);
      setTimeLeft(TIMER_SETTINGS[breakMode]);
    }
  };

  const startTimer = () => {
    setIsRunning(true);
    setShowPlayButton(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    let total;
    if (currentPhase === 'work') {
      total = TIMER_SETTINGS[workMode];
    } else {
      const breakMode = getBreakDuration(workMode);
      total = TIMER_SETTINGS[breakMode];
    }
    return ((total - timeLeft) / total) * 100;
  };

  const getPhaseTitle = () => {
    if (currentPhase === 'work') {
      switch (workMode) {
        case 'work25': return 'Fokus vaqti (25 min)';
        case 'work50': return 'Chuqur ish (50 min)';
        case 'work90': return 'Maksimal fokus (90 min)';
      }
    } else {
      const breakMode = getBreakDuration(workMode);
      switch (breakMode) {
        case 'break5': return 'Qisqa tanaffus (5 min)';
        case 'break10': return 'O\'rta tanaffus (10 min)';
        case 'break15': return 'Uzun tanaffus (15 min)';
      }
    }
  };

  const getPhaseColor = () => {
    if (currentPhase === 'work') {
      switch (workMode) {
        case 'work25': return '#FF6B6B';
        case 'work50': return '#FF8E53';
        case 'work90': return '#FF4757';
      }
    } else {
      return '#4ECDC4';
    }
  };

  // Animatsiyalar
  useEffect(() => {
    if (isRunning) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      const rotate = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 60000,
          useNativeDriver: true,
        })
      );
      rotate.start();

      return () => {
        pulse.stop();
        rotate.stop();
      };
    }
  }, [isRunning]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: getPhaseColor() }]}>
      <View style={styles.content}>
        <Text style={styles.title}>🍅 Pomodoro Timer</Text>
        
        {currentPhase === 'work' && (
          <View style={styles.modeSelector}>
            <TouchableOpacity 
              style={[styles.modeButton, workMode === 'work25' && styles.activeModeButton]}
              onPress={() => switchWorkMode('work25')}
            >
              <Text style={[styles.modeButtonText, workMode === 'work25' && styles.activeModeButtonText]}>
                25 min
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modeButton, workMode === 'work50' && styles.activeModeButton]}
              onPress={() => switchWorkMode('work50')}
            >
              <Text style={[styles.modeButtonText, workMode === 'work50' && styles.activeModeButtonText]}>
                50 min
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modeButton, workMode === 'work90' && styles.activeModeButton]}
              onPress={() => switchWorkMode('work90')}
            >
              <Text style={[styles.modeButtonText, workMode === 'work90' && styles.activeModeButtonText]}>
                90 min
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.phaseTitle}>{getPhaseTitle()}</Text>

        <Animated.View 
          style={[
            styles.timerContainer,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <View style={styles.progressRing}>
            <Animated.View 
              style={[
                styles.progressFill, 
                { 
                  transform: [
                    { rotate: `${getProgress() * 3.6}deg` },
                    { rotate: spin }
                  ] 
                }
              ]} 
            />
            <View style={styles.timerInner}>
              <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
              <Text style={styles.phaseIndicator}>
                {currentPhase === 'work' ? '💼 Ish vaqti' : '☕ Tanaffus'}
              </Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.controls}>
          {showPlayButton && !isRunning && (
            <TouchableOpacity 
              style={[styles.controlButton, styles.playButton]}
              onPress={startTimer}
            >
              <Text style={styles.controlButtonText}>▶ Boshlash</Text>
            </TouchableOpacity>
          )}
          
          {isRunning && (
            <TouchableOpacity 
              style={[styles.controlButton, styles.pauseButton]}
              onPress={() => {
                setIsRunning(false);
                setShowPlayButton(true);
              }}
            >
              <Text style={styles.controlButtonText}>⏸ Pauza</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.controlButton, styles.resetButton]}
            onPress={resetTimer}
          >
            <Text style={styles.controlButtonText}>🔄 Reset</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.audioControls}>
          <TouchableOpacity 
            style={[styles.audioButton, !isAudioEnabled && styles.audioButtonDisabled]}
            onPress={() => setIsAudioEnabled(!isAudioEnabled)}
          >
            <Ionicons 
              name={isAudioEnabled ? "volume-high" : "volume-mute"} 
              size={20} 
              color="white" 
            />
            <Text style={styles.audioButtonText}>
              {isAudioEnabled ? 'Ovoz' : 'Jim'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.audioButton}
            onPress={() => setShowAudioSelector(true)}
          >
            <Ionicons name="musical-notes" size={20} color="white" />
            <Text style={styles.audioButtonText}>
              {AUDIO_FILES[selectedAudio as keyof typeof AUDIO_FILES]?.name || 'Tovush'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{completedSessions}</Text>
            <Text style={styles.statLabel}>Tugallangan</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{Math.round(getProgress())}%</Text>
            <Text style={styles.statLabel}>Jarayon</Text>
          </View>
        </View>
      </View>

      {/* Audio Selector Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAudioSelector}
        onRequestClose={() => setShowAudioSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tovush tanlang</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowAudioSelector(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.audioList} showsVerticalScrollIndicator={false}>
              {Object.entries(AUDIO_FILES).map(([key, audio]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.audioItem,
                    selectedAudio === key && styles.audioItemSelected
                  ]}
                  onPress={() => {
                    setSelectedAudio(key);
                    setShowAudioSelector(false);
                  }}
                >
                  <View style={styles.audioItemLeft}>
                    <View style={[
                      styles.audioIcon,
                      selectedAudio === key && styles.audioIconSelected
                    ]}>
                      <Ionicons 
                        name={audio.icon as any} 
                        size={24} 
                        color={selectedAudio === key ? 'white' : '#007AFF'} 
                      />
                    </View>
                    <Text style={[
                      styles.audioItemText,
                      selectedAudio === key && styles.audioItemTextSelected
                    ]}>
                      {audio.name}
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.previewButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      previewAudio(key);
                    }}
                  >
                    <Ionicons name="play" size={16} color="#007AFF" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    padding: 5,
    marginBottom: 20,
  },
  modeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 2,
  },
  activeModeButton: {
    backgroundColor: 'white',
  },
  modeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  activeModeButtonText: {
    color: '#333',
  },
  phaseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: width * 0.375,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  progressFill: {
    position: 'absolute',
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: width * 0.375,
    backgroundColor: 'rgba(255,255,255,0.2)',
    transformOrigin: 'center',
  },
  timerInner: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(255,255,255,0.98)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  timerText: {
    fontSize: width * 0.12,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'monospace',
  },
  phaseIndicator: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  controlButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  playButton: {
    backgroundColor: '#4CAF50',
  },
  pauseButton: {
    backgroundColor: '#FF9800',
  },
  resetButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'white',
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  audioControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  audioButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  audioButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    opacity: 0.6,
  },
  audioButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalCloseButton: {
    padding: 4,
  },
  audioList: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  audioItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  audioItemSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  audioItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  audioIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  audioIconSelected: {
    backgroundColor: '#007AFF',
  },
  audioItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  audioItemTextSelected: {
    color: '#007AFF',
  },
  previewButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
});