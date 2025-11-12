import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PluginCallData, PluginResultData } from '../../utils/pluginParser';

interface PluginCardProps {
  data: PluginCallData | PluginResultData;
  isCall?: boolean; // true for plugin call, false for plugin result
}

export function PluginCard({ data, isCall = true }: PluginCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animatedHeight] = useState(new Animated.Value(0));

  const toggleExpanded = () => {
    const newHeight = isExpanded ? 0 : 200; // Expanded height
    setIsExpanded(!isExpanded);

    Animated.timing(animatedHeight, {
      toValue: newHeight,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const getStatusColor = () => {
    if (isCall) {
      const callData = data as PluginCallData;
      switch (callData.pluginStatus) {
        case 'in_progress':
        case 'created':
          return '#FFA500'; // Orange
        case 'completed':
          return '#10B981'; // Green
        case 'error':
          return '#EF4444'; // Red
        default:
          return '#6B7280'; // Gray
      }
    } else {
      const resultData = data as PluginResultData;
      return resultData.status === 'success' ? '#10B981' : '#EF4444';
    }
  };

  const getStatusText = () => {
    if (isCall) {
      const callData = data as PluginCallData;
      switch (callData.pluginStatus) {
        case 'created':
          return '已创建';
        case 'in_progress':
          return '执行中';
        case 'completed':
          return '已完成';
        case 'error':
          return '错误';
        default:
          return '未知';
      }
    } else {
      const resultData = data as PluginResultData;
      return resultData.status === 'success' ? '成功' : '失败';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPluginData = () => {
    if (isCall) {
      const callData = data as PluginCallData;
      return callData.pluginData;
    } else {
      const resultData = data as PluginResultData;
      return resultData.result;
    }
  };

  return (
    <View
      style={{
        backgroundColor: 'rgba(45, 46, 53, 0.8)',
        borderRadius: 12,
        marginVertical: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* 主内容区域 */}
      <TouchableOpacity
        onPress={toggleExpanded}
        style={{
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {/* 状态图标 */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: getStatusColor(),
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
            shadowColor: getStatusColor(),
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.3,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <Ionicons
            name={isCall ? 'extension-puzzle' : 'checkmark-circle'}
            size={18}
            color="white"
          />
        </View>

        {/* 插件名称和类型 */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: 'white',
              marginBottom: 2,
            }}
          >
            {isCall ? '🔌 ' : '✅ '}
            {data.pluginName}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: '#9CA3AF',
            }}
          >
            {isCall ? '插件调用' : '执行结果'} • {formatTimestamp(data.timestamp)}
          </Text>
        </View>
      </TouchableOpacity>

      {/* 状态标签和展开箭头 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {/* 状态标签 */}
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            backgroundColor: getStatusColor() + '20',
          }}
        >
          <Text
            style={{
              fontSize: 11,
              color: getStatusColor(),
              fontWeight: '500',
            }}
          >
            {getStatusText()}
          </Text>
        </View>

        {/* 展开箭头 */}
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#9CA3AF"
        />
      </View>

      {/* 可展开的内容区域 */}
      <Animated.View
        style={{
          height: animatedHeight,
          overflow: 'hidden',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        <View style={{ padding: 16 }}>
          <Text
            style={{
              fontSize: 14,
              color: '#D1D5DB',
              marginBottom: 8,
              fontWeight: '500',
            }}
          >
            {isCall ? '插件数据' : '执行结果'}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: '#9CA3AF',
              fontFamily: 'monospace',
              lineHeight: 18,
            }}
          >
            {JSON.stringify(getPluginData(), null, 2)}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}