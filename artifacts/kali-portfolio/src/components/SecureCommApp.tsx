import { useState, useEffect, useRef } from 'react';
import { supabase, supabaseReady } from '@/lib/supabaseClient';
import WindowChrome from './WindowChrome';
import CommLogin from './comm/CommLogin';
import CommSidebar from './comm/CommSidebar';
import CommChat from './comm/CommChat';
import CommVideoCall from './comm/CommVideoCall';
import { Peer, Message, CallSignal, CallHistoryEntry, CallParticipant, CallSession } from './comm/CommTypes';
import { toast } from 'sonner';

interface SecureCommAppProps {
  onClose: () => void;
  onMinimize: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
}

export default function SecureCommApp({
  onClose, onMinimize, isActive, onFocus, initialX, initialY, zIndex,
}: SecureCommAppProps) {
  const [localPeer, setLocalPeer] = useState<Peer | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [activeChat, setActiveChat] = useState<Peer | null>(null);
  const activeChatRef = useRef<Peer | null>(null);

  useEffect(() => {
    activeChatRef.current = activeChat;
    if (activeChat) {
      setUnreadMessages(prev => {
        const next = { ...prev };
        delete next[activeChat.id];
        return next;
      });
    }
  }, [activeChat]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [fileProgress, setFileProgress] = useState<Record<string, number>>({});
  const incomingFilesRef = useRef<Record<string, { chunks: string[]; received: number; total: number; fileName: string; fileType: string; from: string }>>({});
  const [callHistory, setCallHistory] = useState<CallHistoryEntry[]>([]);

  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [heldCall, setHeldCall] = useState<CallSession | null>(null);
  const [pendingCall, setPendingCall] = useState<CallSession | null>(null);

  const activeCallRef = useRef<CallSession | null>(null);
  const pendingCallRef = useRef<CallSession | null>(null);
  const heldCallRef = useRef<CallSession | null>(null);

  const iceCandidateBatchRef = useRef<Map<string, RTCIceCandidate[]>>(new Map());
  const iceCandidateTimerRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);
  useEffect(() => { pendingCallRef.current = pendingCall; }, [pendingCall]);
  useEffect(() => { heldCallRef.current = heldCall; }, [heldCall]);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [callNotification, setCallNotification] = useState<string | null>(null);

  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const iceCandidateQueueRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const dataPcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const dataChannelsRef = useRef<Map<string, RTCDataChannel>>(new Map());

  useEffect(() => {
    const savedAlias = localStorage.getItem('monix_alias');
    const savedId = localStorage.getItem('monix_id');
    if (savedAlias && savedId) setLocalPeer({ id: savedId, alias: savedAlias });
  }, []);

  const handleIncomingMessage = (msg: Message) => {
    setMessages(prev => [...prev, msg]);
    if (activeChatRef.current?.id !== msg.from) {
      setUnreadMessages(prev => ({ ...prev, [msg.from]: (prev[msg.from] || 0) + 1 }));
    }
  };

  const addCallHistory = (peerId: string, peerAlias: string, type: 'incoming' | 'outgoing' | 'missed') => {
    const entry: CallHistoryEntry = { id: crypto.randomUUID(), peerId, peerAlias, type, timestamp: Date.now() };
    setCallHistory(prev => [entry, ...prev].slice(0, 50));
  };

  const handleLogin = (alias: string) => {
    const id = crypto.randomUUID();
    localStorage.setItem('monix_alias', alias);
    localStorage.setItem('monix_id', id);
    setLocalPeer({ id, alias });
  };

  useEffect(() => {
    if (!localPeer) return;
    if (!supabaseReady) {
      toast.error('MONIX-COMM P2P offline: Supabase secrets missing.');
      return;
    }

    const channel = supabase.channel('monix-secure-comm', {
      config: { presence: { key: localPeer.id }, broadcast: { self: false } }
    });
    channelRef.current = channel;

    const setupDataChannel = (dc: RTCDataChannel, peerId: string) => {
      dc.bufferedAmountLowThreshold = 512 * 1024;
      dataChannelsRef.current.set(peerId, dc);
      dc.onopen = () => console.log('Data channel open with', peerId);
      dc.onerror = () => toast.error('Secure file channel failed.');
      dc.onclose = () => {
        dataChannelsRef.current.delete(peerId);
        const pc = dataPcsRef.current.get(peerId);
        if (pc) pc.close();
        dataPcsRef.current.delete(peerId);
      };
      dc.onmessage = (event) => {
        let data: any;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }
        if (data.type === 'file-start') {
          incomingFilesRef.current[data.fileId] = { chunks: new Array(data.totalChunks).fill(''), received: 0, total: data.totalChunks, fileName: data.fileName, fileType: data.fileType, from: peerId };
        } else if (data.type === 'file-chunk') {
          const fileData = incomingFilesRef.current[data.fileId];
          if (fileData && !fileData.chunks[data.chunkIndex]) {
            fileData.chunks[data.chunkIndex] = data.chunk;
            fileData.received++;
            setFileProgress(prev => ({ ...prev, [data.fileId]: Math.round((fileData.received / fileData.total) * 100) }));
          }
        } else if (data.type === 'file-end') {
          const fileData = incomingFilesRef.current[data.fileId];
          if (fileData) {
            handleIncomingMessage({ id: data.fileId, from: fileData.from, to: localPeer.id, content: `Received file: ${fileData.fileName}`, timestamp: Date.now(), status: 'delivered', imageBase64: fileData.chunks.join(''), fileName: fileData.fileName });
            setFileProgress(prev => { const n = { ...prev }; delete n[data.fileId]; return n; });
            delete incomingFilesRef.current[data.fileId];
          }
        }
      };
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ alias?: string; userName?: string; status?: string }>();
        const byId = new Map<string, Peer>();

        Object.entries(state).forEach(([presenceKey, presences]) => {
          presences.forEach((presence: any) => {
            const id = String(presenceKey);
            const alias = String(presence?.alias || presence?.userName || 'Anonymous').trim();
            if (!id || id === localPeer.id || presence?.status === 'offline') return;
            byId.set(id, { id, alias });
          });
        });

        const onlinePeers = Array.from(byId.values()).sort((a, b) => a.alias.localeCompare(b.alias));
        setPeers(prev => (
          prev.length === onlinePeers.length && prev.every((p, i) => p.id === onlinePeers[i].id && p.alias === onlinePeers[i].alias)
            ? prev
            : onlinePeers
        ));
      })
      .on('broadcast', { event: 'private_msg' }, ({ payload }) => {
        const msg = payload as Message;
        if (msg.to === localPeer.id) handleIncomingMessage(msg);
      })
      .on('broadcast', { event: 'file_chunk' }, ({ payload }) => {
        if (payload.to !== localPeer.id) return;
        const { fileId, chunkIndex, totalChunks, chunk, fileName, fileType, from } = payload;
        if (!incomingFilesRef.current[fileId]) {
          incomingFilesRef.current[fileId] = { chunks: new Array(totalChunks).fill(''), received: 0, total: totalChunks, fileName, fileType, from };
        }
        const fileData = incomingFilesRef.current[fileId];
        if (!fileData.chunks[chunkIndex]) {
          fileData.chunks[chunkIndex] = chunk;
          fileData.received++;
          setFileProgress(prev => ({ ...prev, [fileId]: Math.round((fileData.received / totalChunks) * 100) }));
          if (fileData.received === totalChunks) {
            handleIncomingMessage({ id: fileId, from: fileData.from, to: localPeer.id, content: `Received file: ${fileName}`, timestamp: Date.now(), status: 'delivered', imageBase64: fileData.chunks.join(''), fileName });
            setFileProgress(prev => { const n = { ...prev }; delete n[fileId]; return n; });
            delete incomingFilesRef.current[fileId];
          }
        }
      })
      .on('broadcast', { event: 'webrtc_data_signal' }, async ({ payload }) => {
        const signal = payload;
        if (signal.to !== localPeer.id) return;
        let pc = dataPcsRef.current.get(signal.from);
        if (!pc) {
          pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] });
          dataPcsRef.current.set(signal.from, pc);
          pc.onicecandidate = (event) => {
            if (event.candidate && channelRef.current) {
              channelRef.current.send({ type: 'broadcast', event: 'webrtc_data_signal', payload: { type: 'ice-candidate', from: localPeer.id, to: signal.from, payload: { candidate: event.candidate } } });
            }
          };
          pc.ondatachannel = (event) => setupDataChannel(event.channel, signal.from);
        }
        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          channelRef.current?.send({ type: 'broadcast', event: 'webrtc_data_signal', payload: { type: 'answer', from: localPeer.id, to: signal.from, payload: { answer } } });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload.answer));
        } else if (signal.type === 'ice-candidate') {
          try { await pc.addIceCandidate(new RTCIceCandidate(signal.payload.candidate)); } catch (e) { console.error(e); }
        }
      })
      .on('broadcast', { event: 'webrtc_signal' }, async ({ payload }) => {
        const signal = payload as CallSignal;
        if (signal.to !== localPeer.id) return;
        handleSignalingData(signal);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            await channel.track({
              alias: localPeer.alias,
              userName: localPeer.alias,
              status: 'online',
              online_at: new Date().toISOString(),
            });
          } catch {
            toast.error('MONIX-COMM presence failed.');
          }
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          toast.error('MONIX-COMM P2P connection failed. Reopen Comm.');
        }
      });

    return () => {
      channel.unsubscribe();
      if (channelRef.current === channel) channelRef.current = null;
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      pcsRef.current.forEach(pc => pc.close());
      pcsRef.current.clear();
      dataChannelsRef.current.forEach(dc => dc.close());
      dataChannelsRef.current.clear();
      dataPcsRef.current.forEach(pc => pc.close());
      dataPcsRef.current.clear();
      iceCandidateTimerRef.current.forEach(timer => clearTimeout(timer));
      iceCandidateTimerRef.current.clear();
      iceCandidateBatchRef.current.clear();
      iceCandidateQueueRef.current.clear();
      incomingFilesRef.current = {};
      remoteStreamsRef.current.clear();
    };
  }, [localPeer]);

  useEffect(() => {
    if (!activeCall || activeCall.status !== 'connected') return;
    const interval = setInterval(async () => {
      pcsRef.current.forEach(async (pc, _peerId) => {
        try {
          const stats = await pc.getStats();
          let packetLoss = 0, rtt = 0;
          stats.forEach(report => {
            if (report.type === 'inbound-rtp' && report.kind === 'video') packetLoss = report.packetsLost / (report.packetsReceived + report.packetsLost || 1);
            if (report.type === 'candidate-pair' && report.state === 'succeeded') rtt = report.currentRoundTripTime;
          });
          const videoSender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (videoSender && videoSender.track) {
            const params = videoSender.getParameters();
            if (!params.encodings) params.encodings = [{}];
            let needsUpdate = false;
            if (packetLoss > 0.05 || rtt > 0.2) {
              if (params.encodings[0].scaleResolutionDownBy !== 2) { params.encodings[0].scaleResolutionDownBy = 2; params.encodings[0].maxBitrate = 250000; params.encodings[0].maxFramerate = 15; needsUpdate = true; }
            } else {
              if (params.encodings[0].scaleResolutionDownBy !== 1) { params.encodings[0].scaleResolutionDownBy = 1; params.encodings[0].maxBitrate = 1000000; params.encodings[0].maxFramerate = 30; needsUpdate = true; }
            }
            if (needsUpdate) await videoSender.setParameters(params);
          }
        } catch (e) { console.error(e); }
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [activeCall]);

  useEffect(() => {
    if (!activeChat || !localPeer || !channelRef.current) return;
    const unread = messages.filter(m => m.from === activeChat.id && m.to === localPeer.id && m.status !== 'read');
    if (unread.length > 0) {
      const ids = unread.map(m => m.id);
      setMessages(prev => prev.map(m => ids.includes(m.id) ? { ...m, status: 'read' } : m));
      channelRef.current.send({ type: 'broadcast', event: 'webrtc_signal', payload: { type: 'read-receipt', from: localPeer.id, to: activeChat.id, payload: { messageIds: ids } } });
    }
  }, [messages, activeChat, localPeer]);

  useEffect(() => {
    if (activeChat && localPeer) initiateDataConnection(activeChat.id);
  }, [activeChat, localPeer]);

  const initiateDataConnection = async (peerId: string) => {
    if (dataPcsRef.current.has(peerId)) return;
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] });
    dataPcsRef.current.set(peerId, pc);
    pc.onicecandidate = (event) => {
      if (event.candidate && localPeer && channelRef.current) {
        channelRef.current.send({ type: 'broadcast', event: 'webrtc_data_signal', payload: { type: 'ice-candidate', from: localPeer.id, to: peerId, payload: { candidate: event.candidate } } });
      }
    };
    pc.ondatachannel = () => {};
    if (localPeer!.id < peerId) {
      const dc = pc.createDataChannel('fileTransfer');
      dataChannelsRef.current.set(peerId, dc);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      channelRef.current?.send({ type: 'broadcast', event: 'webrtc_data_signal', payload: { type: 'offer', from: localPeer!.id, to: peerId, payload: { offer } } });
    }
  };

  const handleSendMessage = (content: string, imageBase64?: string, fileName?: string) => {
    if (!localPeer || !activeChat || !channelRef.current) return;
    const newMessage: Message = { id: crypto.randomUUID(), from: localPeer.id, to: activeChat.id, content, timestamp: Date.now(), status: 'sent', imageBase64, fileName };
    setMessages(prev => [...prev, newMessage]);
    channelRef.current.send({ type: 'broadcast', event: 'private_msg', payload: newMessage });
  };

  const handleSendFile = (file: File) => {
    if (!localPeer || !activeChat || !channelRef.current) return;
    const dc = dataChannelsRef.current.get(activeChat.id);
    if (!dc || dc.readyState !== 'open') { alert('Establishing secure data link... Please try again.'); initiateDataConnection(activeChat.id); return; }
    const fileId = crypto.randomUUID();
    const chunkSize = 65535;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      const totalChunks = Math.ceil(base64.length / chunkSize);
      setFileProgress(prev => ({ ...prev, [fileId]: 0 }));
      dc.send(JSON.stringify({ type: 'file-start', fileId, fileName: file.name, fileType: file.type, totalChunks }));
      let offset = 0, chunkIndex = 0;
      const sendNextChunk = () => {
        while (offset < base64.length) {
          if (dc.bufferedAmount > 1024 * 1024) { dc.onbufferedamountlow = () => { dc.onbufferedamountlow = null; sendNextChunk(); }; return; }
          dc.send(JSON.stringify({ type: 'file-chunk', fileId, chunkIndex, chunk: base64.slice(offset, offset + chunkSize) }));
          offset += chunkSize; chunkIndex++;
          setFileProgress(prev => ({ ...prev, [fileId]: Math.round((chunkIndex / totalChunks) * 100) }));
        }
        dc.send(JSON.stringify({ type: 'file-end', fileId }));
        setMessages(prev => [...prev, { id: fileId, from: localPeer.id, to: activeChat.id, content: `Sent file: ${file.name}`, timestamp: Date.now(), status: 'sent', imageBase64: base64, fileName: file.name }]);
        setFileProgress(prev => { const n = { ...prev }; delete n[fileId]; return n; });
      };
      sendNextChunk();
    };
    reader.readAsDataURL(file);
  };

  const createPeerConnection = (peerId: string, _roomId: string) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] });
    if (!iceCandidateQueueRef.current.has(peerId)) iceCandidateQueueRef.current.set(peerId, []);
    pc.onicecandidate = (event) => {
      if (event.candidate && localPeer && channelRef.current) {
        const batch = iceCandidateBatchRef.current.get(peerId) || [];
        batch.push(event.candidate);
        iceCandidateBatchRef.current.set(peerId, batch);
        if (!iceCandidateTimerRef.current.has(peerId)) {
          const timer = setTimeout(() => {
            const toSend = iceCandidateBatchRef.current.get(peerId) || [];
            if (toSend.length > 0) {
              channelRef.current?.send({ type: 'broadcast', event: 'webrtc_signal', payload: { type: 'ice-candidate-batch', from: localPeer.id, to: peerId, payload: { roomId: activeCallRef.current?.roomId, candidates: toSend } } });
              iceCandidateBatchRef.current.set(peerId, []);
            }
            iceCandidateTimerRef.current.delete(peerId);
          }, 250);
          iceCandidateTimerRef.current.set(peerId, timer);
        }
      }
    };
    pc.ontrack = (event) => {
      let stream = remoteStreamsRef.current.get(peerId);
      if (!stream) { stream = new MediaStream(); remoteStreamsRef.current.set(peerId, stream); }
      stream.addTrack(event.track);
      updateParticipantStream(peerId, stream);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') updateParticipantStatus(peerId, 'connected');
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') removeParticipant(peerId, 'connection lost');
    };
    pcsRef.current.set(peerId, pc);
    return pc;
  };

  const updateParticipantStream = (peerId: string, stream: MediaStream) => {
    setActiveCall(prev => prev ? { ...prev, participants: prev.participants.map(p => p.id === peerId ? { ...p, stream } : p) } : prev);
  };
  const updateParticipantStatus = (peerId: string, status: 'connecting' | 'connected' | 'on-hold') => {
    setActiveCall(prev => prev ? { ...prev, participants: prev.participants.map(p => p.id === peerId ? { ...p, status } : p) } : prev);
  };

  const showCallNotification = (message: string) => {
    setCallNotification(message);
    setTimeout(() => setCallNotification(null), 3000);
  };

  const endCallLocally = () => {
    const cur = activeCallRef.current;
    const held = heldCallRef.current;
    const stream = localStreamRef.current;
    if (cur) cur.participants.forEach(p => { const pc = pcsRef.current.get(p.id); if (pc) { pc.close(); pcsRef.current.delete(p.id); } remoteStreamsRef.current.delete(p.id); iceCandidateQueueRef.current.delete(p.id); });
    if (held) {
      setActiveCall({ ...held, status: 'connected' });
      setHeldCall(null);
      held.participants.forEach(p => channelRef.current?.send({ type: 'broadcast', event: 'webrtc_signal', payload: { type: 'resume', from: localPeer!.id, to: p.id, payload: { roomId: held.roomId } } }));
    } else {
      setActiveCall(null);
      if (stream) { stream.getTracks().forEach(t => t.stop()); setLocalStream(null); localStreamRef.current = null; }
    }
  };

  const removeParticipant = (peerId: string, reason?: string) => {
    let shouldEnd = false, peerName = 'Peer';
    setActiveCall(prev => {
      if (!prev) return prev;
      const p = prev.participants.find(x => x.id === peerId);
      if (p) peerName = p.alias;
      const next = prev.participants.filter(x => x.id !== peerId);
      if (next.length === 0) { shouldEnd = true; return prev; }
      return { ...prev, participants: next };
    });
    if (shouldEnd) { showCallNotification(`Call disconnected (${reason || peerName + ' left'})`); setTimeout(endCallLocally, 0); }
    else showCallNotification(`${peerName} ${reason || 'left the call'}`);
  };

  const startCall = async (peerId: string, isVideo: boolean) => {
    if (!localPeer || !channelRef.current) return;
    const peer = peers.find(p => p.id === peerId);
    if (!peer) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo ? { width: { ideal: 1920 }, height: { ideal: 1080 } } : false, audio: { echoCancellation: true, noiseSuppression: true } });
      setLocalStream(stream); localStreamRef.current = stream;
      const roomId = crypto.randomUUID();
      const session: CallSession = { roomId, isVideo, status: 'outgoing', initiator: { id: localPeer.id, alias: localPeer.alias }, participants: [{ id: peer.id, alias: peer.alias, status: 'connecting', stream: null }] };
      setActiveCall(session);
      addCallHistory(peerId, peer.alias, 'outgoing');
      channelRef.current.send({ type: 'broadcast', event: 'webrtc_signal', payload: { type: 'invite', from: localPeer.id, to: peerId, payload: { roomId, isVideo, alias: localPeer.alias } } });
    } catch (err) { console.error(err); alert('Could not access camera/microphone. Please check permissions.'); }
  };

  const invitePeerToCall = (peerId: string) => {
    if (!activeCallRef.current || !localPeer || !channelRef.current) return;
    const peer = peers.find(p => p.id === peerId);
    if (!peer) return;
    setActiveCall(prev => prev ? { ...prev, participants: [...prev.participants, { id: peer.id, alias: peer.alias, status: 'connecting', stream: null }] } : prev);
    channelRef.current.send({ type: 'broadcast', event: 'webrtc_signal', payload: { type: 'invite', from: localPeer.id, to: peerId, payload: { roomId: activeCallRef.current.roomId, isVideo: activeCallRef.current.isVideo, alias: localPeer.alias } } });
  };

  const acceptCall = async () => {
    if (!activeCall || !localPeer || !channelRef.current) return;
    try {
      let stream = localStreamRef.current;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ video: activeCall.isVideo ? { width: { ideal: 1920 }, height: { ideal: 1080 } } : false, audio: { echoCancellation: true, noiseSuppression: true } });
        setLocalStream(stream); localStreamRef.current = stream;
      }
      setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
      activeCall.participants.forEach(p => channelRef.current!.send({ type: 'broadcast', event: 'webrtc_signal', payload: { type: 'join-room', from: localPeer.id, to: p.id, payload: { roomId: activeCall.roomId, alias: localPeer.alias } } }));
    } catch (err) { console.error(err); alert('Could not access camera/microphone. Please check permissions.'); }
  };

  const rejectCall = () => {
    if (!activeCall || !localPeer || !channelRef.current) return;
    activeCall.participants.forEach(p => channelRef.current!.send({ type: 'broadcast', event: 'webrtc_signal', payload: { type: 'reject', from: localPeer.id, to: p.id, payload: { roomId: activeCall.roomId } } }));
    endCallLocally();
  };

  const handleEndCall = () => {
    if (!activeCall || !localPeer || !channelRef.current) return;
    const isInitiator = activeCall.initiator.id === localPeer.id;
    activeCall.participants.forEach(p => channelRef.current!.send({ type: 'broadcast', event: 'webrtc_signal', payload: { type: isInitiator ? 'end-room' : 'leave-room', from: localPeer.id, to: p.id, payload: { roomId: activeCall.roomId } } }));
    endCallLocally();
  };

  const acceptWaitingCall = () => {
    if (!activeCall || !pendingCall || !localPeer || !channelRef.current) return;
    activeCall.participants.forEach(p => channelRef.current!.send({ type: 'broadcast', event: 'webrtc_signal', payload: { type: 'hold', from: localPeer.id, to: p.id, payload: { roomId: activeCall.roomId } } }));
    setHeldCall({ ...activeCall, status: 'on-hold' });
    const newCall = { ...pendingCall, status: 'connected' as const };
    setActiveCall(newCall); setPendingCall(null);
    newCall.participants.forEach(p => channelRef.current!.send({ type: 'broadcast', event: 'webrtc_signal', payload: { type: 'join-room', from: localPeer.id, to: p.id, payload: { roomId: newCall.roomId, alias: localPeer.alias } } }));
  };

  const rejectWaitingCall = () => {
    if (!pendingCall || !localPeer || !channelRef.current) return;
    channelRef.current.send({ type: 'broadcast', event: 'webrtc_signal', payload: { type: 'reject', from: localPeer.id, to: pendingCall.initiator.id, payload: { roomId: pendingCall.roomId } } });
    setPendingCall(null);
  };

  const handleMuteAll = () => {
    if (!activeCall || !localPeer || !channelRef.current) return;
    activeCall.participants.forEach(p => channelRef.current!.send({ type: 'broadcast', event: 'webrtc_signal', payload: { type: 'mute-all', from: localPeer.id, to: p.id, payload: { roomId: activeCall.roomId } } }));
  };

  const toggleAudio = () => {
    if (localStream) { localStream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; }); setIsAudioMuted(m => !m); }
  };
  const toggleVideo = () => {
    if (localStream) { localStream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; }); setIsVideoMuted(m => !m); }
  };

  const handleSignalingData = async (signal: CallSignal) => {
    if (!localPeer || !channelRef.current) return;
    const currentActiveCall = activeCallRef.current;
    const currentPendingCall = pendingCallRef.current;

    switch (signal.type) {
      case 'invite': {
        const { roomId, isVideo, alias } = signal.payload;
        const newSession: CallSession = { roomId, isVideo, status: 'incoming', initiator: { id: signal.from, alias }, participants: [{ id: signal.from, alias, status: 'connecting', stream: null }] };
        if (currentActiveCall) { setPendingCall(newSession); showCallNotification(`Incoming call from ${alias}`); }
        else { setActiveCall(newSession); addCallHistory(signal.from, alias, 'incoming'); }
        break;
      }
      case 'join-room': {
        const { roomId, alias } = signal.payload;
        if (!currentActiveCall || currentActiveCall.roomId !== roomId) break;
        setActiveCall(prev => prev ? { ...prev, status: 'connected', participants: prev.participants.some(p => p.id === signal.from) ? prev.participants : [...prev.participants, { id: signal.from, alias, status: 'connecting', stream: null }] } : prev);
        const stream = localStreamRef.current;
        if (stream) {
          const pc = createPeerConnection(signal.from, roomId);
          stream.getTracks().forEach(t => pc.addTrack(t, stream));
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          channelRef.current.send({ type: 'broadcast', event: 'webrtc_signal', payload: { type: 'offer', from: localPeer.id, to: signal.from, payload: { roomId, offer } } });
        }
        break;
      }
      case 'offer': {
        const { roomId, offer } = signal.payload;
        if (!currentActiveCall || currentActiveCall.roomId !== roomId) break;
        const stream = localStreamRef.current;
        const pc = createPeerConnection(signal.from, roomId);
        if (stream) stream.getTracks().forEach(t => pc.addTrack(t, stream));
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const queued = iceCandidateQueueRef.current.get(signal.from) || [];
        for (const c of queued) { try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (e) { console.error(e); } }
        iceCandidateQueueRef.current.set(signal.from, []);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        channelRef.current.send({ type: 'broadcast', event: 'webrtc_signal', payload: { type: 'answer', from: localPeer.id, to: signal.from, payload: { roomId, answer } } });
        break;
      }
      case 'answer': {
        const pc = pcsRef.current.get(signal.from);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload.answer));
          const queued = iceCandidateQueueRef.current.get(signal.from) || [];
          for (const c of queued) { try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (e) { console.error(e); } }
          iceCandidateQueueRef.current.set(signal.from, []);
        }
        break;
      }
      case 'ice-candidate-batch': {
        const pc = pcsRef.current.get(signal.from);
        const { candidates } = signal.payload;
        if (pc && pc.remoteDescription) {
          for (const c of candidates) { try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (e) { console.error(e); } }
        } else {
          const q = iceCandidateQueueRef.current.get(signal.from) || [];
          iceCandidateQueueRef.current.set(signal.from, [...q, ...candidates]);
        }
        break;
      }
      case 'reject':
        showCallNotification('Call rejected');
        endCallLocally();
        break;
      case 'leave-room':
        removeParticipant(signal.from, 'left');
        break;
      case 'end-room':
        showCallNotification('Call ended by initiator');
        endCallLocally();
        break;
      case 'mute-all':
        if (localStream) { localStream.getAudioTracks().forEach(t => { t.enabled = false; }); setIsAudioMuted(true); }
        break;
      case 'hold':
        if (currentActiveCall?.roomId === signal.payload.roomId) updateParticipantStatus(signal.from, 'on-hold');
        break;
      case 'resume':
        if (currentActiveCall?.roomId === signal.payload.roomId) updateParticipantStatus(signal.from, 'connected');
        break;
      case 'read-receipt':
        setMessages(prev => prev.map(m => signal.payload.messageIds.includes(m.id) ? { ...m, status: 'read' } : m));
        break;
    }
  };

  return (
    <WindowChrome
      title="MONIX-COMM — Secure Channel"
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      width={1000}
      height={620}
      zIndex={zIndex}
    >
      {!localPeer ? (
        <CommLogin onLogin={handleLogin} />
      ) : (
        <div className="w-full h-full flex flex-col bg-[#050505] text-[#00ffff] font-mono overflow-hidden relative">
          {/* Call notification toast */}
          {callNotification && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[150] bg-[#0a0a0a] border border-[#00ffff] text-[#00ffff] px-4 py-2 shadow-[0_0_15px_rgba(0,255,255,0.3)] text-sm font-bold">
              {callNotification}
            </div>
          )}

          {/* Pending call toast (call waiting) */}
          {pendingCall && (
            <div className="absolute top-16 right-4 z-[140] bg-[rgba(10,10,10,0.9)] border border-[#00ffff] p-4 shadow-[0_0_20px_rgba(0,255,255,0.2)] animate-pulse">
              <h4 className="text-[#00ffff] font-bold mb-2 uppercase tracking-widest text-sm">
                Incoming: {pendingCall.initiator?.alias}
              </h4>
              <div className="flex gap-2 mt-3">
                <button onClick={acceptWaitingCall} className="px-3 py-1 bg-[rgba(16,185,129,0.2)] text-[#10b981] border border-[#10b981] text-xs uppercase font-bold hover:bg-[#10b981] hover:text-black transition-colors">
                  Hold & Accept
                </button>
                <button onClick={rejectWaitingCall} className="px-3 py-1 bg-[rgba(255,0,60,0.2)] text-[#ff003c] border border-[#ff003c] text-xs uppercase font-bold hover:bg-[#ff003c] hover:text-black transition-colors">
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* Active call overlay — z-[130] stays inside the window frame */}
          {activeCall && (
            <CommVideoCall
              localStream={localStream}
              participants={activeCall.participants}
              onEndCall={handleEndCall}
              onRejectCall={rejectCall}
              onAcceptCall={acceptCall}
              status={activeCall.status}
              initiatorName={activeCall.initiator?.alias}
              isAudioMuted={isAudioMuted}
              isVideoMuted={isVideoMuted}
              onToggleAudio={toggleAudio}
              onToggleVideo={toggleVideo}
              onMuteAll={handleMuteAll}
              onInvitePeer={invitePeerToCall}
              availablePeers={peers}
            />
          )}

          {/* Main layout */}
          <div className="flex-1 flex overflow-hidden">
            <CommSidebar
              localPeer={localPeer}
              peers={peers}
              activeChat={activeChat}
              callHistory={callHistory}
              unreadMessages={unreadMessages}
              onSelectChat={setActiveChat}
              onStartCall={startCall}
            />
            <CommChat
              localPeer={localPeer}
              activeChat={activeChat}
              messages={messages}
              fileProgress={fileProgress}
              onSendMessage={handleSendMessage}
              onSendFile={handleSendFile}
              onStartCall={startCall}
            />
          </div>
        </div>
      )}
    </WindowChrome>
  );
}
