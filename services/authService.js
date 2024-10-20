const users = [
  { username: 'Ghafouri', password: 'M3621755901h@#2' },
];

exports.authenticate = async (username, password) => {
  const user = users.find(u => u.username === username && u.password === password);
  return user ? true : false;
};
