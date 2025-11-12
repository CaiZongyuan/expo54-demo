import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PluginCallData {
  type: 'plugin_call';
  pluginName: string;
  pluginStatus: 'created' | 'in_progress' | 'completed' | 'error';
  pluginData: any;
  pluginId: string;
  timestamp: number;
}

interface PluginResultData {
  type: 'plugin_result';
  pluginName: string;
  result: any;
  status: 'success' | 'error';
  pluginId: string;
  timestamp: number;
}

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
      case 'created':
        return '#FFA500'; // Orange
      case 'completed':
      case 'success':
        return '#10B981'; // Green
      case 'error':
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'created':
        return '调用中';
      case 'in_progress':
        return '执行中';
      case 'completed':
        return '已完成';
      case 'success':
        return '成功';
      case 'error':
        return '错误';
      default:
        return '未知';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View
      className="bg-gray-800/80 rounded-2xl p-4 mb-3 border border-gray-600/50 shadow-lg"
      style={{
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(75, 85, 99, 0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      {/* 卡片头部 - 插件名称和状态 */}
      <TouchableOpacity
        onPress={toggleExpanded}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {/* 插件图标 */}
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: getStatusColor(data.pluginStatus),
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
              shadowColor: getStatusColor(data.pluginStatus),
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
        </View>

        {/* 状态标签和展开箭头 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* 状态标签 */}
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor: getStatusColor(data.pluginStatus) + '20',
              borderWidth: 1,
              borderColor: getStatusColor(data.pluginStatus),
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 50,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                color: getStatusColor(data.pluginStatus),
                textAlign: 'center',
              }}
            >
              {getStatusText(data.pluginStatus)}
            </Text>
          </View>

          {/* 展开箭头 */}
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#9CA3AF"
          />
        </View>
      </TouchableOpacity>

      {/* 可展开的详细内容 */}
      <Animated.View
        style={{
          height: animatedHeight,
          overflow: 'hidden',
          marginTop: isExpanded ? 12 : 0,
        }}
      >
        {isExpanded && (
          <View>
            {/* 分隔线 */}
            <View
              style={{
                height: 1,
                backgroundColor: 'rgba(75, 85, 99, 0.3)',
                marginBottom: 12,
                marginHorizontal: -4,
              }}
            />

            {/* 详细内容 */}
            <View style={{ paddingHorizontal: 4 }}>
              {isCall ? (
                // Plugin Call 详细信息
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: 'white',
                      marginBottom: 8,
                    }}
                  >
                    调用详情
                  </Text>

                  {/* 插件参数 */}
                  {data.pluginData?.parameters && (
                    <View style={{ marginBottom: 12 }}>
                      <Text
                        style={{
                          fontSize: 12,
                          color: '#9CA3AF',
                          marginBottom: 4,
                        }}
                      >
                        参数：
                      </Text>
                      <View
                        style={{
                          backgroundColor: 'rgba(0, 0, 0, 0.4)',
                          padding: 12,
                          borderRadius: 8,
                          borderLeftWidth: 3,
                          borderLeftColor: getStatusColor(data.pluginStatus),
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            color: '#E5E7EB',
                            fontFamily: 'monospace',
                            lineHeight: 16,
                          }}
                        >
                          {JSON.stringify(data.pluginData.parameters, null, 2)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* 插件ID */}
                  <View>
                    <Text
                      style={{
                        fontSize: 12,
                        color: '#9CA3AF',
                        marginBottom: 4,
                      }}
                    >
                      调用ID：
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: '#E5E7EB',
                        fontFamily: 'monospace',
                      }}
                    >
                      {data.pluginId}
                    </Text>
                  </View>
                </View>
              ) : (
                // Plugin Result 详细信息
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: 'white',
                      marginBottom: 8,
                    }}
                  >
                    执行结果
                  </Text>

                  {/* 结果内容 */}
                  <View style={{ marginBottom: 12 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: '#9CA3AF',
                        marginBottom: 4,
                      }}
                    >
                      返回数据：
                    </Text>
                    <View
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        padding: 12,
                        borderRadius: 8,
                        maxHeight: 150,
                        borderLeftWidth: 3,
                        borderLeftColor: getStatusColor(data.pluginStatus),
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: '#E5E7EB',
                          fontFamily: 'monospace',
                          lineHeight: 16,
                        }}
                        numberOfLines={8}
                      >
                        {typeof (data as PluginResultData).result === 'string'
                          ? (data as PluginResultData).result
                          : JSON.stringify((data as PluginResultData).result, null, 2)
                        }
                      </Text>
                    </View>
                  </View>

                  {/* 执行状态 */}
                  <View>
                    <Text
                      style={{
                        fontSize: 12,
                        color: '#9CA3AF',
                        marginBottom: 4,
                      }}
                    >
                      执行状态：
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: getStatusColor(data.pluginStatus),
                      }}
                    >
                      {getStatusText(data.pluginStatus)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}