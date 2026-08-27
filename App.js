import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet, 
  Dimensions, 
  SafeAreaView, 
  Alert, 
  Animated, 
  Easing, 
  StatusBar, 
  ScrollView, 
  Modal, 
  Image, 
  Switch, 
  Clipboard, 
  Share,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

const SUPABASE_PROJECT_REF = 'zyqlntdpftowobsrzbgv'; 
const SUPABASE_ANON_KEY = 'sb_publishable_DuyB_EEKvMkDk0QFxQykqg_ZXCMzTwo';
const SUPABASE_REST_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co/rest/v1`;

const { width } = Dimensions.get('window');
const BOARD_SIZE = Math.min(width - 12, 420);
const CELL_SIZE = BOARD_SIZE / 15;

const ENTRY_FEE_OPTIONS = [50, 100, 200, 500];

const TRACK_COORDINATES = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14], [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7], [14, 6],
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0], [6, 0]
];

const HOME_PATHS = {
  BLUE: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
  RED: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  GREEN: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  YELLOW: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
};

const BASE_SPOTS = {
  BLUE: [[10.5, 1.5], [10.5, 3.5], [12.5, 1.5], [12.5, 3.5]],
  RED: [[1.5, 1.5], [1.5, 3.5], [3.5, 1.5], [3.5, 3.5]],
  GREEN: [[1.5, 10.5], [1.5, 12.5], [3.5, 10.5], [3.5, 12.5]],
  YELLOW: [[10.5, 10.5], [10.5, 12.5], [12.5, 10.5], [12.5, 12.5]],
};

const START_INDEX = { RED: 0, GREEN: 13, YELLOW: 26, BLUE: 39 };
const SAFE_INDEXES = [0, 8, 13, 21, 26, 34, 39, 47];
const ALL_COLORS = ['BLUE', 'RED', 'GREEN', 'YELLOW'];

const AVATAR_DATA = {
  MALE: [
    { id: 'm1', label: '👦 Boy', icon: '👦' },
    { id: 'm2', label: '🧔 Hero', icon: '🧔' },
    { id: 'm3', label: '🧑‍🦱 Cool Guy', icon: '🧑‍🦱' },
    { id: 'm4', label: '👨‍🦰 Smart', icon: '👨‍🦰' },
    { id: 'm5', label: '🤠 Cowboy', icon: '🤠' },
    { id: 'm6', label: '😎 Shades', icon: '😎' },
  ],
  FEMALE: [
    { id: 'f1', label: '👧 Girl', icon: '👧' },
    { id: 'f2', label: '👩‍🦰 Redhead', icon: '👩‍🦰' },
    { id: 'f3', label: '👱‍♀️ Blonde', icon: '👱‍♀️' },
    { id: 'f4', label: '👩‍🦱 Curly', icon: '👩‍🦱' },
    { id: 'f5', label: '👒 Cute Cap', icon: '👒' },
    { id: 'f6', label: '👸 Princess', icon: '👸' },
  ],
  ROYALE: [
    { id: 'r1', label: '👑 King', icon: '👑' },
    { id: 'r2', label: '🦁 Lion King', icon: '🦁' },
    { id: 'r3', label: '🐯 Tiger Pro', icon: '🐯' },
    { id: 'r4', label: '⚡ Flash', icon: '⚡' },
    { id: 'r5', label: '🐉 Dragon', icon: '🐉' },
    { id: 'r6', label: '💎 Diamond', icon: '💎' },
  ]
};

const QUICK_EMOJIS = ['😀', '🔥', '😂', '👏', '🎯', '👑', '😎', '🤫'];

const DiceFace = ({ value }) => {
  const dot = <View style={styles.diceDot} />;
  const empty = <View style={[styles.diceDot, { opacity: 0 }]} />;

  const getDots = () => {
    switch (value) {
      case 1:
        return <View style={styles.diceCenter}>{dot}</View>;
      case 2:
        return (
          <View style={styles.diceRowSpace}>
            <View style={styles.diceCol}>{dot}{empty}</View>
            <View style={styles.diceCol}>{empty}{dot}</View>
          </View>
        );
      case 3:
        return (
          <View style={styles.diceRowSpace}>
            <View style={styles.diceCol}>{dot}{empty}{empty}</View>
            <View style={styles.diceCol}>{empty}{dot}{empty}</View>
            <View style={styles.diceCol}>{empty}{empty}{dot}</View>
          </View>
        );
      case 4:
        return (
          <View style={styles.diceRowSpace}>
            <View style={styles.diceCol}>{dot}{dot}</View>
            <View style={styles.diceCol}>{dot}{dot}</View>
          </View>
        );
      case 5:
        return (
          <View style={styles.diceRowSpace}>
            <View style={styles.diceCol}>{dot}{empty}{dot}</View>
            <View style={styles.diceCol}>{empty}{dot}{empty}</View>
            <View style={styles.diceCol}>{dot}{empty}{dot}</View>
          </View>
        );
      case 6:
        return (
          <View style={styles.diceRowSpace}>
            <View style={styles.diceCol}>{dot}{dot}{dot}</View>
            <View style={styles.diceCol}>{dot}{dot}{dot}</View>
          </View>
        );
      default:
        return <View style={styles.diceCenter}>{dot}</View>;
    }
  };

  return <View style={styles.diceBox}>{getDots()}</View>;
};

const PinToken = ({ colorHex, rotateBack, stackCount }) => (
  <View style={[styles.pinWrapper, rotateBack && { transform: [{ rotate: '180deg' }] }]}>
    {stackCount > 1 && (
      <View style={styles.stackBadgeBubble}>
        <Text style={styles.stackBadgeText}>{stackCount}</Text>
      </View>
    )}
    <View style={[styles.pinHead, { backgroundColor: colorHex }]}>
      <View style={styles.pinInnerGlow} />
      <View style={styles.pinCenterDot} />
    </View>
    <View style={[styles.pinPointer, { borderTopColor: colorHex }]} />
  </View>
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('LOGIN');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');

  const [settingsModal, setSettingsModal] = useState(false);
  const [profileStatsModal, setProfileStatsModal] = useState(false);
  const [avatarModal, setAvatarModal] = useState(false);
  const [avatarCategory, setAvatarCategory] = useState('FEMALE');
  const [userAvatar, setUserAvatar] = useState('👸');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [chatModal, setChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState('');
  const [isMicOn, setIsMicOn] = useState(false);
  const [voiceUsers, setVoiceUsers] = useState({});

  const [selectedEntryFee, setSelectedEntryFee] = useState(50);
  const [matchPrizePool, setMatchPrizePool] = useState(0);

  const [userStats, setUserStats] = useState({
    totalPlayed: 0,
    totalWon: 0,
    totalLost: 0,
  });

  // Turn Timer 30 seconds
  const [turnTimeLeft, setTurnTimeLeft] = useState(30);
  const [playerMissCount, setPlayerMissCount] = useState({
    BLUE: 0,
    RED: 0,
    GREEN: 0,
    YELLOW: 0
  });

  const [finishedRankings, setFinishedRankings] = useState([]);
  const [showPodiumBoard, setShowPodiumBoard] = useState(false);

  const [friendsModal, setFriendsModal] = useState(false);
  const [friendsTab, setFriendsTab] = useState('LIST');
  const [friendsList, setFriendsList] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUserResult, setSearchedUserResult] = useState(null);
  const [isSearchingCloud, setIsSearchingCloud] = useState(false);
  const [incomingInvite, setIncomingInvite] = useState(null);

  const [gameMode, setGameMode] = useState(null); 
  const [botSelectModal, setBotSelectModal] = useState(false);
  const [botPlayerCount, setBotPlayerCount] = useState(2);
  const [passPlayModal, setPassPlayModal] = useState(false);
  const [hybridTeamModal, setHybridTeamModal] = useState(false);
  const [onlineScreen, setOnlineScreen] = useState(false);
  const [onlineLobbyModal, setOnlineLobbyModal] = useState(false);
  
  const [playType, setPlayType] = useState('SOLO');
  const [selectedPlayerCount, setSelectedPlayerCount] = useState(2);
  const [onlinePlayType, setOnlinePlayType] = useState('SOLO');
  const [onlinePlayerCount, setOnlinePlayerCount] = useState(2);
  const [friendlyKill, setFriendlyKill] = useState(false);
  const [activeColors, setActiveColors] = useState(['BLUE', 'GREEN']);

  const [roomPlayers, setRoomPlayers] = useState({});

  const [playerSlots, setPlayerSlots] = useState({
    BLUE: 'LOCAL',
    GREEN: 'ONLINE',
    RED: 'ONLINE',
    YELLOW: 'ONLINE',
  });

  const [roomCode, setRoomCode] = useState('');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [teamJoinCode, setTeamJoinCode] = useState('');
  const [myColor, setMyColor] = useState('BLUE');
  const [isHost, setIsHost] = useState(false);
  const [isVerifyingRoom, setIsVerifyingRoom] = useState(false);
  const joinTimeoutRef = useRef(null);

  const [playerDices, setPlayerDices] = useState({
    BLUE: 1,
    RED: 3,
    GREEN: 6,
    YELLOW: 2,
  });

  const [isRolling, setIsRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [turnIndex, setTurnIndex] = useState(0);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const diceBounceAnim = useRef(new Animated.Value(1)).current;
  const arrowBounceAnim = useRef(new Animated.Value(0)).current;
  const arrowBlinkAnim = useRef(new Animated.Value(1)).current;

  const shouldFlipBoard = (gameMode === 'ONLINE' || gameMode === 'HYBRID') && myColor === 'GREEN';

  const [pawns, setPawns] = useState({
    BLUE: [-1, -1, -1, -1],
    RED: [-1, -1, -1, -1],
    GREEN: [-1, -1, -1, -1],
    YELLOW: [-1, -1, -1, -1],
  });

  const pawnsRef = useRef(pawns);
  pawnsRef.current = pawns;
  const ws = useRef(null);
  const userWs = useRef(null);
  const currentTurn = activeColors[turnIndex] || activeColors[0] || 'BLUE';

  const deductUserCoins = async (amount) => {
    if (!currentUser) return false;
    if (currentUser.coins < amount) {
      Alert.alert('Low Coins', `You need at least 🪙 ${amount} coins. Claim your daily free reward from the lobby!`);
      return false;
    }
    const updatedUser = { ...currentUser, coins: currentUser.coins - amount };
    setCurrentUser(updatedUser);
    await AsyncStorage.setItem('@ludo_supreme_user', JSON.stringify(updatedUser));
    syncUserCoinsToCloud(updatedUser.playerId, updatedUser.coins);
    return true;
  };

  const addWinnerCoins = async (amount) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, coins: currentUser.coins + amount };
    setCurrentUser(updatedUser);
    await AsyncStorage.setItem('@ludo_supreme_user', JSON.stringify(updatedUser));
    syncUserCoinsToCloud(updatedUser.playerId, updatedUser.coins);
  };

  const syncUserCoinsToCloud = async (playerId, coins) => {
    try {
      await fetch(`${SUPABASE_REST_URL}/ludo_users?player_id=eq.${playerId}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ coins })
      });
    } catch (e) {}
  };

  const claimFreeBonus = async () => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, coins: currentUser.coins + 200 };
    setCurrentUser(updatedUser);
    await AsyncStorage.setItem('@ludo_supreme_user', JSON.stringify(updatedUser));
    syncUserCoinsToCloud(updatedUser.playerId, updatedUser.coins);
    Alert.alert('🎁 Bonus Claimed!', '🪙 200 Free Coins added to your wallet!');
  };

  const handleCopyAndShareRoomCode = async () => {
    if (!roomCode) return;
    try {
      Clipboard.setString(roomCode);
      Alert.alert('Copied!', `Room Code ${roomCode} copied to clipboard.`);
      await Share.share({
        message: `Join my Ludo Supreme game! Room Code: ${roomCode}`,
      });
    } catch (error) {
      Clipboard.setString(roomCode);
      Alert.alert('Copied!', `Room Code ${roomCode} copied to clipboard.`);
    }
  };

  const playSound = async (type) => {
    if (!soundEnabled) return;
    try {
      let soundAsset = null;
      if (type === 'dice') soundAsset = require('./assets/sounds/dice.mp3');
      else if (type === 'move') soundAsset = require('./assets/sounds/move.mp3');
      else if (type === 'cut') soundAsset = require('./assets/sounds/cut.mp3');
      else if (type === 'win') soundAsset = require('./assets/sounds/win.mp3');

      if (soundAsset) {
        const { sound } = await Audio.Sound.createAsync(soundAsset, { shouldPlay: true });
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            sound.unloadAsync().catch(() => {});
          }
        });
      }
    } catch (e) {}
  };

  const toggleVoiceMic = () => {
    const nextState = !isMicOn;
    setIsMicOn(nextState);

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        topic: `realtime:room_${roomCode}`,
        event: 'broadcast',
        payload: {
          type: 'VOICE_STATUS_UPDATE',
          data: { color: myColor, name: currentUser.name, isMicOn: nextState }
        },
        ref: 'voice_1'
      }));
    }
  };

  const sendChatMessage = (textToSend = null) => {
    const msg = (textToSend || chatInputText).trim();
    if (!msg) return;

    const newMsgObj = {
      id: Date.now().toString(),
      senderName: currentUser.name,
      senderColor: myColor,
      avatar: userAvatar,
      text: msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, newMsgObj]);
    setChatInputText('');

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        topic: `realtime:room_${roomCode}`,
        event: 'broadcast',
        payload: {
          type: 'CHAT_MESSAGE',
          data: newMsgObj
        },
        ref: 'chat_1'
      }));
    }
  };

  useEffect(() => {
    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowBounceAnim, {
          toValue: 5,
          duration: 380,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(arrowBounceAnim, {
          toValue: 0,
          duration: 380,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ])
    );

    const blinkLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowBlinkAnim, {
          toValue: 0.35,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(arrowBlinkAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }),
      ])
    );

    bounceLoop.start();
    blinkLoop.start();

    return () => {
      bounceLoop.stop();
      blinkLoop.stop();
    };
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const saved = await AsyncStorage.getItem('@ludo_supreme_user');
        const savedSound = await AsyncStorage.getItem('@ludo_sound_setting');
        const savedAvatar = await AsyncStorage.getItem('@ludo_user_avatar');

        if (saved) {
          const userObj = JSON.parse(saved);
          setCurrentUser(userObj);
          loadUserData(userObj.playerId);
        }
        if (savedSound !== null) setSoundEnabled(JSON.parse(savedSound));
        if (savedAvatar) setUserAvatar(savedAvatar);
      } catch (err) {}
    };
    restoreSession();
  }, []);

  const loadUserData = async (playerId) => {
    try {
      const storedFriends = await AsyncStorage.getItem(`@ludo_friends_${playerId}`);
      const storedRequests = await AsyncStorage.getItem(`@ludo_requests_${playerId}`);
      const storedStats = await AsyncStorage.getItem(`@ludo_stats_${playerId}`);

      if (storedFriends) setFriendsList(JSON.parse(storedFriends));
      if (storedRequests) setPendingRequests(JSON.parse(storedRequests));
      if (storedStats) setUserStats(JSON.parse(storedStats));
    } catch (e) {}
  };

  const saveUserData = async (playerId, friends, requests) => {
    try {
      await AsyncStorage.setItem(`@ludo_friends_${playerId}`, JSON.stringify(friends));
      await AsyncStorage.setItem(`@ludo_requests_${playerId}`, JSON.stringify(requests));
    } catch (e) {}
  };

  const updateUserGameStats = async (didWin) => {
    if (!currentUser) return;
    try {
      const updated = {
        totalPlayed: (userStats.totalPlayed || 0) + 1,
        totalWon: didWin ? (userStats.totalWon || 0) + 1 : (userStats.totalWon || 0),
        totalLost: !didWin ? (userStats.totalLost || 0) + 1 : (userStats.totalLost || 0),
      };
      setUserStats(updated);
      await AsyncStorage.setItem(`@ludo_stats_${currentUser.playerId}`, JSON.stringify(updated));
    } catch (e) {}
  };

  const toggleSound = async (val) => {
    setSoundEnabled(val);
    await AsyncStorage.setItem('@ludo_sound_setting', JSON.stringify(val));
  };

  const selectAvatar = async (avatar) => {
    setUserAvatar(avatar);
    await AsyncStorage.setItem('@ludo_user_avatar', avatar);
    if (currentUser) {
      try {
        await fetch(`${SUPABASE_REST_URL}/ludo_users?player_id=eq.${currentUser.playerId}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ avatar })
        });
      } catch (e) {}
    }
  };

  // 30 Seconds Turn Timer
  useEffect(() => {
    if (!gameMode || showPodiumBoard) return;

    setTurnTimeLeft(30);
    const timerInterval = setInterval(() => {
      setTurnTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          handleTurnTimeout();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [turnIndex, gameMode, showPodiumBoard]);

  const handleTurnTimeout = () => {
    if (isMoving || isRolling || showPodiumBoard) return;

    const newMissCount = (playerMissCount[currentTurn] || 0) + 1;
    setPlayerMissCount((prev) => ({ ...prev, [currentTurn]: newMissCount }));

    if (newMissCount >= 3) {
      handlePlayerElimination(currentTurn);
      return;
    }

    rollDice(true, true);
  };

  const handlePlayerElimination = (eliminatedColor) => {
    const remaining = activeColors.filter((c) => c !== eliminatedColor);
    if (remaining.length <= 1) {
      const winCol = remaining[0] || 'BLUE';
      const updatedRanks = [...finishedRankings, winCol, eliminatedColor];
      setFinishedRankings(updatedRanks);
      setShowPodiumBoard(true);
      playSound('win');
      if (winCol === myColor) {
        addWinnerCoins(matchPrizePool);
      }
      updateUserGameStats(winCol === myColor);
      sendMultiplayerSync(pawnsRef.current, turnIndex, playerDices, false, updatedRanks);
    } else {
      setActiveColors(remaining);
      const nextIdx = nextTurn();
      Alert.alert('Player Disqualified', `${getBaseDynamicLabel(eliminatedColor)} lost after 3 continuous misses.`);
      sendMultiplayerSync(pawnsRef.current, nextIdx, playerDices, false);
    }
  };

  // Bot AI Priority Logic
  const getStrategicMoveIndex = (color, diceVal, validMoves) => {
    if (validMoves.length === 1) return validMoves[0];

    const playerPawns = pawnsRef.current[color];

    // Priority 1: Kill enemy
    for (let idx of validMoves) {
      let step = playerPawns[idx];
      let targetStep = step === -1 ? 0 : step + diceVal;
      if (targetStep < 51) {
        let trackIdx = (START_INDEX[color] + targetStep) % 52;
        if (!SAFE_INDEXES.includes(trackIdx)) {
          for (let enemy of activeColors) {
            if (enemy !== color && !isTeammate(color, enemy)) {
              for (let enemyStep of pawnsRef.current[enemy]) {
                if (enemyStep >= 0 && enemyStep < 51) {
                  let enemyTrack = (START_INDEX[enemy] + enemyStep) % 52;
                  if (enemyTrack === trackIdx) return idx;
                }
              }
            }
          }
        }
      }
    }

    // Priority 2: Home Entry (Lali)
    const homeMove = validMoves.find((idx) => playerPawns[idx] + diceVal === 56);
    if (homeMove !== undefined) return homeMove;

    // Priority 3: Reach Safe Star
    for (let idx of validMoves) {
      let step = playerPawns[idx];
      let targetStep = step === -1 ? 0 : step + diceVal;
      if (targetStep < 51) {
        let trackIdx = (START_INDEX[color] + targetStep) % 52;
        if (SAFE_INDEXES.includes(trackIdx)) return idx;
      }
    }

    // Priority 4: Open Base on 6
    if (diceVal === 6) {
      const basePawn = validMoves.find((idx) => playerPawns[idx] === -1);
      if (basePawn !== undefined) return basePawn;
    }

    // Priority 5: Escape Enemy Threat
    for (let idx of validMoves) {
      let step = playerPawns[idx];
      if (step >= 0 && step < 51) {
        let myTrack = (START_INDEX[color] + step) % 52;
        for (let enemy of activeColors) {
          if (enemy !== color && !isTeammate(color, enemy)) {
            for (let enemyStep of pawnsRef.current[enemy]) {
              if (enemyStep >= 0 && enemyStep < 51) {
                let enemyTrack = (START_INDEX[enemy] + enemyStep) % 52;
                let diff = (myTrack - enemyTrack + 52) % 52;
                if (diff >= 1 && diff <= 6) return idx;
              }
            }
          }
        }
      }
    }

    // Priority 6: Balanced Play
    return validMoves.reduce((lowest, curr) => (playerPawns[curr] < playerPawns[lowest] ? curr : lowest), validMoves[0]);
  };

  const handleAuthSubmit = async () => {
    if (!emailInput.trim()) {
      Alert.alert('Error', 'Please enter email address.');
      return;
    }

    const cleanEmail = emailInput.trim().toLowerCase();

    try {
      if (authMode === 'SIGNUP') {
        if (!passwordInput.trim() || !usernameInput.trim()) {
          Alert.alert('Error', 'Please fill all fields.');
          return;
        }

        const checkRes = await fetch(`${SUPABASE_REST_URL}/ludo_users?email=eq.${cleanEmail}`, {
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const existingUsers = await checkRes.json();

        if (existingUsers && existingUsers.length > 0) {
          Alert.alert('Account Exists', 'Account already registered. Please Sign In.');
          return;
        }

        const newId = Math.floor(10000 + Math.random() * 90000).toString();
        const newUserObj = {
          name: usernameInput.trim(),
          email: cleanEmail,
          password: passwordInput.trim(),
          coins: 2000,
          player_id: newId,
          avatar: '👸'
        };

        await fetch(`${SUPABASE_REST_URL}/ludo_users`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(newUserObj)
        });

        const createdUser = {
          name: newUserObj.name,
          email: newUserObj.email,
          playerId: newUserObj.player_id,
          coins: 2000
        };

        await AsyncStorage.setItem('@ludo_supreme_user', JSON.stringify(createdUser));
        setCurrentUser(createdUser);
        loadUserData(createdUser.playerId);
        Alert.alert('Account Created!', `Welcome ${createdUser.name}! Your ID is #${createdUser.playerId}`);
      } else if (authMode === 'LOGIN') {
        if (!passwordInput.trim()) {
          Alert.alert('Error', 'Please enter password.');
          return;
        }

        const loginRes = await fetch(`${SUPABASE_REST_URL}/ludo_users?email=eq.${cleanEmail}`, {
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const users = await loginRes.json();

        if (!users || users.length === 0 || users[0].password !== passwordInput.trim()) {
          Alert.alert('Login Failed', 'Invalid credentials or account does not exist.');
          return;
        }

        const matched = {
          name: users[0].name,
          email: users[0].email,
          playerId: users[0].player_id,
          coins: users[0].coins || 2000
        };

        await AsyncStorage.setItem('@ludo_supreme_user', JSON.stringify(matched));
        if (users[0].avatar) setUserAvatar(users[0].avatar);
        setCurrentUser(matched);
        loadUserData(matched.playerId);
      } else if (authMode === 'FORGOT') {
        if (!newPasswordInput.trim()) {
          Alert.alert('Error', 'Please enter your new password.');
          return;
        }

        await fetch(`${SUPABASE_REST_URL}/ludo_users?email=eq.${cleanEmail}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password: newPasswordInput.trim() })
        });

        Alert.alert('Password Updated', 'Your password has been reset successfully.');
        setAuthMode('LOGIN');
      }
    } catch (err) {
      Alert.alert('Network Error', 'Please check internet connection.');
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('@ludo_supreme_user');
      setCurrentUser(null);
      setSettingsModal(false);
      setProfileStatsModal(false);
      resetGame();
    } catch (err) {}
  };

  const handleGuestLogin = () => {
    const guestId = Math.floor(1000 + Math.random() * 9000);
    const guestObj = { name: `Guest_${guestId}`, email: `guest_${guestId}@ludo.app`, coins: 500, playerId: guestId.toString() };
    setCurrentUser(guestObj);
    loadUserData(guestObj.playerId);
  };

  // Cloud Friend Request Syncing & Polling
  const checkCloudFriendRequests = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${SUPABASE_REST_URL}/ludo_friend_requests?to_id=eq.${currentUser.playerId}&status=eq.PENDING`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
      });
      const data = await res.json();
      if (data && Array.isArray(data) && data.length > 0) {
        const formatted = data.map(item => ({ id: item.from_id, name: item.from_name, reqRowId: item.id }));
        setPendingRequests(formatted);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (!currentUser) return;
    checkCloudFriendRequests();
    const friendInterval = setInterval(checkCloudFriendRequests, 4000);
    return () => clearInterval(friendInterval);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const wsUrl = `wss://${SUPABASE_PROJECT_REF}.supabase.co/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;
    userWs.current = new WebSocket(wsUrl);

    userWs.current.onopen = () => {
      userWs.current.send(JSON.stringify({
        topic: `realtime:user_${currentUser.playerId}`,
        event: 'phx_join',
        payload: {},
        ref: 'user_1'
      }));
    };

    userWs.current.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.event === 'broadcast' && msg.payload) {
          const { type, data } = msg.payload;
          if (type === 'GAME_INVITE') {
            setIncomingInvite(data);
          } else if (type === 'FRIEND_REQUEST') {
            checkCloudFriendRequests();
            Alert.alert('New Friend Request!', `${data.fromName} sent you a friend request.`);
          } else if (type === 'FRIEND_ACCEPTED') {
            const newFriend = { id: data.fromId, name: data.fromName, online: true };
            setFriendsList((prev) => {
              const updated = [...prev.filter(f => f.id !== data.fromId), newFriend];
              saveUserData(currentUser.playerId, updated, pendingRequests);
              return updated;
            });
            Alert.alert('Request Accepted!', `${data.fromName} is now your friend!`);
          }
        }
      } catch (err) {}
    };

    return () => {
      if (userWs.current) userWs.current.close();
    };
  }, [currentUser, friendsList, pendingRequests]);

  const handleSearchUser = async () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;

    setIsSearchingCloud(true);
    setSearchedUserResult(null);

    try {
      const res = await fetch(`${SUPABASE_REST_URL}/ludo_users?or=(player_id.eq.${q},email.eq.${q})`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
      });
      const data = await res.json();

      setIsSearchingCloud(false);
      if (data && data.length > 0) {
        const found = {
          name: data[0].name,
          email: data[0].email,
          playerId: data[0].player_id,
          avatar: data[0].avatar || '👦'
        };

        if (found.playerId === currentUser.playerId) {
          Alert.alert('Note', 'This is your own profile ID.');
        } else {
          setSearchedUserResult(found);
        }
      } else {
        Alert.alert('Not Found', 'No player found with this ID or Email.');
      }
    } catch (e) {
      setIsSearchingCloud(false);
      Alert.alert('Search Error', 'Failed to connect to player cloud.');
    }
  };

  const sendRealtimeFriendRequest = async (targetUser) => {
    try {
      await fetch(`${SUPABASE_REST_URL}/ludo_friend_requests`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          from_id: currentUser.playerId,
          from_name: currentUser.name,
          to_id: targetUser.playerId,
          status: 'PENDING'
        })
      });

      if (userWs.current && userWs.current.readyState === WebSocket.OPEN) {
        userWs.current.send(JSON.stringify({
          topic: `realtime:user_${targetUser.playerId}`,
          event: 'broadcast',
          payload: {
            type: 'FRIEND_REQUEST',
            data: { fromId: currentUser.playerId, fromName: currentUser.name }
          },
          ref: 'req_1'
        }));
      }

      Alert.alert('Success', `Friend request sent to ${targetUser.name}!`);
      setSearchedUserResult(null);
      setSearchQuery('');
    } catch (e) {
      Alert.alert('Error', 'Could not send friend request. Try again.');
    }
  };

  const acceptFriendRequest = async (reqUser) => {
    try {
      if (reqUser.reqRowId) {
        await fetch(`${SUPABASE_REST_URL}/ludo_friend_requests?id=eq.${reqUser.reqRowId}`, {
          method: 'DELETE',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
      }

      const updatedReqs = pendingRequests.filter(r => r.id !== reqUser.id);
      const newFriend = { id: reqUser.id, name: reqUser.name, online: true };
      const updatedFriends = [...friendsList.filter(f => f.id !== reqUser.id), newFriend];

      setPendingRequests(updatedReqs);
      setFriendsList(updatedFriends);
      saveUserData(currentUser.playerId, updatedFriends, updatedReqs);

      if (userWs.current && userWs.current.readyState === WebSocket.OPEN) {
        userWs.current.send(JSON.stringify({
          topic: `realtime:user_${reqUser.id}`,
          event: 'broadcast',
          payload: {
            type: 'FRIEND_ACCEPTED',
            data: { fromId: currentUser.playerId, fromName: currentUser.name }
          },
          ref: 'acc_1'
        }));
      }

      Alert.alert('Success', `You are now friends with ${reqUser.name}!`);
    } catch (e) {}
  };

  const sendFriendInvite = (friend) => {
    const activeRoom = roomCode || Math.floor(100000 + Math.random() * 900000).toString();
    if (!roomCode) setRoomCode(activeRoom);

    if (userWs.current && userWs.current.readyState === WebSocket.OPEN) {
      userWs.current.send(JSON.stringify({
        topic: `realtime:user_${friend.id}`,
        event: 'broadcast',
        payload: {
          type: 'GAME_INVITE',
          data: {
            fromName: currentUser.name,
            fromId: currentUser.playerId,
            roomCode: activeRoom,
            playType: playType || 'SOLO',
            targetColor: 'GREEN',
            entryFee: selectedEntryFee
          }
        },
        ref: 'inv_1'
      }));
      setFriendsModal(false);
      Alert.alert('Invite Sent', `Match invitation sent to ${friend.name}`);
    } else {
      Alert.alert('Connection Error', 'Please check your internet connection.');
    }
  };

  const acceptInvite = async () => {
    if (!incomingInvite) return;
    const { roomCode: invitedRoom, playType: invitedType, targetColor, fromName, fromId, entryFee = 50 } = incomingInvite;
    
    const canJoin = await deductUserCoins(entryFee);
    if (!canJoin) return;

    setRoomCode(invitedRoom);
    setMyColor(targetColor || 'GREEN');
    setIsHost(false);
    setPlayType(invitedType || 'SOLO');
    setSelectedEntryFee(entryFee);
    setMatchPrizePool(entryFee * 2);
    
    setRoomPlayers({
      BLUE: { name: fromName, id: fromId },
      GREEN: { name: currentUser.name, id: currentUser.playerId, avatar: userAvatar }
    });

    if (invitedType === 'TEAM') {
      setActiveColors(['BLUE', 'RED', 'GREEN', 'YELLOW']);
      setGameMode('ONLINE');
    } else {
      setActiveColors(['BLUE', 'GREEN']);
      setGameMode('ONLINE');
    }

    setOnlineLobbyModal(false);
    setIncomingInvite(null);
  };

  const startBotMatch = (count) => {
    let colors = ['BLUE', 'GREEN'];
    let pool = 100;

    if (count === 2) {
      colors = ['BLUE', 'GREEN'];
      pool = 100;
      setRoomPlayers({ BLUE: { name: currentUser.name }, GREEN: { name: 'Bot (Green)' } });
    } else if (count === 3) {
      colors = ['BLUE', 'RED', 'GREEN'];
      pool = 200;
      setRoomPlayers({ BLUE: { name: currentUser.name }, RED: { name: 'Bot 1 (Red)' }, GREEN: { name: 'Bot 2 (Green)' } });
    } else {
      colors = ['BLUE', 'RED', 'GREEN', 'YELLOW'];
      pool = 300;
      setRoomPlayers({ BLUE: { name: currentUser.name }, RED: { name: 'Bot 1' }, GREEN: { name: 'Bot 2' }, YELLOW: { name: 'Bot 3' } });
    }

    setMatchPrizePool(pool);
    setActiveColors(colors);
    setPlayType('SOLO');
    setTurnIndex(0);
    setHasRolled(false);
    setIsMoving(false);
    setFinishedRankings([]);
    setShowPodiumBoard(false);
    setBotSelectModal(false);
    setGameMode('BOT');
  };

  const startCustomPassPlay = () => {
    let colors = ['BLUE', 'GREEN'];
    if (playType === 'SOLO') {
      if (selectedPlayerCount === 2) colors = ['BLUE', 'GREEN'];
      else if (selectedPlayerCount === 3) colors = ['BLUE', 'RED', 'GREEN'];
      else colors = ['BLUE', 'RED', 'GREEN', 'YELLOW'];
    } else {
      colors = ['BLUE', 'RED', 'GREEN', 'YELLOW'];
    }
    setActiveColors(colors);
    setTurnIndex(0);
    setHasRolled(false);
    setIsMoving(false);
    setFinishedRankings([]);
    setShowPodiumBoard(false);
    setPassPlayModal(false);
    setGameMode('OFFLINE');
  };

  const startOnlineHost = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    setMyColor('BLUE');
    setIsHost(true);
    
    // Online Arena mein pure slots default 'ONLINE' rahenge
    setPlayerSlots({ BLUE: 'LOCAL', GREEN: 'ONLINE', RED: 'ONLINE', YELLOW: 'ONLINE' });

    let colors = ['BLUE', 'GREEN'];
    if (onlinePlayType === 'SOLO') {
      if (onlinePlayerCount === 2) colors = ['BLUE', 'GREEN'];
      else if (onlinePlayerCount === 3) colors = ['BLUE', 'RED', 'GREEN'];
      else colors = ['BLUE', 'RED', 'GREEN', 'YELLOW'];
    } else {
      colors = ['BLUE', 'RED', 'GREEN', 'YELLOW'];
    }
    
    setActiveColors(colors);
    setPlayType(onlinePlayType);
    setRoomPlayers({ BLUE: { name: currentUser.name, id: currentUser.playerId, avatar: userAvatar } });
    setOnlineScreen(false);
    setOnlineLobbyModal(true);
  };

  const joinOnlineRoom = () => {
    const code = inputRoomCode.trim();
    if (code.length < 4) {
      Alert.alert('Invalid Code', 'Please enter a valid room code');
      return;
    }

    setIsVerifyingRoom(true);
    setIsHost(false);

    const wsUrl = `wss://${SUPABASE_PROJECT_REF}.supabase.co/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;
    const tempWs = new WebSocket(wsUrl);

    tempWs.onopen = () => {
      tempWs.send(JSON.stringify({
        topic: `realtime:room_${code}`,
        event: 'phx_join',
        payload: {},
        ref: 'chk_join'
      }));

      tempWs.send(JSON.stringify({
        topic: `realtime:room_${code}`,
        event: 'broadcast',
        payload: {
          type: 'CHECK_ROOM_EXISTS',
          data: { guestId: currentUser?.playerId }
        },
        ref: 'chk_req'
      }));
    };

    tempWs.onmessage = (e) => {
      try {
        const message = JSON.parse(e.data);
        if (message.event === 'broadcast' && message.payload?.type === 'ROOM_EXISTS_CONFIRMED') {
          if (joinTimeoutRef.current) clearTimeout(joinTimeoutRef.current);
          tempWs.close();

          const data = message.payload.data;
          setRoomCode(code);
          setMyColor('GREEN');
          setActiveColors(data.activeColors || ['BLUE', 'GREEN']);
          setPlayType(data.playType || 'SOLO');
          setSelectedEntryFee(data.entryFee || 50);
          setRoomPlayers(prev => ({ 
            ...prev, 
            BLUE: { name: data.hostName || 'Host', avatar: data.hostAvatar || '👑' },
            GREEN: { name: currentUser.name, id: currentUser.playerId, avatar: userAvatar } 
          }));
          setIsVerifyingRoom(false);
          setOnlineScreen(false);
          setOnlineLobbyModal(true);
        }
      } catch (err) {}
    };

    joinTimeoutRef.current = setTimeout(() => {
      tempWs.close();
      setIsVerifyingRoom(false);
      Alert.alert('Room Not Found', 'No active host found with this code.');
    }, 4500);
  };

  const joinTeamOnlineRoom = () => {
    const code = teamJoinCode.trim();
    if (code.length < 4) {
      Alert.alert('Invalid Code', 'Please enter a valid room code to join');
      return;
    }

    setIsVerifyingRoom(true);
    setIsHost(false);

    const wsUrl = `wss://${SUPABASE_PROJECT_REF}.supabase.co/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;
    const tempWs = new WebSocket(wsUrl);

    tempWs.onopen = () => {
      tempWs.send(JSON.stringify({
        topic: `realtime:room_${code}`,
        event: 'phx_join',
        payload: {},
        ref: 'chk_join_team'
      }));

      tempWs.send(JSON.stringify({
        topic: `realtime:room_${code}`,
        event: 'broadcast',
        payload: {
          type: 'CHECK_ROOM_EXISTS',
          data: { guestId: currentUser?.playerId }
        },
        ref: 'chk_req_team'
      }));
    };

    tempWs.onmessage = (e) => {
      try {
        const message = JSON.parse(e.data);
        if (message.event === 'broadcast' && message.payload?.type === 'ROOM_EXISTS_CONFIRMED') {
          if (joinTimeoutRef.current) clearTimeout(joinTimeoutRef.current);
          tempWs.close();

          const data = message.payload.data;
          setRoomCode(code);
          setMyColor('GREEN');
          setActiveColors(['BLUE', 'RED', 'GREEN', 'YELLOW']);
          setPlayType('TEAM');
          setGameMode('HYBRID');
          setSelectedEntryFee(data.entryFee || 50);
          setRoomPlayers(prev => ({ 
            ...prev, 
            BLUE: { name: data.hostName || 'Host', avatar: data.hostAvatar || '👑' },
            GREEN: { name: currentUser.name, id: currentUser.playerId, avatar: userAvatar } 
          }));
          setIsVerifyingRoom(false);
          setHybridTeamModal(false);
          setOnlineLobbyModal(true);
        }
      } catch (err) {}
    };

    joinTimeoutRef.current = setTimeout(() => {
      tempWs.close();
      setIsVerifyingRoom(false);
      Alert.alert('Room Not Found', 'No active team host found with this code.');
    }, 4500);
  };

  const getEffectiveReadyCount = () => {
    let count = 0;
    activeColors.forEach((colorKey) => {
      if (roomPlayers[colorKey] || (gameMode === 'HYBRID' && playerSlots[colorKey] === 'BOT')) {
        count++;
      }
    });
    return count;
  };

  const startMatchFromLobby = async () => {
    if (!isHost) {
      Alert.alert('Permission Denied', 'Only the room Host can start the game!');
      return;
    }

    const currentReady = getEffectiveReadyCount();
    if (currentReady < activeColors.length) {
      Alert.alert('Waiting for Players', `Please wait for all players to join (${currentReady}/${activeColors.length}).`);
      return;
    }

    const canPlay = await deductUserCoins(selectedEntryFee);
    if (!canPlay) return;

    const totalPool = selectedEntryFee * activeColors.length;
    setMatchPrizePool(totalPool);

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        topic: `realtime:room_${roomCode}`,
        event: 'broadcast',
        payload: {
          type: 'START_MATCH',
          data: { activeColors, playType, syncedRoomPlayers: roomPlayers, entryFee: selectedEntryFee, prizePool: totalPool }
        },
        ref: 'start_1'
      }));
    }
    setOnlineLobbyModal(false);
    setTurnIndex(0);
    setHasRolled(false);
    setIsMoving(false);
    setFinishedRankings([]);
    setShowPodiumBoard(false);
    setGameMode(gameMode || 'ONLINE');
  };

  const resetGame = () => {
    setPawns({
      BLUE: [-1, -1, -1, -1],
      RED: [-1, -1, -1, -1],
      GREEN: [-1, -1, -1, -1],
      YELLOW: [-1, -1, -1, -1],
    });
    setTurnIndex(0);
    setHasRolled(false);
    setIsMoving(false);
    setIsRolling(false);
    setIsHost(false);
    setChatMessages([]);
    setIsMicOn(false);
    setVoiceUsers({});
    setFinishedRankings([]);
    setShowPodiumBoard(false);
    setGameMode(null);
    setBotSelectModal(false);
    setPassPlayModal(false);
    setHybridTeamModal(false);
    setOnlineScreen(false);
    setOnlineLobbyModal(false);
    setRoomPlayers({});
    if (ws.current) ws.current.close();
  };

  const handleExitGame = () => {
    Alert.alert('Exit Game', 'Return to Main Lobby?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Quit Match', style: 'destructive', onPress: resetGame },
    ]);
  };

  const isTeammate = (c1, c2) => {
    if (playType !== 'TEAM') return false;
    return ( (c1 === 'BLUE' && c2 === 'GREEN') || (c1 === 'GREEN' && c2 === 'BLUE') ||
             (c1 === 'RED' && c2 === 'YELLOW') || (c1 === 'YELLOW' && c2 === 'RED') );
  };

  // Real-time WebSocket Multi-player Game & Lobby Sync
  useEffect(() => {
    if ((gameMode !== 'ONLINE' && !onlineLobbyModal && gameMode !== 'HYBRID') || !roomCode) return;
    const wsUrl = `wss://${SUPABASE_PROJECT_REF}.supabase.co/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({
        topic: `realtime:room_${roomCode}`,
        event: 'phx_join',
        payload: {},
        ref: '1'
      }));

      if (currentUser) {
        ws.current.send(JSON.stringify({
          topic: `realtime:room_${roomCode}`,
          event: 'broadcast',
          payload: {
            type: 'PLAYER_JOINED',
            data: { color: myColor, name: currentUser.name, id: currentUser.playerId, avatar: userAvatar }
          },
          ref: 'p_join'
        }));
      }
    };

    ws.current.onmessage = async (e) => {
      try {
        const message = JSON.parse(e.data);
        if (message.event === 'broadcast') {
          const type = message.payload?.type;
          const data = message.payload?.data;

          if (type === 'CHECK_ROOM_EXISTS') {
            if (myColor === 'BLUE' && currentUser) {
              ws.current.send(JSON.stringify({
                topic: `realtime:room_${roomCode}`,
                event: 'broadcast',
                payload: {
                  type: 'ROOM_EXISTS_CONFIRMED',
                  data: {
                    hostName: currentUser.name,
                    hostAvatar: userAvatar,
                    activeColors,
                    playType,
                    entryFee: selectedEntryFee
                  }
                },
                ref: 'confirm_ack'
              }));
            }
          } else if (type === 'CHAT_MESSAGE') {
            setChatMessages((prev) => [...prev, data]);
          } else if (type === 'VOICE_STATUS_UPDATE') {
            setVoiceUsers((prev) => ({ ...prev, [data.color]: data.isMicOn }));
          } else if (type === 'PLAYER_JOINED') {
            setRoomPlayers(prev => ({ ...prev, [data.color]: { name: data.name, id: data.id, avatar: data.avatar } }));
            if (myColor === 'BLUE' && currentUser) {
              ws.current.send(JSON.stringify({
                topic: `realtime:room_${roomCode}`,
                event: 'broadcast',
                payload: {
                  type: 'ROSTER_UPDATE',
                  data: { color: 'BLUE', name: currentUser.name, id: currentUser.playerId, avatar: userAvatar }
                },
                ref: 'p_resp'
              }));
            }
          } else if (type === 'ROSTER_UPDATE') {
            setRoomPlayers(prev => ({ ...prev, [data.color]: { name: data.name, id: data.id, avatar: data.avatar } }));
          } else if (type === 'START_MATCH') {
            // Instant Guest Screen Transition
            if (myColor !== 'BLUE') {
              await deductUserCoins(data.entryFee || 50);
            }
            setActiveColors(data.activeColors);
            setPlayType(data.playType);
            setMatchPrizePool(data.prizePool || 100);
            if (data.syncedRoomPlayers) setRoomPlayers(data.syncedRoomPlayers);
            setOnlineLobbyModal(false);
            setGameMode('ONLINE');
          } else if (type === 'SYNC_GAME') {
            setPawns(data.newPawns);
            setTurnIndex(data.nextTurnIdx);
            setPlayerDices(data.updatedDices);
            setHasRolled(data.rolled);
            if (data.syncedColors) setActiveColors(data.syncedColors);
            if (data.syncedPlayType) setPlayType(data.syncedPlayType);
            if (data.rankings) {
              setFinishedRankings(data.rankings);
              setShowPodiumBoard(true);
              if (data.rankings[0] === myColor) {
                addWinnerCoins(matchPrizePool);
              }
              updateUserGameStats(data.rankings[0] === myColor);
            }
          }
        }
      } catch (err) {}
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [gameMode, onlineLobbyModal, roomCode, userAvatar, myColor, currentUser, matchPrizePool, activeColors, playType, selectedEntryFee]);

  const sendMultiplayerSync = (newPawns, nextTurnIdx, updatedDices, rolled, rankings = null) => {
    if ((gameMode === 'ONLINE' || gameMode === 'HYBRID') && ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        topic: `realtime:room_${roomCode}`,
        event: 'broadcast',
        payload: {
          type: 'SYNC_GAME',
          data: { newPawns, nextTurnIdx, updatedDices, rolled, rankings, syncedColors: activeColors, syncedPlayType: playType }
        },
        ref: '2'
      }));
    }
  };

  useEffect(() => {
    const isBotTurn = (gameMode === 'BOT' && currentTurn !== 'BLUE') || 
                     (gameMode === 'HYBRID' && playerSlots[currentTurn] === 'BOT');

    if (isBotTurn && !hasRolled && !isRolling && !isMoving && !showPodiumBoard) {
      const botTimer = setTimeout(() => rollDice(true), 800);
      return () => clearTimeout(botTimer);
    }
  }, [turnIndex, hasRolled, isMoving, gameMode, showPodiumBoard, currentTurn, playerSlots]);

  const nextTurn = (currentIdx = turnIndex, customActive = activeColors) => {
    const nextIdx = (currentIdx + 1) % customActive.length;
    setTurnIndex(nextIdx);
    setHasRolled(false);
    setIsMoving(false);
    return nextIdx;
  };

  const getValidMoves = (color, diceVal) => {
    const playerPawns = pawnsRef.current[color];
    if (!playerPawns) return [];
    const validIndexes = [];
    playerPawns.forEach((stepCount, idx) => {
      if (stepCount === -1 && diceVal === 6) validIndexes.push(idx);
      else if (stepCount >= 0 && stepCount + diceVal <= 56) validIndexes.push(idx);
    });
    return validIndexes;
  };

  const rollDice = async (isBot = false, isAutoTimeout = false) => {
    if (hasRolled || isMoving || isRolling || showPodiumBoard) return;

    if (!isBot && !isAutoTimeout) {
      if (gameMode === 'ONLINE' && currentTurn !== myColor) return;
      if (gameMode === 'HYBRID' && playerSlots[currentTurn] === 'ONLINE' && currentTurn !== myColor) return;
    }

    setIsRolling(true);
    playSound('dice');

    const finalVal = Math.floor(Math.random() * 6) + 1;

    spinAnim.setValue(0);
    diceBounceAnim.setValue(1);

    Animated.parallel([
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 650,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.timing(diceBounceAnim, { toValue: 1.35, duration: 180, useNativeDriver: false }),
        Animated.timing(diceBounceAnim, { toValue: 0.85, duration: 180, useNativeDriver: false }),
        Animated.timing(diceBounceAnim, { toValue: 1, duration: 290, useNativeDriver: false }),
      ])
    ]).start();

    const shuffleSteps = [50, 70, 90, 110, 140];
    for (let delay of shuffleSteps) {
      const rand = Math.floor(Math.random() * 6) + 1;
      setPlayerDices(prev => ({ ...prev, [currentTurn]: rand }));
      await sleep(delay);
    }

    const newDices = { ...playerDices, [currentTurn]: finalVal };
    setPlayerDices(prev => ({ ...prev, [currentTurn]: finalVal }));
    await sleep(200);

    setIsRolling(false);
    setHasRolled(true);

    const validMoves = getValidMoves(currentTurn, finalVal);

    if (validMoves.length === 0) {
      setTimeout(() => {
        const nextIdx = nextTurn();
        sendMultiplayerSync(pawnsRef.current, nextIdx, newDices, false);
      }, 700);
    } else if (isBot || isAutoTimeout || validMoves.length === 1) {
      const bestMove = getStrategicMoveIndex(currentTurn, finalVal, validMoves);
      setTimeout(() => executeStepMovement(currentTurn, bestMove, finalVal, newDices), 400);
    } else {
      sendMultiplayerSync(pawnsRef.current, turnIndex, newDices, true);
    }
  };

  const executeStepMovement = async (color, index, diceVal, currentDices = playerDices) => {
    setIsMoving(true);
    let startStep = pawnsRef.current[color][index];

    if (startStep === -1) {
      playSound('move');
      const updated = JSON.parse(JSON.stringify(pawnsRef.current));
      updated[color][index] = 0;
      setPawns(updated);
      await sleep(350);
      finalizeMove(color, index, 0, diceVal, updated, currentDices);
      return;
    }

    let currentStep = startStep;
    let currentPawnsState = JSON.parse(JSON.stringify(pawnsRef.current));

    for (let step = 1; step <= diceVal; step++) {
      currentStep += 1;
      playSound('move');
      currentPawnsState = JSON.parse(JSON.stringify(currentPawnsState));
      currentPawnsState[color][index] = currentStep;
      setPawns(currentPawnsState);
      await sleep(250);
    }

    finalizeMove(color, index, currentStep, diceVal, currentPawnsState, currentDices);
  };

  const finalizeMove = (color, index, finalStep, diceVal, finalState, currentDices) => {
    let updatedPawns = JSON.parse(JSON.stringify(finalState));
    let extraTurn = diceVal === 6 || finalStep === 56;

    if (finalStep >= 0 && finalStep < 51) {
      const myTrackIndex = (START_INDEX[color] + finalStep) % 52;
      const isSafeCell = SAFE_INDEXES.includes(myTrackIndex);

      if (!isSafeCell) {
        ALL_COLORS.forEach((enemyColor) => {
          if (enemyColor !== color) {
            const teammate = isTeammate(color, enemyColor);
            if (!teammate || (teammate && friendlyKill)) {
              updatedPawns[enemyColor] = updatedPawns[enemyColor].map((enemyStep) => {
                if (enemyStep >= 0 && enemyStep < 51) {
                  const enemyTrackIndex = (START_INDEX[enemyColor] + enemyStep) % 52;
                  if (enemyTrackIndex === myTrackIndex) {
                    playSound('cut');
                    extraTurn = true;
                    return -1;
                  }
                }
                return enemyStep;
              });
            }
          }
        });
      }
    }

    let currentFinished = [...finishedRankings];
    let isCurrentColorWinnerNow = false;

    if (!currentFinished.includes(color) && updatedPawns[color].every((s) => s === 56)) {
      currentFinished.push(color);
      setFinishedRankings(currentFinished);
      isCurrentColorWinnerNow = true;
      playSound('win');

      const rankTitle = currentFinished.length === 1 ? '🥇 1st Place' : currentFinished.length === 2 ? '🥈 2nd Place' : '🥉 3rd Place';
      Alert.alert('VICTORY!', `${getBaseDynamicLabel(color)} secured ${rankTitle}!`);
    }

    const activeRemaining = activeColors.filter((c) => !currentFinished.includes(c));

    if (activeRemaining.length <= 1) {
      if (activeRemaining.length === 1) {
        currentFinished.push(activeRemaining[0]);
      }
      setFinishedRankings(currentFinished);
      setShowPodiumBoard(true);
      setPawns(updatedPawns);
      setIsMoving(false);

      if (currentFinished[0] === myColor) {
        addWinnerCoins(matchPrizePool);
      }
      updateUserGameStats(currentFinished[0] === myColor);
      sendMultiplayerSync(updatedPawns, turnIndex, currentDices, false, currentFinished);
      return;
    }

    setPawns(updatedPawns);
    setIsMoving(false);

    let newActiveColors = activeColors.filter((c) => !currentFinished.includes(c));
    if (isCurrentColorWinnerNow) {
      setActiveColors(newActiveColors);
      const nextIdx = nextTurn(turnIndex, newActiveColors);
      sendMultiplayerSync(updatedPawns, nextIdx, currentDices, false, currentFinished);
    } else if (extraTurn) {
      setHasRolled(false);
      sendMultiplayerSync(updatedPawns, turnIndex, currentDices, false, currentFinished);
    } else {
      const nextIdx = nextTurn(turnIndex, activeColors);
      sendMultiplayerSync(updatedPawns, nextIdx, currentDices, false, currentFinished);
    }
  };

  const getPawnScreenCoords = (color, stepCount, idx) => {
    if (stepCount === -1) return BASE_SPOTS[color][idx];
    if (stepCount === 56) return [7, 7];
    if (stepCount >= 51) return HOME_PATHS[color][stepCount - 51];
    return TRACK_COORDINATES[(START_INDEX[color] + stepCount) % 52];
  };

  const getTurnColorHex = (col) => {
    if (col === 'RED') return '#ef4444';
    if (col === 'GREEN') return '#22c55e';
    if (col === 'YELLOW') return '#eab308';
    return '#3b82f6';
  };

  const renderCell = (row, col) => {
    if (row < 6 && col < 6) return null;
    if (row < 6 && col > 8) return null;
    if (row > 8 && col < 6) return null;
    if (row > 8 && col > 8) return null;
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return null;

    let bgColor = '#ffffff';

    if (row === 7 && col >= 1 && col <= 5) { bgColor = '#ef4444'; } 
    if (col === 7 && row >= 1 && row <= 5) { bgColor = '#22c55e'; } 
    if (row === 7 && col >= 9 && col <= 13) { bgColor = '#eab308'; } 
    if (col === 7 && row >= 9 && row <= 13) { bgColor = '#3b82f6'; } 

    if (row === 6 && col === 1) { bgColor = '#ef4444'; }
    if (row === 1 && col === 8) { bgColor = '#22c55e'; }
    if (row === 8 && col === 13) { bgColor = '#eab308'; }
    if (row === 13 && col === 6) { bgColor = '#3b82f6'; }

    const isStar = (row === 2 && col === 6) ||
                   (row === 6 && col === 12) ||
                   (row === 12 && col === 8) ||
                   (row === 8 && col === 2);

    const isArrow = (row === 7 && col === 0) || (row === 0 && col === 7) || (row === 7 && col === 14) || (row === 14 && col === 7);

    let arrowIcon = '';
    if (row === 7 && col === 0) arrowIcon = '➔';
    if (row === 0 && col === 7) arrowIcon = '⬇';
    if (row === 7 && col === 14) arrowIcon = '⬅';
    if (row === 14 && col === 7) arrowIcon = '⬆';

    return (
      <View key={`${row}-${col}`} style={[styles.cell, { left: col * CELL_SIZE, top: row * CELL_SIZE, backgroundColor: bgColor }]}>
        {isStar && (
          <View style={styles.starCircle}>
            <Text style={[styles.starText, shouldFlipBoard && { transform: [{ rotate: '180deg' }] }]}>★</Text>
          </View>
        )}
        {isArrow && (
          <Text style={[styles.arrowText, shouldFlipBoard && { transform: [{ rotate: '180deg' }] }]}>{arrowIcon}</Text>
        )}
      </View>
    );
  };

  const getBaseDynamicLabel = (color) => {
    if (playType === 'TEAM') {
      if (color === 'BLUE') return roomPlayers['BLUE']?.name || (myColor === 'BLUE' ? currentUser?.name : 'Team A (Blue)');
      if (color === 'GREEN') return roomPlayers['GREEN']?.name || (myColor === 'GREEN' ? currentUser?.name : 'Team A (Green)');
      if (color === 'RED') return roomPlayers['RED']?.name || 'Team B (Red)';
      if (color === 'YELLOW') return roomPlayers['YELLOW']?.name || 'Team B (Yellow)';
    } else {
      if (roomPlayers[color]?.name) return roomPlayers[color].name;
      if (color === myColor) return currentUser ? currentUser.name : 'Me';
      if (color === 'BLUE') return 'Host';
      if (color === 'GREEN') return selectedPlayerCount === 2 ? 'Guest' : 'Player 3';
      if (color === 'RED') return 'Player 2';
      if (color === 'YELLOW') return 'Player 4';
    }
    return '';
  };

  const renderBase = (color, posStyle, isVertical) => {
    const isPlayable = activeColors.includes(color) || finishedRankings.includes(color);
    const label = getBaseDynamicLabel(color);
    const isRanked = finishedRankings.indexOf(color);

    return (
      <View style={[styles.base, posStyle, !isPlayable && { opacity: 0.35 }]}>
        <View style={styles.baseInnerWhite}>
          <View style={styles.pocketRow}>
            <View style={[styles.basePocket, { backgroundColor: getTurnColorHex(color) }]} />
            <View style={[styles.basePocket, { backgroundColor: getTurnColorHex(color) }]} />
          </View>
          <View style={styles.pocketRow}>
            <View style={[styles.basePocket, { backgroundColor: getTurnColorHex(color) }]} />
            <View style={[styles.basePocket, { backgroundColor: getTurnColorHex(color) }]} />
          </View>
        </View>

        {isRanked !== -1 && (
          <View style={styles.baseRankBanner}>
            <Text style={styles.baseRankBannerText}>
              {isRanked === 0 ? '🥇 1st' : isRanked === 1 ? '🥈 2nd' : isRanked === 2 ? '🥉 3rd' : '4th'}
            </Text>
          </View>
        )}

        {isPlayable && (
          <Text style={[
            styles.playerLabel, 
            isVertical ? styles.playerLabelRotated : styles.playerLabelHorizontal,
            shouldFlipBoard && { transform: [{ rotate: isVertical ? '90deg' : '180deg' }] }
          ]}>
            {label}
          </Text>
        )}
      </View>
    );
  };

  const renderAllTokens = () => {
    const cellGroups = {};

    ALL_COLORS.forEach((color) => {
      pawns[color].forEach((stepCount, idx) => {
        if (stepCount >= 0 && stepCount < 56) {
          const coords = getPawnScreenCoords(color, stepCount, idx);
          const cellKey = `${coords[0].toFixed(1)}_${coords[1].toFixed(1)}`;
          if (!cellGroups[cellKey]) cellGroups[cellKey] = [];
          cellGroups[cellKey].push({ color, idx, stepCount, coords });
        }
      });
    });

    const rendered = [];

    ALL_COLORS.forEach((color) => {
      pawns[color].forEach((stepCount, idx) => {
        const coords = getPawnScreenCoords(color, stepCount, idx);
        const isMyTurn = currentTurn === color;
        const colorHex = getTurnColorHex(color);

        let offsetX = 0;
        let offsetY = 0;
        let stackCount = 1;

        if (stepCount >= 0 && stepCount < 56) {
          const cellKey = `${coords[0].toFixed(1)}_${coords[1].toFixed(1)}`;
          const group = cellGroups[cellKey] || [];
          stackCount = group.length;

          if (stackCount > 1) {
            const indexInGroup = group.findIndex((p) => p.color === color && p.idx === idx);
            if (indexInGroup === 0) { offsetX = -4; offsetY = -3; }
            else if (indexInGroup === 1) { offsetX = 5; offsetY = 3; }
            else if (indexInGroup === 2) { offsetX = 0; offsetY = 5; }
            else if (indexInGroup === 3) { offsetX = -4; offsetY = 5; }
          }
        }

        rendered.push(
          <TouchableOpacity
            key={`${color}-${idx}`}
            disabled={!hasRolled || !isMyTurn || isMoving}
            onPress={() => executeStepMovement(color, idx, playerDices[color])}
            style={[
              styles.tokenWrapper,
              { 
                left: coords[1] * CELL_SIZE + offsetX, 
                top: coords[0] * CELL_SIZE - 7 + offsetY,
                zIndex: isMyTurn ? 25 : 10 + idx
              },
              stepCount === 56 && { opacity: 0.3 }
            ]}
          >
            <PinToken colorHex={colorHex} rotateBack={shouldFlipBoard} stackCount={stackCount} />
          </TouchableOpacity>
        );
      });
    });

    return rendered;
  };

  const renderPlayerCard = (color, pinHex, shadowHex, isLeftDice = false, isTopRow = true) => {
    const isPlayable = activeColors.includes(color) && !finishedRankings.includes(color);
    if (!isPlayable) return <View style={styles.playerCardPlaceholder} />;

    const isCurrent = currentTurn === color;
    const slotType = playerSlots[color];
    const misses = playerMissCount[color] || 0;
    const badgeText = gameMode === 'HYBRID' ? (slotType === 'LOCAL' ? '📱 Local' : slotType === 'ONLINE' ? '🌐 Online' : '🤖 Bot') : '';
    const userMicState = voiceUsers[color];

    const spinVal = spinAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '1080deg'],
    });

    return (
      <View style={styles.cardContainerWrapper}>
        {isCurrent && (
          <Animated.View 
            style={[
              styles.floatingArrowContainer, 
              styles.arrowTopPos, 
              { 
                transform: [{ translateY: arrowBounceAnim }],
                opacity: arrowBlinkAnim 
              }
            ]}
          >
            <View style={styles.arrowIconBubble}>
              <Text style={styles.arrowIconText}>▼</Text>
            </View>
          </Animated.View>
        )}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => isCurrent && rollDice()}
          style={[styles.playerCard, isCurrent && styles.activeCardGlow]}
        >
          {isLeftDice ? (
            <>
              <Animated.View style={[styles.cardDiceWrap, isCurrent && isRolling && { transform: [{ rotate: spinVal }, { scale: diceBounceAnim }] }]}>
                <DiceFace value={playerDices[color]} />
              </Animated.View>
              <View style={styles.cardAvatarRight}>
                <PinToken colorHex={pinHex} stackCount={1} />
                {userMicState && <Text style={styles.micActiveIndicator}>🎙️</Text>}
                {misses > 0 && <Text style={styles.missCounterBadge}>⚠️ {misses}/3</Text>}
                {badgeText !== '' && <Text style={styles.slotSmallBadge}>{badgeText}</Text>}
              </View>
            </>
          ) : (
            <>
              <View style={styles.cardAvatarLeft}>
                <PinToken colorHex={pinHex} stackCount={1} />
                {userMicState && <Text style={styles.micActiveIndicator}>🎙️</Text>}
                {misses > 0 && <Text style={styles.missCounterBadge}>⚠️ {misses}/3</Text>}
                {badgeText !== '' && <Text style={styles.slotSmallBadge}>{badgeText}</Text>}
              </View>
              <Animated.View style={[styles.cardDiceWrap, isCurrent && isRolling && { transform: [{ rotate: spinVal }, { scale: diceBounceAnim }] }]}>
                <DiceFace value={playerDices[color]} />
              </Animated.View>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.royaleContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f1d" />
        <View style={styles.brandHero}>
          <Text style={styles.crownEmoji}>👑</Text>
          <Text style={styles.brandGoldTitle}>LUDO SUPREME</Text>
          <View style={styles.goldPillBadge}><Text style={styles.goldPillText}>★ CLOUD AUTH & REALTIME ★</Text></View>
        </View>

        <View style={styles.glassCard}>
          {authMode !== 'FORGOT' ? (
            <View style={styles.tabToggleRow}>
              <TouchableOpacity style={[styles.tabToggleBtn, authMode === 'LOGIN' && styles.tabToggleActive]} onPress={() => setAuthMode('LOGIN')}>
                <Text style={[styles.tabToggleText, authMode === 'LOGIN' && styles.tabToggleTextActive]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabToggleBtn, authMode === 'SIGNUP' && styles.tabToggleActive]} onPress={() => setAuthMode('SIGNUP')}>
                <Text style={[styles.tabToggleText, authMode === 'SIGNUP' && styles.tabToggleTextActive]}>Create Account</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.forgotHeaderBox}>
              <Text style={styles.forgotTitle}>🔑 Reset Your Password</Text>
              <Text style={styles.forgotSubtitle}>Enter registered email and set a new password</Text>
            </View>
          )}

          {authMode === 'SIGNUP' && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.inputLabel}>CHOOSE USERNAME</Text>
              <TextInput style={styles.gameTextInput} placeholder="e.g. MasterRajeev" placeholderTextColor="#64748b" value={usernameInput} onChangeText={setUsernameInput} />
            </View>
          )}

          <View style={{ marginTop: 10 }}>
            <Text style={styles.inputLabel}>EMAIL / USER ID</Text>
            <TextInput style={styles.gameTextInput} placeholder="name@gmail.com" placeholderTextColor="#64748b" keyboardType="email-address" autoCapitalize="none" value={emailInput} onChangeText={setEmailInput} />
          </View>

          {authMode !== 'FORGOT' ? (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <TextInput style={styles.gameTextInput} placeholder="••••••••" placeholderTextColor="#64748b" secureTextEntry value={passwordInput} onChangeText={setPasswordInput} />
            </View>
          ) : (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.inputLabel}>NEW PASSWORD</Text>
              <TextInput style={styles.gameTextInput} placeholder="Enter new password" placeholderTextColor="#64748b" secureTextEntry value={newPasswordInput} onChangeText={setNewPasswordInput} />
            </View>
          )}

          {authMode === 'LOGIN' && (
            <TouchableOpacity style={styles.forgotLinkContainer} onPress={() => setAuthMode('FORGOT')}>
              <Text style={styles.forgotLinkText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 14 }]} onPress={handleAuthSubmit}>
            <Text style={styles.gold3DButtonText}>
              {authMode === 'LOGIN' ? 'LOGIN TO ACCOUNT  ➔' : authMode === 'SIGNUP' ? 'SIGN UP PERMANENTLY  ➔' : 'CONFIRM RESET PASSWORD  ➔'}
            </Text>
          </TouchableOpacity>

          {authMode === 'FORGOT' && (
            <TouchableOpacity activeOpacity={0.85} style={[styles.darkSecondaryButton, { marginTop: 10 }]} onPress={() => setAuthMode('LOGIN')}>
              <Text style={styles.darkSecondaryButtonText}>⬅ Back to Sign In</Text>
            </TouchableOpacity>
          )}

          {authMode !== 'FORGOT' && (
            <>
              <View style={styles.orDivider}><View style={styles.dividerLine} /><Text style={styles.orText}>OR</Text><View style={styles.dividerLine} /></View>
              <TouchableOpacity activeOpacity={0.85} style={styles.darkSecondaryButton} onPress={handleGuestLogin}>
                <Text style={styles.darkSecondaryButtonText}>⚡ Quick Guest Play</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (botSelectModal) {
    return (
      <SafeAreaView style={styles.royaleContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f1d" />
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}>
          <View style={styles.brandHero}>
            <Text style={styles.crownEmoji}>🤖</Text>
            <Text style={styles.brandGoldTitle}>VS COMPUTER</Text>
            <Text style={styles.lobbySubtitle}>Practice & Win Free Coins</Text>
          </View>

          <View style={[styles.glassCard, { marginTop: 14 }]}>
            <Text style={styles.inputLabel}>HOW MANY PLAYERS?</Text>
            <View style={styles.playerCountRow}>
              {[2, 3, 4].map((count) => (
                <TouchableOpacity 
                  key={count} 
                  style={[styles.countPill, botPlayerCount === count && styles.countPillActive]} 
                  onPress={() => setBotPlayerCount(count)}
                >
                  <Text style={[styles.countPillText, botPlayerCount === count && styles.countPillTextActive]}>
                    {count} Players
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.prizePoolPreviewBox}>
              <Text style={styles.prizePoolPreviewLabel}>🛡️ RISK FREE WINNER REWARD:</Text>
              <Text style={styles.prizePoolPreviewAmount}>
                🪙 Win {botPlayerCount === 2 ? '100' : botPlayerCount === 3 ? '200' : '300'} Coins on 1st Place!
              </Text>
            </View>

            <TouchableOpacity 
              activeOpacity={0.85} 
              style={[styles.gold3DButton, { marginTop: 16 }]} 
              onPress={() => startBotMatch(botPlayerCount)}
            >
              <Text style={styles.gold3DButtonText}>START PRACTICE MATCH ➔</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.85} 
              style={[styles.darkSecondaryButton, { marginTop: 10 }]} 
              onPress={() => setBotSelectModal(false)}
            >
              <Text style={styles.darkSecondaryButtonText}>⬅ Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (passPlayModal) {
    return (
      <SafeAreaView style={styles.royaleContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f1d" />
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}>
          <View style={styles.brandHero}>
            <Text style={styles.crownEmoji}>👥</Text>
            <Text style={styles.brandGoldTitle}>PASS & PLAY</Text>
            <Text style={styles.lobbySubtitle}>Select Match Format</Text>
          </View>

          <View style={[styles.glassCard, { marginTop: 12 }]}>
            <Text style={styles.inputLabel}>SELECT GAMEPLAY TYPE:</Text>
            <View style={styles.tabToggleRow}>
              <TouchableOpacity style={[styles.tabToggleBtn, playType === 'SOLO' && styles.tabToggleActive]} onPress={() => setPlayType('SOLO')}>
                <Text style={[styles.tabToggleText, playType === 'SOLO' && styles.tabToggleTextActive]}>👤 Individual</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabToggleBtn, playType === 'TEAM' && styles.tabToggleActive]} onPress={() => setPlayType('TEAM')}>
                <Text style={[styles.tabToggleText, playType === 'TEAM' && styles.tabToggleTextActive]}>🤝 2v2 Team</Text>
              </TouchableOpacity>
            </View>

            {playType === 'SOLO' ? (
              <View style={{ marginTop: 14 }}>
                <Text style={styles.inputLabel}>HOW MANY PLAYERS?</Text>
                <View style={styles.playerCountRow}>
                  {[2, 3, 4].map((count) => (
                    <TouchableOpacity key={count} style={[styles.countPill, selectedPlayerCount === count && styles.countPillActive]} onPress={() => setSelectedPlayerCount(count)}>
                      <Text style={[styles.countPillText, selectedPlayerCount === count && styles.countPillTextActive]}>{count} Players</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <View style={{ marginTop: 14 }}>
                <Text style={styles.inputLabel}>TEAM UP SETUP:</Text>
                <View style={styles.teamContainerBoxA}><Text style={styles.teamHeaderTitleA}>🛡️ Team A: Blue + Green</Text></View>
                <View style={[styles.teamContainerBoxB, { marginTop: 6 }]}><Text style={styles.teamHeaderTitleB}>⚔️ Team B: Red + Yellow</Text></View>
                <TouchableOpacity style={[styles.checkboxRow, { marginTop: 10 }]} onPress={() => setFriendlyKill(!friendlyKill)}>
                  <View style={[styles.checkSquare, friendlyKill && styles.checkSquareActive]}>{friendlyKill && <Text style={styles.checkTick}>✓</Text>}</View>
                  <View style={{ marginLeft: 10 }}><Text style={styles.checkboxLabel}>Enable Friendly Kill?</Text></View>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 18 }]} onPress={startCustomPassPlay}>
              <Text style={styles.gold3DButtonText}>START GAME NOW ➔</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={[styles.darkSecondaryButton, { marginTop: 10 }]} onPress={() => setPassPlayModal(false)}>
              <Text style={styles.darkSecondaryButtonText}>⬅ Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (hybridTeamModal) {
    return (
      <SafeAreaView style={styles.royaleContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f1d" />
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}>
          <View style={styles.brandHero}>
            <Text style={styles.crownEmoji}>⚡</Text>
            <Text style={styles.brandGoldTitle}>HYBRID TEAM BATTLE</Text>
            <Text style={styles.lobbySubtitle}>Host or Join 2v2 Team Match</Text>
          </View>

          <View style={[styles.glassCard, { marginTop: 12 }]}>
            <Text style={styles.inputLabel}>SELECT ENTRY FEE PER PLAYER:</Text>
            <View style={styles.playerCountRow}>
              {ENTRY_FEE_OPTIONS.map((fee) => (
                <TouchableOpacity
                  key={fee}
                  style={[styles.countPill, selectedEntryFee === fee && styles.countPillActive]}
                  onPress={() => setSelectedEntryFee(fee)}
                >
                  <Text style={[styles.countPillText, selectedEntryFee === fee && styles.countPillTextActive]}>
                    🪙 {fee}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 8 }]}>CREATE TEAM SLOTS:</Text>
            <View style={styles.teamContainerBoxA}>
              <View style={styles.teamHeaderRow}>
                <Text style={styles.teamHeaderTitleA}>🛡️ TEAM A (Blue & Green)</Text>
                <View style={styles.teamBadgeA}><Text style={styles.teamBadgeText}>Partners</Text></View>
              </View>
              {['BLUE', 'GREEN'].map((col) => (
                <View key={col} style={styles.slotRow}>
                  <Text style={[styles.slotColorText, { color: getTurnColorHex(col) }]}>{col}</Text>
                  <View style={styles.slotTypeSelector}>
                    {['LOCAL', 'ONLINE', 'BOT'].map((type) => (
                      <TouchableOpacity key={type} style={[styles.slotTypePill, playerSlots[col] === type && styles.slotTypePillActive]} onPress={() => setPlayerSlots({ ...playerSlots, [col]: type })}>
                        <Text style={[styles.slotTypeText, playerSlots[col] === type && styles.slotTypeTextActive]}>{type === 'LOCAL' ? '📱 Local' : type === 'ONLINE' ? '🌐 Online' : '🤖 Bot'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.vsContainer}><View style={styles.vsLine} /><View style={styles.vsCircle}><Text style={styles.vsText}>VS</Text></View><View style={styles.vsLine} /></View>

            <View style={styles.teamContainerBoxB}>
              <View style={styles.teamHeaderRow}>
                <Text style={styles.teamHeaderTitleB}>⚔️ TEAM B (Red & Yellow)</Text>
                <View style={styles.teamBadgeB}><Text style={styles.teamBadgeText}>Partners</Text></View>
              </View>
              {['RED', 'YELLOW'].map((col) => (
                <View key={col} style={styles.slotRow}>
                  <Text style={[styles.slotColorText, { color: getTurnColorHex(col) }]}>{col}</Text>
                  <View style={styles.slotTypeSelector}>
                    {['LOCAL', 'ONLINE', 'BOT'].map((type) => (
                      <TouchableOpacity key={type} style={[styles.slotTypePill, playerSlots[col] === type && styles.slotTypePillActive]} onPress={() => setPlayerSlots({ ...playerSlots, [col]: type })}>
                        <Text style={[styles.slotTypeText, playerSlots[col] === type && styles.slotTypeTextActive]}>{type === 'LOCAL' ? '📱 Local' : type === 'ONLINE' ? '🌐 Online' : '🤖 Bot'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 14 }]} onPress={() => {
              const code = Math.floor(100000 + Math.random() * 900000).toString();
              setRoomCode(code);
              setMyColor('BLUE');
              setIsHost(true);
              setActiveColors(['BLUE', 'RED', 'GREEN', 'YELLOW']);
              setPlayType('TEAM');
              setGameMode('HYBRID');
              setMatchPrizePool(selectedEntryFee * 4);
              setRoomPlayers({ BLUE: { name: currentUser.name, id: currentUser.playerId, avatar: userAvatar } });
              setHybridTeamModal(false);
              setOnlineLobbyModal(true);
            }}>
              <Text style={styles.gold3DButtonText}>➕ CREATE TEAM ROOM (HOST)</Text>
            </TouchableOpacity>

            <View style={styles.orDivider}><View style={styles.dividerLine} /><Text style={styles.orText}>JOIN EXISTING TEAM</Text><View style={styles.dividerLine} /></View>
            <TextInput 
              style={[styles.gameTextInput, { textAlign: 'center', fontSize: 18, letterSpacing: 4 }]} 
              placeholder="ENTER TEAM ROOM CODE" 
              placeholderTextColor="#64748b" 
              keyboardType="number-pad" 
              maxLength={6} 
              value={teamJoinCode} 
              onChangeText={setTeamJoinCode} 
            />

            <TouchableOpacity 
              activeOpacity={0.85} 
              disabled={isVerifyingRoom}
              style={[styles.gold3DButton, { marginTop: 10, backgroundColor: '#0284c7', borderColor: '#38bdf8' }]} 
              onPress={joinTeamOnlineRoom}
            >
              {isVerifyingRoom ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.gold3DButtonText}>🚪 JOIN TEAM ROOM NOW</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.85} style={[styles.darkSecondaryButton, { marginTop: 10 }]} onPress={() => setHybridTeamModal(false)}>
              <Text style={styles.darkSecondaryButtonText}>⬅ Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (onlineScreen) {
    return (
      <SafeAreaView style={styles.royaleContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f1d" />
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}>
          <View style={styles.brandHero}><Text style={styles.crownEmoji}>🌐</Text><Text style={styles.brandGoldTitle}>ONLINE ARENA</Text><Text style={styles.lobbySubtitle}>Host or Join Room</Text></View>
          <View style={[styles.glassCard, { marginTop: 12 }]}>
            <Text style={styles.inputLabel}>SELECT MATCH TYPE:</Text>
            <View style={styles.tabToggleRow}>
              <TouchableOpacity style={[styles.tabToggleBtn, onlinePlayType === 'SOLO' && styles.tabToggleActive]} onPress={() => setOnlinePlayType('SOLO')}>
                <Text style={[styles.tabToggleText, onlinePlayType === 'SOLO' && styles.tabToggleTextActive]}>👤 Individual</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabToggleBtn, onlinePlayType === 'TEAM' && styles.tabToggleActive]} onPress={() => setOnlinePlayType('TEAM')}>
                <Text style={[styles.tabToggleText, onlinePlayType === 'TEAM' && styles.tabToggleTextActive]}>🤝 2v2 Team</Text>
              </TouchableOpacity>
            </View>

            {onlinePlayType === 'SOLO' ? (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.inputLabel}>PLAYERS COUNT:</Text>
                <View style={styles.playerCountRow}>
                  {[2, 3, 4].map((count) => (
                    <TouchableOpacity key={count} style={[styles.countPill, onlinePlayerCount === count && styles.countPillActive]} onPress={() => setOnlinePlayerCount(count)}>
                      <Text style={[styles.countPillText, onlinePlayerCount === count && styles.countPillTextActive]}>{count} Players</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.helperTip}>• 4 Real Online Players (Team A vs Team B)</Text>
              </View>
            )}

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>SELECT ENTRY FEE (BET):</Text>
            <View style={styles.playerCountRow}>
              {ENTRY_FEE_OPTIONS.map((fee) => (
                <TouchableOpacity
                  key={fee}
                  style={[styles.countPill, selectedEntryFee === fee && styles.countPillActive]}
                  onPress={() => setSelectedEntryFee(fee)}
                >
                  <Text style={[styles.countPillText, selectedEntryFee === fee && styles.countPillTextActive]}>
                    🪙 {fee}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 12 }]} onPress={startOnlineHost}>
              <Text style={styles.gold3DButtonText}>➕ CREATE PRIVATE ROOM</Text>
            </TouchableOpacity>

            <View style={styles.orDivider}><View style={styles.dividerLine} /><Text style={styles.orText}>JOIN ROOM</Text><View style={styles.dividerLine} /></View>
            <TextInput 
              style={[styles.gameTextInput, { textAlign: 'center', fontSize: 18, letterSpacing: 4 }]} 
              placeholder="ENTER ROOM CODE" 
              placeholderTextColor="#64748b" 
              keyboardType="number-pad" 
              maxLength={6} 
              value={inputRoomCode} 
              onChangeText={setInputRoomCode} 
            />

            <TouchableOpacity 
              activeOpacity={0.85} 
              disabled={isVerifyingRoom}
              style={[styles.gold3DButton, { marginTop: 10, backgroundColor: '#0284c7', borderColor: '#38bdf8' }]} 
              onPress={joinOnlineRoom}
            >
              {isVerifyingRoom ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.gold3DButtonText}>🚪 JOIN ROOM NOW</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={[styles.darkSecondaryButton, { marginTop: 10 }]} onPress={() => setOnlineScreen(false)}>
              <Text style={styles.darkSecondaryButtonText}>⬅ Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // MATCHMAKING LOBBY
  if (onlineLobbyModal) {
    const isTeamMode = playType === 'TEAM';
    const opponentColors = activeColors.filter(c => c !== 'BLUE');
    const totalPotentialPool = selectedEntryFee * activeColors.length;
    const currentReady = getEffectiveReadyCount();
    const isRoomFull = currentReady === activeColors.length;

    return (
      <SafeAreaView style={styles.matchmakingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#881337" />

        {incomingInvite && (
          <Modal transparent animationType="fade" visible={!!incomingInvite}>
            <View style={styles.inviteModalOverlay}>
              <View style={[styles.glassCard, { borderColor: '#facc15', borderWidth: 2.5 }]}>
                <Text style={styles.cardHeading}>🎮 LIVE GAME INVITE!</Text>
                <View style={styles.inviteDetailsBox}>
                  <Text style={styles.invitePromptText}>
                    <Text style={{ fontWeight: 'bold', color: '#facc15', fontSize: 18 }}>{incomingInvite.fromName}</Text> invited you to play a match!
                  </Text>
                  <Text style={styles.inviteRoomTag}>Room Code: #{incomingInvite.roomCode}</Text>
                  <Text style={styles.inviteModeTag}>Entry Bet: 🪙 {incomingInvite.entryFee || 50} Coins</Text>
                </View>
                <TouchableOpacity activeOpacity={0.85} style={styles.gold3DButton} onPress={acceptInvite}>
                  <Text style={styles.gold3DButtonText}>ACCEPT & BET NOW ➔</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.85} style={[styles.darkSecondaryButton, { marginTop: 8 }]} onPress={() => setIncomingInvite(null)}>
                  <Text style={styles.darkSecondaryButtonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {friendsModal && (
          <Modal transparent animationType="slide" visible={friendsModal}>
            <View style={styles.inviteModalOverlay}>
              <View style={styles.glassCard}>
                <View style={styles.brandHero}>
                  <Text style={styles.crownEmoji}>👥</Text>
                  <Text style={styles.brandGoldTitle}>FRIENDS SQUAD</Text>
                  <Text style={styles.lobbySubtitle}>Search & Send Friend Request</Text>
                </View>

                <View style={styles.tabToggleRow}>
                  <TouchableOpacity style={[styles.tabToggleBtn, friendsTab === 'LIST' && styles.tabToggleActive]} onPress={() => setFriendsTab('LIST')}>
                    <Text style={[styles.tabToggleText, friendsTab === 'LIST' && styles.tabToggleTextActive]}>Friends ({friendsList.length})</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.tabToggleBtn, friendsTab === 'REQUESTS' && styles.tabToggleActive]} onPress={() => setFriendsTab('REQUESTS')}>
                    <Text style={[styles.tabToggleText, friendsTab === 'REQUESTS' && styles.tabToggleTextActive]}>Requests ({pendingRequests.length})</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.tabToggleBtn, friendsTab === 'SEARCH' && styles.tabToggleActive]} onPress={() => setFriendsTab('SEARCH')}>
                    <Text style={[styles.tabToggleText, friendsTab === 'SEARCH' && styles.tabToggleTextActive]}>🔍 Search</Text>
                  </TouchableOpacity>
                </View>

                {friendsTab === 'SEARCH' && (
                  <View style={{ marginTop: 12, width: '100%' }}>
                    <Text style={styles.inputLabel}>SEARCH BY PLAYER ID OR GMAIL:</Text>
                    <View style={{ flexDirection: 'row' }}>
                      <TextInput 
                        style={[styles.gameTextInput, { flex: 1 }]} 
                        placeholder="e.g. 9575 or name@gmail.com" 
                        placeholderTextColor="#64748b" 
                        autoCapitalize="none"
                        value={searchQuery} 
                        onChangeText={setSearchQuery} 
                      />
                      <TouchableOpacity style={[styles.gold3DButton, { marginLeft: 8, paddingHorizontal: 12 }]} onPress={handleSearchUser}>
                        {isSearchingCloud ? (
                          <ActivityIndicator color="#000000" size="small" />
                        ) : (
                          <Text style={styles.gold3DButtonText}>Search</Text>
                        )}
                      </TouchableOpacity>
                    </View>

                    {searchedUserResult && (
                      <View style={styles.searchedUserCard}>
                        <View>
                          <Text style={styles.friendNameText}>👤 {searchedUserResult.name}</Text>
                          <Text style={styles.friendStatusText}>ID: #{searchedUserResult.playerId}</Text>
                        </View>
                        <TouchableOpacity style={styles.invitePillBtn} onPress={() => sendRealtimeFriendRequest(searchedUserResult)}>
                          <Text style={styles.invitePillBtnText}>+ Add Friend</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                {friendsTab === 'REQUESTS' && (
                  <ScrollView style={{ maxHeight: 200, marginTop: 10, width: '100%' }}>
                    {pendingRequests.length === 0 ? (
                      <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 14 }}>No pending friend requests.</Text>
                    ) : (
                      pendingRequests.map((req) => (
                        <View key={req.id} style={styles.friendCardRow}>
                          <View>
                            <Text style={styles.friendNameText}>{req.name}</Text>
                            <Text style={styles.friendStatusText}>Wants to be your friend</Text>
                          </View>
                          <TouchableOpacity style={[styles.invitePillBtn, { backgroundColor: '#eab308' }]} onPress={() => acceptFriendRequest(req)}>
                            <Text style={[styles.invitePillBtnText, { color: '#000' }]}>✓ Accept</Text>
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </ScrollView>
                )}

                {friendsTab === 'LIST' && (
                  <ScrollView style={{ maxHeight: 200, marginTop: 10, width: '100%' }}>
                    {friendsList.length === 0 ? (
                      <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 14 }}>No friends added yet. Use Search tab to add friends!</Text>
                    ) : (
                      friendsList.map((friend) => (
                        <View key={friend.id} style={styles.friendCardRow}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[styles.onlineDot, { backgroundColor: friend.online ? '#10b981' : '#64748b' }]} />
                            <View style={{ marginLeft: 10 }}>
                              <Text style={styles.friendNameText}>{friend.name}</Text>
                              <Text style={styles.friendStatusText}>{friend.online ? 'Online' : 'Offline'}</Text>
                            </View>
                          </View>
                          <TouchableOpacity disabled={!friend.online} style={[styles.invitePillBtn, !friend.online && { opacity: 0.4 }]} onPress={() => sendFriendInvite(friend)}>
                            <Text style={styles.invitePillBtnText}>🎮 Invite</Text>
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </ScrollView>
                )}

                <TouchableOpacity activeOpacity={0.85} style={[styles.darkSecondaryButton, { marginTop: 12, width: '100%' }]} onPress={() => setFriendsModal(false)}>
                  <Text style={styles.darkSecondaryButtonText}>⬅ Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
        
        <View style={styles.matchLobbyHeader}>
          <Text style={styles.matchLobbyTitle}>ONLINE MULTIPLAYER</Text>
          <Text style={styles.matchFormatSub}>
            {isTeamMode ? '🤝 2v2 TEAM BATTLE' : `👤 ${activeColors.length} PLAYERS INDIVIDUAL`}
          </Text>
        </View>

        <View style={styles.matchCodeCard}>
          <Text style={styles.matchCodeLabel}>Room Code : </Text>
          <View style={styles.codePillBox}>
            <Text style={styles.codePillText}>{roomCode}</Text>
          </View>
          <TouchableOpacity 
            activeOpacity={0.7}
            style={styles.shareCodeBtn}
            onPress={handleCopyAndShareRoomCode}
          >
            <Text style={styles.shareCodeText}>📋 Copy</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.prizePoolBadgeLobby}>
          <Text style={styles.prizePoolBadgeLobbyText}>🪙 Total Prize Pool: {totalPotentialPool.toLocaleString()} Coins</Text>
        </View>

        {isTeamMode ? (
          <View style={styles.teamMatchLobbyWrap}>
            <View style={styles.teamLobbyBoxA}>
              <Text style={styles.teamLobbyTitleA}>🛡️ TEAM A (Blue + Green)</Text>
              <View style={styles.teamSlotsRow}>
                <View style={styles.playerSquareActive}>
                  <Text style={{ fontSize: 32 }}>{isHost ? userAvatar : (roomPlayers['BLUE']?.avatar || '👑')}</Text>
                  <Text style={styles.slotPlayerNameText} numberOfLines={1}>{roomPlayers['BLUE']?.name || 'Host'}</Text>
                  <Text style={styles.slotRoleTagBlue}>HOST (BLUE)</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.slotInviteBox, (roomPlayers['GREEN'] || (gameMode === 'HYBRID' && playerSlots['GREEN'] === 'BOT')) && styles.slotBoxFilledGreen]}
                  onPress={() => !roomPlayers['GREEN'] && !(gameMode === 'HYBRID' && playerSlots['GREEN'] === 'BOT') && setFriendsModal(true)}
                >
                  {gameMode === 'HYBRID' && playerSlots['GREEN'] === 'BOT' ? (
                    <>
                      <Text style={{ fontSize: 32 }}>🤖</Text>
                      <Text style={styles.slotPlayerNameText}>AI Bot</Text>
                      <Text style={styles.slotRoleTagGreen}>READY</Text>
                    </>
                  ) : roomPlayers['GREEN'] ? (
                    <>
                      <Text style={{ fontSize: 32 }}>{roomPlayers['GREEN'].avatar || '🎮'}</Text>
                      <Text style={styles.slotPlayerNameText} numberOfLines={1}>{roomPlayers['GREEN'].name}</Text>
                      <Text style={styles.slotRoleTagGreen}>PARTNER</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.plusAvatarIcon}>🤝+</Text>
                      <Text style={styles.inviteSlotLabel}>Tap to Invite</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.vsGlowBanner}>
              <Text style={styles.vsGlowText}>⚡ VS ⚡</Text>
            </View>

            <View style={styles.teamLobbyBoxB}>
              <Text style={styles.teamLobbyTitleB}>⚔️ TEAM B (Red + Yellow)</Text>
              <View style={styles.teamSlotsRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.slotInviteBox, (roomPlayers['RED'] || (gameMode === 'HYBRID' && playerSlots['RED'] === 'BOT')) && styles.slotBoxFilledRed]}
                  onPress={() => !roomPlayers['RED'] && !(gameMode === 'HYBRID' && playerSlots['RED'] === 'BOT') && setFriendsModal(true)}
                >
                  {gameMode === 'HYBRID' && playerSlots['RED'] === 'BOT' ? (
                    <>
                      <Text style={{ fontSize: 32 }}>🤖</Text>
                      <Text style={styles.slotPlayerNameText}>AI Bot</Text>
                      <Text style={styles.slotRoleTagRed}>READY</Text>
                    </>
                  ) : roomPlayers['RED'] ? (
                    <>
                      <Text style={{ fontSize: 32 }}>{roomPlayers['RED'].avatar || '🎮'}</Text>
                      <Text style={styles.slotPlayerNameText} numberOfLines={1}>{roomPlayers['RED'].name}</Text>
                      <Text style={styles.slotRoleTagRed}>OPPONENT</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.plusAvatarIcon}>⚔️+</Text>
                      <Text style={styles.inviteSlotLabel}>Tap to Invite</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.slotInviteBox, (roomPlayers['YELLOW'] || (gameMode === 'HYBRID' && playerSlots['YELLOW'] === 'BOT')) && styles.slotBoxFilledYellow]}
                  onPress={() => !roomPlayers['YELLOW'] && !(gameMode === 'HYBRID' && playerSlots['YELLOW'] === 'BOT') && setFriendsModal(true)}
                >
                  {gameMode === 'HYBRID' && playerSlots['YELLOW'] === 'BOT' ? (
                    <>
                      <Text style={{ fontSize: 32 }}>🤖</Text>
                      <Text style={styles.slotPlayerNameText}>AI Bot</Text>
                      <Text style={styles.slotRoleTagYellow}>READY</Text>
                    </>
                  ) : roomPlayers['YELLOW'] ? (
                    <>
                      <Text style={{ fontSize: 32 }}>{roomPlayers['YELLOW'].avatar || '🎮'}</Text>
                      <Text style={styles.slotPlayerNameText} numberOfLines={1}>{roomPlayers['YELLOW'].name}</Text>
                      <Text style={styles.slotRoleTagYellow}>OPPONENT</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.plusAvatarIcon}>⚔️+</Text>
                      <Text style={styles.inviteSlotLabel}>Tap to Invite</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.soloMatchLobbyWrap}>
            <View style={styles.hostProfileBox}>
              <View style={styles.hostAvatarSquare}>
                <Text style={{ fontSize: 44 }}>{isHost ? userAvatar : (roomPlayers['BLUE']?.avatar || '👑')}</Text>
              </View>
              <Text style={styles.hostNameText}>{roomPlayers['BLUE']?.name || 'Host'}</Text>
              <Text style={styles.hostBadgeText}>ROOM HOST (BLUE)</Text>
            </View>

            <View style={styles.vsGlowBanner}>
              <Text style={styles.vsGlowText}>⚡ VS ⚡</Text>
            </View>

            <View style={styles.opponentSlotsRow}>
              {opponentColors.map((colorKey) => {
                const playerJoined = roomPlayers[colorKey];
                return (
                  <TouchableOpacity
                    key={colorKey}
                    activeOpacity={0.8}
                    style={[
                      styles.slotInviteBox,
                      playerJoined && { borderColor: getTurnColorHex(colorKey), backgroundColor: 'rgba(0,0,0,0.4)' }
                    ]}
                    onPress={() => !playerJoined && setFriendsModal(true)}
                  >
                    {playerJoined ? (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 30 }}>{playerJoined.avatar || '🎮'}</Text>
                        <Text style={styles.joinedSlotName} numberOfLines={1}>{playerJoined.name}</Text>
                        <Text style={[styles.joinedSlotTag, { color: getTurnColorHex(colorKey) }]}>READY</Text>
                      </View>
                    ) : (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={styles.plusAvatarIcon}>👤+</Text>
                        <Text style={styles.inviteSlotLabel}>Tap to Invite</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.matchBottomActions}>
          {isHost ? (
            <TouchableOpacity 
              activeOpacity={0.85} 
              disabled={!isRoomFull}
              style={[styles.startMatchGoldBtn, !isRoomFull && { backgroundColor: '#475569', borderColor: '#64748b' }]} 
              onPress={startMatchFromLobby}
            >
              <Text style={[styles.startMatchGoldText, !isRoomFull && { color: '#94a3b8' }]}>
                {isRoomFull ? 'START MATCH NOW ➔' : `WAITING FOR PLAYERS (${currentReady}/${activeColors.length})...`}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.startMatchGoldBtn, { backgroundColor: '#334155', borderColor: '#64748b' }]}>
              <Text style={[styles.startMatchGoldText, { color: '#94a3b8', fontSize: 13 }]}>
                ⏳ WAITING FOR HOST TO START...
              </Text>
            </View>
          )}

          <TouchableOpacity 
            activeOpacity={0.85} 
            style={styles.cancelMatchBtn} 
            onPress={() => { setOnlineLobbyModal(false); resetGame(); }}
          >
            <Text style={styles.cancelMatchText}>✕ Leave Room</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 3D ISOMETRIC DASHBOARD
  if (!gameMode) {
    const winPercentage = userStats.totalPlayed > 0 
      ? Math.round((userStats.totalWon / userStats.totalPlayed) * 100) 
      : 0;

    const isLowBalance = currentUser.coins < 50;

    return (
      <View style={styles.dashboardContainer}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        <Image
          source={require('./lobby_bg.png')}
          style={styles.lobbyBgImage}
          resizeMode="cover"
        />

        {profileStatsModal && (
          <Modal transparent animationType="slide" visible={profileStatsModal}>
            <View style={styles.inviteModalOverlay}>
              <View style={[styles.glassCard, { borderColor: '#facc15', borderWidth: 2 }]}>
                <View style={styles.profileModalHeader}>
                  <Text style={styles.crownEmoji}>👑</Text>
                  <Text style={styles.profileStatsTitle}>{currentUser.name}</Text>
                  <Text style={styles.profileStatsSubId}>Player ID: #{currentUser.playerId || '9575'}</Text>
                </View>

                <View style={styles.profileBigAvatarWrap}>
                  <Text style={{ fontSize: 44 }}>{userAvatar}</Text>
                </View>

                <View style={styles.statsRowGrid}>
                  <View style={styles.statBoxCard}>
                    <Text style={styles.statBoxNumber}>{userStats.totalPlayed}</Text>
                    <Text style={styles.statBoxLabel}>Played</Text>
                  </View>
                  <View style={[styles.statBoxCard, { borderColor: '#10b981' }]}>
                    <Text style={[styles.statBoxNumber, { color: '#10b981' }]}>{userStats.totalWon}</Text>
                    <Text style={styles.statBoxLabel}>Won 🏆</Text>
                  </View>
                  <View style={[styles.statBoxCard, { borderColor: '#ef4444' }]}>
                    <Text style={[styles.statBoxNumber, { color: '#ef4444' }]}>{userStats.totalLost}</Text>
                    <Text style={styles.statBoxLabel}>Lost ❌</Text>
                  </View>
                  <View style={[styles.statBoxCard, { borderColor: '#facc15' }]}>
                    <Text style={[styles.statBoxNumber, { color: '#facc15' }]}>{winPercentage}%</Text>
                    <Text style={styles.statBoxLabel}>Win Rate</Text>
                  </View>
                </View>

                <View style={styles.infoLineRow}>
                  <Text style={styles.infoFieldLabel}>Gmail ID :</Text>
                  <Text style={styles.infoFieldValue} numberOfLines={1}>{currentUser.email}</Text>
                </View>
                <View style={styles.infoLineRow}>
                  <Text style={styles.infoFieldLabel}>Coin Balance :</Text>
                  <Text style={[styles.infoFieldValue, { color: '#facc15' }]}>🪙 {currentUser.coins.toLocaleString()}</Text>
                </View>

                <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 14 }]} onPress={() => setProfileStatsModal(false)}>
                  <Text style={styles.gold3DButtonText}>CLOSE PROFILE ➔</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {settingsModal && (
          <Modal transparent animationType="slide" visible={settingsModal}>
            <View style={styles.inviteModalOverlay}>
              <View style={[styles.glassCard, { maxHeight: '90%' }]}>
                <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 10 }}>
                  <Text style={styles.cardHeading}>⚙️ GAME SETTINGS</Text>

                  <View style={styles.settingsSectionCard}>
                    <Text style={styles.settingsSectionTitle}>👤 USER PROFILE</Text>
                    
                    <TouchableOpacity activeOpacity={0.8} style={styles.profileBigAvatarWrap} onPress={() => setAvatarModal(true)}>
                      <Text style={{ fontSize: 48 }}>{userAvatar}</Text>
                      <View style={styles.editAvatarBadge}><Text style={{ fontSize: 10, color: '#ffffff', fontWeight: 'bold' }}>✏️ Change</Text></View>
                    </TouchableOpacity>

                    <View style={styles.infoLineRow}>
                      <Text style={styles.infoFieldLabel}>Username :</Text>
                      <Text style={styles.infoFieldValue}>{currentUser.name}</Text>
                    </View>

                    <View style={styles.infoLineRow}>
                      <Text style={styles.infoFieldLabel}>Gmail ID :</Text>
                      <Text style={styles.infoFieldValue} numberOfLines={1}>{currentUser.email}</Text>
                    </View>

                    <View style={styles.infoLineRow}>
                      <Text style={styles.infoFieldLabel}>Player ID :</Text>
                      <Text style={styles.infoFieldValue}>#{currentUser.playerId || '9575'}</Text>
                    </View>

                    <TouchableOpacity style={styles.avatarPickerTriggerBtn} onPress={() => setAvatarModal(true)}>
                      <Text style={styles.avatarPickerTriggerText}>🎭 Select Cartoon Profile Picture ➔</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.settingsSectionCard}>
                    <Text style={styles.settingsSectionTitle}>🔊 AUDIO SETTINGS</Text>
                    <View style={styles.soundToggleRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 22, marginRight: 8 }}>{soundEnabled ? '🔊' : '🔇'}</Text>
                        <Text style={styles.soundLabelText}>Game Sounds & FX</Text>
                      </View>
                      <Switch
                        trackColor={{ false: '#475569', true: '#10b981' }}
                        thumbColor={soundEnabled ? '#ffffff' : '#94a3b8'}
                        onValueChange={toggleSound}
                        value={soundEnabled}
                      />
                    </View>
                  </View>

                  <View style={styles.settingsSectionCard}>
                    <Text style={styles.settingsSectionTitle}>ℹ️ ABOUT GAME</Text>
                    <Text style={styles.aboutGoldTitle}>LUDO SUPREME 3D</Text>
                    <Text style={styles.aboutVersionText}>Version: 1.0.0 (Royale Edition)</Text>
                    <View style={styles.dividerLine} />
                    <Text style={styles.aboutCreatorText}>App created by Rajeev Kumar sah</Text>
                    <Text style={styles.aboutContactText}>Gmail - razeevsah@gmail.com</Text>
                  </View>

                  <TouchableOpacity activeOpacity={0.85} style={styles.logoutSettingsBtn} onPress={handleLogout}>
                    <Text style={styles.logoutSettingsText}>🚪 LOGOUT ACCOUNT</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.gold3DButton, { width: '100%', marginTop: 8 }]} onPress={() => setSettingsModal(false)}>
                    <Text style={styles.gold3DButtonText}>SAVE & CLOSE</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}

        {avatarModal && (
          <Modal transparent animationType="fade" visible={avatarModal}>
            <View style={styles.inviteModalOverlay}>
              <View style={styles.avatarSelectionCard}>
                <View style={styles.avatarPreviewTopBox}>
                  <View style={styles.avatarPreviewCircle}>
                    <Text style={{ fontSize: 36 }}>{userAvatar}</Text>
                  </View>
                  <View style={styles.avatarPreviewNamePlank}>
                    <Text style={styles.avatarPreviewNameText}>{currentUser.name}</Text>
                  </View>
                </View>

                <View style={styles.avatarCategoryRow}>
                  <TouchableOpacity 
                    style={[styles.avatarTabBtn, avatarCategory === 'MALE' && styles.avatarTabActiveMale]} 
                    onPress={() => setAvatarCategory('MALE')}
                  >
                    <Text style={styles.avatarTabText}>👦 Male</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.avatarTabBtn, avatarCategory === 'FEMALE' && styles.avatarTabActiveFemale]} 
                    onPress={() => setAvatarCategory('FEMALE')}
                  >
                    <Text style={styles.avatarTabText}>👧 Female</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.avatarTabBtn, avatarCategory === 'ROYALE' && styles.avatarTabActiveRoyale]} 
                    onPress={() => setAvatarCategory('ROYALE')}
                  >
                    <Text style={styles.avatarTabText}>👑 Special</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.selectPicHeading}>SELECT PROFILE PICTURE</Text>

                <View style={styles.avatarGridContainer}>
                  {AVATAR_DATA[avatarCategory].map((item) => {
                    const isSelected = userAvatar === item.icon;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.7}
                        style={[styles.avatarGridTile, isSelected && styles.avatarGridTileSelected]}
                        onPress={() => selectAvatar(item.icon)}
                      >
                        <Text style={{ fontSize: 38 }}>{item.icon}</Text>
                        <Text style={styles.avatarTileLabel} numberOfLines={1}>{item.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity 
                  activeOpacity={0.85} 
                  style={[styles.gold3DButton, { width: '100%', marginTop: 14 }]} 
                  onPress={() => setAvatarModal(false)}
                >
                  <Text style={styles.gold3DButtonText}>CONFIRM PICTURE ➔</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {friendsModal && (
          <Modal transparent animationType="slide" visible={friendsModal}>
            <View style={styles.inviteModalOverlay}>
              <View style={styles.glassCard}>
                <View style={styles.brandHero}>
                  <Text style={styles.crownEmoji}>👥</Text>
                  <Text style={styles.brandGoldTitle}>FRIENDS SQUAD</Text>
                  <Text style={styles.lobbySubtitle}>Search & Send Friend Request</Text>
                </View>

                <View style={styles.tabToggleRow}>
                  <TouchableOpacity style={[styles.tabToggleBtn, friendsTab === 'LIST' && styles.tabToggleActive]} onPress={() => setFriendsTab('LIST')}>
                    <Text style={[styles.tabToggleText, friendsTab === 'LIST' && styles.tabToggleTextActive]}>Friends ({friendsList.length})</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.tabToggleBtn, friendsTab === 'REQUESTS' && styles.tabToggleActive]} onPress={() => setFriendsTab('REQUESTS')}>
                    <Text style={[styles.tabToggleText, friendsTab === 'REQUESTS' && styles.tabToggleTextActive]}>Requests ({pendingRequests.length})</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.tabToggleBtn, friendsTab === 'SEARCH' && styles.tabToggleActive]} onPress={() => setFriendsTab('SEARCH')}>
                    <Text style={[styles.tabToggleText, friendsTab === 'SEARCH' && styles.tabToggleTextActive]}>🔍 Search</Text>
                  </TouchableOpacity>
                </View>

                {friendsTab === 'SEARCH' && (
                  <View style={{ marginTop: 12, width: '100%' }}>
                    <Text style={styles.inputLabel}>SEARCH BY PLAYER ID OR GMAIL:</Text>
                    <View style={{ flexDirection: 'row' }}>
                      <TextInput 
                        style={[styles.gameTextInput, { flex: 1 }]} 
                        placeholder="e.g. 9575 or name@gmail.com" 
                        placeholderTextColor="#64748b" 
                        autoCapitalize="none"
                        value={searchQuery} 
                        onChangeText={setSearchQuery} 
                      />
                      <TouchableOpacity style={[styles.gold3DButton, { marginLeft: 8, paddingHorizontal: 12 }]} onPress={handleSearchUser}>
                        {isSearchingCloud ? (
                          <ActivityIndicator color="#000000" size="small" />
                        ) : (
                          <Text style={styles.gold3DButtonText}>Search</Text>
                        )}
                      </TouchableOpacity>
                    </View>

                    {searchedUserResult && (
                      <View style={styles.searchedUserCard}>
                        <View>
                          <Text style={styles.friendNameText}>👤 {searchedUserResult.name}</Text>
                          <Text style={styles.friendStatusText}>ID: #{searchedUserResult.playerId}</Text>
                        </View>
                        <TouchableOpacity style={styles.invitePillBtn} onPress={() => sendRealtimeFriendRequest(searchedUserResult)}>
                          <Text style={styles.invitePillBtnText}>+ Add Friend</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                {friendsTab === 'REQUESTS' && (
                  <ScrollView style={{ maxHeight: 200, marginTop: 10, width: '100%' }}>
                    {pendingRequests.length === 0 ? (
                      <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 14 }}>No pending friend requests.</Text>
                    ) : (
                      pendingRequests.map((req) => (
                        <View key={req.id} style={styles.friendCardRow}>
                          <View>
                            <Text style={styles.friendNameText}>{req.name}</Text>
                            <Text style={styles.friendStatusText}>Wants to be your friend</Text>
                          </View>
                          <TouchableOpacity style={[styles.invitePillBtn, { backgroundColor: '#eab308' }]} onPress={() => acceptFriendRequest(req)}>
                            <Text style={[styles.invitePillBtnText, { color: '#000' }]}>✓ Accept</Text>
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </ScrollView>
                )}

                {friendsTab === 'LIST' && (
                  <ScrollView style={{ maxHeight: 200, marginTop: 10, width: '100%' }}>
                    {friendsList.length === 0 ? (
                      <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 14 }}>No friends added yet. Use Search tab to add friends!</Text>
                    ) : (
                      friendsList.map((friend) => (
                        <View key={friend.id} style={styles.friendCardRow}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[styles.onlineDot, { backgroundColor: friend.online ? '#10b981' : '#64748b' }]} />
                            <View style={{ marginLeft: 10 }}>
                              <Text style={styles.friendNameText}>{friend.name}</Text>
                              <Text style={styles.friendStatusText}>{friend.online ? 'Online' : 'Offline'}</Text>
                            </View>
                          </View>
                          <TouchableOpacity disabled={!friend.online} style={[styles.invitePillBtn, !friend.online && { opacity: 0.4 }]} onPress={() => sendFriendInvite(friend)}>
                            <Text style={styles.invitePillBtnText}>🎮 Invite</Text>
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </ScrollView>
                )}

                <TouchableOpacity activeOpacity={0.85} style={[styles.darkSecondaryButton, { marginTop: 12, width: '100%' }]} onPress={() => setFriendsModal(false)}>
                  <Text style={styles.darkSecondaryButtonText}>⬅ Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        <SafeAreaView style={styles.topHeaderOverlay}>
          <TouchableOpacity 
            activeOpacity={0.7} 
            style={styles.topLeftProfileWrap} 
            onPress={() => setProfileStatsModal(true)}
          >
            <Text style={styles.headerUserName} numberOfLines={1}>
              {currentUser.name}
            </Text>
            <Text style={styles.headerUserCoins}>
              🪙 {currentUser.coins.toLocaleString()} Coins
            </Text>
          </TouchableOpacity>

          <View style={styles.topRightBtnsWrap}>
            {isLowBalance && (
              <TouchableOpacity activeOpacity={0.8} style={styles.freeBonusBtn} onPress={claimFreeBonus}>
                <Text style={styles.freeBonusBtnText}>🎁 +200</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity activeOpacity={0.7} style={styles.settingTouchBtn} onPress={() => setSettingsModal(true)}>
              <Text style={styles.settingBtnText}>⚙️</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7} style={styles.friendsTouchBtn} onPress={() => setFriendsModal(true)}>
              <Text style={styles.friendsBtnText}>👥 Friends</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <TouchableOpacity 
          activeOpacity={0.7} 
          style={styles.centerCrownPlankWrap}
          onPress={() => setProfileStatsModal(true)}
        >
          <Text style={styles.centerPlankName} numberOfLines={1}>
            {currentUser.name}
          </Text>
          <Text style={styles.centerPlankCoins}>
            🪙 {currentUser.coins.toLocaleString()} Coins
          </Text>
        </TouchableOpacity>

        <View style={styles.podiumTouchLayer}>
          <TouchableOpacity
            activeOpacity={0.4}
            style={styles.podiumTouchSpot}
            onPress={() => setBotSelectModal(true)}
          />
          <TouchableOpacity
            activeOpacity={0.4}
            style={styles.podiumTouchSpot}
            onPress={() => setPassPlayModal(true)}
          />
          <TouchableOpacity
            activeOpacity={0.4}
            style={styles.podiumTouchSpot}
            onPress={() => setHybridTeamModal(true)}
          />
          <TouchableOpacity
            activeOpacity={0.4}
            style={styles.podiumTouchSpot}
            onPress={() => setOnlineScreen(true)}
          />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <View style={styles.patternBg} />

      <Modal transparent animationType="slide" visible={chatModal}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inviteModalOverlay}
        >
          <View style={[styles.glassCard, styles.chatModalBox]}>
            <View style={styles.chatHeaderRow}>
              <Text style={styles.chatTitleText}>💬 LIVE MATCH CHAT</Text>
              <TouchableOpacity onPress={() => setChatModal(false)} style={styles.closeChatBtn}>
                <Text style={styles.closeChatText}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={chatMessages}
              keyExtractor={(item) => item.id}
              style={styles.chatListFeed}
              contentContainerStyle={{ paddingVertical: 8 }}
              renderItem={({ item }) => {
                const isMe = item.senderColor === myColor;
                return (
                  <View style={[styles.chatBubbleRow, isMe ? styles.chatBubbleRight : styles.chatBubbleLeft]}>
                    <View style={[styles.chatMessageBubble, isMe ? styles.chatBubbleMe : styles.chatBubbleOpponent]}>
                      <Text style={[styles.chatSenderName, { color: getTurnColorHex(item.senderColor) }]}>
                        {item.senderName} ({item.senderColor})
                      </Text>
                      <Text style={styles.chatMessageText}>{item.text}</Text>
                      <Text style={styles.chatTimeText}>{item.time}</Text>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.noChatText}>No messages yet. Send a quick emoji or message!</Text>
              }
            />

            <View style={styles.quickEmojiRow}>
              {QUICK_EMOJIS.map((emoji, idx) => (
                <TouchableOpacity key={idx} style={styles.emojiCircleBtn} onPress={() => sendChatMessage(emoji)}>
                  <Text style={{ fontSize: 20 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.chatInputWrap}>
              <TextInput
                style={styles.chatTextInputField}
                placeholder="Type your message..."
                placeholderTextColor="#64748b"
                value={chatInputText}
                onChangeText={setChatInputText}
              />
              <TouchableOpacity style={styles.sendChatBtn} onPress={() => sendChatMessage()}>
                <Text style={styles.sendChatBtnText}>Send ➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {showPodiumBoard && (
        <Modal transparent animationType="slide" visible={showPodiumBoard}>
          <View style={styles.inviteModalOverlay}>
            <View style={[styles.glassCard, { borderColor: '#facc15', borderWidth: 2.5 }]}>
              <Text style={styles.podiumTitleHeader}>🏆 MATCH LEADERBOARD 🏆</Text>
              <Text style={styles.podiumSubHeader}>Prize Pool Winner Payout</Text>

              <View style={styles.leaderboardListWrap}>
                {finishedRankings.map((colorKey, index) => {
                  const playerName = getBaseDynamicLabel(colorKey);
                  const isHostUser = colorKey === myColor;
                  const rankBadge = index === 0 ? '🥇 1st (Winner)' : index === 1 ? '🥈 2nd Place' : index === 2 ? '🥉 3rd Place' : '🎖️ 4th Place';
                  const coinReward = index === 0 ? `+🪙 ${matchPrizePool.toLocaleString()}` : '+🪙 0';

                  return (
                    <View key={colorKey} style={[styles.leaderboardRowItem, isHostUser && styles.leaderboardHostRow]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.rankBadgeText}>{rankBadge}</Text>
                        <View style={{ marginLeft: 10 }}>
                          <Text style={[styles.rankPlayerName, { color: getTurnColorHex(colorKey) }]}>{playerName}</Text>
                          <Text style={styles.rankColorSub}>{colorKey}</Text>
                        </View>
                      </View>
                      <View style={styles.rankCoinBox}>
                        <Text style={styles.rankCoinText}>{coinReward}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              <TouchableOpacity activeOpacity={0.85} style={[styles.gold3DButton, { marginTop: 16 }]} onPress={resetGame}>
                <Text style={styles.gold3DButtonText}>COLLECT REWARD & EXIT ➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.exitBtn} onPress={handleExitGame}>
          <Text style={styles.exitBtnText}>✕ Exit</Text>
        </TouchableOpacity>
        
        <View style={styles.inGamePoolBox}>
          <Text style={styles.inGamePoolText}>🪙 Pool: {matchPrizePool.toLocaleString()}</Text>
        </View>

        {(gameMode === 'ONLINE' || gameMode === 'HYBRID') && (
          <View style={styles.onlineGameActions}>
            <TouchableOpacity 
              activeOpacity={0.8} 
              style={[styles.inGameIconBtn, isMicOn ? styles.micBtnActive : styles.micBtnInactive]} 
              onPress={toggleVoiceMic}
            >
              <Text style={{ fontSize: 16 }}>{isMicOn ? '🎙️' : '🔇'}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.8} 
              style={[styles.inGameIconBtn, styles.chatTriggerBtn]} 
              onPress={() => setChatModal(true)}
            >
              <Text style={{ fontSize: 16 }}>💬</Text>
              {chatMessages.length > 0 && <View style={styles.chatBadgeDot} />}
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.timerBubbleWrap, turnTimeLeft <= 10 && styles.timerDangerPulse]}>
          <Text style={styles.timerBubbleText}>⏱️ {turnTimeLeft}s</Text>
        </View>
      </View>

      <View style={styles.topCardsRow}>
        {shouldFlipBoard ? (
          <>
            {renderPlayerCard('YELLOW', '#eab308', '#a16207', false, true)}
            {renderPlayerCard('BLUE', '#3b82f6', '#1d4ed8', true, true)}
          </>
        ) : (
          <>
            {renderPlayerCard('RED', '#ef4444', '#b91c1c', false, true)}
            {renderPlayerCard('GREEN', '#22c55e', '#15803d', true, true)}
          </>
        )}
      </View>

      <View style={styles.boardContainer}>
        <View style={[styles.board, shouldFlipBoard && { transform: [{ rotate: '180deg' }] }]}>
          {renderBase('RED', styles.redBase, true)}
          {renderBase('GREEN', styles.greenBase, false)}
          {renderBase('BLUE', styles.blueBase, false)}
          {renderBase('YELLOW', styles.yellowBase, false)}

          <View style={styles.centerHome}>
            <View style={styles.centerTriangleTop} />
            <View style={styles.centerTriangleRight} />
            <View style={styles.centerTriangleBottom} />
            <View style={styles.centerTriangleLeft} />
          </View>

          {Array.from({ length: 15 }).map((_, r) =>
            Array.from({ length: 15 }).map((_, c) => renderCell(r, c))
          )}

          {renderAllTokens()}
        </View>
      </View>

      <View style={styles.bottomCardsRow}>
        {shouldFlipBoard ? (
          <>
            {renderPlayerCard('GREEN', '#22c55e', '#15803d', false, false)}
            {renderPlayerCard('RED', '#ef4444', '#b91c1c', true, false)}
          </>
        ) : (
          <>
            {renderPlayerCard('BLUE', '#3b82f6', '#1d4ed8', false, false)}
            {renderPlayerCard('YELLOW', '#eab308', '#a16207', true, false)}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  royaleContainer: { flex: 1, backgroundColor: '#0a0f1d', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16 },
  dashboardContainer: { flex: 1, backgroundColor: '#0a0f1d', width: '100%', height: '100%' },
  lobbyBgImage: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  topHeaderOverlay: { position: 'absolute', top: 38, left: 14, right: 14, height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 30 },
  
  topLeftProfileWrap: { marginLeft: 56, paddingVertical: 2, justifyContent: 'center' },
  headerUserName: { color: '#ffffff', fontSize: 14, fontWeight: '900', maxWidth: 120, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  headerUserCoins: { color: '#facc15', fontSize: 12, fontWeight: '800', marginTop: 1, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  topRightBtnsWrap: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  freeBonusBtn: { backgroundColor: '#10b981', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, marginRight: 6, borderWidth: 1, borderColor: '#6ee7b7' },
  freeBonusBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 11 },
  settingTouchBtn: { backgroundColor: 'rgba(15, 23, 42, 0.85)', borderWidth: 1, borderColor: '#facc15', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8 },
  settingBtnText: { fontSize: 15 },
  friendsTouchBtn: { backgroundColor: '#0284c7', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#38bdf8' },
  friendsBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  
  centerCrownPlankWrap: { position: 'absolute', top: 144, alignSelf: 'center', alignItems: 'center', zIndex: 20 },
  centerPlankName: { color: '#ffffff', fontSize: 16, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 },
  centerPlankCoins: { color: '#facc15', fontSize: 13, fontWeight: '800', marginTop: 1, textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 },
  
  podiumTouchLayer: { position: 'absolute', top: '41%', left: '4%', right: '4%', height: 360, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignContent: 'space-between', zIndex: 20 },
  podiumTouchSpot: { width: '47%', height: 165, borderRadius: 24 },
  
  profileModalHeader: { alignItems: 'center', marginBottom: 6 },
  profileStatsTitle: { color: '#facc15', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  profileStatsSubId: { color: '#38bdf8', fontSize: 12, fontWeight: 'bold', marginTop: 2 },
  statsRowGrid: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginVertical: 12 },
  statBoxCard: { width: '23%', backgroundColor: '#0a0f1d', borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1.5, borderColor: '#334155' },
  statBoxNumber: { color: '#ffffff', fontSize: 18, fontWeight: '900' },
  statBoxLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '700', marginTop: 2 },

  prizePoolPreviewBox: { backgroundColor: '#1e293b', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1.5, borderColor: '#facc15', marginTop: 8 },
  prizePoolPreviewLabel: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold' },
  prizePoolPreviewAmount: { color: '#facc15', fontSize: 18, fontWeight: '900', marginTop: 2 },
  prizePoolBadgeLobby: { backgroundColor: '#78350f', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, borderWidth: 1.5, borderColor: '#facc15', marginVertical: 4 },
  prizePoolBadgeLobbyText: { color: '#facc15', fontWeight: '900', fontSize: 13 },
  inGamePoolBox: { backgroundColor: '#78350f', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#facc15' },
  inGamePoolText: { color: '#facc15', fontWeight: 'bold', fontSize: 12 },

  settingsSectionCard: { width: '100%', backgroundColor: '#0a0f1d', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#334155', marginVertical: 6, alignItems: 'center' },
  settingsSectionTitle: { color: '#38bdf8', fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 8, alignSelf: 'flex-start' },
  profileBigAvatarWrap: { width: 75, height: 75, borderRadius: 38, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: '#facc15', marginVertical: 6, position: 'relative' },
  editAvatarBadge: { position: 'absolute', bottom: -4, backgroundColor: '#0284c7', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, borderWidth: 1, borderColor: '#ffffff' },
  infoLineRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: '#1e293b' },
  infoFieldLabel: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
  infoFieldValue: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', maxWidth: 170 },
  avatarPickerTriggerBtn: { marginTop: 10, backgroundColor: '#1e293b', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#facc15', width: '100%', alignItems: 'center' },
  avatarPickerTriggerText: { color: '#facc15', fontWeight: 'bold', fontSize: 12 },
  soundToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingVertical: 4 },
  soundLabelText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  aboutGoldTitle: { color: '#facc15', fontSize: 16, fontWeight: '900', marginTop: 2 },
  aboutVersionText: { color: '#94a3b8', fontSize: 11, marginBottom: 6 },
  aboutCreatorText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  aboutContactText: { color: '#38bdf8', fontSize: 12, fontWeight: '600', marginTop: 2 },
  logoutSettingsBtn: { width: '100%', backgroundColor: '#ef4444', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#fca5a5' },
  logoutSettingsText: { color: '#ffffff', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },

  podiumTitleHeader: { color: '#facc15', fontSize: 20, fontWeight: '900', textAlign: 'center', letterSpacing: 1 },
  podiumSubHeader: { color: '#94a3b8', fontSize: 12, fontWeight: '700', textAlign: 'center', marginBottom: 14 },
  leaderboardListWrap: { width: '100%', marginVertical: 6 },
  leaderboardRowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0a0f1d', borderRadius: 12, padding: 10, marginVertical: 4, borderWidth: 1.5, borderColor: '#334155' },
  leaderboardHostRow: { borderColor: '#facc15', backgroundColor: '#1e293b' },
  rankBadgeText: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  rankPlayerName: { fontSize: 13, fontWeight: 'bold' },
  rankColorSub: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
  rankCoinBox: { backgroundColor: '#78350f', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#facc15' },
  rankCoinText: { color: '#facc15', fontWeight: '900', fontSize: 12 },
  baseRankBanner: { position: 'absolute', top: 4, backgroundColor: '#78350f', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#facc15', zIndex: 10 },
  baseRankBannerText: { color: '#fef08a', fontSize: 10, fontWeight: '900' },

  avatarSelectionCard: { width: '95%', backgroundColor: '#022144', borderRadius: 24, padding: 14, borderWidth: 3, borderColor: '#facc15', alignItems: 'center', elevation: 12 },
  avatarPreviewTopBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 12 },
  avatarPreviewCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1e3a8a', borderWidth: 2, borderColor: '#38bdf8', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarPreviewNamePlank: { backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#94a3b8', borderStyle: 'dashed', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 8, minWidth: 150, alignItems: 'center' },
  avatarPreviewNameText: { color: '#000000', fontWeight: '900', fontSize: 15 },
  avatarCategoryRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
  avatarTabBtn: { flex: 1, backgroundColor: '#0f172a', paddingVertical: 8, alignItems: 'center', borderRadius: 10, marginHorizontal: 3, borderWidth: 1, borderColor: '#334155' },
  avatarTabActiveMale: { backgroundColor: '#0284c7', borderColor: '#38bdf8' },
  avatarTabActiveFemale: { backgroundColor: '#db2777', borderColor: '#f472b6' },
  avatarTabActiveRoyale: { backgroundColor: '#ca8a04', borderColor: '#facc15' },
  avatarTabText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  selectPicHeading: { color: '#facc15', fontSize: 16, fontWeight: '900', letterSpacing: 1, marginVertical: 6 },
  avatarGridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' },
  avatarGridTile: { width: '31%', height: 85, backgroundColor: '#0a192f', borderRadius: 12, borderWidth: 1.5, borderColor: '#1e3a8a', justifyContent: 'center', alignItems: 'center', marginVertical: 4 },
  avatarGridTileSelected: { borderColor: '#facc15', backgroundColor: '#1e3a8a', borderWidth: 2.5, elevation: 6 },
  avatarTileLabel: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', marginTop: 2 },

  matchmakingContainer: { flex: 1, backgroundColor: '#881337', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, paddingHorizontal: 16 },
  matchLobbyHeader: { alignItems: 'center', marginTop: 4 },
  matchLobbyTitle: { color: '#facc15', fontSize: 22, fontWeight: '900', letterSpacing: 1.5 },
  matchFormatSub: { color: '#ffffff', fontSize: 12, fontWeight: '800', marginTop: 2, letterSpacing: 1 },
  matchCodeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#450a0a', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, borderWidth: 2, borderColor: '#f87171', marginTop: 8 },
  matchCodeLabel: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  codePillBox: { backgroundColor: '#1e3a8a', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#38bdf8' },
  codePillText: { color: '#facc15', fontWeight: '900', fontSize: 18, letterSpacing: 2 },
  shareCodeBtn: { backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginLeft: 10 },
  shareCodeText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  
  soloMatchLobbyWrap: { width: '100%', alignItems: 'center', marginVertical: 4 },
  hostProfileBox: { alignItems: 'center', marginTop: 6 },
  hostAvatarSquare: { width: 84, height: 84, borderRadius: 18, backgroundColor: '#7f1d1d', borderWidth: 2.5, borderColor: '#facc15', justifyContent: 'center', alignItems: 'center', elevation: 8 },
  hostNameText: { color: '#ffffff', fontWeight: '900', fontSize: 15, marginTop: 4 },
  hostBadgeText: { color: '#38bdf8', fontWeight: '800', fontSize: 10, marginTop: 1 },
  vsGlowBanner: { marginVertical: 6 },
  vsGlowText: { color: '#facc15', fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  opponentSlotsRow: { flexDirection: 'row', justifyContent: 'center', width: '100%', marginVertical: 6 },
  slotInviteBox: { width: 88, height: 95, borderRadius: 16, backgroundColor: '#7f1d1d', borderWidth: 2, borderColor: '#fca5a5', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginHorizontal: 6, elevation: 4 },
  plusAvatarIcon: { fontSize: 28, color: '#fecaca' },
  inviteSlotLabel: { color: '#fecaca', fontSize: 9, fontWeight: 'bold', marginTop: 4, textAlign: 'center' },
  joinedSlotName: { color: '#ffffff', fontSize: 11, fontWeight: 'bold', maxWidth: 75, textAlign: 'center', marginTop: 2 },
  joinedSlotTag: { fontSize: 9, fontWeight: '900', marginTop: 1 },
  
  teamMatchLobbyWrap: { width: '100%', marginVertical: 2 },
  teamLobbyBoxA: { backgroundColor: 'rgba(2, 132, 199, 0.25)', borderWidth: 1.5, borderColor: '#38bdf8', borderRadius: 16, padding: 8, alignItems: 'center' },
  teamLobbyBoxB: { backgroundColor: 'rgba(225, 29, 72, 0.25)', borderWidth: 1.5, borderColor: '#fb7185', borderRadius: 16, padding: 8, alignItems: 'center' },
  teamLobbyTitleA: { color: '#38bdf8', fontWeight: '900', fontSize: 12, marginBottom: 6, letterSpacing: 0.5 },
  teamLobbyTitleB: { color: '#fb7185', fontWeight: '900', fontSize: 12, marginBottom: 6, letterSpacing: 0.5 },
  teamSlotsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  playerSquareActive: { width: 100, height: 86, borderRadius: 14, backgroundColor: '#1e3a8a', borderWidth: 1.5, borderColor: '#38bdf8', justifyContent: 'center', alignItems: 'center' },
  slotBoxFilledGreen: { backgroundColor: '#14532d', borderColor: '#4ade80', borderStyle: 'solid' },
  slotBoxFilledRed: { backgroundColor: '#881337', borderColor: '#fb7185', borderStyle: 'solid' },
  slotBoxFilledYellow: { backgroundColor: '#713f12', borderColor: '#facc15', borderStyle: 'solid' },
  slotPlayerNameText: { color: '#ffffff', fontWeight: 'bold', fontSize: 11, maxWidth: 85, textAlign: 'center', marginTop: 2 },
  slotRoleTagBlue: { color: '#38bdf8', fontSize: 8, fontWeight: '900', marginTop: 1 },
  slotRoleTagGreen: { color: '#4ade80', fontSize: 8, fontWeight: '900', marginTop: 1 },
  slotRoleTagRed: { color: '#fb7185', fontSize: 8, fontWeight: '900', marginTop: 1 },
  slotRoleTagYellow: { color: '#facc15', fontSize: 8, fontWeight: '900', marginTop: 1 },

  matchBottomActions: { width: '100%', alignItems: 'center', marginBottom: 6 },
  startMatchGoldBtn: { width: '90%', backgroundColor: '#eab308', borderWidth: 1.5, borderColor: '#fef08a', borderRadius: 14, paddingVertical: 13, alignItems: 'center', elevation: 6 },
  startMatchGoldText: { color: '#000000', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  cancelMatchBtn: { marginTop: 8, paddingVertical: 4 },
  cancelMatchText: { color: '#fca5a5', fontWeight: 'bold', fontSize: 13 },

  searchedUserCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0a0f1d', padding: 10, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: '#38bdf8' },
  inviteDetailsBox: { backgroundColor: '#0a0f1d', borderRadius: 12, padding: 12, marginVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  inviteRoomTag: { color: '#38bdf8', fontSize: 14, fontWeight: 'bold', marginTop: 4 },
  inviteModeTag: { color: '#4ade80', fontSize: 12, fontWeight: '800', marginTop: 2 },

  brandHero: { alignItems: 'center', marginTop: 4 },
  crownEmoji: { fontSize: 36, marginBottom: 2 },
  brandGoldTitle: { fontSize: 24, fontWeight: '900', color: '#facc15', letterSpacing: 1.5, textAlign: 'center' },
  goldPillBadge: { backgroundColor: '#78350f', borderColor: '#facc15', borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 3, marginTop: 4 },
  goldPillText: { color: '#fef08a', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  glassCard: { width: '100%', backgroundColor: '#131c31', borderRadius: 20, padding: 16, borderWidth: 1.5, borderColor: '#1e293b', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 15, elevation: 8 },
  cardHeading: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 14, letterSpacing: 1 },
  inputLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '700', marginBottom: 6, letterSpacing: 0.5 },
  gameTextInput: { backgroundColor: '#0a0f1d', borderWidth: 1.5, borderColor: '#334155', borderRadius: 12, color: '#ffffff', paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontWeight: '600' },
  gold3DButton: { backgroundColor: '#eab308', borderColor: '#fef08a', borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: 'center', shadowColor: '#facc15', shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  gold3DButtonText: { color: '#000000', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  forgotHeaderBox: { alignItems: 'center', marginBottom: 8 },
  forgotTitle: { color: '#facc15', fontSize: 16, fontWeight: 'bold' },
  forgotSubtitle: { color: '#94a3b8', fontSize: 11, textAlign: 'center', marginTop: 2 },
  forgotLinkContainer: { alignSelf: 'flex-end', marginTop: 8, paddingVertical: 4 },
  forgotLinkText: { color: '#38bdf8', fontSize: 12, fontWeight: 'bold' },
  orDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#334155', marginVertical: 6 },
  orText: { color: '#64748b', paddingHorizontal: 12, fontSize: 11, fontWeight: 'bold' },
  darkSecondaryButton: { backgroundColor: '#1e293b', borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#475569' },
  darkSecondaryButtonText: { color: '#cbd5e1', fontSize: 13, fontWeight: '700' },
  tabToggleRow: { flexDirection: 'row', backgroundColor: '#0a0f1d', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: '#334155' },
  tabToggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabToggleActive: { backgroundColor: '#0284c7' },
  tabToggleText: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
  tabToggleTextActive: { color: '#ffffff' },
  playerCountRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  countPill: { flex: 1, backgroundColor: '#0a0f1d', borderWidth: 1.5, borderColor: '#334155', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginHorizontal: 4 },
  countPillActive: { borderColor: '#10b981', backgroundColor: '#064e3b' },
  countPillText: { color: '#94a3b8', fontWeight: 'bold', fontSize: 12 },
  countPillTextActive: { color: '#ffffff' },
  teamContainerBoxA: { backgroundColor: 'rgba(2, 132, 199, 0.12)', borderWidth: 1.5, borderColor: '#0284c7', borderRadius: 14, padding: 10, marginBottom: 4 },
  teamContainerBoxB: { backgroundColor: 'rgba(225, 29, 72, 0.12)', borderWidth: 1.5, borderColor: '#e11d48', borderRadius: 14, padding: 10, marginTop: 4 },
  teamHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  teamHeaderTitleA: { color: '#38bdf8', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
  teamHeaderTitleB: { color: '#fb7185', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
  teamBadgeA: { backgroundColor: '#0369a1', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  teamBadgeB: { backgroundColor: '#9f1239', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  teamBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  vsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 4 },
  vsLine: { flex: 1, height: 1, backgroundColor: '#334155' },
  vsCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f59e0b', justifyContent: 'center', alignItems: 'center', marginHorizontal: 8 },
  vsText: { color: '#ffffff', fontWeight: '900', fontSize: 11 },
  slotRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4, backgroundColor: '#0a0f1d', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  slotColorText: { fontSize: 13, fontWeight: 'bold', width: 65 },
  slotTypeSelector: { flexDirection: 'row' },
  slotTypePill: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, backgroundColor: '#1e293b', marginLeft: 4 },
  slotTypePillActive: { backgroundColor: '#0284c7' },
  slotTypeText: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold' },
  slotTypeTextActive: { color: '#ffffff' },
  slotSmallBadge: { color: '#facc15', fontSize: 8, fontWeight: 'bold', marginTop: 1 },
  missCounterBadge: { color: '#ef4444', fontSize: 9, fontWeight: '900', marginTop: 1 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a0f1d', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  checkSquare: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#64748b', justifyContent: 'center', alignItems: 'center' },
  checkSquareActive: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  checkTick: { color: '#ffffff', fontWeight: '900', fontSize: 13 },
  checkboxLabel: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  helperTip: { color: '#94a3b8', fontSize: 10, marginTop: 4 },
  friendCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0a0f1d', padding: 10, borderRadius: 12, marginVertical: 4, borderWidth: 1, borderColor: '#334155' },
  onlineDot: { width: 10, height: 10, borderRadius: 5 },
  friendNameText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  friendStatusText: { color: '#94a3b8', fontSize: 11 },
  invitePillBtn: { backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  invitePillBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  inviteModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  invitePromptText: { color: '#ffffff', fontSize: 16, textAlign: 'center', marginBottom: 6 },
  
  mainContainer: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  patternBg: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: '#1e293b' },
  headerBar: { width: '94%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4, zIndex: 10 },
  exitBtn: { backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5, borderColor: '#ffffff' },
  exitBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  timerBubbleWrap: { backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5, borderColor: '#38bdf8' },
  timerDangerPulse: { borderColor: '#ef4444', backgroundColor: '#450a0a' },
  timerBubbleText: { color: '#ffffff', fontWeight: '900', fontSize: 13 },
  
  onlineGameActions: { flexDirection: 'row', alignItems: 'center' },
  inGameIconBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginHorizontal: 4, borderWidth: 1.5 },
  micBtnActive: { backgroundColor: '#10b981', borderColor: '#6ee7b7' },
  micBtnInactive: { backgroundColor: '#334155', borderColor: '#64748b' },
  chatTriggerBtn: { backgroundColor: '#0284c7', borderColor: '#38bdf8', position: 'relative' },
  chatBadgeDot: { position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#facc15' },
  micActiveIndicator: { fontSize: 10, position: 'absolute', top: -4, right: -4 },

  chatModalBox: { width: '92%', height: '65%', padding: 12, justifyContent: 'space-between' },
  chatHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#334155', paddingBottom: 8 },
  chatTitleText: { color: '#facc15', fontWeight: '900', fontSize: 15 },
  closeChatBtn: { padding: 4 },
  closeChatText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  chatListFeed: { flex: 1, width: '100%' },
  chatBubbleRow: { width: '100%', marginVertical: 3, flexDirection: 'row' },
  chatBubbleLeft: { justifyContent: 'flex-start' },
  chatBubbleRight: { justifyContent: 'flex-end' },
  chatMessageBubble: { maxWidth: '78%', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  chatBubbleMe: { backgroundColor: '#0284c7' },
  chatBubbleOpponent: { backgroundColor: '#334155' },
  chatSenderName: { fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
  chatMessageText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  chatTimeText: { color: '#cbd5e1', fontSize: 8, alignSelf: 'flex-end', marginTop: 2 },
  noChatText: { color: '#64748b', textAlign: 'center', fontSize: 12, marginTop: 20 },
  quickEmojiRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#1e293b' },
  emojiCircleBtn: { padding: 4, backgroundColor: '#1e293b', borderRadius: 8 },
  chatInputWrap: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  chatTextInputField: { flex: 1, backgroundColor: '#0a0f1d', borderWidth: 1, borderColor: '#334155', borderRadius: 10, color: '#ffffff', paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 },
  sendChatBtn: { backgroundColor: '#eab308', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginLeft: 6 },
  sendChatBtnText: { color: '#000000', fontWeight: '900', fontSize: 12 },

  topCardsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: BOARD_SIZE, paddingHorizontal: 4, minHeight: 60 },
  bottomCardsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: BOARD_SIZE, paddingHorizontal: 4, minHeight: 60 },
  cardContainerWrapper: { width: '46%', alignItems: 'center' },
  playerCardPlaceholder: { width: '46%' },
  playerCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 12, borderWidth: 1.5, borderColor: '#475569', width: '100%' },
  activeCardGlow: { borderColor: '#facc15', backgroundColor: '#334155', elevation: 8, shadowColor: '#facc15', shadowOpacity: 0.6, shadowRadius: 10 },
  cardAvatarLeft: { flexDirection: 'column', alignItems: 'center', width: 35 },
  cardAvatarRight: { flexDirection: 'column', alignItems: 'center', width: 35 },
  cardDiceWrap: { padding: 2 },

  floatingArrowContainer: { position: 'absolute', alignSelf: 'center', zIndex: 30 },
  arrowTopPos: { top: -24 },
  arrowIconBubble: { backgroundColor: '#f59e0b', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1.5, borderColor: '#ffffff', elevation: 6 },
  arrowIconText: { color: '#ffffff', fontWeight: '900', fontSize: 14 },

  diceBox: { width: 42, height: 42, backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 2, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center', padding: 3 },
  diceDot: { width: 6.5, height: 6.5, borderRadius: 3.25, backgroundColor: '#0f172a', margin: 1.5 },
  diceCenter: { justifyContent: 'center', alignItems: 'center' },
  diceRowSpace: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 2 },
  diceCol: { justifyContent: 'space-between' },
  
  pinWrapper: { alignItems: 'center', width: 22, height: 28 },
  pinHead: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#ffffff', justifyContent: 'center', alignItems: 'center' },
  pinInnerGlow: { position: 'absolute', top: 2, left: 4, width: 6, height: 4, borderRadius: 2, backgroundColor: 'rgba(255, 255, 255, 0.5)' },
  pinCenterDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#ffffff' },
  pinPointer: { width: 0, height: 0, borderLeftWidth: 4, borderRightWidth: 4, borderTopWidth: 6, borderLeftColor: 'transparent', borderRightColor: 'transparent', marginTop: -1 },
  
  stackBadgeBubble: { position: 'absolute', top: -10, alignSelf: 'center', backgroundColor: '#facc15', borderRadius: 8, width: 15, height: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#000000', zIndex: 30 },
  stackBadgeText: { color: '#000000', fontSize: 9, fontWeight: '900' },

  boardContainer: { width: BOARD_SIZE, height: BOARD_SIZE, backgroundColor: '#000000', borderWidth: 3.5, borderColor: '#000000', borderRadius: 16, overflow: 'hidden', elevation: 12, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10 },
  board: { width: '100%', height: '100%', position: 'relative', backgroundColor: '#ffffff' },
  
  // Dark Solid Black Crisp Grid Lines
  cell: { position: 'absolute', width: CELL_SIZE, height: CELL_SIZE, borderWidth: 1, borderColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  starCircle: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#0284c7', justifyContent: 'center', alignItems: 'center' },
  starText: { fontSize: 11, color: '#ffffff', fontWeight: '900' },
  arrowText: { fontSize: 13, color: '#ffffff', fontWeight: '900' },
  
  base: { position: 'absolute', width: CELL_SIZE * 6, height: CELL_SIZE * 6, justifyContent: 'center', alignItems: 'center', padding: 8, borderRadius: 16, borderWidth: 2, borderColor: '#000000' },
  redBase: { top: 0, left: 0, backgroundColor: '#ef4444' },
  greenBase: { top: 0, right: 0, backgroundColor: '#22c55e' },
  blueBase: { bottom: 0, left: 0, backgroundColor: '#3b82f6' },
  yellowBase: { bottom: 0, right: 0, backgroundColor: '#eab308' },
  baseInnerWhite: { width: '84%', height: '84%', backgroundColor: '#ffffff', borderRadius: 14, justifyContent: 'space-around', padding: 8, borderWidth: 1.5, borderColor: '#000000' },
  pocketRow: { flexDirection: 'row', justifyContent: 'space-around' },
  basePocket: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: '#000000' },
  playerLabel: { position: 'absolute', fontSize: 10, fontWeight: 'bold', color: '#ffffff', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 2 },
  playerLabelHorizontal: { bottom: 3 },
  playerLabelRotated: { left: -10, transform: [{ rotate: '-90deg' }] },
  
  centerHome: { position: 'absolute', top: CELL_SIZE * 6, left: CELL_SIZE * 6, width: CELL_SIZE * 3, height: CELL_SIZE * 3, overflow: 'hidden', borderWidth: 1, borderColor: '#000000' },
  centerTriangleTop: { position: 'absolute', top: 0, left: 0, width: 0, height: 0, borderLeftWidth: (CELL_SIZE * 3) / 2, borderRightWidth: (CELL_SIZE * 3) / 2, borderTopWidth: (CELL_SIZE * 3) / 2, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#22c55e' },
  centerTriangleRight: { position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderTopWidth: (CELL_SIZE * 3) / 2, borderBottomWidth: (CELL_SIZE * 3) / 2, borderRightWidth: (CELL_SIZE * 3) / 2, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: '#eab308' },
  centerTriangleBottom: { position: 'absolute', bottom: 0, left: 0, width: 0, height: 0, borderLeftWidth: (CELL_SIZE * 3) / 2, borderRightWidth: (CELL_SIZE * 3) / 2, borderBottomWidth: (CELL_SIZE * 3) / 2, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#3b82f6' },
  centerTriangleLeft: { position: 'absolute', top: 0, left: 0, width: 0, height: 0, borderTopWidth: (CELL_SIZE * 3) / 2, borderBottomWidth: (CELL_SIZE * 3) / 2, borderLeftWidth: (CELL_SIZE * 3) / 2, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#ef4444' },

  tokenWrapper: { position: 'absolute', width: CELL_SIZE, height: CELL_SIZE, justifyContent: 'center', alignItems: 'center' },
});
