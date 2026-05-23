export type ProjectTypeKey =
  | 'residencial'
  | 'comercial'
  | 'industrial'
  | 'remodelacao'
  | 'misto'
  | 'outro';

export type BriefingFieldType =
  | 'text'
  | 'number'
  | 'textarea'
  | 'select'
  | 'boolean'
  | 'date';

export interface BriefingFieldOption {
  value: string;
  label: string;
}

/** '*' = todos os tipos de projecto */
export type VisibleFor = ProjectTypeKey[] | '*';

export interface BriefingFieldDef {
  key: string;
  label: string;
  type: BriefingFieldType;
  hint?: string;
  placeholder?: string;
  options?: BriefingFieldOption[];
  visibleFor: VisibleFor;
  /** Coluna em grid: 1 = metade, 2 = linha inteira */
  colSpan?: 1 | 2;
  min?: number;
  max?: number;
  step?: number;
}

export interface BriefingSectionDef {
  id: string;
  title: string;
  description?: string;
  visibleFor: VisibleFor;
  fields: BriefingFieldDef[];
  defaultExpanded?: boolean;
}
