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
  Modal
} from 'react-native';
import { Audio } from 'expo-av';

const SUPABASE_PROJECT_REF = 'zyqlntdpftowobsrzbgv'; 
const SUPABASE_ANON_KEY = 'sb_publishable_DuyB_EEKvMkDk0QFxQykqg_ZXCMzTwo';
const SUPABASE_REST_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co/rest/v1`;

const { width } = Dimensions.get('window');
const BOARD_SIZE = Math.min(width - 24, 380);
const CELL_SIZE = BOARD_SIZE / 15;

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const playSound = async (type) => {
  try {
    let soundAsset;
    if (type === 'dice') soundAsset = require('./assets/sounds/dice.mp3');
    else if (type === 'move') soundAsset = require('./assets/sounds/move.mp3');
    else if (type === 'cut') soundAsset = require('./assets/sounds/cut.mp3');
    else if (type === 'win') soundAsset = require('./assets/sounds/win.mp3');

    if (soundAsset) {
      const { sound } = await Audio.Sound.createAsync(soundAsset);
      await sound.playAsync();
    }
  } catch (error) {}
};

const DiceFace = ({ value }) => {
  const dot = <View style={styles.diceDot} />;
  const empty = <View style={[styles.diceDot, { opacity: 0 }]} />;

  const getDots = () => {
    switch (value) {
      case 1: return <View style={styles.diceCenter}>{dot}</View>;
      case 2: return <View style={styles.diceRowSpace}><View style={styles.diceCol}>{dot}{empty}</View><View style={styles.diceCol}>{empty}{dot}</View></View>;
      case 3: return <View style={styles.diceRowSpace}><View style={styles.diceCol}>{dot}{empty}{empty}</View><View style={styles.diceCol}>{empty}{dot}{empty}</View><View style={styles.diceCol}>{empty}{empty}{dot}</View></View>;
      case 4: return <View style={styles.diceRowSpace}><View style={styles.diceCol}>{dot}{dot}</View><View style={styles.diceCol}>{dot}{dot}</View></View>;
      case 5: return <View style={styles.diceRowSpace}><View style={styles.diceCol}>{dot}{empty}{dot}</View><View style={styles.diceCol}>{empty}{dot}{empty}</View><View style={styles.diceCol}>{dot}{empty}{dot}</View></View>;
      case 6: return <View style={styles.diceRowSpace}><View style={styles.diceCol}>{dot}{dot}{dot}</View><View style={styles.diceCol}>{dot}{dot}{dot}</View></View>;
      default: return <View style={styles.diceCenter}>{dot}</View>;
    }
  };

  return <View style={styles.diceBox}>{getDots()}</View>;
};

const PinToken = ({ colorHex, shadowColor }) => (
  <View style={styles.pinWrapper}>
    <View style={[styles.pinHead, { backgroundColor: colorHex, shadowColor: shadowColor }]}>
      <View style={styles.pinInnerGlow} />
      <View style={styles.pinCenterDot} />
    </View>
    <View style={[styles.pinPointer, { borderTopColor: colorHex }]} />
  </View>
);

const ActiveTurnArrow = ({ bounceAnim, isTopRow }) => (
  <Animated.View
    style={[
      styles.floatingArrowContainer,
      isTopRow ? styles.arrowTopPos : styles.arrowBottomPos,
      { transform: [{ translateY: bounceAnim }] }
    ]}
  >
    <View style={styles.arrowIconBubble}>
      <Text style={styles.arrowIconText}>{isTopRow ? '▼' : '▲'}</Text>
    </View>
  </Animated.View>
);
export default function App() {
  // Permanent Auth State
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('LOGIN'); // 'LOGIN' | 'SIGNUP'
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');

  // Friends & Invite System
  const [friendsModal, setFriendsModal] = useState(false);
  const [friendsList, setFriendsList] = useState([
    { id: '101', name: 'Rohan_Gamer', online: true },
    { id: '102', name: 'Amit_Pro', online: true },
    { id: '103', name: 'Vanya_Player', online: false },
  ]);
  const [newFriendInput, setNewFriendInput] = useState('');
  const [incomingInvite, setIncomingInvite] = useState(null);

  // Gameplay Setup
  const [gameMode, setGameMode] = useState(null); 
  const [passPlayModal, setPassPlayModal] = useState(false);
  const [hybridTeamModal, setHybridTeamModal] = useState(false);
  const [onlineScreen, setOnlineScreen] = useState(false);
  
  const [playType, setPlayType] = useState('SOLO');
  const [selectedPlayerCount, setSelectedPlayerCount] = useState(2);
  const [onlinePlayerCount, setOnlinePlayerCount] = useState(2);
  const [friendlyKill, setFriendlyKill] = useState(false);
  const [activeColors, setActiveColors] = useState(['BLUE', 'GREEN']);

  const [playerSlots, setPlayerSlots] = useState({
    BLUE: 'LOCAL',
    GREEN: 'ONLINE',
    RED: 'LOCAL',
    YELLOW: 'BOT',
  });

  const [roomCode, setRoomCode] = useState('');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [myColor, setMyColor] = useState('BLUE');

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
  const [winner, setWinner] = useState(null);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const diceBounceAnim = useRef(new Animated.Value(1)).current;
  const arrowBounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowBounceAnim, {
          toValue: -8,
          duration: 400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(arrowBounceAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

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
  const currentTurn = activeColors[turnIndex] || activeColors[0];

  // Permanent Auth Handlers
  const handleAuthSubmit = () => {
    if (!emailInput.trim() || !passwordInput.trim()) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    if (authMode === 'SIGNUP') {
      if (!usernameInput.trim()) {
        Alert.alert('Error', 'Please choose a username.');
        return;
      }
      const newUser = {
        name: usernameInput.trim(),
        email: emailInput.trim(),
        coins: 2000,
        playerId: Math.floor(10000 + Math.random() * 90000).toString()
      };
      setCurrentUser(newUser);
      Alert.alert('Success', 'Account created permanently! You can use this email & password on any device.');
    } else {
      // Mock Login lookup
      const user = {
        name: emailInput.split('@')[0] || 'LudoMaster',
        email: emailInput.trim(),
        coins: 2500,
        playerId: '77892'
      };
      setCurrentUser(user);
    }
  };

  const handleGuestLogin = () => {
    const guestId = Math.floor(1000 + Math.random() * 9000);
    setCurrentUser({ name: `Guest_${guestId}`, email: `guest_${guestId}@ludo.app`, coins: 500, playerId: guestId.toString() });
  };

  // User WebSocket for Direct Live Friend Invites
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
        if (msg.event === 'broadcast' && msg.payload?.type === 'GAME_INVITE') {
          setIncomingInvite(msg.payload.data);
        }
      } catch (err) {}
    };

    return () => {
      if (userWs.current) userWs.current.close();
    };
  }, [currentUser]);

  const sendFriendInvite = (friend) => {
    if (userWs.current && userWs.current.readyState === WebSocket.OPEN) {
      const generatedRoom = Math.floor(1000 + Math.random() * 9000).toString();
      userWs.current.send(JSON.stringify({
        topic: `realtime:user_${friend.id}`,
        event: 'broadcast',
        payload: {
          type: 'GAME_INVITE',
          data: {
            fromName: currentUser.name,
            fromId: currentUser.playerId,
            roomCode: generatedRoom,
          }
        },
        ref: 'inv_1'
      }));
      setRoomCode(generatedRoom);
      setMyColor('BLUE');
      setActiveColors(['BLUE', 'GREEN']);
      setGameMode('ONLINE');
      setFriendsModal(false);
      Alert.alert('Invite Sent!', `Invite notification sent to ${friend.name}. Waiting for them to join...`);
    } else {
      Alert.alert('Offline', 'Connecting to network server...');
    }
  };

  const acceptInvite = () => {
    if (!incomingInvite) return;
    setRoomCode(incomingInvite.roomCode);
    setMyColor('GREEN');
    setActiveColors(['BLUE', 'GREEN']);
    setGameMode('ONLINE');
    setIncomingInvite(null);
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
    setWinner(null);
    setGameMode(null);
    setPassPlayModal(false);
    setHybridTeamModal(false);
    setOnlineScreen(false);
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

  // Match Game Sync
  useEffect(() => {
    if ((gameMode !== 'ONLINE' && gameMode !== 'HYBRID') || !roomCode) return;
    const wsUrl = `wss://${SUPABASE_PROJECT_REF}.supabase.co/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({
        topic: `realtime:room_${roomCode}`,
        event: 'phx_join',
        payload: {},
        ref: '1'
      }));
    };

    ws.current.onmessage = (e) => {
      try {
        const message = JSON.parse(e.data);
        if (message.event === 'broadcast' && message.payload?.type === 'SYNC_GAME') {
          const { newPawns, nextTurnIdx, updatedDices, rolled, winPlayer, syncedColors } = message.payload.data;
          setPawns(newPawns);
          setTurnIndex(nextTurnIdx);
          setPlayerDices(updatedDices);
          setHasRolled(rolled);
          if (syncedColors) setActiveColors(syncedColors);
          if (winPlayer) setWinner(winPlayer);
        }
      } catch (err) {}
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [gameMode, roomCode]);

  const sendMultiplayerSync = (newPawns, nextTurnIdx, updatedDices, rolled, winPlayer = null) => {
    if ((gameMode === 'ONLINE' || gameMode === 'HYBRID') && ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        topic: `realtime:room_${roomCode}`,
        event: 'broadcast',
        payload: {
          type: 'SYNC_GAME',
          data: { newPawns, nextTurnIdx, updatedDices, rolled, winPlayer, syncedColors: activeColors }
        },
        ref: '2'
      }));
    }
  };

  useEffect(() => {
    const isBotTurn = (gameMode === 'BOT' && currentTurn !== 'BLUE') || 
                     (gameMode === 'HYBRID' && playerSlots[currentTurn] === 'BOT');

    if (isBotTurn && !hasRolled && !isRolling && !isMoving && !winner) {
      const botTimer = setTimeout(() => rollDice(true), 800);
      return () => clearTimeout(botTimer);
    }
  }, [turnIndex, hasRolled, isMoving, gameMode, winner, currentTurn, playerSlots]);

  const nextTurn = (currentIdx = turnIndex) => {
    const nextIdx = (currentIdx + 1) % activeColors.length;
    setTurnIndex(nextIdx);
    setHasRolled(false);
    setIsMoving(false);
    return nextIdx;
  };

  const getValidMoves = (color, diceVal) => {
    const playerPawns = pawnsRef.current[color];
    const validIndexes = [];
    playerPawns.forEach((stepCount, idx) => {
      if (stepCount === -1 && diceVal === 6) validIndexes.push(idx);
      else if (stepCount >= 0 && stepCount + diceVal <= 56) validIndexes.push(idx);
    });
    return validIndexes;
  };

  const rollDice = async (isBot = false) => {
    if (hasRolled || isMoving || isRolling || winner) return;

    if (gameMode === 'ONLINE' && currentTurn !== myColor) return;
    if (gameMode === 'HYBRID' && playerSlots[currentTurn] === 'ONLINE' && currentTurn !== myColor) return;

    setIsRolling(true);
    playSound('dice');

    spinAnim.setValue(0);
    diceBounceAnim.setValue(1);

    Animated.parallel([
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(diceBounceAnim, { toValue: 1.2, duration: 250, useNativeDriver: true }),
        Animated.timing(diceBounceAnim, { toValue: 0.9, duration: 250, useNativeDriver: true }),
        Animated.timing(diceBounceAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ])
    ]).start();

    const shuffleDelays = [80, 90, 110, 140, 180, 220];
    for (let delay of shuffleDelays) {
      const rand = Math.floor(Math.random() * 6) + 1;
      setPlayerDices(prev => ({ ...prev, [currentTurn]: rand }));
      await sleep(delay);
    }

    const finalVal = Math.floor(Math.random() * 6) + 1;
    const newDices = { ...playerDices, [currentTurn]: finalVal };
    setPlayerDices(newDices);
    setIsRolling(false);
    setHasRolled(true);

    const validMoves = getValidMoves(currentTurn, finalVal);

    if (validMoves.length === 0) {
      setTimeout(() => {
        const nextIdx = nextTurn();
        sendMultiplayerSync(pawnsRef.current, nextIdx, newDices, false);
      }, 700);
    } else if (validMoves.length === 1 || (gameMode === 'BOT' && currentTurn !== 'BLUE') || (gameMode === 'HYBRID' && playerSlots[currentTurn] === 'BOT')) {
      setTimeout(() => executeStepMovement(currentTurn, validMoves[0], finalVal, newDices), 450);
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
      await sleep(280);
    }

    finalizeMove(color, index, currentStep, diceVal, currentPawnsState, currentDices);
  };

  const finalizeMove = (color, index, finalStep, diceVal, finalState, currentDices) => {
    let updatedPawns = JSON.parse(JSON.stringify(finalState));
    let extraTurn = diceVal === 6;

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

    let winPlayer = null;
    if (playType === 'TEAM') {
      const partnerColor = color === 'BLUE' ? 'GREEN' : color === 'GREEN' ? 'BLUE' : color === 'RED' ? 'YELLOW' : 'RED';
      const myHome = updatedPawns[color].every(s => s === 56);
      const partnerHome = updatedPawns[partnerColor].every(s => s === 56);

      if (myHome && partnerHome) {
        playSound('win');
        winPlayer = color === 'BLUE' || color === 'GREEN' ? 'TEAM A (Blue & Green)' : 'TEAM B (Red & Yellow)';
        setWinner(winPlayer);
        Alert.alert('TEAM VICTORY!', `${winPlayer} won the match!`);
      }
    } else {
      if (updatedPawns[color].every((s) => s === 56)) {
        playSound('win');
        winPlayer = color;
        setWinner(color);
        Alert.alert('VICTORY!', `${color} has won the match!`);
      }
    }

    setPawns(updatedPawns);
    setIsMoving(false);

    if (extraTurn && !winPlayer) {
      setHasRolled(false);
      sendMultiplayerSync(updatedPawns, turnIndex, currentDices, false, winPlayer);
    } else {
      const nextIdx = nextTurn();
      sendMultiplayerSync(updatedPawns, nextIdx, currentDices, false, winPlayer);
    }
  };

  const getPawnScreenCoords = (color, stepCount, idx) => {
    if (stepCount === -1) return BASE_SPOTS[color][idx];
    if (stepCount === 56) return [7, 7];
    if (stepCount >= 51) return HOME_PATHS[color][stepCount - 51];
    return TRACK_COORDINATES[(START_INDEX[color] + stepCount) % 52];
  };

  const getTurnColorHex = (col) => {
    if (col === 'RED') return '#e11d48';
    if (col === 'GREEN') return '#16a34a';
    if (col === 'YELLOW') return '#eab308';
    return '#0284c7';
  };

  const renderCell = (row, col) => {
    if (row < 6 && col < 6) return null;
    if (row < 6 && col > 8) return null;
    if (row > 8 && col < 6) return null;
    if (row > 8 && col > 8) return null;
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return null;

    let bgColor = '#ffffff';
    if (row === 7 && col >= 1 && col <= 5) bgColor = '#e11d48';
    if (col === 7 && row >= 1 && row <= 5) bgColor = '#16a34a';
    if (row === 7 && col >= 9 && col <= 13) bgColor = '#facc15';
    if (col === 7 && row >= 9 && row <= 13) bgColor = '#38bdf8';
    if (row === 6 && col === 1) bgColor = '#e11d48';
    if (row === 1 && col === 8) bgColor = '#16a34a';
    if (row === 8 && col === 13) bgColor = '#facc15';
    if (row === 13 && col === 6) bgColor = '#38bdf8';

    const isStar = (row === 2 && col === 6) ||
                   (row === 6 && col === 12) ||
                   (row === 12 && col === 8) ||
                   (row === 8 && col === 2);

    const isArrow = (row === 7 && col === 0) || (row === 0 && col === 7) || (row === 7 && col === 14) || (row === 14 && col === 7);

    let arrowIcon = '';
    if (row === 7 && col === 0) arrowIcon = '→';
    if (row === 0 && col === 7) arrowIcon = '↓';
    if (row === 7 && col === 14) arrowIcon = '←';
    if (row === 14 && col === 7) arrowIcon = '↑';

    return (
      <View key={`${row}-${col}`} style={[styles.cell, { left: col * CELL_SIZE, top: row * CELL_SIZE, backgroundColor: bgColor }]}>
        {isStar && <Text style={styles.starText}>☆</Text>}
        {isArrow && <Text style={styles.arrowText}>{arrowIcon}</Text>}
      </View>
    );
  };

  const renderBase = (color, posStyle, label, isVertical) => {
    const isPlayable = activeColors.includes(color);
    return (
      <View style={[styles.base, posStyle, !isPlayable && { opacity: 0.35 }]}>
        <View style={styles.baseInnerWhite}>
          <View style={styles.pocketRow}>
            <View style={[styles.basePocket, { borderColor: getTurnColorHex(color) }]} />
            <View style={[styles.basePocket, { borderColor: getTurnColorHex(color) }]} />
          </View>
          <View style={styles.pocketRow}>
            <View style={[styles.basePocket, { borderColor: getTurnColorHex(color) }]} />
            <View style={[styles.basePocket, { borderColor: getTurnColorHex(color) }]} />
          </View>
        </View>
        <Text style={[styles.playerLabel, isVertical ? styles.playerLabelRotated : styles.playerLabelHorizontal]}>{label}</Text>
      </View>
    );
  };

  const renderPlayerTokens = (color, colorHex, shadowColor) => {
    if (!activeColors.includes(color)) return null;
    return pawns[color].map((stepCount, idx) => {
      const coords = getPawnScreenCoords(color, stepCount, idx);
      const isMyTurn = currentTurn === color;

      return (
        <TouchableOpacity
          key={`${color}-${idx}`}
          disabled={!hasRolled || !isMyTurn || isMoving}
          onPress={() => executeStepMovement(color, idx, playerDices[color])}
          style={[
            styles.tokenWrapper,
            { left: coords[1] * CELL_SIZE, top: coords[0] * CELL_SIZE - 6 },
            stepCount === 56 && { opacity: 0.3 }
          ]}
        >
          <PinToken colorHex={colorHex} shadowColor={shadowColor} />
        </TouchableOpacity>
      );
    });
  };

  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  const renderPlayerCard = (color, pinHex, shadowHex, isLeftDice = false, isTopRow = true) => {
    const isPlayable = activeColors.includes(color);
    if (!isPlayable) return <View style={{ width: '45%' }} />;

    const isCurrent = currentTurn === color;
    const slotType = playerSlots[color];
    const badgeText = gameMode === 'HYBRID' ? (slotType === 'LOCAL' ? '📱 Local' : slotType === 'ONLINE' ? '🌐 Online' : '🤖 Bot') : '';

    return (
      <View style={styles.cardContainerWrapper}>
        {isCurrent && <ActiveTurnArrow bounceAnim={arrowBounceAnim} isTopRow={isTopRow} />}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => isCurrent && rollDice()}
          style={[styles.playerCard, isCurrent && styles.activeCardGlow]}
        >
          {isLeftDice ? (
            <>
              <Animated.View style={[styles.cardDiceWrap, isCurrent && { transform: [{ rotate: spinInterpolation }, { scale: diceBounceAnim }] }]}>
                <DiceFace value={playerDices[color]} />
              </Animated.View>
              <View style={styles.cardAvatarRight}>
                <PinToken colorHex={pinHex} shadowColor={shadowHex} />
                {badgeText !== '' && <Text style={styles.slotSmallBadge}>{badgeText}</Text>}
              </View>
            </>
          ) : (
            <>
              <View style={styles.cardAvatarLeft}>
                <PinToken colorHex={pinHex} shadowColor={shadowHex} />
                {badgeText !== '' && <Text style={styles.slotSmallBadge}>{badgeText}</Text>}
              </View>
              <Animated.View style={[styles.cardDiceWrap, isCurrent && { transform: [{ rotate: spinInterpolation }, { scale: diceBounceAnim }] }]}>
                <DiceFace value={playerDices[color]} />
              </Animated.View>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };
  // 1. PERMANENT LOGIN / SIGNUP SCREEN
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.royaleContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f1d" />

        <View style={styles.brandHero}>
          <Text style={styles.crownEmoji}>👑</Text>
          <Text style={styles.brandGoldTitle}>LUDO SUPREME</Text>
          <View style={styles.goldPillBadge}>
            <Text style={styles.goldPillText}>★ CLOUD AUTH & REALTIME ★</Text>
          </View>
        </View>

        <View style={styles.glassCard}>
          <View style={styles.tabToggleRow}>
            <TouchableOpacity 
              style={[styles.tabToggleBtn, authMode === 'LOGIN' && styles.tabToggleActive]}
              onPress={() => setAuthMode('LOGIN')}
            >
              <Text style={[styles.tabToggleText, authMode === 'LOGIN' && styles.tabToggleTextActive]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabToggleBtn, authMode === 'SIGNUP' && styles.tabToggleActive]}
              onPress={() => setAuthMode('SIGNUP')}
            >
              <Text style={[styles.tabToggleText, authMode === 'SIGNUP' && styles.tabToggleTextActive]}>Create Account</Text>
            </TouchableOpacity>
          </View>

          {authMode === 'SIGNUP' && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.inputLabel}>CHOOSE USERNAME</Text>
              <TextInput
                style={styles.gameTextInput}
                placeholder="e.g. MasterRajeev"
                placeholderTextColor="#64748b"
                value={usernameInput}
                onChangeText={setUsernameInput}
              />
            </View>
          )}

          <View style={{ marginTop: 10 }}>
            <Text style={styles.inputLabel}>EMAIL / USER ID</Text>
            <TextInput
              style={styles.gameTextInput}
              placeholder="name@gmail.com"
              placeholderTextColor="#64748b"
              keyboardType="email-address"
              autoCapitalize="none"
              value={emailInput}
              onChangeText={setEmailInput}
            />
          </View>

          <View style={{ marginTop: 10 }}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <TextInput
              style={styles.gameTextInput}
              placeholder="••••••••"
              placeholderTextColor="#64748b"
              secureTextEntry
              value={passwordInput}
              onChangeText={setPasswordInput}
            />
          </View>

          <TouchableOpacity 
            activeOpacity={0.85}
            style={[styles.gold3DButton, { marginTop: 16 }]}
            onPress={handleAuthSubmit}
          >
            <Text style={styles.gold3DButtonText}>
              {authMode === 'LOGIN' ? 'LOGIN TO ACCOUNT  ➔' : 'SIGN UP PERMANENTLY  ➔'}
            </Text>
          </TouchableOpacity>

          <View style={styles.orDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            activeOpacity={0.85}
            style={styles.darkSecondaryButton}
            onPress={handleGuestLogin}
          >
            <Text style={styles.darkSecondaryButtonText}>⚡ Quick Guest Play</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 2. IN-GAME FRIENDS & LIVE INVITE MODAL
  if (friendsModal) {
    return (
      <SafeAreaView style={styles.royaleContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f1d" />
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}>
          <View style={styles.brandHero}>
            <Text style={styles.crownEmoji}>👥</Text>
            <Text style={styles.brandGoldTitle}>FRIENDS SQUAD</Text>
            <Text style={styles.lobbySubtitle}>Invite Friends Directly (No WhatsApp Needed)</Text>
          </View>

          <View style={[styles.glassCard, { marginTop: 12 }]}>
            {/* Add Friend Input */}
            <Text style={styles.inputLabel}>ADD NEW FRIEND BY ID:</Text>
            <View style={{ flexDirection: 'row' }}>
              <TextInput
                style={[styles.gameTextInput, { flex: 1 }]}
                placeholder="Enter Player ID / Email"
                placeholderTextColor="#64748b"
                value={newFriendInput}
                onChangeText={setNewFriendInput}
              />
              <TouchableOpacity 
                style={[styles.gold3DButton, { marginLeft: 8, paddingHorizontal: 14 }]}
                onPress={() => {
                  if (newFriendInput.trim()) {
                    setFriendsList([...friendsList, { id: Math.random().toString(), name: newFriendInput.trim(), online: true }]);
                    setNewFriendInput('');
                    Alert.alert('Friend Added!', 'Friend added to your list.');
                  }
                }}
              >
                <Text style={styles.gold3DButtonText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.orDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>ONLINE FRIENDS</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Friend List */}
            {friendsList.map((friend) => (
              <View key={friend.id} style={styles.friendCardRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.onlineDot, { backgroundColor: friend.online ? '#10b981' : '#64748b' }]} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.friendNameText}>{friend.name}</Text>
                    <Text style={styles.friendStatusText}>{friend.online ? 'Online' : 'Offline'}</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  disabled={!friend.online}
                  style={[styles.invitePillBtn, !friend.online && { opacity: 0.4 }]}
                  onPress={() => sendFriendInvite(friend)}
                >
                  <Text style={styles.invitePillBtnText}>🎮 Invite</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity 
              activeOpacity={0.85}
              style={[styles.darkSecondaryButton, { marginTop: 14 }]}
              onPress={() => setFriendsModal(false)}
            >
              <Text style={styles.darkSecondaryButtonText}>⬅ Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 3. MAIN DASHBOARD
  if (!gameMode) {
    return (
      <SafeAreaView style={styles.royaleContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0f1d" />

        {/* Incoming Invite Notification Modal */}
        {incomingInvite && (
          <Modal transparent animationType="fade" visible={!!incomingInvite}>
            <View style={styles.inviteModalOverlay}>
              <View style={styles.glassCard}>
                <Text style={styles.cardHeading}>🎮 LIVE GAME INVITE!</Text>
                <Text style={styles.invitePromptText}>
                  <Text style={{ fontWeight: 'bold', color: '#facc15' }}>{incomingInvite.fromName}</Text> invited you to play a match!
                </Text>

                <TouchableOpacity style={styles.gold3DButton} onPress={acceptInvite}>
                  <Text style={styles.gold3DButtonText}>ACCEPT & PLAY NOW ➔</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.darkSecondaryButton, { marginTop: 8 }]} 
                  onPress={() => setIncomingInvite(null)}
                >
                  <Text style={styles.darkSecondaryButtonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* Profile Card */}
        <View style={styles.topProfileHeader}>
          <View style={styles.profileLeftGroup}>
            <View style={styles.profileAvatarGlow}>
              <Text style={styles.profileAvatarIcon}>👑</Text>
            </View>
            <View>
              <Text style={styles.profileUserName}>{currentUser.name}</Text>
              <View style={styles.coinBadge}>
                <Text style={styles.coinIcon}>🪙</Text>
                <Text style={styles.coinAmount}>{currentUser.coins.toLocaleString()} Coins</Text>
              </View>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity style={styles.friendHeaderBtn} onPress={() => setFriendsModal(true)}>
              <Text style={styles.friendHeaderBtnText}>👥 Friends</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutPill} onPress={() => { setCurrentUser(null); resetGame(); }}>
              <Text style={styles.logoutPillText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.lobbyCenterTitle}>
          <Text style={styles.brandGoldTitle}>🎲 LUDO SUPREME 🎲</Text>
          <Text style={styles.lobbySubtitle}>ID: {currentUser.playerId || '7890'} | Choose Arena</Text>
        </View>

        <View style={styles.gridContainer}>
          <TouchableOpacity 
            activeOpacity={0.85}
            style={[styles.gridTile, { borderColor: '#38bdf8', backgroundColor: '#075985' }]}
            onPress={() => {
              setActiveColors(['BLUE', 'RED', 'GREEN', 'YELLOW']);
              setPlayType('SOLO');
              setGameMode('BOT');
            }}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: '#0284c7' }]}>
              <Text style={styles.tileEmoji}>🤖</Text>
            </View>
            <Text style={styles.tileTitle}>Vs Computer</Text>
            <Text style={styles.tileSub}>Practice Bot</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.85}
            style={[styles.gridTile, { borderColor: '#4ade80', backgroundColor: '#166534' }]}
            onPress={() => setPassPlayModal(true)}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: '#15803d' }]}>
              <Text style={styles.tileEmoji}>👥</Text>
            </View>
            <Text style={styles.tileTitle}>Pass & Play</Text>
            <Text style={styles.tileSub}>2 - 4 Players</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.85}
            style={[styles.gridTile, { borderColor: '#facc15', backgroundColor: '#854d0e' }]}
            onPress={() => setHybridTeamModal(true)}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: '#ca8a04' }]}>
              <Text style={styles.tileEmoji}>🤝</Text>
            </View>
            <Text style={styles.tileTitle}>Team Up (A vs B)</Text>
            <Text style={styles.tileSub}>Online + Offline</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.85}
            style={[styles.gridTile, { borderColor: '#c084fc', backgroundColor: '#6b21a8' }]}
            onPress={() => setFriendsModal(true)}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: '#7e22ce' }]}>
              <Text style={styles.tileEmoji}>🌐</Text>
            </View>
            <Text style={styles.tileTitle}>Invite Friends</Text>
            <Text style={styles.tileSub}>Direct Match</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomFooterPill}>
          <Text style={styles.footerPillText}>★ PERMANENT ACCOUNT • CLOUD BACKUP ★</Text>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      <View style={styles.patternBg} />

      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.exitBtn} onPress={handleExitGame}>
          <Text style={styles.exitBtnText}>✕ Exit</Text>
        </TouchableOpacity>
        
        <View style={styles.playerInfoTop}>
          <Text style={styles.playerInfoTopText}>
            {gameMode === 'HYBRID' ? '⚡ TEAM A vs TEAM B' : playType === 'TEAM' ? '🤝 TEAM MODE' : `👑 ${currentUser.name}`}
          </Text>
        </View>

        {(gameMode === 'ONLINE' || gameMode === 'HYBRID') && (
          <View style={styles.roomTag}>
            <Text style={styles.roomTagText}>Room: {roomCode}</Text>
          </View>
        )}
      </View>

      <View style={styles.topCardsRow}>
        {renderPlayerCard('RED', '#e11d48', '#991b1b', false, true)}
        {renderPlayerCard('GREEN', '#16a34a', '#14532d', true, true)}
      </View>

      <View style={styles.boardContainer}>
        <View style={styles.board}>
          {renderBase('RED', styles.redBase, 'Player 2', true)}
          {renderBase('GREEN', styles.greenBase, 'Player 3', false)}
          {renderBase('BLUE', styles.blueBase, currentUser.name, false)}
          {renderBase('YELLOW', styles.yellowBase, 'Player 4', false)}

          <View style={styles.centerHome}>
            <View style={styles.triRed} />
            <View style={styles.triGreen} />
            <View style={styles.triYellow} />
            <View style={styles.triBlue} />
          </View>

          {Array.from({ length: 15 }).map((_, r) =>
            Array.from({ length: 15 }).map((_, c) => renderCell(r, c))
          )}

          {renderPlayerTokens('RED', '#e11d48', '#991b1b')}
          {renderPlayerTokens('GREEN', '#16a34a', '#14532d')}
          {renderPlayerTokens('YELLOW', '#eab308', '#a16207')}
          {renderPlayerTokens('BLUE', '#0284c7', '#0369a1')}
        </View>
      </View>

      <View style={styles.bottomCardsRow}>
        {renderPlayerCard('BLUE', '#0284c7', '#0369a1', false, false)}
        {renderPlayerCard('YELLOW', '#eab308', '#a16207', true, false)}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  royaleContainer: {
    flex: 1,
    backgroundColor: '#0a0f1d',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  brandHero: {
    alignItems: 'center',
    marginTop: 6,
  },
  crownEmoji: {
    fontSize: 38,
    marginBottom: 2,
  },
  brandGoldTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#facc15',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  goldPillBadge: {
    backgroundColor: '#78350f',
    borderColor: '#facc15',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginTop: 4,
  },
  goldPillText: {
    color: '#fef08a',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  glassCard: {
    width: '100%',
    backgroundColor: '#131c31',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  gameTextInput: {
    backgroundColor: '#0a0f1d',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 12,
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  gold3DButton: {
    backgroundColor: '#eab308',
    borderColor: '#fef08a',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#facc15',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  gold3DButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  orText: {
    color: '#64748b',
    paddingHorizontal: 12,
    fontSize: 11,
    fontWeight: 'bold',
  },
  darkSecondaryButton: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  darkSecondaryButtonText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '700',
  },
  topProfileHeader: {
    width: '100%',
    backgroundColor: '#131c31',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  profileLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatarGlow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#facc15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileAvatarIcon: {
    fontSize: 22,
  },
  profileUserName: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  coinIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  coinAmount: {
    color: '#facc15',
    fontWeight: '800',
    fontSize: 13,
  },
  friendHeaderBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
  },
  friendHeaderBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutPill: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lobbyCenterTitle: {
    alignItems: 'center',
    marginVertical: 6,
  },
  lobbySubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  gridContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginVertical: 8,
  },
  gridTile: {
    width: '48%',
    height: 145,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginBottom: 14,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  tileIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    elevation: 4,
  },
  tileEmoji: {
    fontSize: 26,
  },
  tileTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  tileSub: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.85,
  },
  bottomFooterPill: {
    backgroundColor: '#131c31',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 4,
  },
  footerPillText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#0a0f1d',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabToggleActive: {
    backgroundColor: '#0284c7',
  },
  tabToggleText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabToggleTextActive: {
    color: '#ffffff',
  },
  playerCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  countPill: {
    flex: 1,
    backgroundColor: '#0a0f1d',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  countPillActive: {
    borderColor: '#10b981',
    backgroundColor: '#064e3b',
  },
  countPillText: {
    color: '#94a3b8',
    fontWeight: 'bold',
    fontSize: 13,
  },
  countPillTextActive: {
    color: '#ffffff',
  },
  friendCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0f1d',
    padding: 10,
    borderRadius: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  friendNameText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  friendStatusText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  invitePillBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  invitePillBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  inviteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  invitePromptText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  patternBg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1e40af',
  },
  headerBar: {
    width: '94%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
    zIndex: 10,
  },
  exitBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  exitBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  playerInfoTop: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  playerInfoTopText: {
    color: '#facc15',
    fontWeight: 'bold',
    fontSize: 13,
  },
  roomTag: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  roomTagText: {
    color: '#38bdf8',
    fontWeight: 'bold',
    fontSize: 13,
  },
  topCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '94%',
    paddingHorizontal: 8,
  },
  bottomCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '94%',
    paddingHorizontal: 8,
  },
  cardContainerWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    borderWidth: 2,
    borderColor: '#facc15',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  activeCardGlow: {
    borderColor: '#ffffff',
    elevation: 10,
    shadowColor: '#ffffff',
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  cardDiceWrap: {
    marginHorizontal: 4,
  },
  cardAvatarLeft: {
    marginRight: 6,
    alignItems: 'center',
  },
  cardAvatarRight: {
    marginLeft: 6,
    alignItems: 'center',
  },
  floatingArrowContainer: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 20,
  },
  arrowTopPos: {
    bottom: -22,
  },
  arrowBottomPos: {
    top: -22,
  },
  arrowIconBubble: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  arrowIconText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  diceBox: {
    width: 44,
    height: 44,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
  },
  diceDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#0f172a',
    margin: 1.5,
  },
  diceCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  diceRowSpace: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 2,
  },
  diceCol: {
    justifyContent: 'space-between',
  },
  pinWrapper: {
    alignItems: 'center',
    width: 22,
    height: 28,
  },
  pinHead: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  pinInnerGlow: {
    position: 'absolute',
    top: 2,
    left: 4,
    width: 8,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  pinCenterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
    opacity: 0.9,
  },
  pinPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  boardContainer: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#000000',
  },
  board: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  cell: {
    position: 'absolute',
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 0.5,
    borderColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: 'bold',
  },
  arrowText: {
    fontSize: 12,
    color: '#e11d48',
    fontWeight: 'bold',
  },
  base: {
    position: 'absolute',
    width: CELL_SIZE * 6,
    height: CELL_SIZE * 6,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  redBase: { top: 0, left: 0, backgroundColor: '#e11d48' },
  greenBase: { top: 0, right: 0, backgroundColor: '#16a34a' },
  blueBase: { bottom: 0, left: 0, backgroundColor: '#0284c7' },
  yellowBase: { bottom: 0, right: 0, backgroundColor: '#eab308' },
  baseInnerWhite: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    justifyContent: 'space-around',
    padding: 8,
  },
  pocketRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  basePocket: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    backgroundColor: '#f8fafc',
  },
  playerLabel: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  playerLabelHorizontal: {
    bottom: 2,
  },
  playerLabelRotated: {
    left: -12,
    transform: [{ rotate: '-90deg' }],
  },
  centerHome: {
    position: 'absolute',
    top: CELL_SIZE * 6,
    left: CELL_SIZE * 6,
    width: CELL_SIZE * 3,
    height: CELL_SIZE * 3,
    overflow: 'hidden',
  },
  triRed: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 0,
    height: 0,
    borderTopWidth: (CELL_SIZE * 3) / 2,
    borderBottomWidth: (CELL_SIZE * 3) / 2,
    borderLeftWidth: (CELL_SIZE * 3) / 2,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#e11d48',
  },
  triGreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    borderLeftWidth: (CELL_SIZE * 3) / 2,
    borderRightWidth: (CELL_SIZE * 3) / 2,
    borderTopWidth: (CELL_SIZE * 3) / 2,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#16a34a',
  },
  triYellow: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 0,
    height: 0,
    borderTopWidth: (CELL_SIZE * 3) / 2,
    borderBottomWidth: (CELL_SIZE * 3) / 2,
    borderRightWidth: (CELL_SIZE * 3) / 2,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#eab308',
  },
  triBlue: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    borderLeftWidth: (CELL_SIZE * 3) / 2,
    borderRightWidth: (CELL_SIZE * 3) / 2,
    borderBottomWidth: (CELL_SIZE * 3) / 2,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#0284c7',
  },
  tokenWrapper: {
    position: 'absolute',
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
