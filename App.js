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
  Platform, 
  BackHandler, 
  PermissionsAndroid 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

const SUPABASE_PROJECT_REF = 'zyqlntdpftowobsrzbgv'; 
const SUPABASE_ANON_KEY = 'sb_publishable_DuyB_EEKvMkDk0QFxQykqg_ZXCMzTwo';
const SUPABASE_REST_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co/rest/v1`;

const AGORA_APP_ID = '110534b7d9ce4f1ea80f93494d69ffa5';

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
    <View style={[styles.pinPedestalRing, { borderColor: colorHex }]}>
      <View style={[styles.pinHeadCircle, { backgroundColor: colorHex }]}>
        <View style={styles.pinWhiteInnerCore}>
          <View style={[styles.pinDotCenter, { backgroundColor: colorHex }]} />
        </View>
      </View>
      <View style={[styles.pinBottomPoint, { borderTopColor: colorHex }]} />
    </View>
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
  const [leaderboardModal, setLeaderboardModal] = useState(false);
  const [cloudLeaderboardData, setCloudLeaderboardData] = useState([]);
  const [avatarModal, setAvatarModal] = useState(false);
  const [avatarCategory, setAvatarCategory] = useState('FEMALE');
  const [userAvatar, setUserAvatar] = useState('👸');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [chatModal, setChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState('');
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVoiceUnlocked, setIsVoiceUnlocked] = useState(false);
  const [voiceUsers, setVoiceUsers] = useState({});

  const [selectedEntryFee, setSelectedEntryFee] = useState(50);
  const [matchPrizePool, setMatchPrizePool] = useState(0);

  const [userStats, setUserStats] = useState({
    totalPlayed: 0,
    totalWon: 0,
    totalLost: 0,
  });

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
  const [recentPlayersList, setRecentPlayersList] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [incomingInvitesList, setIncomingInvitesList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUserResult, setSearchedUserResult] = useState(null);
  const [isSearchingCloud, setIsSearchingCloud] = useState(false);
  const [incomingInvite, setIncomingInvite] = useState(null);
  const [lastBonusClaimDate, setLastBonusClaimDate] = useState('');

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
    GREEN: 'BOT',
    RED: 'BOT',
    YELLOW: 'BOT',
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
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;
  const myColorRef = useRef(myColor);
  myColorRef.current = myColor;
  const roomCodeRef = useRef(roomCode);
  roomCodeRef.current = roomCode;
  const userAvatarRef = useRef(userAvatar);
  userAvatarRef.current = userAvatar;
  const activeColorsRef = useRef(activeColors);
  activeColorsRef.current = activeColors;
  const playTypeRef = useRef(playType);
  playTypeRef.current = playType;
  const selectedEntryFeeRef = useRef(selectedEntryFee);
  selectedEntryFeeRef.current = selectedEntryFee;

  const ws = useRef(null);
  const userWs = useRef(null);
  const agoraEngine = useRef(null);
  const currentTurn = activeColors[turnIndex] || activeColors[0] || 'BLUE';

  // Hardware Back Button Control
  useEffect(() => {
    const backAction = () => {
      if (chatModal) { setChatModal(false); return true; }
      if (avatarModal) { setAvatarModal(false); return true; }
      if (friendsModal) { setFriendsModal(false); return true; }
      if (leaderboardModal) { setLeaderboardModal(false); return true; }
      if (profileStatsModal) { setProfileStatsModal(false); return true; }
      if (settingsModal) { setSettingsModal(false); return true; }
      if (botSelectModal) { setBotSelectModal(false); return true; }
      if (passPlayModal) { setPassPlayModal(false); return true; }
      if (hybridTeamModal) { setHybridTeamModal(false); return true; }
      if (onlineScreen) { setOnlineScreen(false); return true; }
      if (onlineLobbyModal) { setOnlineLobbyModal(false); resetGame(); return true; }
      if (gameMode) {
        Alert.alert('Exit Game', 'Return to Main Lobby?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Quit Match', style: 'destructive', onPress: resetGame },
        ]);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [chatModal, avatarModal, friendsModal, leaderboardModal, profileStatsModal, settingsModal, botSelectModal, passPlayModal, hybridTeamModal, onlineScreen, onlineLobbyModal, gameMode]);

  // Heartbeat Presence Ping (Updates last_seen in Supabase every 10 seconds)
  useEffect(() => {
    if (!currentUser) return;

    const sendHeartbeat = async () => {
      try {
        await fetch(`${SUPABASE_REST_URL}/ludo_users?player_id=eq.${currentUser.playerId}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ last_seen: new Date().toISOString() })
        });
      } catch (e) {}
    };

    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 10000);
    return () => clearInterval(heartbeatInterval);
  }, [currentUser]);

  // Fetch Real Cloud Leaderboard Data
  const fetchCloudLeaderboard = async () => {
    try {
      const res = await fetch(`${SUPABASE_REST_URL}/ludo_users?select=name,coins,player_id,avatar&order=coins.desc&limit=10`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
      });
      const data = await res.json();
      if (data && Array.isArray(data)) {
        setCloudLeaderboardData(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (leaderboardModal) {
      fetchCloudLeaderboard();
    }
  }, [leaderboardModal]);

  // Agora Live Voice Lifecycle with Speakerphone
  useEffect(() => {
    if ((gameMode !== 'ONLINE' && gameMode !== 'HYBRID') || !roomCode || !isVoiceUnlocked) {
      leaveAgoraVoiceChannel();
      return;
    }
    initAgoraVoice(roomCode);
    return () => {
      leaveAgoraVoiceChannel();
    };
  }, [gameMode, roomCode, isVoiceUnlocked]);

  const initAgoraVoice = async (channelId) => {
    try {
      if (Platform.OS === 'android') {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
      }
      let RtcEngine;
      try {
        const AgoraModule = require('react-native-agora');
        RtcEngine = AgoraModule.createAgoraRtcEngine || AgoraModule.default;
      } catch (e) {
        return;
      }
      if (RtcEngine) {
        agoraEngine.current = RtcEngine();
        await agoraEngine.current.initialize({ appId: AGORA_APP_ID });
        await agoraEngine.current.enableAudio();
        await agoraEngine.current.setChannelProfile(1);
        await agoraEngine.current.setClientRoleType(1);
        await agoraEngine.current.setEnableSpeakerphone(true);
        await agoraEngine.current.joinChannel('', channelId, 0, {});
        await agoraEngine.current.muteLocalAudioStream(!isMicOn);
      }
    } catch (err) {}
  };

  const leaveAgoraVoiceChannel = async () => {
    try {
      if (agoraEngine.current) {
        await agoraEngine.current.leaveChannel();
        await agoraEngine.current.release();
        agoraEngine.current = null;
      }
    } catch (e) {}
  };

  const toggleVoiceMic = async () => {
    if (!isVoiceUnlocked) {
      Alert.alert(
        'Unlock Live Voice Chat',
        'You have to pay 500 coins to use online live voice chat. Do you want to unlock it?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Pay 500 Coins', 
            onPress: async () => {
              const success = await deductUserCoins(500);
              if (success) {
                setIsVoiceUnlocked(true);
                executeMicToggle(true);
              }
            } 
          }
        ]
      );
      return;
    }

    executeMicToggle(!isMicOn);
  };

  const executeMicToggle = async (nextState) => {
    setIsMicOn(nextState);
    try {
      if (agoraEngine.current) {
        await agoraEngine.current.muteLocalAudioStream(!nextState);
      }
    } catch (e) {}

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        topic: `realtime:room_${roomCodeRef.current}`,
        event: 'broadcast',
        payload: {
          type: 'VOICE_STATUS_UPDATE',
          data: { color: myColorRef.current, name: currentUserRef.current?.name, isMicOn: nextState }
        },
        ref: 'voice_1'
      }));
    }
  };

  const deductUserCoins = async (amount) => {
    if (!currentUserRef.current) return false;
    if (currentUserRef.current.coins < amount) {
      Alert.alert('Low Coins', `You need at least 🪙 ${amount} coins.`);
      return false;
    }
    const updatedUser = { ...currentUserRef.current, coins: currentUserRef.current.coins - amount };
    setCurrentUser(updatedUser);
    await AsyncStorage.setItem('@ludo_supreme_user', JSON.stringify(updatedUser));
    syncUserCoinsToCloud(updatedUser.playerId, updatedUser.coins);
    return true;
  };

  const addWinnerCoins = async (amount) => {
    if (!currentUserRef.current) return;
    const updatedUser = { ...currentUserRef.current, coins: currentUserRef.current.coins + amount };
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
    const todayStr = new Date().toDateString();
    if (lastBonusClaimDate === todayStr) {
      Alert.alert('Already Claimed', 'Come back tomorrow for your next daily reward!');
      return;
    }

    const updatedUser = { ...currentUser, coins: currentUser.coins + 200 };
    setCurrentUser(updatedUser);
    setLastBonusClaimDate(todayStr);
    await AsyncStorage.setItem('@ludo_supreme_user', JSON.stringify(updatedUser));
    await AsyncStorage.setItem(`@ludo_bonus_${currentUser.playerId}`, todayStr);
    syncUserCoinsToCloud(updatedUser.playerId, updatedUser.coins);
    Alert.alert('🎁 Daily Bonus Claimed!', '🪙 200 Free Coins added to your account!');
  };

  const copyMyPlayerId = () => {
    if (!currentUser?.playerId) return;
    Clipboard.setString(currentUser.playerId);
    Alert.alert('Copied!', `Your Player ID #${currentUser.playerId} copied.`);
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

  const sendChatMessage = (textToSend = null) => {
    const msg = (textToSend || chatInputText).trim();
    if (!msg) return;

    const newMsgObj = {
      id: Date.now().toString(),
      senderName: currentUserRef.current?.name,
      senderColor: myColorRef.current,
      avatar: userAvatarRef.current,
      text: msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, newMsgObj]);
    setChatInputText('');

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        topic: `realtime:room_${roomCodeRef.current}`,
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
          const savedBonusDate = await AsyncStorage.getItem(`@ludo_bonus_${userObj.playerId}`);
          if (savedBonusDate) setLastBonusClaimDate(savedBonusDate);
        }
        if (savedSound !== null) setSoundEnabled(JSON.parse(savedSound));
        if (savedAvatar) setUserAvatar(savedAvatar);
      } catch (err) {}
    };
    restoreSession();
  }, []);

  const loadUserData = async (playerId) => {
    try {
      const storedStats = await AsyncStorage.getItem(`@ludo_stats_${playerId}`);
      if (storedStats) setUserStats(JSON.parse(storedStats));

      const storedRecent = await AsyncStorage.getItem(`@ludo_recent_${playerId}`);
      if (storedRecent) setRecentPlayersList(JSON.parse(storedRecent));

      fetchCloudFriendList(playerId);
      checkCloudFriendRequests();
      checkCloudGameInvites();
    } catch (e) {}
  };

  const recordRecentPlayer = async (playerObj) => {
    if (!currentUserRef.current || !playerObj?.id || playerObj.id === currentUserRef.current.playerId) return;

    try {
      const stored = await AsyncStorage.getItem(`@ludo_recent_${currentUserRef.current.playerId}`);
      let currentList = stored ? JSON.parse(stored) : [];

      currentList = [
        {
          id: playerObj.id,
          name: playerObj.name || 'Player',
          avatar: playerObj.avatar || '👦',
          playedAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        },
        ...currentList.filter(p => p.id !== playerObj.id)
      ].slice(0, 15);

      setRecentPlayersList(currentList);
      await AsyncStorage.setItem(`@ludo_recent_${currentUserRef.current.playerId}`, JSON.stringify(currentList));
    } catch (e) {}
  };

  const updateUserGameStats = async (didWin) => {
    if (!currentUserRef.current) return;
    try {
      const updated = {
        totalPlayed: (userStats.totalPlayed || 0) + 1,
        totalWon: didWin ? (userStats.totalWon || 0) + 1 : (userStats.totalWon || 0),
        totalLost: !didWin ? (userStats.totalLost || 0) + 1 : (userStats.totalLost || 0),
      };
      setUserStats(updated);
      await AsyncStorage.setItem(`@ludo_stats_${currentUserRef.current.playerId}`, JSON.stringify(updated));
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
      if (winCol === myColorRef.current) {
        addWinnerCoins(matchPrizePool);
      }
      updateUserGameStats(winCol === myColorRef.current);
      sendMultiplayerSync(pawnsRef.current, turnIndex, playerDices, false, updatedRanks);
    } else {
      setActiveColors(remaining);
      const nextIdx = nextTurn();
      Alert.alert('Player Disqualified', `${getBaseDynamicLabel(eliminatedColor)} lost after 3 continuous misses.`);
      sendMultiplayerSync(pawnsRef.current, nextIdx, playerDices, false);
    }
  };

  const getStrategicMoveIndex = (color, diceVal, validMoves) => {
    if (validMoves.length === 1) return validMoves[0];

    const playerPawns = pawnsRef.current[color];

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

    const homeMove = validMoves.find((idx) => playerPawns[idx] + diceVal === 56);
    if (homeMove !== undefined) return homeMove;

    for (let idx of validMoves) {
      let step = playerPawns[idx];
      let targetStep = step === -1 ? 0 : step + diceVal;
      if (targetStep < 51) {
        let trackIdx = (START_INDEX[color] + targetStep) % 52;
        if (SAFE_INDEXES.includes(trackIdx)) return idx;
      }
    }

    if (diceVal === 6) {
      const basePawn = validMoves.find((idx) => playerPawns[idx] === -1);
      if (basePawn !== undefined) return basePawn;
    }

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

  const fetchCloudFriendList = async (myPlayerId) => {
    const pId = myPlayerId || currentUserRef.current?.playerId;
    if (!pId) return;

    try {
      const res = await fetch(`${SUPABASE_REST_URL}/ludo_friendships?or=(user_a.eq.${pId},user_b.eq.${pId})`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
      });
      const pairs = await res.json();
      if (pairs && Array.isArray(pairs)) {
        const friendIds = pairs.map(p => p.user_a === pId ? p.user_b : p.user_a);
        if (friendIds.length === 0) {
          setFriendsList([]);
          return;
        }
        
        const usersRes = await fetch(`${SUPABASE_REST_URL}/ludo_users?player_id=in.(${friendIds.join(',')})`, {
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const usersData = await usersRes.json();
        if (usersData && Array.isArray(usersData)) {
          const now = new Date().getTime();
          const list = usersData.map(u => {
            const lastSeenTime = u.last_seen ? new Date(u.last_seen).getTime() : 0;
            const isOnline = (now - lastSeenTime) < 25000;
            return {
              id: u.player_id,
              name: u.name,
              online: isOnline,
              avatar: u.avatar || '👦'
            };
          });
          setFriendsList(list);
        }
      }
    } catch (e) {}
  };

  const checkCloudFriendRequests = async () => {
    if (!currentUserRef.current) return;
    try {
      const res = await fetch(`${SUPABASE_REST_URL}/ludo_friend_requests?to_id=eq.${currentUserRef.current.playerId}&status=eq.PENDING`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
      });
      const data = await res.json();
      if (data && Array.isArray(data)) {
        const formatted = data.map(item => ({ id: item.from_id, name: item.from_name, reqRowId: item.id }));
        setPendingRequests(formatted);
      }
    } catch (e) {}
  };

  const checkCloudGameInvites = async () => {
    if (!currentUserRef.current) return;
    try {
      const res = await fetch(`${SUPABASE_REST_URL}/ludo_game_invites?to_id=eq.${currentUserRef.current.playerId}&status=eq.PENDING`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
      });
      const data = await res.json();
      if (data && Array.isArray(data) && data.length > 0) {
        setIncomingInvitesList(data);
        if (!incomingInvite && !onlineLobbyModal && !gameMode) {
          const latest = data[0];
          setIncomingInvite({
            inviteRowId: latest.id,
            fromName: latest.from_name,
            fromId: latest.from_id,
            roomCode: latest.room_code,
            playType: latest.play_type || 'SOLO',
            entryFee: latest.entry_fee || 50,
            targetColor: 'GREEN'
          });
        }
      } else {
        setIncomingInvitesList([]);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchCloudFriendList(currentUser.playerId);
    checkCloudFriendRequests();
    checkCloudGameInvites();

    const pollTimer = setInterval(() => {
      fetchCloudFriendList(currentUser.playerId);
      checkCloudFriendRequests();
      checkCloudGameInvites();
    }, 3000);

    return () => clearInterval(pollTimer);
  }, [currentUser, incomingInvite, onlineLobbyModal, gameMode]);

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
          to_id: targetUser.playerId || targetUser.id,
          status: 'PENDING'
        })
      });

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

      await fetch(`${SUPABASE_REST_URL}/ludo_friendships`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          user_a: currentUser.playerId,
          user_b: reqUser.id
        })
      });

      setPendingRequests(prev => prev.filter(r => r.id !== reqUser.id));
      fetchCloudFriendList(currentUser.playerId);
      Alert.alert('Success', `You are now mutual friends with ${reqUser.name}!`);
    } catch (e) {}
  };

  const sendFriendInvite = async (friend) => {
    const activeRoom = roomCode || Math.floor(100000 + Math.random() * 900000).toString();
    if (!roomCode) {
      setRoomCode(activeRoom);
      setMyColor('BLUE');
      setIsHost(true);
      setActiveColors(['BLUE', 'GREEN']);
      setPlayType(playType || 'SOLO');
      setRoomPlayers({ BLUE: { name: currentUser.name, id: currentUser.playerId, avatar: userAvatar } });
    }

    try {
      await fetch(`${SUPABASE_REST_URL}/ludo_game_invites`, {
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
          to_id: friend.id,
          room_code: activeRoom,
          play_type: playType || 'SOLO',
          entry_fee: selectedEntryFee || 50,
          status: 'PENDING'
        })
      });

      setFriendsModal(false);
      setOnlineLobbyModal(true);
      Alert.alert('Invite Sent! 🎮', `Match invitation sent to ${friend.name}. You are now in the Lobby!`);
    } catch (e) {
      Alert.alert('Invite Error', 'Could not send match invite. Try again.');
    }
  };

  const acceptInvite = async (inviteObj = null) => {
    const target = inviteObj || incomingInvite;
    if (!target) return;

    const { inviteRowId, roomCode: invitedRoom, playType: invitedType, fromName, fromId, entryFee = 50 } = target;

    const canJoin = await deductUserCoins(entryFee);
    if (!canJoin) return;

    if (inviteRowId) {
      try {
        await fetch(`${SUPABASE_REST_URL}/ludo_game_invites?id=eq.${inviteRowId}`, {
          method: 'DELETE',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
      } catch (e) {}
    }

    setRoomCode(invitedRoom);
    setMyColor('GREEN');
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
    } else {
      setActiveColors(['BLUE', 'GREEN']);
    }

    setFriendsModal(false);
    setIncomingInvite(null);
    setOnlineLobbyModal(true);
  };

  const declineInvite = async (inviteObj = null) => {
    const target = inviteObj || incomingInvite;
    if (target?.inviteRowId) {
      try {
        await fetch(`${SUPABASE_REST_URL}/ludo_game_invites?id=eq.${target.inviteRowId}`, {
          method: 'DELETE',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
      } catch (e) {}
    }
    setIncomingInvite(null);
    checkCloudGameInvites();
  };

  const startBotMatch = (count) => {
    let colors = ['BLUE', 'GREEN'];
    let pool = 100;

    if (count === 2) {
      colors = ['BLUE', 'GREEN'];
      pool = 100;
      setRoomPlayers({ BLUE: { name: currentUser.name }, GREEN: { name: 'Computer (Green)' } });
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

  const handleSlotTypeChange = (col, newType) => {
    const updatedSlots = { ...playerSlots, [col]: newType };
    const hasLocal = Object.values(updatedSlots).some(t => t === 'LOCAL');
    if (!hasLocal) {
      Alert.alert('Local Player Required', 'At least 1 player slot must remain set to Local to control your turn.');
      return;
    }
    setPlayerSlots(updatedSlots);
  };

  const startOnlineHost = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    setMyColor('BLUE');
    setIsHost(true);
    
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
      if (roomPlayers[colorKey] || (gameMode === 'HYBRID' && (playerSlots[colorKey] === 'BOT' || playerSlots[colorKey] === 'LOCAL'))) {
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

    Object.keys(roomPlayers).forEach((col) => {
      const p = roomPlayers[col];
      if (p && p.id && p.id !== currentUser.playerId) {
        recordRecentPlayer(p);
      }
    });

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
    setIsVoiceUnlocked(false);
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
    leaveAgoraVoiceChannel();
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

  useEffect(() => {
    if (!roomCode) return;

    const wsUrl = `wss://${SUPABASE_PROJECT_REF}.supabase.co/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;
    const socket = new WebSocket(wsUrl);
    ws.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({
        topic: `realtime:room_${roomCode}`,
        event: 'phx_join',
        payload: {},
        ref: 'room_join_ref'
      }));

      if (currentUserRef.current) {
        socket.send(JSON.stringify({
          topic: `realtime:room_${roomCode}`,
          event: 'broadcast',
          payload: {
            type: 'PLAYER_JOINED',
            data: { 
              color: myColorRef.current, 
              name: currentUserRef.current.name, 
              id: currentUserRef.current.playerId, 
              avatar: userAvatarRef.current 
            }
          },
          ref: 'p_join_ref'
        }));
      }
    };

    socket.onmessage = async (e) => {
      try {
        const message = JSON.parse(e.data);
        if (message.event === 'broadcast') {
          const type = message.payload?.type;
          const data = message.payload?.data;

          if (type === 'CHECK_ROOM_EXISTS') {
            if (myColorRef.current === 'BLUE' && currentUserRef.current) {
              socket.send(JSON.stringify({
                topic: `realtime:room_${roomCodeRef.current}`,
                event: 'broadcast',
                payload: {
                  type: 'ROOM_EXISTS_CONFIRMED',
                  data: {
                    hostName: currentUserRef.current.name,
                    hostAvatar: userAvatarRef.current,
                    activeColors: activeColorsRef.current,
                    playType: playTypeRef.current,
                    entryFee: selectedEntryFeeRef.current
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
            recordRecentPlayer({ id: data.id, name: data.name, avatar: data.avatar });
            if (myColorRef.current === 'BLUE' && currentUserRef.current) {
              socket.send(JSON.stringify({
                topic: `realtime:room_${roomCodeRef.current}`,
                event: 'broadcast',
                payload: {
                  type: 'ROSTER_UPDATE',
                  data: { color: 'BLUE', name: currentUserRef.current.name, id: currentUserRef.current.playerId, avatar: userAvatarRef.current }
                },
                ref: 'p_resp'
              }));
            }
          } else if (type === 'ROSTER_UPDATE') {
            setRoomPlayers(prev => ({ ...prev, [data.color]: { name: data.name, id: data.id, avatar: data.avatar } }));
            recordRecentPlayer({ id: data.id, name: data.name, avatar: data.avatar });
          } else if (type === 'START_MATCH') {
            if (myColorRef.current !== 'BLUE') {
              await deductUserCoins(data.entryFee || 50);
            }
            if (data.activeColors) setActiveColors(data.activeColors);
            if (data.playType) setPlayType(data.playType);
            if (data.prizePool) setMatchPrizePool(data.prizePool);
            if (data.syncedRoomPlayers) setRoomPlayers(data.syncedRoomPlayers);
            setOnlineLobbyModal(false);
            setGameMode('ONLINE');
          } else if (type === 'SYNC_GAME') {
            setOnlineLobbyModal(false);
            setGameMode((current) => current || 'ONLINE');
            setPawns(data.newPawns);
            setTurnIndex(data.nextTurnIdx);
            setPlayerDices(data.updatedDices);
            setHasRolled(data.rolled);
            if (data.syncedColors) setActiveColors(data.syncedColors);
            if (data.syncedPlayType) setPlayType(data.syncedPlayType);
            if (data.rankings) {
              setFinishedRankings(data.rankings);
              setShowPodiumBoard(true);
              if (data.rankings[0] === myColorRef.current) {
                addWinnerCoins(matchPrizePool);
              }
              updateUserGameStats(data.rankings[0] === myColorRef.current);
            }
          }
        }
      } catch (err) {}
    };

    return () => {
      socket.close();
    };
  }, [roomCode]);

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

    const hasWonMatch = updatedPawns[color].every((s) => s === 56);
    if (!currentFinished.includes(color) && hasWonMatch) {
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

      if (currentFinished[0] === myColorRef.current) {
        addWinnerCoins(matchPrizePool);
      }
      updateUserGameStats(currentFinished[0] === myColorRef.current);
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
    if (col === 'GREEN') return '#16a34a';
    if (col === 'YELLOW') return '#eab308';
    return '#2563eb';
  };

  const renderCell = (row, col) => {
    if (row < 6 && col < 6) return null;
    if (row < 6 && col > 8) return null;
    if (row > 8 && col < 6) return null;
    if (row > 8 && col > 8) return null;
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return null;

    let bgColor = '#ffffff';

    if (row === 7 && col >= 1 && col <= 5) { bgColor = '#ef4444'; } 
    if (col === 7 && row >= 1 && row <= 5) { bgColor = '#16a34a'; } 
    if (row === 7 && col >= 9 && col <= 13) { bgColor = '#eab308'; } 
    if (col === 7 && row >= 9 && row <= 13) { bgColor = '#2563eb'; } 

    if (row === 6 && col === 1) { bgColor = '#ef4444'; }
    if (row === 1 && col === 8) { bgColor = '#16a34a'; }
    if (row === 8 && col === 13) { bgColor = '#eab308'; }
    if (row === 13 && col === 6) { bgColor = '#2563eb'; }

    const isStar = (row === 2 && col === 6) ||
                   (row === 6 && col === 12) ||
                   (row === 12 && col === 8) ||
                   (row === 8 && col === 2);

    const isArrow = (row === 7 && col === 0) || (row === 0 && col === 7) || (row === 7 && col === 14) || (row === 14 && col === 7);

    let arrowIcon = '';
    let arrowColor = '#000000';
    if (row === 7 && col === 0) { arrowIcon = '➔'; arrowColor = '#ef4444'; }
    if (row === 0 && col === 7) { arrowIcon = '⬇'; arrowColor = '#16a34a'; }
    if (row === 7 && col === 14) { arrowIcon = '⬅'; arrowColor = '#eab308'; }
    if (row === 14 && col === 7) { arrowIcon = '⬆'; arrowColor = '#2563eb'; }

    return (
      <View key={`${row}-${col}`} style={[styles.cell, { left: col * CELL_SIZE, top: row * CELL_SIZE, backgroundColor: bgColor }]}>
        {isStar && (
          <Text style={[styles.starCleanText, shouldFlipBoard && { transform: [{ rotate: '180deg' }] }]}>☆</Text>
        )}
        {isArrow && (
          <Text style={[styles.arrowCleanText, { color: arrowColor }, shouldFlipBoard && { transform: [{ rotate: '180deg' }] }]}>{arrowIcon}</Text>
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
      if (color === myColor) return currentUser ? currentUser.name : 'You';
      if (color === 'BLUE') return 'You';
      if (color === 'GREEN') return selectedPlayerCount === 2 ? 'Computer' : 'Player 3';
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
      <View style={[styles.base, posStyle]}>
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

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0f2b5c" />
      
      <Image
        source={require('./lobby_bg.png')}
        style={styles.inGameBgCover}
        resizeMode="cover"
        blurRadius={12}
      />
      <View style={styles.inGameBackdropShade} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  royaleContainer: { flex: 1, backgroundColor: '#0a0f1d', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16 },
  dashboardContainer: { flex: 1, backgroundColor: '#0a0f1d', width: '100%', height: '100%' },
  lobbyBgImage: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  topHeaderOverlay: { position: 'absolute', top: 12, left: 8, right: 8, height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 30 },
  
  topLeftProfileWrap: { marginLeft: 34, paddingVertical: 2, justifyContent: 'center' },
  headerUserName: { color: '#ffffff', fontSize: 13, fontWeight: '900', maxWidth: 105, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  headerUserCoins: { color: '#facc15', fontSize: 11, fontWeight: '800', marginTop: 1, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  topRightBtnsWrap: { flexDirection: 'row', alignItems: 'center' },
  freeBonusBtn: { backgroundColor: '#10b981', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 4, marginRight: 4, borderWidth: 1, borderColor: '#6ee7b7' },
  freeBonusBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 10 },
  trophyTouchBtn: { backgroundColor: 'rgba(15, 23, 42, 0.85)', borderWidth: 1, borderColor: '#facc15', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 5, marginRight: 4 },
  settingTouchBtn: { backgroundColor: 'rgba(15, 23, 42, 0.85)', borderWidth: 1, borderColor: '#facc15', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 5, marginRight: 4 },
  settingBtnText: { fontSize: 13 },
  
  friendsTouchBtn: { backgroundColor: '#0284c7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: '#38bdf8', position: 'relative' },
  friendsBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 11 },
  
  friendNotificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    paddingHorizontal: 2,
    elevation: 6,
  },
  friendNotificationBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },

  tabRedDotIndicator: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#ef4444',
    marginLeft: 4,
  },
  
  podiumTouchLayer: { position: 'absolute', top: '35%', left: '4%', right: '4%', height: 360, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignContent: 'space-between', zIndex: 20 },
  podiumTouchSpot: { width: '47%', height: 165, borderRadius: 24 },
  
  squadTopHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 8 },
  squadMainTitle: { color: '#facc15', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  squadSubTitle: { color: '#94a3b8', fontSize: 11, fontWeight: '600', marginTop: 1 },
  squadCloseCrossBtn: { padding: 6, backgroundColor: '#1e293b', borderRadius: 14, borderWidth: 1, borderColor: '#334155' },
  squadCloseCrossText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },

  myIdPlankBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', backgroundColor: '#0a192f', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#38bdf8', marginTop: 10 },
  myIdPlankText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  copyIdPillBtn: { backgroundColor: '#0284c7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  copyIdPillText: { color: '#ffffff', fontWeight: 'bold', fontSize: 11 },

  topSquadSearchRow: { flexDirection: 'row', width: '100%', marginTop: 8 },
  topSquadSearchInput: { flex: 1, backgroundColor: '#0a0f1d', borderWidth: 1, borderColor: '#334155', borderRadius: 10, color: '#ffffff', paddingHorizontal: 12, paddingVertical: 8, fontSize: 12 },
  topSquadSearchBtn: { backgroundColor: '#eab308', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
  topSquadSearchBtnText: { color: '#000000', fontWeight: '900', fontSize: 12 },

  searchedPlayerCardBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', backgroundColor: '#0a0f1d', padding: 10, borderRadius: 12, marginTop: 8, borderWidth: 1.5, borderColor: '#facc15' },
  addFriendActionBtn: { backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addFriendActionText: { color: '#ffffff', fontWeight: '900', fontSize: 11 },

  cleanTabsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10, backgroundColor: '#0a0f1d', padding: 3, borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  cleanTabPill: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 8 },
  cleanTabPillActive: { backgroundColor: '#0284c7' },
  cleanTabText: { color: '#94a3b8', fontSize: 10, fontWeight: '700' },
  cleanTabTextActive: { color: '#ffffff', fontWeight: '900' },

  squadTabScrollFeed: { maxHeight: 220, width: '100%', marginTop: 8 },
  squadEmptyStateText: { color: '#94a3b8', textAlign: 'center', fontSize: 12, marginTop: 24, paddingHorizontal: 16 },
  friendItemCardWrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0a0f1d', padding: 10, borderRadius: 12, marginVertical: 4, borderWidth: 1, borderColor: '#1e293b' },
  avatarWithRingBox: { position: 'relative', width: 34, height: 34, borderRadius: 17, backgroundColor: '#1e3a8a', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#38bdf8' },
  onlineIndicatorDot: { position: 'absolute', bottom: -2, right: -2, width: 9, height: 9, borderRadius: 4.5, borderWidth: 1.5, borderColor: '#0a0f1d' },
  friendCardNameText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  friendCardSubText: { color: '#94a3b8', fontSize: 10, marginTop: 1 },
  inviteFriendActionBtn: { backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  inviteFriendActionText: { color: '#ffffff', fontWeight: 'bold', fontSize: 11 },

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
  leaderboardListWrap: { width: '100%', maxHeight: 240, marginVertical: 6 },
  leaderboardRowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0a0f1d', borderRadius: 12, padding: 10, marginVertical: 4, borderWidth: 1.5, borderColor: '#334155' },
  leaderboardHostRow: { borderColor: '#facc15', backgroundColor: '#1e293b' },
  rankBadgeText: { fontSize: 14, fontWeight: '900', color: '#ffffff', width: 45 },
  rankPlayerName: { fontSize: 13, fontWeight: 'bold', flex: 1, marginLeft: 6 },
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
  slotBoxFilledBlue: { backgroundColor: '#1e3a8a', borderColor: '#38bdf8', borderStyle: 'solid' },
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
  tabToggleText: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold' },
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
  tokenWrapper: { position: 'absolute', width: CELL_SIZE, height: CELL_SIZE, justifyContent: 'center', alignItems: 'center' },
});
