import { useDrag, useDrop } from 'react-dnd';
import { Card, Button } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { DraggablePDFItemProps } from '../type';
import styles from './index.less';
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
    <div ref={(node) => drag(drop(node))} style={{ opacity }} className={styles.pdfItemWrapper}>
      <Card
        className={styles.pdfItemCard}
        hoverable
      >
        <Button
          type="text"
          danger
          size="small"
          className={styles.deleteButton}
          icon={<DeleteOutlined />}
          onClick={() => removeItem(item.id)}
          key="delete"
        >
        </Button>
        <div className={styles.pdfItemContent}>
          <div className={styles.pdfThumbnail}>
            {item.thumbnail ? (
              <img src={item.thumbnail} alt={item.name} />
            ) : (
              <div className={styles.pdfPlaceholder}>
                <div className={styles.pdfIcon}>PDF</div>
              </div>
            )}
          </div>
          <div className={styles.pdfInfo}>
            <div className={styles.pdfName} title={item.name}>
              {item.name}
            </div>
            {/* <div className={styles.pdfPages}>{item.pages} 页</div> */}
          </div>
        </div>
      </Card>
    </div>
  );
};
export default DraggablePDFItem;