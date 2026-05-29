module.exports = function checkAuth(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  return token && token === process.env.ADMIN_TOKEN;
};
