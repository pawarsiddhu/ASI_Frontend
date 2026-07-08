import { ROLES } from '@utils/constants';

/**
 * Five hardcoded mock users — one per role.
 * Password for all: `password`
 *
 * Real backend will replace this file. Nothing else depends on this shape
 * except the MSW handlers.
 */
export const users = [
  {
    id: 'u-001',
    email: 'operator@nmma',
    name: 'Ravi Kumar',
    role: ROLES.OPERATOR,
    circle: 'Delhi Circle',
    circleId: 'CIR-DEL',
    department: 'Documentation Unit',
    joinedAt: '2023-04-11',
  },
  {
    id: 'u-002',
    email: 'supervisor@nmma',
    name: 'Priya Sharma',
    role: ROLES.SUPERVISOR,
    circle: 'Delhi Circle',
    circleId: 'CIR-DEL',
    department: 'Documentation Unit',
    joinedAt: '2022-01-20',
  },
  {
    id: 'u-003',
    email: 'admin@nmma',
    name: 'Rajesh Iyer',
    role: ROLES.ADMIN,
    circle: null,
    circleId: null,
    department: 'NMMA Central',
    joinedAt: '2021-08-05',
  },
  {
    id: 'u-004',
    email: 'superadmin@nmma',
    name: 'Dr. Meera Nair',
    role: ROLES.SUPERADMIN,
    circle: null,
    circleId: null,
    department: 'NMMA Directorate',
    joinedAt: '2019-06-15',
  },
  {
    id: 'u-005',
    email: 'rd@nmma',
    name: 'Vikram Singh',
    role: ROLES.RD,
    circle: 'Delhi Circle',
    circleId: 'CIR-DEL',
    department: 'Regional Directorate',
    joinedAt: '2020-11-02',
  },
];

/**
 * Find a user by email — used by the mock login handler.
 */
export function findByEmail(email) {
  return users.find((u) => u.email === email);
}

/**
 * Find a user by id — used by the mock /me handler after decoding the token.
 */
export function findById(id) {
  return users.find((u) => u.id === id);
}
