import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

interface ImageProcessingOptions {
  maxSize?: number; // 最大文件大小 (bytes)
  quality?: number; // 图片质量 0-1
  maxWidth?: number; // 最大宽度
  maxHeight?: number; // 最大高度
  compress?: boolean; // 是否压缩图片
}

interface ProcessedImageResult {
  base64: string;
  format: string;
  size: number;
  width?: number;
  height?: number;
}

/**
 * 将图片URI转换为Base64编码
 * @param imageUri 图片URI
 * @param options 处理选项
 * @returns Promise<ProcessedImageResult> 处理后的图片信息
 */
export async function convertImageToBase64(
  imageUri: string,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImageResult> {
  const {
    maxSize = 5 * 1024 * 1024, // 默认5MB
    quality = 0.8,
    maxWidth = 1024,
    maxHeight = 1024,
    compress = true,
  } = options;

  try {

    // 验证输入参数
    if (!imageUri || typeof imageUri !== 'string') {
      throw new Error('图片URI无效');
    }

    let processedUri = imageUri;
    let finalWidth = 0;
    let finalHeight = 0;

    // 如果需要压缩图片
    if (compress) {
      try {
        const compressedResult = await manipulateAsync(
          imageUri,
          [
            {
              resize: {
                width: maxWidth,
                height: maxHeight,
              },
            },
          ],
          {
            compress: quality,
            format: SaveFormat.JPEG,
            base64: false, // 先不转base64，后面统一处理
          }
        );

        if (compressedResult && compressedResult.uri) {
          processedUri = compressedResult.uri;
          finalWidth = compressedResult.width || 0;
          finalHeight = compressedResult.height || 0;
          // console.log('图片压缩完成:', processedUri);
          // console.log('压缩后尺寸:', finalWidth, 'x', finalHeight);
        }
      } catch (compressError) {
        console.warn('图片压缩失败，使用原始图片:', compressError);
        // 压缩失败时继续使用原始图片
      }
    }

    // 获取文件信息
    const fileInfo = await FileSystem.getInfoAsync(processedUri);

    if (!fileInfo.exists) {
      throw new Error('图片文件不存在');
    }

    // 检查文件大小
    const fileSize = fileInfo.size || 0;
    if (fileSize > maxSize) {
      console.warn(`图片大小 ${fileSize} bytes 超过限制 ${maxSize} bytes`);
      throw new Error(`图片文件过大 (${Math.round(fileSize / 1024 / 1024)}MB)，最大支持 ${Math.round(maxSize / 1024 / 1024)}MB`);
    }

    // console.log('文件大小:', fileSize, 'bytes');

    let base64: string;
    try {
      // 尝试使用新的API
      base64 = await FileSystem.readAsStringAsync(processedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } catch (apiError) {
      console.warn('新API读取失败，尝试兼容方法:', apiError);
      // 如果新API失败，尝试其他方法
      try {
        const fileContent = await FileSystem.readAsStringAsync(processedUri);
        // 如果是base64格式，直接使用；否则需要转换
        if (fileContent.startsWith('data:image/')) {
          // 已经是data URL格式
          const match = fileContent.match(/^data:image\/\w+;base64,(.+)$/);
          if (match) {
            base64 = match[1];
          } else {
            throw new Error('无法解析data URL格式');
          }
        } else {
          // 需要转换为base64，但这在React Native中比较复杂
          throw new Error('需要使用base64编码读取文件');
        }
      } catch (fallbackError) {
        console.error('所有读取方法都失败:', fallbackError);
        throw new Error('无法读取图片文件，请检查文件权限和格式');
      }
    }

    if (!base64 || base64.length === 0) {
      throw new Error('图片读取失败，得到的base64数据为空');
    }


    // 检测图片格式
    const format = getImageFormat(processedUri, base64);

    // 构建data URL
    const dataUrl = `data:image/${format};base64,${base64}`;


    return {
      base64: dataUrl,
      format,
      size: base64.length,
      width: finalWidth,
      height: finalHeight,
    };
  } catch (error) {
    console.error('图片转换为Base64失败:', error);
    throw new Error(`图片处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 获取图片格式
 * @param uri 图片URI
 * @param base64 Base64字符串
 * @returns 图片格式
 */
function getImageFormat(uri: string, base64: string): string {
  // 从URI中提取格式
  const uriMatch = uri.match(/\.(\w+)(?:\?.*)?$/);
  if (uriMatch) {
    const format = uriMatch[1].toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(format)) {
      return format === 'jpg' ? 'jpeg' : format;
    }
  }

  // 从base64头部检测格式
  if (base64.startsWith('/9j/')) return 'jpeg';
  if (base64.startsWith('iVBORw0K')) return 'png';
  if (base64.startsWith('R0lGOD')) return 'gif';
  if (base64.startsWith('UklGR')) return 'webp';

  // 默认返回jpeg
  return 'jpeg';
}

/**
 * 验证Base64图片数据
 * @param base64String Base64字符串
 * @returns 是否为有效的图片Base64
 */
export function isValidImageBase64(base64String: string): boolean {
  if (!base64String || typeof base64String !== 'string') {
    return false;
  }

  // 检查data URL格式
  const dataUrlMatch = base64String.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!dataUrlMatch) {
    return false;
  }

  const format = dataUrlMatch[1];
  const base64Data = dataUrlMatch[2];

  // 验证格式
  if (!['jpeg', 'jpg', 'png', 'gif', 'webp'].includes(format.toLowerCase())) {
    return false;
  }

  // 验证base64数据
  try {
    // 简单验证base64格式（长度应该是4的倍数）
    if (base64Data.length % 4 !== 0) {
      return false;
    }

    // 尝试解码验证
    atob(base64Data);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取图片的基本信息
 * @param imageUri 图片URI
 * @returns Promise<{width: number, height: number, size: number}>
 */
export async function getImageInfo(imageUri: string): Promise<{
  width: number;
  height: number;
  size: number;
}> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(imageUri);

    if (!fileInfo.exists) {
      throw new Error('图片文件不存在');
    }

    // 使用expo-image-manipulator获取图片尺寸
    const manipResult = await manipulateAsync(
      imageUri,
      [], // 不做任何操作，只获取信息
      { format: SaveFormat.JPEG }
    );

    return {
      width: manipResult.width || 0,
      height: manipResult.height || 0,
      size: fileInfo.size || 0,
    };
  } catch (error) {
    console.error('获取图片信息失败:', error);
    throw new Error(`获取图片信息失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 检查图片是否需要压缩
 * @param width 图片宽度
 * @param height 图片高度
 * @param maxSize 最大文件大小
 * @returns 是否需要压缩
 */
export function shouldCompressImage(
  width: number,
  height: number,
  maxSize: number,
  currentSize: number
): boolean {
  // 如果文件大小超过限制，需要压缩
  if (currentSize > maxSize) {
    return true;
  }

  // 如果图片尺寸过大，需要压缩
  const maxDimension = Math.max(width, height);
  if (maxDimension > 1024) {
    return true;
  }

  return false;
}

/**
 * 计算压缩后的目标尺寸
 * @param originalWidth 原始宽度
 * @param originalHeight 原始高度
 * @param maxWidth 最大宽度
 * @param maxHeight 最大高度
 * @returns 压缩后的尺寸
 */
export function calculateCompressedSize(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;

  let width = originalWidth;
  let height = originalHeight;

  // 按宽度限制
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  // 按高度限制
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}