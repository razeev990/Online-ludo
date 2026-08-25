import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView, Alert, Animated, Easing } from 'react-native';
import { Audio } from 'expo-av';

const SUPABASE_PROJECT_REF = 'zyqlntdpftowobsrzbgv'; 
const SUPABASE_ANON_KEY = 'sb_publishable_DuyB_EEKvMkDk0QFxQykqg_ZXCMzTwo';

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
const TURN_ORDER = ['BLUE', 'RED', 'GREEN', 'YELLOW'];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Sound Player Utility
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
  } catch (error) {
    // Agar file load na ho toh silent skip karega
  }
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
    <View style={[styles.pinHead, { borderColor: '#ffffff', backgroundColor: colorHex, shadowColor: shadowColor }]}>
      <View style={[styles.pinCenterDot, { backgroundColor: colorHex }]} />
    </View>
    <View style={[styles.pinPointer, { borderTopColor: '#ffffff' }]} />
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
  const [gameMode, setGameMode] = useState(null);
  const [roomCode] = useState('789');
  const [myColor] = useState('BLUE');

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
  const currentTurn = TURN_ORDER[turnIndex];

  useEffect(() => {
    if (gameMode !== 'ONLINE') return;
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
          const { newPawns, nextTurnIdx, updatedDices, rolled, winPlayer } = message.payload.data;
          setPawns(newPawns);
          setTurnIndex(nextTurnIdx);
          setPlayerDices(updatedDices);
          setHasRolled(rolled);
          if (winPlayer) setWinner(winPlayer);
        }
      } catch (err) {}
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [gameMode, roomCode]);

  const sendMultiplayerSync = (newPawns, nextTurnIdx, updatedDices, rolled, winPlayer = null) => {
    if (gameMode === 'ONLINE' && ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        topic: `realtime:room_${roomCode}`,
        event: 'broadcast',
        payload: {
          type: 'SYNC_GAME',
          data: { newPawns, nextTurnIdx, updatedDices, rolled, winPlayer }
        },
        ref: '2'
      }));
    }
  };

  useEffect(() => {
    if (gameMode === 'BOT' && currentTurn !== 'BLUE' && !hasRolled && !isRolling && !isMoving && !winner) {
      const botTimer = setTimeout(() => rollDice(true), 800);
      return () => clearTimeout(botTimer);
    }
  }, [turnIndex, hasRolled, isMoving, gameMode, winner]);

  const nextTurn = (currentIdx = turnIndex) => {
    const nextIdx = (currentIdx + 1) % 4;
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
    if (gameMode === 'BOT' && currentTurn === 'BLUE' && isBot) return;

    setIsRolling(true);
    playSound('dice'); // DICE SOUND TRIGGER

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
    } else if (validMoves.length === 1 || (gameMode === 'BOT' && currentTurn !== 'BLUE')) {
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
      playSound('move'); // STEP TICK SOUND TRIGGER
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
        TURN_ORDER.forEach((enemyColor) => {
          if (enemyColor !== color) {
            updatedPawns[enemyColor] = updatedPawns[enemyColor].map((enemyStep) => {
              if (enemyStep >= 0 && enemyStep < 51) {
                const enemyTrackIndex = (START_INDEX[enemyColor] + enemyStep) % 52;
                if (enemyTrackIndex === myTrackIndex) {
                  playSound('cut'); // GOTI CUT SOUND TRIGGER
                  extraTurn = true;
                  return -1;
                }
              }
              return enemyStep;
            });
          }
        });
      }
    }

    let winPlayer = null;
    if (updatedPawns[color].every((s) => s === 56)) {
      playSound('win'); // VICTORY CHEER SOUND TRIGGER
      winPlayer = color;
      setWinner(color);
      Alert.alert('VICTORY!', `${color} has won the match!`);
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

  const renderBase = (color, posStyle, label, isVertical) => (
    <View style={[styles.base, posStyle]}>
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

  const renderPlayerTokens = (color, colorHex, shadowColor) => {
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
    const isCurrent = currentTurn === color;
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
              <View style={styles.cardAvatarRight}><PinToken colorHex={pinHex} shadowColor={shadowHex} /></View>
            </>
          ) : (
            <>
              <View style={styles.cardAvatarLeft}><PinToken colorHex={pinHex} shadowColor={shadowHex} /></View>
              <Animated.View style={[styles.cardDiceWrap, isCurrent && { transform: [{ rotate: spinInterpolation }, { scale: diceBounceAnim }] }]}>
                <DiceFace value={playerDices[color]} />
              </Animated.View>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (!gameMode) {
    return (
      <SafeAreaView style={styles.lobbyContainer}>
        <Text style={styles.lobbyTitle}>🎲 4-PLAYER 3D LUDO</Text>
        <View style={styles.lobbyCard}>
          <TouchableOpacity style={[styles.modeBtn, { backgroundColor: '#0284c7' }]} onPress={() => setGameMode('BOT')}>
            <Text style={styles.modeBtnText}>🤖 Play Vs Computer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeBtn, { backgroundColor: '#16a34a' }]} onPress={() => setGameMode('OFFLINE')}>
            <Text style={styles.modeBtnText}>👥 Pass & Play (4 Players)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeBtn, { backgroundColor: '#9333ea' }]} onPress={() => setGameMode('ONLINE')}>
            <Text style={styles.modeBtnText}>🌐 Play Online With Friends</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.patternBg} />

      <View style={styles.topCardsRow}>
        {renderPlayerCard('RED', '#e11d48', '#991b1b', false, true)}
        {renderPlayerCard('GREEN', '#16a34a', '#14532d', true, true)}
      </View>

      <View style={styles.boardContainer}>
        <View style={styles.board}>
          {renderBase('RED', styles.redBase, 'Player 2', true)}
          {renderBase('GREEN', styles.greenBase, 'Player 3', false)}
          {renderBase('BLUE', styles.blueBase, 'Player 1', false)}
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
  mainContainer: { flex: 1, backgroundColor: '#1d4ed8', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 10 },
  patternBg: { ...StyleSheet.absoluteFillObject, backgroundColor: '#1e40af', opacity: 0.9 },
  lobbyContainer: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', padding: 20 },
  lobbyTitle: { fontSize: 30, fontWeight: 'bold', color: '#38bdf8', marginBottom: 30 },
  lobbyCard: { width: '100%', backgroundColor: '#1e293b', padding: 20, borderRadius: 16 },
  modeBtn: { paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  modeBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  topCardsRow: { width: BOARD_SIZE, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  bottomCardsRow: { width: BOARD_SIZE, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  cardContainerWrapper: { position: 'relative', alignItems: 'center' },
  playerCard: { width: 110, height: 60, borderRadius: 12, borderWidth: 3, borderColor: '#facc15', backgroundColor: '#0284c7', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, elevation: 8 },
  activeCardGlow: { borderColor: '#ffffff', borderWidth: 3.5, backgroundColor: '#0369a1' },
  cardAvatarLeft: { width: 34, height: 46, justifyContent: 'center', alignItems: 'center' },
  cardAvatarRight: { width: 34, height: 46, justifyContent: 'center', alignItems: 'center' },
  cardDiceWrap: { width: 48, height: 46, backgroundColor: '#fecdd3', borderRadius: 8, borderWidth: 1.5, borderColor: '#f43f5e', justifyContent: 'center', alignItems: 'center' },

  floatingArrowContainer: { position: 'absolute', zIndex: 50, alignItems: 'center', justifyContent: 'center' },
  arrowTopPos: { top: -22 },
  arrowBottomPos: { bottom: -22 },
  arrowIconBubble: { width: 28, height: 22, borderRadius: 6, backgroundColor: '#f97316', borderWidth: 2, borderColor: '#fde047', justifyContent: 'center', alignItems: 'center', elevation: 8 },
  arrowIconText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },

  boardContainer: { padding: 2, backgroundColor: '#000', borderWidth: 2, borderColor: '#334155', elevation: 15 },
  board: { width: BOARD_SIZE, height: BOARD_SIZE, backgroundColor: '#fff', position: 'relative' },
  base: { width: CELL_SIZE * 6, height: CELL_SIZE * 6, position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  redBase: { top: 0, left: 0, backgroundColor: '#e11d48' },
  greenBase: { top: 0, right: 0, backgroundColor: '#16a34a' },
  blueBase: { bottom: 0, left: 0, backgroundColor: '#0284c7' },
  yellowBase: { bottom: 0, right: 0, backgroundColor: '#facc15' },
  baseInnerWhite: { width: '74%', height: '74%', backgroundColor: '#ffffff', borderRadius: 6, padding: 8, justifyContent: 'space-between' },
  pocketRow: { flexDirection: 'row', justifyContent: 'space-between' },
  basePocket: { width: CELL_SIZE * 1.5, height: CELL_SIZE * 1.5, borderRadius: (CELL_SIZE * 1.5) / 2, backgroundColor: '#ffffff', borderWidth: 3 },
  playerLabel: { position: 'absolute', color: '#000000', fontWeight: 'bold', fontSize: 13 },
  playerLabelHorizontal: { bottom: 4 },
  playerLabelRotated: { left: -14, top: '40%', transform: [{ rotate: '-90deg' }] },

  centerHome: { width: CELL_SIZE * 3, height: CELL_SIZE * 3, top: CELL_SIZE * 6, left: CELL_SIZE * 6, position: 'absolute', overflow: 'hidden' },
  triRed: { position: 'absolute', left: 0, top: 0, width: 0, height: 0, borderTopWidth: (CELL_SIZE * 3) / 2, borderBottomWidth: (CELL_SIZE * 3) / 2, borderLeftWidth: (CELL_SIZE * 3) / 2, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#e11d48' },
  triGreen: { position: 'absolute', top: 0, left: 0, width: 0, height: 0, borderLeftWidth: (CELL_SIZE * 3) / 2, borderRightWidth: (CELL_SIZE * 3) / 2, borderTopWidth: (CELL_SIZE * 3) / 2, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#16a34a' },
  triYellow: { position: 'absolute', right: 0, top: 0, width: 0, height: 0, borderTopWidth: (CELL_SIZE * 3) / 2, borderBottomWidth: (CELL_SIZE * 3) / 2, borderRightWidth: (CELL_SIZE * 3) / 2, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: '#facc15' },
  triBlue: { position: 'absolute', bottom: 0, left: 0, width: 0, height: 0, borderLeftWidth: (CELL_SIZE * 3) / 2, borderRightWidth: (CELL_SIZE * 3) / 2, borderBottomWidth: (CELL_SIZE * 3) / 2, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#0284c7' },

  cell: { width: CELL_SIZE, height: CELL_SIZE, position: 'absolute', borderWidth: 0.5, borderColor: '#94a3b8', justifyContent: 'center', alignItems: 'center' },
  starText: { color: '#000000', fontSize: 16, fontWeight: 'bold' },
  arrowText: { color: '#e11d48', fontSize: 13, fontWeight: 'bold' },

  tokenWrapper: { width: CELL_SIZE, height: CELL_SIZE + 6, position: 'absolute', justifyContent: 'center', alignItems: 'center', zIndex: 20 },
  pinWrapper: { width: 22, height: 28, alignItems: 'center', justifyContent: 'flex-start' },
  pinHead: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, justifyContent: 'center', alignItems: 'center', elevation: 6 },
  pinCenterDot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: '#ffffff' },
  pinPointer: { width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', marginTop: -2 },

  diceBox: { width: 42, height: 40, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1.5, borderColor: '#cbd5e1', padding: 4, justifyContent: 'center', alignItems: 'center' },
  diceDot: { width: 6.5, height: 6.5, borderRadius: 3.5, backgroundColor: '#000000', margin: 1 },
  diceCenter: { justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' },
  diceRowSpace: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', height: '100%' },
  diceCol: { justifyContent: 'space-between', alignItems: 'center' },
});
