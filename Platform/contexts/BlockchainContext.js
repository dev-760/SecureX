
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create context
export const NodeContext = createContext();

const NodeProvider = ({ children }) => {
  const [nodeStatus, setNodeStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected'
  const [nodeList, setNodeList] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [nodeUrl, setNodeUrl] = useState(process.env.NODE_SERVER_URL || 'http://localhost:3000');

  // Connect to node server
  const connectToNode = async (url) => {
    try {
      setIsConnecting(true);
      setError(null);
      
      // Verify server is online
      const response = await axios.get(`${url}/status`);
      
      if (response.data.status === 'online') {
        // Create WebSocket connection
        const ws = new WebSocket(url.replace(/^http/, 'ws'));
        
        ws.onopen = () => {
          setSocket(ws);
          setNodeStatus('connected');
          setIsConnecting(false);
          console.log('Connected to node server');
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('Received message:', data);
          
          // Handle different message types
          if (data.type === 'update') {
            // Update node status
            fetchNodeList();
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setError('Connection error');
          setIsConnecting(false);
          setNodeStatus('disconnected');
        };
        
        ws.onclose = () => {
          console.log('WebSocket connection closed');
          setSocket(null);
          setNodeStatus('disconnected');
        };
        
        return true;
      } else {
        throw new Error('Node server not available');
      }
    } catch (err) {
      console.error('Failed to connect to node server:', err);
      setError(err.message || 'Failed to connect to node server');
      setIsConnecting(false);
      setNodeStatus('disconnected');
      return false;
    }
  };

  // Disconnect from node server
  const disconnectFromNode = () => {
    if (socket) {
      socket.close();
      setSocket(null);
      setNodeStatus('disconnected');
    }
  };

  // Fetch node list
  const fetchNodeList = async () => {
    try {
      if (nodeStatus !== 'connected') return;
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }
      
      const response = await axios.get(`${nodeUrl}/api/nodes`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setNodeList(response.data.nodes || []);
    } catch (err) {
      console.error('Failed to fetch node list:', err);
      setError(err.message || 'Failed to fetch node list');
    }
  };

  // Send transaction to node server
  const sendTransaction = async (data) => {
    try {
      if (nodeStatus !== 'connected') {
        throw new Error('Not connected to node server');
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Example transaction endpoint - would be customized based on actual API
      const response = await axios.post(`${nodeUrl}/api/transaction`, data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (err) {
      console.error('Transaction failed:', err);
      throw err;
    }
  };

  // Auto-connect to the node server on initial load
  useEffect(() => {
    const autoConnect = async () => {
      // Try to connect if we have a token
      const token = localStorage.getItem('token');
      if (token) {
        await connectToNode(nodeUrl);
      }
    };
    
    autoConnect();
    
    // Cleanup on unmount
    return () => {
      if (socket) socket.close();
    };
  }, []);

  // Fetch node list periodically when connected
  useEffect(() => {
    if (nodeStatus === 'connected') {
      fetchNodeList();
      const interval = setInterval(fetchNodeList, 30000); // Every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [nodeStatus]);

  return (
    <NodeContext.Provider 
      value={{
        nodeStatus,
        nodeList,
        isConnecting,
        error,
        connectToNode,
        disconnectFromNode,
        sendTransaction,
        nodeUrl
      }}
    >
      {children}
    </NodeContext.Provider>
  );
};

export default NodeProvider;
