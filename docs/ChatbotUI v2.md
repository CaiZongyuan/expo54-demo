ChatBot Plugin Call UI 优化计划

 📋 核心分析

 基于您提供的API返回结构和custom-agent-provid.ts代码分析：

 当前数据流程

 1. 后端SSE事件：plugin_call → plugin_call_output → text → message completed
 2. 当前转换处理：在custom-agent-provid.ts第196-212行，plugin_call被简单转换为文本消息：[ 
 Plugin Call: ${pluginData.name}]
 3. 前端接收：通过useChat接收到的是已经转换过的简单文本标签

 目标

 将简单的文本提示升级为完整的卡片式UI，支持状态流、参数展示和结果可视化。

 🎯 实施策略

 方案选择：修改数据流传递更丰富信息

 不采用：在转换层丢失信息后试图重建UI
 采用：修改custom-agent-provid.ts，将plugin call信息作为特殊数据传递，前端完整解析        

 📝 分步实施计划

 第1步：修改数据转换层 (1小时)

 文件：src/providers/custom-agent-provid.ts

 目标：让plugin call信息作为结构化数据传递到前端

 具体修改：
 1. 修改plugin_call处理 (第196-212行)：
   - 不转换为简单文本，而是转换为特殊的工具调用数据格式
   - 保留完整的id、name、input信息
 2. 修改plugin_call_output处理：
   - 添加对plugin_call_output事件的处理
   - 通过ID匹配调用和结果
 3. 新增数据格式：
 // 在delta中传递特殊标记
 delta: {
   type: 'tool_call',
   toolData: {
     id: pluginData.id,
     name: pluginData.name,
     input: pluginData.input,
     status: 'pending'
   }
 }

 第2步：创建ToolCallCard组件 (1.5小时)

 文件：src/components/ToolCallCard.tsx（新建）

 功能特性：
 - 卡片式布局：替换现有简单标签
 - 状态管理：pending → success/error
 - 折叠展开：默认折叠，点击展开显示详情
 - 视觉设计：
   - 左侧彩色状态条
   - 工具图标和名称
   - 右侧状态标签
   - 参数JSON格式化显示
   - 结果内容美化展示

 第3步：解析前端数据流 (0.5小时)

 文件：src/app/(chatbot)/index.tsx

 目标：
 - 解析messages中的特殊工具调用数据
 - 维护工具调用状态（通过ID匹配plugin_call和plugin_call_output）
 - 渲染ToolCallCard组件

 第4步：集成和测试 (1小时)

 集成要点：
 - 替换现有的tool-weather、tool-convertFahrenheitToCelsius处理逻辑
 - 保持与现有UI风格的深色主题一致性
 - 测试各种工具调用场景

 🔧 技术实现细节

 数据流设计

 // 1. plugin_call事件处理
 delta: {
   type: 'tool_call_start',
   toolCall: {
     id: pluginData.id,
     name: pluginData.name,
     input: pluginData.input,
     status: 'pending'
   }
 }

 // 2. plugin_call_output事件处理
 delta: {
   type: 'tool_call_result',
   toolCallId: pluginData.id,
   result: pluginData.output,
   status: 'success'
 }

 状态管理策略

 // 在ChatBotScreen中
 const [toolCalls, setToolCalls] = useState<Map<string, ToolCallItem>>(new Map());        

 // 处理工具调用开始
 const handleToolCallStart = (toolCall) => {
   setToolCalls(prev => new Map(prev).set(toolCall.id, toolCall));
 };

 // 处理工具调用结果
 const handleToolCallResult = (toolCallId, result) => {
   setToolCalls(prev => {
     const updated = new Map(prev);
     const existing = updated.get(toolCallId);
     if (existing) {
       updated.set(toolCallId, { ...existing, result, status: 'success' });
     }
     return updated;
   });
 };

 UI组件结构

 interface ToolCallCardProps {
   toolCall: ToolCallItem;
   isExpanded: boolean;
   onToggle: () => void;
 }

 // 折叠状态
 [🔧] tool_now              [准备中]

 // 展开状态
 [🔧] tool_now              [完成] [▼]
 ├─ 输入参数
 │   { "tz_offset_minutes": 480 }
 └─ 输出结果
     2025-11-12T14:53:35.722479+00:00

 ⚡ 关键优势

 1. 保持现有架构：不破坏好用的chat功能
 2. 信息完整性：从源头保留完整的plugin call信息
 3. 实时更新：支持状态流的实时展示
 4. 向后兼容：现有的文本消息继续正常工作

 ⏱️ 预估时间

 总计：4小时
 - 数据转换层修改：1小时
 - UI组件开发：1.5小时
 - 前端集成：0.5小时
 - 测试和优化：1小时

 🚀 预期效果

 完成后，用户看到：
 - 🎨 专业的工具调用卡片：替换简单标签
 - ⚡ 实时状态更新：pending → success 流程可视
 - 📋 详细信息展示：参数和结果完整呈现
 - 👆 直观交互：点击展开查看详情

 这个方案在保持现有稳定功能的基础上，显著提升plugin call的视觉体验！