const validateAsset = (req, res, next) => {
  const { name, serialNumber, type } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Name must be a non-empty string.' });
  }
  if (!serialNumber || typeof serialNumber !== 'string' || serialNumber.trim() === '') {
    return res.status(400).json({ success: false, message: 'Serial Number must be a non-empty string.' });
  }
  if (!type || typeof type !== 'string') {
    return res.status(400).json({ success: false, message: 'Type is required.' });
  }
  const allowedTypes = ['LAPTOP', 'MONITOR', 'IDCARD'];
  if (!allowedTypes.includes(type.toUpperCase())) {
    return res.status(400).json({ success: false, message: 'Type must be either LAPTOP, MONITOR, or IDCARD.' });
  }
  req.body.type = type.toUpperCase();
  next();
};

module.exports = {
  validateAsset,
};
