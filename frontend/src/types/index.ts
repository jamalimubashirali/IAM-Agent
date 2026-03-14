export interface Permission {
  id: number;
  name: string;
}

export interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  roles: Role[];
  enabled: boolean;
  phoneNumber?: string;
  lastLogin?: string;
  createdAt: string;
}
