const route = [
  {
    method: 'GET',
    path: '/',
    handler: () => 'getAll',
  },
  {
    method: '*',
    path: '/',
    handler: () => 'Welcome to Frontline Password Manager',
  },
];

export default route;
