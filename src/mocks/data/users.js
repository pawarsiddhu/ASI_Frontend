import { ROLES } from '@utils/constants';

/**
 * Five hardcoded mock users — one per role.
 * Password for all: `password123`
 *
 * Real backend will replace this file. Nothing else depends on this shape
 * except the MSW handlers.
 *
 * Note: Backend `users` table has a `username` column, not `email`.
 */
export const users = [
  {
    id: 'u-001',
    username: 'operator1',
    name: 'Ravi Kumar',
    role: ROLES.OPERATOR,
    circle: 'Delhi Circle',
    circleId: 'DELHI',
    department: 'Documentation Unit',
    joinedAt: '2023-04-11',
  },
  {
    id: 'u-002',
    username: 'supervisor1',
    name: 'Priya Sharma',
    role: ROLES.SUPERVISOR,
    circle: 'Delhi Circle',
    circleId: 'DELHI',
    department: 'Documentation Unit',
    joinedAt: '2022-01-20',
  },
  {
    id: 'u-003',
    username: 'admin1',
    name: 'Rajesh Iyer',
    role: ROLES.ADMIN,
    circle: null,
    circleId: null,
    department: 'NMMA Central',
    joinedAt: '2021-08-05',
  },
  {
    id: 'u-004',
    username: 'superadmin1',
    name: 'Dr. Meera Nair',
    role: ROLES.SUPERADMIN,
    circle: null,
    circleId: null,
    department: 'NMMA Directorate',
    joinedAt: '2019-06-15',
  },
  {
    id: 'u-005',
    username: 'director1',
    name: 'Vikram Singh',
    role: ROLES.RD,
    circle: 'Delhi Circle',
    circleId: 'DELHI',
    department: 'Regional Directorate',
    joinedAt: '2020-11-02',
  },
];

/**
 * Find a user by username — used by the mock login handler.
 */
export function findByUsername(username) {
  return users.find((u) => u.username === username);
}

/**
 * Find a user by id — used by the mock /me handler after decoding the token.
 */
export function findById(id) {
  return users.find((u) => u.id === id);
}
