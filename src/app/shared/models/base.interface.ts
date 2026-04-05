export interface BaseEntity {
  id: string | number;
  created_at?: string;
  updated_at?: string;
}

export interface TimestampedEntity extends BaseEntity {
  created_at: string;
  updated_at: string;
}

export interface NamedEntity extends BaseEntity {
  name: string;
  description?: string;
}

export interface SoftDeletableEntity extends TimestampedEntity {
  deleted_at?: string;
}
