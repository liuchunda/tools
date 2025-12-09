import React, { useState, useCallback, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Upload, Button, Card, message, Space, Typography } from 'antd';
import { UploadOutlined, DeleteOutlined, DownloadOutlined, DragOutlined } from '@ant-design/icons';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import type { UploadFile } from 'antd/es/upload/interface';
import './index.less';

// 设置 pdf.js worker - 使用本地worker文件（已复制到public目录）
// 这样就不依赖外部CDN，避免404错误
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const { Title } = Typography;

interface PDFFileItem {
  id: string;
  file: File;
  thumbnail?: string;
  name: string;
  pages: number;
}

interface DraggablePDFItemProps {
  item: PDFFileItem;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  removeItem: (id: string) => void;
}

const DraggablePDFItem: React.FC<DraggablePDFItemProps> = ({ item, index, moveItem, removeItem }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'pdf-item',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'pdf-item',
    hover: (draggedItem: { index: number }) => {
      if (draggedItem.index !== index) {
        moveItem(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  const opacity = isDragging ? 0.5 : 1;

  return (
    <div ref={(node) => drag(drop(node))} style={{ opacity }} className="pdf-item-wrapper">
      <Card
        className="pdf-item-card"
        hoverable
        actions={[
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => removeItem(item.id)}
            key="delete"
          >
            删除
          </Button>,
        ]}
      >
        <div className="pdf-item-content">
          <div className="drag-handle">
            <DragOutlined />
          </div>
          <div className="pdf-thumbnail">
            {item.thumbnail ? (
              <img src={item.thumbnail} alt={item.name} />
            ) : (
              <div className="pdf-placeholder">
                <div className="pdf-icon">PDF</div>
              </div>
            )}
          </div>
          <div className="pdf-info">
            <div className="pdf-name" title={item.name}>
              {item.name}
            </div>
            <div className="pdf-pages">{item.pages} 页</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const Combine: React.FC = () => {
  const [pdfFiles, setPdfFiles] = useState<PDFFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  // 使用 ref 跟踪已处理的文件，避免重复添加
  const processedFilesRef = useRef<Set<string>>(new Set());

  // 生成 PDF 缩略图
  const generateThumbnail = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      // 使用 pdf.js 加载 PDF 文档
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      // 获取第一页
      const page = await pdf.getPage(1);
      
      // 设置缩放比例，缩略图尺寸
      const scale = 1.5;
      const viewport = page.getViewport({ scale });
      
      // 创建 canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        return '';
      }
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // 渲染 PDF 页面到 canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      };
      
      await page.render(renderContext).promise;
      
      // 将 canvas 转换为 base64 图片
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('生成缩略图失败:', error);
      return '';
    }
  };

  // 获取 PDF 页数
  const getPDFPages = async (file: File): Promise<number> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      return pdfDoc.getPageCount();
    } catch (error) {
      console.error('读取 PDF 失败:', error);
      return 0;
    }
  };

  // 处理文件上传
  const handleFileChange = useCallback(async (info: any) => {
    const { fileList } = info;
    const newFiles: File[] = [];

    fileList.forEach((file: UploadFile) => {
      if (file.status === 'done' || file.originFileObj) {
        const actualFile = file.originFileObj || file;
        if (actualFile && actualFile.type === 'application/pdf') {
          newFiles.push(actualFile as File);
        }
      }
    });

    if (newFiles.length > 0) {
      setLoading(true);
      try {
        // 使用函数式更新获取当前已存在文件的唯一标识（文件名+大小）
        setPdfFiles((prev) => {
          const existingKeys = new Set(
            prev.map(item => `${item.name}-${item.file.size}`)
          );

          // 过滤掉已存在的文件和已处理过的文件
          const uniqueNewFiles = newFiles.filter(file => {
            const key = `${file.name}-${file.size}`;
            // 检查是否已存在于列表中或已处理过
            if (existingKeys.has(key) || processedFilesRef.current.has(key)) {
              return false;
            }
            // 标记为已处理
            processedFilesRef.current.add(key);
            return true;
          });

          if (uniqueNewFiles.length === 0) {
            setLoading(false);
            return prev;
          }

          // 异步处理新文件
          (async () => {
            try {
              const newPDFItems: PDFFileItem[] = await Promise.all(
                uniqueNewFiles.map(async (file) => {
                  const pages = await getPDFPages(file);
                  const thumbnail = await generateThumbnail(file);
                  return {
                    id: `${Date.now()}-${Math.random()}`,
                    file,
                    thumbnail,
                    name: file.name,
                    pages,
                  };
                })
              );

              setPdfFiles((currentPrev) => [...currentPrev, ...newPDFItems]);
              message.success(`成功添加 ${newPDFItems.length} 个 PDF 文件`);
            } catch (error) {
              message.error('处理 PDF 文件失败');
              console.error(error);
            } finally {
              setLoading(false);
            }
          })();

          return prev;
        });
      } catch (error) {
        message.error('处理 PDF 文件失败');
        console.error(error);
        setLoading(false);
      }
    }
  }, []);

  // 移动项目
  const moveItem = useCallback((dragIndex: number, hoverIndex: number) => {
    setPdfFiles((prev) => {
      const newItems = [...prev];
      const [removed] = newItems.splice(dragIndex, 1);
      newItems.splice(hoverIndex, 0, removed);
      return newItems;
    });
  }, []);

  // 删除项目
  const removeItem = useCallback((id: string) => {
    setPdfFiles((prev) => {
      const itemToRemove = prev.find((item) => item.id === id);
      if (itemToRemove) {
        // 从 processedFilesRef 中移除，允许重新上传
        const key = `${itemToRemove.name}-${itemToRemove.file.size}`;
        processedFilesRef.current.delete(key);
      }
      return prev.filter((item) => item.id !== id);
    });
    message.success('已删除');
  }, []);

  // 合并并下载 PDF
  const handleMergeAndDownload = useCallback(async () => {
    if (pdfFiles.length === 0) {
      message.warning('请先上传 PDF 文件');
      return;
    }

    setLoading(true);
    try {
      const mergedPdf = await PDFDocument.create();

      for (const pdfItem of pdfFiles) {
        const pdfBytes = await pdfItem.file.arrayBuffer();
        const pdf = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `合并的PDF_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success('PDF 合并成功！');
    } catch (error) {
      message.error('合并 PDF 失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [pdfFiles]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="pdf-combine-container">
        <Title level={2}>PDF 合并工具</Title>
        
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card>
            <Upload
              multiple
              accept=".pdf"
              fileList={[]}
              beforeUpload={() => false}
              onChange={handleFileChange}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} loading={loading}>
                上传 PDF 文件（可多选）
              </Button>
            </Upload>
          </Card>

          {pdfFiles.length > 0 && (
            <>
              <Card>
                <div className="pdf-list">
                  {pdfFiles.map((item, index) => (
                    <DraggablePDFItem
                      key={item.id}
                      item={item}
                      index={index}
                      moveItem={moveItem}
                      removeItem={removeItem}
                    />
                  ))}
                </div>
              </Card>

              <Card>
                <Space>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleMergeAndDownload}
                    loading={loading}
                    size="large"
                  >
                    合并并下载 PDF
                  </Button>
                  <div className="merge-info">
                    共 {pdfFiles.length} 个文件，总计 {pdfFiles.reduce((sum, item) => sum + item.pages, 0)} 页
                  </div>
                </Space>
              </Card>
            </>
          )}
        </Space>
      </div>
    </DndProvider>
  );
};

export default Combine;
