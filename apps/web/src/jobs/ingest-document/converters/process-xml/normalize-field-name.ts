const normalizeFieldName = (fieldName: string): string => {
  // Remove x0020 (which represents space in XML)
  let normalized = fieldName.replace(/_x0020_/g, ' ');

  // Remove x002F (which represents forward slash in XML)
  normalized = normalized.replace(/_x002F_/g, '/');

  // Remove double underscores
  normalized = normalized.replace(/__+/g, '_');

  // Remove leading/trailing underscores
  normalized = normalized.replace(/^_+|_+$/g, '');

  return normalized;
};

export default normalizeFieldName;
