export interface PDFFileItem {
    id: string;
    file: File;
    thumbnail?: string;
    name: string;
    pages: number;
    loading?: boolean; 
}

export interface DraggablePDFItemProps {
    item: PDFFileItem;
    index: number;
    moveItem: (dragIndex: number, hoverIndex: number) => void;
    removeItem: (id: string) => void;
}