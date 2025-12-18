export interface NavItem {
  title: string
  to: { name: string }
  icon: { icon: string }
  action?: string // optional: only users with this role can see it
  subject?: string // optional: only users with this role can see it
}

const navItems: NavItem[] = [
  {
    title: 'Home',
    to: { name: 'home' },
    icon: { icon: 'tabler-smart-home' },
    action: 'read',
    subject: 'Home', // only super_user can manage Workers
  },
  {
    title: 'Second page',
    to: { name: 'second-page' },
    icon: { icon: 'tabler-file' },
    action: 'read',
    subject: 'Second Page', // only super_user can manage Workers
  },
  {
    title: 'Calendar',
    to: { name: 'apps-calendar' },
    icon: { icon: 'tabler-calendar-month' },
  },
  {
    title: 'Schedule',
    to: { name: 'schedule' },
    icon: { icon: 'tabler-calendar-month' },
  },
  {
    title: 'Workers',
    to: { name: 'workers' },
    icon: { icon: 'tabler-users' },
    action: 'manage',
    subject: 'Workers', // only super_user can manage Workers
  },
]

export default navItems
