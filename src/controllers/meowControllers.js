import t3Meow from '../models/t3Meow.js';

async function getAll() {
  const testssss = await t3Meow.findAll();
  return testssss;
}

export default getAll;
