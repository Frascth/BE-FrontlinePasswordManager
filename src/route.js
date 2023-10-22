const route = [
  {
    method: 'GET',
    path: '/',
    handler: () => 'Welcome to Frontline Password Manager',
  },
  {
    method: '*',
    path: '/',
    handler: () => 'Welcome to Frontline Password Manager',
  },
];

export default route;
